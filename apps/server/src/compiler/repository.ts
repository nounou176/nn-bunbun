import { createHash } from "node:crypto";

import type { DatabaseSync } from "node:sqlite";

import type { PublishedLessonProjection } from "../adaptation/derive-adaptive-snapshot.js";

import {
  type LessonAuthoringRequestV2,
  type LessonAuthoringResultV2,
  type ValidatedLessonPackage,
  validateLessonAuthoringResultV2Structure,
  validateLessonPackage,
  validateRuntimeCapabilities,
} from "@bunbun/contracts";

import { canonicalJson, fingerprint } from "../persistence/canonical-json.js";
import {
  CompilerError,
  type CompilerDiagnostic,
  compileAuthoringResult,
  createRepairRequest,
} from "./core.js";
import {
  type ApprovedProfileTrace,
  type CompilationMode,
  M8_LAST_TRAIN_PROFILE_ID,
  M8_LAST_TRAIN_APPROVED_SPEECH,
  approvedLastTrainPackage,
  createCompilerRouteDraft,
} from "./profiles.js";

export type CompilationStatus =
  | "AWAITING_AUTHORING"
  | "REPAIR_REQUIRED"
  | "READY_FOR_REVIEW"
  | "PUBLISHED"
  | "FAILED";

export interface CompilationView {
  compilationId: string;
  mode: CompilationMode;
  profileId: string;
  status: CompilationStatus;
  attempt: 1 | 2;
  targetKeys: string[];
  request?: LessonAuthoringRequestV2;
  selection?: ApprovedProfileTrace;
  diagnostics: CompilerDiagnostic[];
  review?: {
    title: { ja: string; support?: string };
    objective: { ja: string; support?: string };
    targetLabels: string[];
    requestedTargetLabels: string[];
    supportingTargetLabels: string[];
    stepCount: number;
    promptModules: Array<{ id: string; version: string }>;
  };
  lesson?: { lessonId: string; revision: number };
  createdAt: string;
  updatedAt: string;
}

interface CompilationRow {
  compilation_id: string;
  mode: CompilationMode;
  profile_id: string;
  status: CompilationStatus;
  current_attempt: 1 | 2;
  normalized_target_keys_json: string;
  authoring_request_json: string;
  diagnostics_json: string;
  pending_package_json: string | null;
  lesson_id: string | null;
  revision: number | null;
  created_at: string;
  updated_at: string;
}

