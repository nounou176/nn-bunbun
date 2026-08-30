import type { DatabaseSync } from "node:sqlite";

import {
  EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
  type AbandonSessionResult,
  type EvidenceEvent,
  type LessonManifest,
  type LessonStep,
  type LocalPreferences,
  type ProgressSummaryResult,
  type ResumableSessionResult,
  type SessionCheckpoint,
  type SessionCommitRequest,
  type SessionCommitResult,
  type SessionCreateRequest,
  type StorageSummary,
  type TargetEvidenceSummary,
  type UpdatePreferencesRequest,
  validateLessonPackage,
} from "@bunbun/contracts";

import { canonicalJson, fingerprint } from "./canonical-json.js";
import { PersistenceError } from "./errors.js";
import { DATABASE_SCHEMA_VERSION } from "./migrations.js";

const LOCAL_PROFILE_ID = "local_default";

export class EvidenceRepository {
  constructor(
    private readonly database: DatabaseSync,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  createSession(request: SessionCreateRequest): SessionCommitResult {
    const payloadFingerprint = fingerprint(request);
    const retry = this.readCommit(request.commitId, payloadFingerprint);
    if (retry !== undefined) return retry;

    const validation = validateLessonPackage(request.manifest, request.catalog);
    if (!validation.ok) {
      const first = validation.errors[0];
      throw new PersistenceError(
        "PERSISTENCE_PACKAGE_INVALID",
        first === undefined
          ? "Lesson package did not pass validation."
          : `${first.code} at ${first.path}: ${first.message}`,
      );
    }
    const computedFingerprint = fingerprint({
      manifest: request.manifest,
      catalog: request.catalog,
    });
    if (computedFingerprint !== request.packageFingerprint) {
      throw new PersistenceError(
        "PERSISTENCE_PACKAGE_INVALID",
        "Lesson package fingerprint does not match its payload.",
      );
    }
    this.validateCheckpoint(request.checkpoint, request.manifest, 0);
    if (
      request.checkpoint.status !== "ACTIVE" ||
      request.checkpoint.sequence !== 0
    ) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "A new session must begin with ACTIVE checkpoint sequence 0.",
      );
    }
    this.validateEvents(
      request.events,
      request.manifest,
      request.checkpoint.sessionId,
    );

    const savedAt = this.now();
    this.transaction(() => {
      this.insertOrConfirmLessonRevision(request, savedAt);
      const active = this.database
        .prepare(
          `SELECT session_id FROM play_sessions
           WHERE profile_id = ? AND lesson_id = ? AND revision = ? AND status = 'ACTIVE'
           LIMIT 1`,
        )
        .get(
          LOCAL_PROFILE_ID,
          request.manifest.lessonId,
          request.manifest.revision,
        ) as { session_id: string } | undefined;
      if (active !== undefined) {
        throw new PersistenceError(
          "PERSISTENCE_SESSION_CONFLICT",
          `Active session '${active.session_id}' must be resumed or abandoned first.`,
          409,
        );
      }
      this.database
        .prepare(
          `INSERT INTO play_sessions (
             session_id, profile_id, lesson_id, revision, status,
             checkpoint_sequence, active_time_ms, started_at, updated_at
           ) VALUES (?, ?, ?, ?, 'ACTIVE', 0, ?, ?, ?)`,
        )
        .run(
          request.checkpoint.sessionId,
          LOCAL_PROFILE_ID,
          request.manifest.lessonId,
          request.manifest.revision,
          request.checkpoint.activeTimeMs,
          savedAt,
          savedAt,
        );
      this.insertEvents(request.events, savedAt);
      this.writeCheckpoint(request.checkpoint, savedAt);
      const storedEventCount = this.eventCount(request.checkpoint.sessionId);
      this.writeCommit(
        request.commitId,
        request.checkpoint.sessionId,
        payloadFingerprint,
        0,
        storedEventCount,
        savedAt,
      );
    });

    return {
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      sessionId: request.checkpoint.sessionId,
      checkpointSequence: 0,
      storedEventCount: this.eventCount(request.checkpoint.sessionId),
      lastSavedAt: savedAt,
    };
  }

  commitSession(
    sessionId: string,
    request: SessionCommitRequest,
  ): SessionCommitResult {
    const payloadFingerprint = fingerprint(request);
    const retry = this.readCommit(request.commitId, payloadFingerprint);
    if (retry !== undefined) {
      if (retry.sessionId !== sessionId) {
        throw new PersistenceError(
          "PERSISTENCE_COMMIT_CONFLICT",
          "Commit ID belongs to a different session.",
          409,
        );
      }
      return retry;
    }

    const session = this.readSession(sessionId);
    if (session.status !== "ACTIVE") {
      throw new PersistenceError(
        "PERSISTENCE_SESSION_INACTIVE",
        `Session '${sessionId}' is ${session.status.toLowerCase()}.`,
        409,
      );
    }
    if (session.checkpoint_sequence !== request.expectedSequence) {
      throw new PersistenceError(
        "PERSISTENCE_STALE_CHECKPOINT",
        `Expected checkpoint ${request.expectedSequence}, current checkpoint is ${session.checkpoint_sequence}.`,
        409,
      );
    }
    const manifest = this.readManifest(session.lesson_id, session.revision);
    this.validateCheckpoint(
      request.checkpoint,
      manifest,
      request.expectedSequence + 1,
    );
    this.validateEvents(request.events, manifest, sessionId);
    if (request.checkpoint.sessionId !== sessionId) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Checkpoint session does not match the request path.",
      );
    }

    const savedAt = this.now();
    let storedEventCount = 0;
    this.transaction(() => {
      const current = this.readSession(sessionId);
      if (current.status !== "ACTIVE") {
        throw new PersistenceError(
          "PERSISTENCE_SESSION_INACTIVE",
          `Session '${sessionId}' is no longer active.`,
          409,
        );
      }
      if (current.checkpoint_sequence !== request.expectedSequence) {
        throw new PersistenceError(
          "PERSISTENCE_STALE_CHECKPOINT",
          `Checkpoint changed before commit '${request.commitId}'.`,
          409,
        );
      }
      this.insertEvents(request.events, savedAt);
      this.writeCheckpoint(request.checkpoint, savedAt);
      const completed = request.checkpoint.status === "COMPLETED";
      this.database
        .prepare(
          `UPDATE play_sessions
           SET status = ?, checkpoint_sequence = ?, active_time_ms = ?,
               updated_at = ?, completed_at = ?
           WHERE session_id = ?`,
        )
        .run(
          completed ? "COMPLETED" : "ACTIVE",
          request.checkpoint.sequence,
          request.checkpoint.activeTimeMs,
          savedAt,
          completed ? savedAt : null,
          sessionId,
        );
      storedEventCount = this.eventCount(sessionId);
      this.writeCommit(
        request.commitId,
        sessionId,
        payloadFingerprint,
        request.checkpoint.sequence,
        storedEventCount,
        savedAt,
      );
    });

    return {
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      sessionId,
      checkpointSequence: request.checkpoint.sequence,
      storedEventCount,
      lastSavedAt: savedAt,
    };
  }

  findResumableSession(
    lessonId: string,
    revision: number,
    packageFingerprint: string,
  ): ResumableSessionResult {
    const row = this.database
      .prepare(
        `SELECT s.session_id, s.status, l.package_fingerprint,
                c.payload_json, c.updated_at,
                (SELECT COUNT(*) FROM session_events e WHERE e.session_id = s.session_id) AS event_count
         FROM play_sessions s
         JOIN lesson_revisions l
           ON l.lesson_id = s.lesson_id AND l.revision = s.revision
         JOIN session_checkpoints c ON c.session_id = s.session_id
         WHERE s.profile_id = ? AND s.lesson_id = ? AND s.revision = ?
           AND s.status IN ('ACTIVE', 'COMPLETED')
           AND l.package_fingerprint = ?
         ORDER BY CASE s.status WHEN 'ACTIVE' THEN 0 ELSE 1 END,
                  s.updated_at DESC, s.session_id DESC
         LIMIT 1`,
      )
      .get(LOCAL_PROFILE_ID, lessonId, revision, packageFingerprint) as
      | {
          session_id: string;
          status: "ACTIVE" | "COMPLETED";
          package_fingerprint: string;
          payload_json: string;
          updated_at: string;
          event_count: number;
        }
      | undefined;

    if (row === undefined) {
      return { schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION };
    }
    return {
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      session: {
        sessionId: row.session_id,
        status: row.status,
        packageFingerprint: row.package_fingerprint,
        checkpoint: JSON.parse(row.payload_json) as SessionCheckpoint,
        storedEventCount: Number(row.event_count),
        lastSavedAt: row.updated_at,
      },
    };
  }

  abandonSession(
    sessionId: string,
    expectedSequence: number,
  ): AbandonSessionResult {
    const row = this.readSession(sessionId);
    if (row.status === "ABANDONED") {
      return {
        schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
        sessionId,
        status: "ABANDONED",
        updatedAt: row.updated_at,
      };
    }
    if (row.status !== "ACTIVE") {
      throw new PersistenceError(
        "PERSISTENCE_SESSION_INACTIVE",
        `Session '${sessionId}' cannot be abandoned from ${row.status}.`,
        409,
      );
    }
    if (row.checkpoint_sequence !== expectedSequence) {
      throw new PersistenceError(
        "PERSISTENCE_STALE_CHECKPOINT",
        `Expected checkpoint ${expectedSequence}, current checkpoint is ${row.checkpoint_sequence}.`,
        409,
      );
    }
    const updatedAt = this.now();
    this.database
      .prepare(
        `UPDATE play_sessions
         SET status = 'ABANDONED', updated_at = ?, abandoned_at = ?
         WHERE session_id = ?`,
      )
      .run(updatedAt, updatedAt, sessionId);
    return {
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      sessionId,
      status: "ABANDONED",
      updatedAt,
    };
  }

  getPreferences(): LocalPreferences {
    const row = this.database
      .prepare(
        "SELECT resume_mode, updated_at FROM local_preferences WHERE profile_id = ?",
      )
      .get(LOCAL_PROFILE_ID) as
      | { resume_mode: LocalPreferences["resumeMode"]; updated_at: string }
      | undefined;
    if (row !== undefined) {
      return {
        schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
        resumeMode: row.resume_mode,
        updatedAt: row.updated_at,
      };
    }
    const updatedAt = this.now();
    this.database
      .prepare(
        "INSERT INTO local_preferences (profile_id, resume_mode, updated_at) VALUES (?, 'ASK', ?)",
      )
      .run(LOCAL_PROFILE_ID, updatedAt);
    return {
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      resumeMode: "ASK",
      updatedAt,
    };
  }

  updatePreferences(request: UpdatePreferencesRequest): LocalPreferences {
    const updatedAt = this.now();
    this.database
      .prepare(
        `INSERT INTO local_preferences (profile_id, resume_mode, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT (profile_id) DO UPDATE SET
           resume_mode = excluded.resume_mode,
           updated_at = excluded.updated_at`,
      )
      .run(LOCAL_PROFILE_ID, request.resumeMode, updatedAt);
    return {
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      resumeMode: request.resumeMode,
      updatedAt,
    };
  }

  progressSummary(lessonId: string, revision: number): ProgressSummaryResult {
    const manifest = this.readManifest(lessonId, revision);
    const targets = manifest.learningTargets.map((target) =>
      this.summarizeTarget(lessonId, revision, target.targetId),
    );
    return { schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION, targets };
  }

  storageSummary(): StorageSummary {
    const sessions = this.database
      .prepare(
        `SELECT session_id, lesson_id, revision, status,
                checkpoint_sequence, updated_at
         FROM play_sessions
         ORDER BY updated_at DESC, session_id DESC
         LIMIT 100`,
      )
      .all() as Array<{
      session_id: string;
      lesson_id: string;
      revision: number;
      status: "ACTIVE" | "COMPLETED" | "ABANDONED";
      checkpoint_sequence: number;
      updated_at: string;
    }>;
    return {
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      databaseSchemaVersion: DATABASE_SCHEMA_VERSION,
      lessonRevisionCount: this.tableCount("lesson_revisions"),
      sessionCount: this.tableCount("play_sessions"),
      activeSessionCount: this.scalarCount(
        "SELECT COUNT(*) AS count FROM play_sessions WHERE status = 'ACTIVE'",
      ),
      eventCount: this.tableCount("session_events"),
      checkpointCount: this.tableCount("session_checkpoints"),
      sessions: sessions.map((session) => ({
        sessionId: session.session_id,
        lessonId: session.lesson_id,
        revision: session.revision,
        status: session.status,
        checkpointSequence: session.checkpoint_sequence,
        updatedAt: session.updated_at,
      })),
    };
  }

  resetLocalData(): void {
    this.transaction(() => {
      this.database.exec(`
        DELETE FROM session_commits;
        DELETE FROM session_events;
        DELETE FROM session_checkpoints;
        DELETE FROM play_sessions;
        DELETE FROM lesson_revisions;
        DELETE FROM local_preferences;
        DELETE FROM adaptive_preferences;
      `);
    });
  }

  private insertOrConfirmLessonRevision(
    request: SessionCreateRequest,
    createdAt: string,
  ): void {
    const existing = this.database
      .prepare(
        `SELECT package_fingerprint FROM lesson_revisions
         WHERE lesson_id = ? AND revision = ?`,
      )
      .get(request.manifest.lessonId, request.manifest.revision) as
      { package_fingerprint: string } | undefined;
    if (existing !== undefined) {
      if (existing.package_fingerprint !== request.packageFingerprint) {
        throw new PersistenceError(
          "PERSISTENCE_PACKAGE_CONFLICT",
          "An immutable lesson revision already exists with different content.",
          409,
        );
      }
      return;
    }
    this.database
      .prepare(
        `INSERT INTO lesson_revisions (
           lesson_id, revision, manifest_schema_version, catalog_schema_version,
           package_fingerprint, manifest_json, catalog_json, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        request.manifest.lessonId,
        request.manifest.revision,
        request.manifest.schemaVersion,
        request.catalog.schemaVersion,
        request.packageFingerprint,
        canonicalJson(request.manifest),
        canonicalJson(request.catalog),
        createdAt,
      );
  }

  private validateEvents(
    events: readonly EvidenceEvent[],
    manifest: LessonManifest,
    expectedSessionId: string,
  ): void {
    for (const event of events) {
      if (
        event.sessionId !== expectedSessionId ||
        event.lessonId !== manifest.lessonId ||
        event.revision !== manifest.revision
      ) {
        throw this.invalidEvent(
          event,
          "Session or lesson identity does not match.",
        );
      }
      const step = manifest.steps.find(
        (candidate) => candidate.stepId === event.stepId,
      );
      if (step === undefined)
        throw this.invalidEvent(event, "Step does not exist.");
      if (
        event.contextId !== step.contextId ||
        event.primitive !== step.interaction.type
      ) {
        throw this.invalidEvent(
          event,
          "Step context or primitive does not match.",
        );
      }
      this.validateEventBinding(event, step);
      this.validateEventResponse(event, step);
      const expectedId = expectedEventId(event);
      if (event.eventId !== expectedId) {
        throw this.invalidEvent(event, `Expected event ID '${expectedId}'.`);
      }
    }
  }

  private validateEventBinding(event: EvidenceEvent, step: LessonStep): void {
    if (event.kind === "EXPOSURE") {
      const valid = step.targetBindings.some(
        (binding) =>
          binding.relation === "EXPOSES" &&
          binding.targetId === event.targetId &&
          event.evidence === "encountered",
      );
      if (!valid)
        throw this.invalidEvent(event, "Exposure binding is invalid.");
      if (
        event.correct !== undefined ||
        event.assisted ||
        event.attempt !== 0
      ) {
        throw this.invalidEvent(event, "Exposure outcome fields are invalid.");
      }
      return;
    }
    if (event.kind === "HEARD" || event.kind === "REACTION") {
      const valid = step.targetBindings.some(
        (binding) =>
          binding.relation === "ASSESSES" &&
          binding.targetId === event.targetId &&
          binding.successEvidence === event.evidence,
      );
      if (!valid)
        throw this.invalidEvent(event, "Assessment binding is invalid.");
      if (event.kind === "REACTION" && event.correct === undefined) {
        throw this.invalidEvent(event, "Reaction correctness is required.");
      }
      if (event.attempt < 1) {
        throw this.invalidEvent(event, "Assessment attempt must be positive.");
      }
      if (
        event.kind === "HEARD" &&
        (event.correct !== true || event.assisted)
      ) {
        throw this.invalidEvent(
          event,
          "Heard evidence must be unaided and successful.",
        );
      }
      return;
    }
    if (
      event.targetId !== undefined ||
      event.evidence !== undefined ||
      event.responseIds !== undefined
    ) {
      throw this.invalidEvent(
        event,
        "Terminal events cannot contain target response data.",
      );
    }
    if (
      event.kind === "STEP_COMPLETED" &&
      (event.correct === undefined || event.attempt < 1)
    ) {
      throw this.invalidEvent(event, "Step completion outcome is incomplete.");
    }
    if (
      event.kind === "LESSON_COMPLETED" &&
      (event.correct !== undefined || event.assisted || event.attempt !== 0)
    ) {
      throw this.invalidEvent(
        event,
        "Lesson completion outcome fields are invalid.",
      );
    }
  }

  private validateEventResponse(event: EvidenceEvent, step: LessonStep): void {
    if (event.kind !== "REACTION") {
      if (event.responseIds !== undefined) {
        throw this.invalidEvent(
          event,
          "Only reactions may contain response IDs.",
        );
      }
      return;
    }
    const response = event.responseIds;
    const interaction = step.interaction;
    switch (interaction.type) {
      case "TYPE":
      case "LISTEN":
        if (response !== undefined) {
          throw this.invalidEvent(
            event,
            "Typed or listen responses must not be persisted.",
          );
        }
        return;
      case "ARRANGE": {
        const valid =
          response !== undefined &&
          response.length === interaction.tokens.length &&
          response.every((id) =>
            interaction.tokens.some((token) => token.tokenId === id),
          );
        if (!valid)
          throw this.invalidEvent(event, "ARRANGE response IDs are invalid.");
        return;
      }
      case "CLICK_OBJECT":
      case "PICK_UP":
        if (
          response?.length !== 1 ||
          !interaction.candidateObjectIds.includes(response[0]!)
        ) {
          throw this.invalidEvent(event, "Object response ID is invalid.");
        }
        return;
      case "MOVE_TO":
        if (
          response?.length !== 1 ||
          !interaction.candidateLocationIds.includes(response[0]!)
        ) {
          throw this.invalidEvent(event, "Location response ID is invalid.");
        }
        return;
      case "CHOOSE":
        if (
          response?.length !== 1 ||
          !interaction.options.some((option) => option.optionId === response[0])
        ) {
          throw this.invalidEvent(event, "Choice response ID is invalid.");
        }
        return;
      case "GIVE":
        if (
          response?.length !== 2 ||
          !interaction.candidateObjectIds.includes(response[0]!) ||
          !interaction.candidateRecipientEntityIds.includes(response[1]!)
        ) {
          throw this.invalidEvent(event, "GIVE response IDs are invalid.");
        }
    }
  }

  private validateCheckpoint(
    checkpoint: SessionCheckpoint,
    manifest: LessonManifest,
    expectedSequence: number,
  ): void {
    if (
      checkpoint.lessonId !== manifest.lessonId ||
      checkpoint.revision !== manifest.revision ||
      checkpoint.sequence !== expectedSequence
    ) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Checkpoint identity or sequence does not match the lesson session.",
      );
    }
    const step = manifest.steps.find(
      (candidate) => candidate.stepId === checkpoint.currentStepId,
    );
    if (step === undefined) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Checkpoint current step does not exist.",
      );
    }
    const allowedPhases = allowedCheckpointPhases(step);
    if (!allowedPhases.has(checkpoint.phase)) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        `Checkpoint phase '${checkpoint.phase}' is incompatible with ${step.interaction.type}.`,
      );
    }
    if (checkpoint.attempt > step.attemptPolicy.maximumAttempts) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Checkpoint attempt exceeds the authored attempt policy.",
      );
    }
    const stepIds = new Set(
      manifest.steps.map((candidate) => candidate.stepId),
    );
    if (checkpoint.completedStepIds.some((id) => !stepIds.has(id))) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Checkpoint completed steps contain an unknown ID.",
      );
    }
    const scaffoldIds = new Set(
      step.scaffolds.map((scaffold) => scaffold.scaffoldId),
    );
    if (checkpoint.activeScaffoldIds.some((id) => !scaffoldIds.has(id))) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Checkpoint scaffolds do not belong to the current step.",
      );
    }
    if (
      checkpoint.activeScaffoldIds.some((id) => {
        const scaffold = step.scaffolds.find(
          (candidate) => candidate.scaffoldId === id,
        );
        return (
          scaffold !== undefined && scaffold.afterAttempt > checkpoint.attempt
        );
      })
    ) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Checkpoint activates a scaffold before its authored attempt.",
      );
    }
    if (step.interaction.type === "ARRANGE") {
      const tokenIds = new Set(
        step.interaction.tokens.map((token) => token.tokenId),
      );
      if (checkpoint.arrangedTokenIds.some((id) => !tokenIds.has(id))) {
        throw new PersistenceError(
          "PERSISTENCE_CHECKPOINT_INVALID",
          "Checkpoint ARRANGE tokens do not belong to the current step.",
        );
      }
    } else if (checkpoint.arrangedTokenIds.length > 0) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Only ARRANGE checkpoints may retain arranged token IDs.",
      );
    }
    if (
      checkpoint.carriedObjectId !== undefined &&
      !manifest.objects.some(
        (object) => object.objectId === checkpoint.carriedObjectId,
      )
    ) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Checkpoint carried object does not exist.",
      );
    }
    for (const transfer of checkpoint.transferredObjects) {
      const valid = manifest.steps.some(
        (candidate) =>
          candidate.interaction.type === "GIVE" &&
          candidate.interaction.acceptedPairs.some(
            (pair) =>
              pair.objectId === transfer.objectId &&
              pair.recipientEntityId === transfer.recipientEntityId,
          ),
      );
      if (!valid) {
        throw new PersistenceError(
          "PERSISTENCE_CHECKPOINT_INVALID",
          "Checkpoint contains an unauthored object transfer.",
        );
      }
    }
    if (
      new Set(checkpoint.transferredObjects.map((item) => item.objectId))
        .size !== checkpoint.transferredObjects.length
    ) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Checkpoint contains duplicate object transfers.",
      );
    }
    if (checkpoint.stepStartedAtActiveMs > checkpoint.activeTimeMs) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Checkpoint step start exceeds active time.",
      );
    }
    const hasPending =
      checkpoint.pendingAction !== undefined &&
      checkpoint.feedbackKind !== undefined;
    if ((checkpoint.phase === "FEEDBACK") !== hasPending) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Feedback checkpoint must contain one pending action and feedback kind.",
      );
    }
    if (checkpoint.pendingAction?.kind === "TRANSITION") {
      const pendingTarget = checkpoint.pendingAction.target;
      const authoredTargets = [
        step.transitions.onSuccess,
        step.transitions.onFailure,
        step.transitions.onAssisted,
      ];
      if (
        !authoredTargets.some(
          (target) => canonicalJson(target) === canonicalJson(pendingTarget),
        )
      ) {
        throw new PersistenceError(
          "PERSISTENCE_CHECKPOINT_INVALID",
          "Checkpoint pending transition is not authored for the current step.",
        );
      }
    }
    if (
      (checkpoint.status === "COMPLETED") !==
      (checkpoint.phase === "COMPLETED")
    ) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Checkpoint status and completion phase disagree.",
      );
    }
    if (
      checkpoint.status === "COMPLETED" &&
      manifest.completion.requiredStepIds.some(
        (stepId) => !checkpoint.completedStepIds.includes(stepId),
      )
    ) {
      throw new PersistenceError(
        "PERSISTENCE_CHECKPOINT_INVALID",
        "Completed checkpoint is missing an authored required step.",
      );
    }
  }

  private insertEvents(
    events: readonly EvidenceEvent[],
    receivedAt: string,
  ): void {
    const existingStatement = this.database.prepare(
      "SELECT payload_fingerprint FROM session_events WHERE event_id = ?",
    );
    const insertStatement = this.database.prepare(
      `INSERT INTO session_events (
         event_id, payload_fingerprint, session_id, lesson_id, revision, kind,
         step_id, context_id, primitive, target_id, evidence, response_ids_json,
         correct, assisted, attempt, active_latency_ms, occurred_at, received_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const event of events) {
      const payloadFingerprint = fingerprint(event);
      const existing = existingStatement.get(event.eventId) as
        { payload_fingerprint: string } | undefined;
      if (existing !== undefined) {
        if (existing.payload_fingerprint !== payloadFingerprint) {
          throw new PersistenceError(
            "PERSISTENCE_EVENT_INVALID",
            `Event '${event.eventId}' was reused with different content.`,
            409,
          );
        }
        continue;
      }
      insertStatement.run(
        event.eventId,
        payloadFingerprint,
        event.sessionId,
        event.lessonId,
        event.revision,
        event.kind,
        event.stepId,
        event.contextId,
        event.primitive,
        event.targetId ?? null,
        event.evidence ?? null,
        event.responseIds === undefined
          ? null
          : JSON.stringify(event.responseIds),
        event.correct === undefined ? null : event.correct ? 1 : 0,
        event.assisted ? 1 : 0,
        event.attempt,
        event.activeLatencyMs,
        event.occurredAt,
        receivedAt,
      );
    }
  }

  private writeCheckpoint(
    checkpoint: SessionCheckpoint,
    savedAt: string,
  ): void {
    this.database
      .prepare(
        `INSERT INTO session_checkpoints (
           session_id, checkpoint_contract_version, sequence, payload_json, updated_at
         ) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (session_id) DO UPDATE SET
           checkpoint_contract_version = excluded.checkpoint_contract_version,
           sequence = excluded.sequence,
           payload_json = excluded.payload_json,
           updated_at = excluded.updated_at`,
      )
      .run(
        checkpoint.sessionId,
        checkpoint.schemaVersion,
        checkpoint.sequence,
        canonicalJson(checkpoint),
        savedAt,
      );
  }

  private readCommit(
    commitId: string,
    payloadFingerprint: string,
  ): SessionCommitResult | undefined {
    const row = this.database
      .prepare(
        `SELECT session_id, payload_fingerprint, resulting_sequence,
                stored_event_count, committed_at
         FROM session_commits WHERE commit_id = ?`,
      )
      .get(commitId) as
      | {
          session_id: string;
          payload_fingerprint: string;
          resulting_sequence: number;
          stored_event_count: number;
          committed_at: string;
        }
      | undefined;
    if (row === undefined) return undefined;
    if (row.payload_fingerprint !== payloadFingerprint) {
      throw new PersistenceError(
        "PERSISTENCE_COMMIT_CONFLICT",
        `Commit '${commitId}' was reused with different content.`,
        409,
      );
    }
    return {
      schemaVersion: EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
      sessionId: row.session_id,
      checkpointSequence: row.resulting_sequence,
      storedEventCount: row.stored_event_count,
      lastSavedAt: row.committed_at,
    };
  }

  private writeCommit(
    commitId: string,
    sessionId: string,
    payloadFingerprint: string,
    resultingSequence: number,
    storedEventCount: number,
    committedAt: string,
  ): void {
    this.database
      .prepare(
        `INSERT INTO session_commits (
           commit_id, session_id, payload_fingerprint, resulting_sequence,
           stored_event_count, committed_at
         ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        commitId,
        sessionId,
        payloadFingerprint,
        resultingSequence,
        storedEventCount,
        committedAt,
      );
  }

  private readSession(sessionId: string): SessionRow {
    const row = this.database
      .prepare(
        `SELECT session_id, lesson_id, revision, status, checkpoint_sequence,
                updated_at
         FROM play_sessions WHERE session_id = ?`,
      )
      .get(sessionId) as SessionRow | undefined;
    if (row === undefined) {
      throw new PersistenceError(
        "PERSISTENCE_SESSION_NOT_FOUND",
        `Session '${sessionId}' was not found.`,
        404,
      );
    }
    return row;
  }

  private readManifest(lessonId: string, revision: number): LessonManifest {
    const row = this.database
      .prepare(
        "SELECT manifest_json FROM lesson_revisions WHERE lesson_id = ? AND revision = ?",
      )
      .get(lessonId, revision) as { manifest_json: string } | undefined;
    if (row === undefined) {
      throw new PersistenceError(
        "PERSISTENCE_SESSION_NOT_FOUND",
        `Lesson '${lessonId}' revision ${revision} was not found.`,
        404,
      );
    }
    return JSON.parse(row.manifest_json) as LessonManifest;
  }

  private summarizeTarget(
    lessonId: string,
    revision: number,
    targetId: string,
  ): TargetEvidenceSummary {
    const rows = this.database
      .prepare(
        `SELECT kind, context_id, correct, assisted, received_at
         FROM session_events
         WHERE lesson_id = ? AND revision = ? AND target_id = ?
         ORDER BY event_sequence`,
      )
      .all(lessonId, revision, targetId) as Array<{
      kind: EvidenceEvent["kind"];
      context_id: string;
      correct: number | null;
      assisted: number;
      received_at: string;
    }>;
    const reactions = rows.filter((row) => row.kind === "REACTION");
    const unaidedCorrect = reactions.filter(
      (row) => row.correct === 1 && row.assisted === 0,
    );
    const assistedCorrect = reactions.filter(
      (row) => row.correct === 1 && row.assisted === 1,
    );
    const incorrect = reactions.filter((row) => row.correct === 0);
    let lastWeakIndex = -1;
    reactions.forEach((row, index) => {
      if (row.correct === 0 || row.assisted === 1) lastWeakIndex = index;
    });
    const recoveryContexts = new Set(
      reactions
        .slice(lastWeakIndex + 1)
        .filter((row) => row.correct === 1 && row.assisted === 0)
        .map((row) => row.context_id),
    );
    const allCorrectContexts = new Set(
      unaidedCorrect.map((row) => row.context_id),
    );
    const signal =
      lastWeakIndex >= 0
        ? recoveryContexts.size >= 2
          ? "DEVELOPING"
          : "NEEDS_REVIEW"
        : allCorrectContexts.size >= 2
          ? "DEVELOPING"
          : "INSUFFICIENT_EVIDENCE";
    const last = rows.at(-1);
    return {
      lessonId,
      revision,
      targetId,
      exposureCount: rows.filter((row) => row.kind === "EXPOSURE").length,
      heardCount: rows.filter((row) => row.kind === "HEARD").length,
      reactionCount: reactions.length,
      unaidedCorrectCount: unaidedCorrect.length,
      assistedCorrectCount: assistedCorrect.length,
      incorrectCount: incorrect.length,
      distinctCorrectContextCount: allCorrectContexts.size,
      signal,
      ...(last === undefined ? {} : { lastPracticedAt: last.received_at }),
    };
  }

  private invalidEvent(
    event: EvidenceEvent,
    message: string,
  ): PersistenceError {
    return new PersistenceError(
      "PERSISTENCE_EVENT_INVALID",
      `Event '${event.eventId}' is invalid: ${message}`,
    );
  }

  private eventCount(sessionId: string): number {
    return this.scalarCount(
      "SELECT COUNT(*) AS count FROM session_events WHERE session_id = ?",
      sessionId,
    );
  }

  private tableCount(table: CountableTable): number {
    return this.scalarCount(`SELECT COUNT(*) AS count FROM ${table}`);
  }

  private scalarCount(sql: string, ...values: (string | number)[]): number {
    const row = this.database.prepare(sql).get(...values) as { count: number };
    return Number(row.count);
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
        // Preserve the original transaction error.
      }
      throw error;
    }
  }
}

interface SessionRow {
  session_id: string;
  lesson_id: string;
  revision: number;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  checkpoint_sequence: number;
  updated_at: string;
}

type CountableTable =
  | "lesson_revisions"
  | "play_sessions"
  | "session_events"
  | "session_checkpoints";

function expectedEventId(event: EvidenceEvent): string {
  const prefix = `${event.sessionId}:${event.stepId}`;
  switch (event.kind) {
    case "EXPOSURE":
      return `${prefix}:exposure:${event.targetId}`;
    case "HEARD":
      return `${prefix}:heard:${event.targetId}`;
    case "REACTION":
      return `${prefix}:reaction:${event.attempt}:${event.targetId}`;
    case "STEP_COMPLETED": {
      const outcome = event.assisted
        ? "ASSISTED"
        : event.correct
          ? "SUCCESS"
          : "FAILURE";
      return `${prefix}:completed:${outcome}`;
    }
    case "LESSON_COMPLETED":
      return `${prefix}:lesson-completed`;
  }
}

function allowedCheckpointPhases(
  step: LessonStep,
): ReadonlySet<SessionCheckpoint["phase"]> {
  const phases: SessionCheckpoint["phase"][] = ["FEEDBACK", "COMPLETED"];
  switch (step.interaction.type) {
    case "LISTEN":
      phases.push("AWAITING_AUDIO", "PLAYING_AUDIO", "AWAITING_CONTINUE");
      break;
    case "ARRANGE":
      phases.push("AWAITING_ARRANGE");
      break;
    case "CLICK_OBJECT":
      phases.push("AWAITING_OBJECT");
      break;
    case "TYPE":
      phases.push("AWAITING_TYPE");
      break;
    case "MOVE_TO":
      phases.push("AWAITING_LOCATION", "MOVING_TO_LOCATION");
      break;
    case "PICK_UP":
      phases.push("AWAITING_PICK_UP");
      break;
    case "GIVE":
      phases.push("AWAITING_RECIPIENT");
      break;
    case "CHOOSE":
      phases.push("AWAITING_CHOICE");
      break;
  }
  return new Set(phases);
}