export class CompilationRepository {
  constructor(
    private readonly database: DatabaseSync,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  create(targetTexts: readonly string[]): CompilationView {
    const draft = createCompilerRouteDraft(targetTexts);
    if (draft.mode === "APPROVED_PROFILE_SELECTION") {
      this.assertApprovedSpeechReady();
    }
    const existing = this.database
      .prepare(
        `SELECT compilation_id FROM compilation_requests
         WHERE cache_key = ? AND status != 'FAILED'
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(draft.cacheKey) as { compilation_id: string } | undefined;
    if (existing !== undefined) return this.read(existing.compilation_id);

    const priorFailureCount = this.database
      .prepare(
        "SELECT COUNT(*) AS count FROM compilation_requests WHERE cache_key = ?",
      )
      .get(draft.cacheKey) as { count: number };
    const compilationId =
      priorFailureCount.count === 0
        ? draft.compilationId
        : `${draft.compilationId}_retry_${priorFailureCount.count + 1}`;

    const createdAt = this.now();
    this.database
      .prepare(
        `INSERT INTO compilation_requests (
           compilation_id, cache_key, mode, profile_id, status,
           current_attempt, normalized_target_keys_json,
           authoring_request_json, diagnostics_json, pending_package_json,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, '[]', ?, ?, ?)`,
      )
      .run(
        compilationId,
        draft.cacheKey,
        draft.mode,
        draft.profileId,
        draft.mode === "APPROVED_PROFILE_SELECTION"
          ? "READY_FOR_REVIEW"
          : "AWAITING_AUTHORING",
        canonicalJson(draft.normalizedTargetKeys),
        canonicalJson(draft.payload),
        draft.mode === "APPROVED_PROFILE_SELECTION"
          ? canonicalJson(draft.pendingPackage)
          : null,
        createdAt,
        createdAt,
      );
    return this.read(compilationId);
  }

  list(): CompilationView[] {
    const rows = this.database
      .prepare(
        "SELECT * FROM compilation_requests ORDER BY updated_at DESC, compilation_id DESC LIMIT 100",
      )
      .all() as unknown as CompilationRow[];
    return rows.map((row) => this.view(row));
  }

  read(compilationId: string): CompilationView {
    return this.view(this.row(compilationId));
  }

  request(compilationId: string): LessonAuthoringRequestV2 {
    const row = this.row(compilationId);
    if (row.mode !== "AUTHORING_HANDOFF") {
      throw new CompilerError(
        "COMPILATION_AUTHORING_NOT_APPLICABLE",
        "Approved-profile selections do not export authoring requests.",
        [],
        409,
      );
    }
    return parseJson<LessonAuthoringRequestV2>(row.authoring_request_json);
  }

  importResult(compilationId: string, rawText: string): CompilationView {
    const row = this.row(compilationId);
    if (row.mode !== "AUTHORING_HANDOFF") {
      throw new CompilerError(
        "COMPILATION_AUTHORING_NOT_APPLICABLE",
        "Approved-profile selections do not import authoring results.",
        [],
        409,
      );
    }
    if (Buffer.byteLength(rawText, "utf8") > 256 * 1024) {
      throw new CompilerError(
        "AUTHORING_FILE_TOO_LARGE",
        "Authoring result exceeds 256 KiB.",
        [
          diagnostic(
            "STRUCTURAL",
            "AUTHORING_FILE_TOO_LARGE",
            "/rawText",
            "Select a smaller strict JSON result file.",
          ),
        ],
        413,
      );
    }
    if (
      row.status !== "AWAITING_AUTHORING" &&
      row.status !== "REPAIR_REQUIRED"
    ) {
      throw new CompilerError(
        "COMPILATION_STATE_CONFLICT",
        `Compilation cannot import a result while ${row.status}.`,
        [],
        409,
      );
    }
    const responseSha256 = createHash("sha256")
      .update(rawText, "utf8")
      .digest("hex");
    const existingAttempt = this.database
      .prepare(
        "SELECT response_sha256 FROM compilation_attempts WHERE compilation_id = ? AND attempt = ?",
      )
      .get(compilationId, row.current_attempt) as
      { response_sha256: string } | undefined;
    if (existingAttempt !== undefined) {
      if (existingAttempt.response_sha256 === responseSha256)
        return this.read(compilationId);
      throw new CompilerError(
        "AUTHORING_ATTEMPT_CONFLICT",
        "This attempt already imported a different file.",
        [],
        409,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText) as unknown;
    } catch {
      return this.failAttempt(row, responseSha256, "JSON_PARSE", null, [
        {
          source: "STRUCTURAL",
          code: "RESULT_JSON_PARSE_ERROR",
          path: "/result",
          message: "File must contain exactly one valid JSON object.",
        },
      ]);
    }
    const structure = validateLessonAuthoringResultV2Structure(parsed);
    if (!structure.ok) {
      const diagnostics = structure.errors.slice(0, 24).map((error) => ({
        source: "STRUCTURAL" as const,
        code: error.code,
        path: error.path,
        message: error.message,
      }));
      return this.failAttempt(
        row,
        responseSha256,
        "STRUCTURAL",
        null,
        diagnostics,
      );
    }

    const request = parseJson<LessonAuthoringRequestV2>(
      row.authoring_request_json,
    );
    let lessonPackage: ValidatedLessonPackage;
    try {
      lessonPackage = compileAuthoringResult(
        request,
        structure.value,
        this.now(),
      );
    } catch (error) {
      if (!(error instanceof CompilerError)) throw error;
      return this.failAttempt(
        row,
        responseSha256,
        "SEMANTIC",
        structure.value,
        error.diagnostics,
      );
    }

    const updatedAt = this.now();
    this.transaction(() => {
      this.insertAttempt(
        row,
        responseSha256,
        null,
        structure.value,
        [],
        updatedAt,
      );
      this.database
        .prepare(
          `UPDATE compilation_requests
           SET status = 'READY_FOR_REVIEW', diagnostics_json = '[]',
               pending_package_json = ?, updated_at = ?
           WHERE compilation_id = ?`,
        )
        .run(canonicalJson(lessonPackage), updatedAt, compilationId);
    });
    return this.read(compilationId);
  }

  publish(compilationId: string): CompilationView {
    const row = this.row(compilationId);
    if (row.status === "PUBLISHED") return this.view(row);
    if (
      row.status !== "READY_FOR_REVIEW" ||
      row.pending_package_json === null
    ) {
      throw new CompilerError(
        "COMPILATION_NOT_REVIEWABLE",
        "Only a ready-for-review compilation can be published.",
        [],
        409,
      );
    }
    const lessonPackage = parseJson<ValidatedLessonPackage>(
      row.pending_package_json,
    );
    if (row.mode === "APPROVED_PROFILE_SELECTION") {
      this.assertApprovedSpeechReady();
      const approved = approvedLastTrainPackage();
      if (fingerprint(lessonPackage) !== fingerprint(approved)) {
        throw new CompilerError(
          "APPROVED_PROFILE_PACKAGE_DRIFT",
          "The review candidate no longer matches the approved Last Train package.",
          [],
          409,
        );
      }
    }
    const validated = validateLessonPackage(
      lessonPackage.manifest,
      lessonPackage.catalog,
    );
    if (!validated.ok) {
      throw new CompilerError(
        "PUBLICATION_PACKAGE_INVALID",
        "The pending package no longer passes validation.",
        validated.errors.map((error) => ({
          source: "SEMANTIC",
          code: error.code,
          path: error.path,
          message: error.message,
        })),
      );
    }
    const runtimeErrors = validateRuntimeCapabilities(validated.value);
    if (runtimeErrors.length > 0) {
      throw new CompilerError(
        "PUBLICATION_RUNTIME_UNSUPPORTED",
        "The pending package is not supported by this runtime.",
        runtimeErrors.map((error) => ({
          source: "RUNTIME_CAPABILITY",
          ...error,
        })),
      );
    }
    const packageFingerprint = fingerprint(validated.value);
    const publishedAt = this.now();
    this.transaction(() => {
      const existing = this.database
        .prepare(
          "SELECT package_fingerprint FROM lesson_revisions WHERE lesson_id = ? AND revision = ?",
        )
        .get(
          validated.value.manifest.lessonId,
          validated.value.manifest.revision,
        ) as { package_fingerprint: string } | undefined;
      if (
        existing !== undefined &&
        existing.package_fingerprint !== packageFingerprint
      ) {
        throw new CompilerError(
          "PUBLICATION_REVISION_CONFLICT",
          "An immutable lesson revision already exists with different content.",
          [],
          409,
        );
      }
      if (existing === undefined) {
        this.database
          .prepare(
            `INSERT INTO lesson_revisions (
               lesson_id, revision, manifest_schema_version, catalog_schema_version,
               package_fingerprint, manifest_json, catalog_json, created_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            validated.value.manifest.lessonId,
            validated.value.manifest.revision,
            validated.value.manifest.schemaVersion,
            validated.value.catalog.schemaVersion,
            packageFingerprint,
            canonicalJson(validated.value.manifest),
            canonicalJson(validated.value.catalog),
            publishedAt,
          );
      }
      this.database
        .prepare(
          `UPDATE compilation_requests
           SET status = 'PUBLISHED', lesson_id = ?, revision = ?,
               updated_at = ?, published_at = ?
           WHERE compilation_id = ?`,
        )
        .run(
          validated.value.manifest.lessonId,
          validated.value.manifest.revision,
          publishedAt,
          publishedAt,
          compilationId,
        );
    });
    return this.read(compilationId);
  }

  listLessons(): Array<{
    lessonId: string;
    revision: number;
    title: { ja: string; support?: string };
    createdAt: string;
  }> {
    const rows = this.database
      .prepare(
        `SELECT DISTINCT revisions.lesson_id, revisions.revision,
                revisions.manifest_json, revisions.created_at
         FROM lesson_revisions AS revisions
         INNER JOIN compilation_requests AS compilations
           ON compilations.lesson_id = revisions.lesson_id
          AND compilations.revision = revisions.revision
          AND compilations.status = 'PUBLISHED'
         ORDER BY revisions.created_at DESC, revisions.lesson_id`,
      )
      .all() as Array<{
      lesson_id: string;
      revision: number;
      manifest_json: string;
      created_at: string;
    }>;
    return rows.map((row) => {
      const manifest = parseJson<{
        title: { ja: string; support?: string };
      }>(row.manifest_json);
      return {
        lessonId: row.lesson_id,
        revision: row.revision,
        title: manifest.title,
        createdAt: row.created_at,
      };
    });
  }

  listAdaptivePublishedLessons(limit = 100): PublishedLessonProjection[] {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new CompilerError(
        "PUBLISHED_LIBRARY_LIMIT_INVALID",
        "Adaptive published lesson limit must be between 1 and 100.",
        [],
      );
    }
    const rows = this.database
      .prepare(
        `WITH ranked AS (
           SELECT lesson_id, revision, profile_id,
                  ROW_NUMBER() OVER (
                    PARTITION BY lesson_id
                    ORDER BY revision DESC, published_at DESC, compilation_id DESC
                  ) AS lesson_rank
           FROM compilation_requests
           WHERE status = 'PUBLISHED'
             AND lesson_id IS NOT NULL
             AND revision IS NOT NULL
         )
         SELECT lesson_id, revision, profile_id
         FROM ranked
         WHERE lesson_rank = 1
         ORDER BY lesson_id
         LIMIT ?`,
      )
      .all(limit + 1) as Array<{
      lesson_id: string;
      revision: number;
      profile_id: string;
    }>;
    if (rows.length > limit) {
      throw new CompilerError(
        "PUBLISHED_LIBRARY_LIMIT_EXCEEDED",
        `Adaptive publication projection exceeds ${limit} lessons.`,
        [],
        500,
      );
    }
    return rows.map((row) => ({
      ...this.loadLesson(row.lesson_id, row.revision),
      supportedLaunchModes:
        row.profile_id === M8_LAST_TRAIN_PROFILE_ID
          ? ["GUIDED", "IMMERSIVE"]
          : ["IMMERSIVE"],
    }));
  }

  loadLesson(lessonId: string, revision: number): ValidatedLessonPackage {
    const row = this.database
      .prepare(
        "SELECT manifest_json, catalog_json FROM lesson_revisions WHERE lesson_id = ? AND revision = ?",
      )
      .get(lessonId, revision) as
      { manifest_json: string; catalog_json: string } | undefined;
    if (row === undefined)
      throw new CompilerError(
        "LESSON_REVISION_NOT_FOUND",
        "Published lesson revision was not found.",
        [],
        404,
      );
    const validated = validateLessonPackage(
      parseJson(row.manifest_json),
      parseJson(row.catalog_json),
    );
    if (!validated.ok)
      throw new CompilerError(
        "PUBLISHED_PACKAGE_INVALID",
        "Stored lesson package failed validation.",
        validated.errors.map((error) => ({
          source: "SEMANTIC",
          code: error.code,
          path: error.path,
          message: error.message,
        })),
        500,
      );
    const runtimeErrors = validateRuntimeCapabilities(validated.value);
    if (runtimeErrors.length > 0)
      throw new CompilerError(
        "PUBLISHED_RUNTIME_UNSUPPORTED",
        "Stored lesson package is not supported by this runtime.",
        runtimeErrors.map((error) => ({
          source: "RUNTIME_CAPABILITY",
          ...error,
        })),
        500,
      );
    const approved = approvedLastTrainPackage();
    if (
      lessonId === approved.manifest.lessonId &&
      revision === approved.manifest.revision
    ) {
      this.assertApprovedSpeechReady();
      if (fingerprint(validated.value) !== fingerprint(approved)) {
        throw new CompilerError(
          "PUBLISHED_APPROVED_PROFILE_DRIFT",
          "Stored Last Train bytes do not match the approved profile.",
          [],
          500,
        );
      }
    }
    return validated.value;
  }

  reset(): void {
    this.database.exec(
      "DELETE FROM compilation_attempts; DELETE FROM compilation_requests;",
    );
  }

  private failAttempt(
    row: CompilationRow,
    responseSha256: string,
    failureStage: "JSON_PARSE" | "STRUCTURAL" | "SEMANTIC",
    structuredResult: LessonAuthoringResultV2 | null,
    diagnostics: CompilerDiagnostic[],
  ): CompilationView {
    const updatedAt = this.now();
    const canRepair = row.current_attempt === 1;
    const currentRequest = parseJson<LessonAuthoringRequestV2>(
      row.authoring_request_json,
    );
    const nextRequest = canRepair
      ? createRepairRequest(
          currentRequest,
          failureStage,
          responseSha256,
          structuredResult,
          diagnostics,
        )
      : currentRequest;
    this.transaction(() => {
      this.insertAttempt(
        row,
        responseSha256,
        failureStage,
        structuredResult,
        diagnostics,
        updatedAt,
      );
      this.database
        .prepare(
          `UPDATE compilation_requests
           SET status = ?, current_attempt = ?, authoring_request_json = ?,
               diagnostics_json = ?, updated_at = ?
           WHERE compilation_id = ?`,
        )
        .run(
          canRepair ? "REPAIR_REQUIRED" : "FAILED",
          canRepair ? 2 : row.current_attempt,
          canonicalJson(nextRequest),
          canonicalJson(diagnostics),
          updatedAt,
          row.compilation_id,
        );
    });
    return this.read(row.compilation_id);
  }

  private insertAttempt(
    row: CompilationRow,
    responseSha256: string,
    failureStage: string | null,
    structuredResult: LessonAuthoringResultV2 | null,
    diagnostics: CompilerDiagnostic[],
    importedAt: string,
  ): void {
    this.database
      .prepare(
        `INSERT INTO compilation_attempts (
           compilation_id, attempt, response_sha256, failure_stage,
           diagnostics_json, structured_result_json, imported_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        row.compilation_id,
        row.current_attempt,
        responseSha256,
        failureStage,
        canonicalJson(diagnostics),
        structuredResult === null ? null : canonicalJson(structuredResult),
        importedAt,
      );
  }

  private view(row: CompilationRow): CompilationView {
    const lessonPackage =
      row.pending_package_json === null
        ? undefined
        : parseJson<ValidatedLessonPackage>(row.pending_package_json);
    return {
      compilationId: row.compilation_id,
      mode: row.mode,
      profileId: row.profile_id,
      status: row.status,
      attempt: row.current_attempt,
      targetKeys: parseJson<string[]>(row.normalized_target_keys_json),
      ...(row.mode === "AUTHORING_HANDOFF"
        ? {
            request: parseJson<LessonAuthoringRequestV2>(
              row.authoring_request_json,
            ),
          }
        : {
            selection: parseJson<ApprovedProfileTrace>(
              row.authoring_request_json,
            ),
          }),
      diagnostics: parseJson<CompilerDiagnostic[]>(row.diagnostics_json),
      ...(lessonPackage === undefined
        ? {}
        : { review: reviewSummary(lessonPackage) }),
      ...(row.lesson_id === null || row.revision === null
        ? {}
        : { lesson: { lessonId: row.lesson_id, revision: row.revision } }),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private row(compilationId: string): CompilationRow {
    const row = this.database
      .prepare("SELECT * FROM compilation_requests WHERE compilation_id = ?")
      .get(compilationId) as unknown as CompilationRow | undefined;
    if (row === undefined)
      throw new CompilerError(
        "COMPILATION_NOT_FOUND",
        "Compilation request was not found.",
        [],
        404,
      );
    return row;
  }

  private assertApprovedSpeechReady(): void {
    const missing = M8_LAST_TRAIN_APPROVED_SPEECH.filter((identity) => {
      const row = this.database
        .prepare(
          "SELECT status, wav_sha256 FROM audio_speech_assets WHERE cache_key = ?",
        )
        .get(identity.cacheKey) as
        { status: string; wav_sha256: string | null } | undefined;
      return row?.status !== "READY" || row.wav_sha256 !== identity.wavSha256;
    });
    if (missing.length > 0) {
      throw new CompilerError(
        "APPROVED_PROFILE_SPEECH_NOT_READY",
        "Last Train needs all four exact approved speech files before review or play.",
        missing.map((identity) => ({
          source: "SEMANTIC",
          code: "APPROVED_SPEECH_NOT_READY",
          path: `/audio/${identity.cacheKey}`,
          message:
            "Expected one READY speech row with the approved WAV SHA-256.",
        })),
        409,
      );
    }
  }

  private transaction(action: () => void): void {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      action();
      this.database.exec("COMMIT");
    } catch (error) {
      try {
        this.database.exec("ROLLBACK");
      } catch {
        /* no active transaction */
      }
      throw error;
    }
  }
}

function reviewSummary(lessonPackage: ValidatedLessonPackage) {
  const label = (
    target: ValidatedLessonPackage["manifest"]["learningTargets"][number],
  ) =>
    target.kind === "VOCABULARY"
      ? (target.content.writtenForms[0] ?? target.targetId)
      : target.kind === "GRAMMAR"
        ? target.content.pattern
        : target.content.character;
  return {
    title: lessonPackage.manifest.title,
    objective: lessonPackage.manifest.scenario.objective,
    targetLabels: lessonPackage.manifest.learningTargets.map(label),
    requestedTargetLabels: lessonPackage.manifest.learningTargets
      .filter((target) => target.role === "REQUESTED")
      .map(label),
    supportingTargetLabels: lessonPackage.manifest.learningTargets
      .filter((target) => target.role === "SUPPORTING")
      .map(label),
    stepCount: lessonPackage.manifest.steps.length,
    promptModules: lessonPackage.manifest.provenance.promptModuleVersions,
  };
}

function diagnostic(
  source: CompilerDiagnostic["source"],
  code: string,
  path: string,
  message: string,
): CompilerDiagnostic {
  return { source, code, path, message };
}

function parseJson<Value = unknown>(value: string): Value {
  return JSON.parse(value) as Value;
}
