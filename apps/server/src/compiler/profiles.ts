import { createHash } from "node:crypto";

import {
  type LessonAuthoringRequestV2,
  type ValidatedLessonPackage,
  validateJapaneseTextStudyCatalogStructure,
  validateLessonPackage,
  validateRuntimeCapabilities,
} from "@bunbun/contracts";
import lastTrainCatalogFixture from "@bunbun/contracts/fixtures/m8-last-train-catalog" with { type: "json" };
import lastTrainManifestFixture from "@bunbun/contracts/fixtures/m8-last-train" with { type: "json" };
import approvedProfileFixture from "@bunbun/contracts/fixtures/m8-last-train-approved-profile" with { type: "json" };
import studyCatalogFixture from "@bunbun/contracts/fixtures/m8-last-train-study-catalog" with { type: "json" };

import { canonicalJson, fingerprint } from "../persistence/canonical-json.js";
import {
  CompilerError,
  type CompilerDiagnostic,
  createCompilationDraft,
} from "./core.js";

export type CompilationMode =
  "AUTHORING_HANDOFF" | "APPROVED_PROFILE_SELECTION";

export const PARK_AUTHORING_PROFILE_ID = "park_authoring_v1";
export const M8_LAST_TRAIN_PROFILE_ID = "m8_last_train_approved_v1";

interface ApprovedTargetDefinition {
  key: string;
  targetId: string;
  labelJa: string;
  aliases: string[];
}

interface ApprovedSpeechIdentity {
  cacheKey: string;
  wavSha256: string;
}

interface ApprovedProfileReference {
  profileFormat: string;
  profileVersion: string;
  profileId: string;
  mode: "APPROVED_PROFILE_SELECTION";
  requestedTargets: ApprovedTargetDefinition[];
  supportingTargetIds: string[];
  package: {
    lessonId: string;
    revision: number;
    packageFingerprint: string;
    contentApprovalSha256: string;
    speechApprovalSha256: string;
    studyCatalogId: string;
    studyCatalogVersion: string;
    speech: ApprovedSpeechIdentity[];
  };
}

export interface ApprovedProfileTrace {
  packetFormat: "bunbun_approved_profile_selection_trace";
  packetVersion: "1.0.0";
  profileId: string;
  normalizedTargetKeys: string[];
  requestedTargetIds: string[];
  supportingTargetIds: string[];
  lessonId: string;
  revision: number;
  packageFingerprint: string;
  contentApprovalSha256: string;
  speechApprovalSha256: string;
  studyCatalogId: string;
}

export type CompilerRouteDraft =
  | {
      mode: "AUTHORING_HANDOFF";
      profileId: typeof PARK_AUTHORING_PROFILE_ID;
      compilationId: string;
      cacheKey: string;
      normalizedTargetKeys: string[];
      payload: LessonAuthoringRequestV2;
    }
  | {
      mode: "APPROVED_PROFILE_SELECTION";
      profileId: typeof M8_LAST_TRAIN_PROFILE_ID;
      compilationId: string;
      cacheKey: string;
      normalizedTargetKeys: string[];
      payload: ApprovedProfileTrace;
      pendingPackage: ValidatedLessonPackage;
    };

const profile = approvedProfileFixture as ApprovedProfileReference;

export const M8_LAST_TRAIN_APPROVED_SPEECH = profile.package.speech.map(
  (identity) => ({ ...identity }),
);

export function createCompilerRouteDraft(
  targetTexts: readonly string[],
): CompilerRouteDraft {
  const normalizedTexts = normalizeInputTexts(targetTexts);
  const matched = normalizedTexts.map((text) => findApprovedTarget(text));
  const hasM8Target = matched.some(
    (target) => target?.key === "wallet" || target?.key === "search",
  );

  if (!hasM8Target) {
    const draft = createCompilationDraft(targetTexts);
    return {
      mode: "AUTHORING_HANDOFF",
      profileId: PARK_AUTHORING_PROFILE_ID,
      compilationId: draft.compilationId,
      cacheKey: draft.cacheKey,
      normalizedTargetKeys: draft.normalizedTargetKeys,
      payload: draft.request,
    };
  }

  if (
    normalizedTexts.length !== profile.requestedTargets.length ||
    matched.some((target) => target === undefined)
  ) {
    throw profileTargetError(
      "APPROVED_PROFILE_TARGET_SET_INVALID",
      "Last Train requires exactly 財布, 探す, and ～てください. Do not mix park and neighborhood targets.",
    );
  }

  const matchedTargets = matched as ApprovedTargetDefinition[];
  const keys = matchedTargets.map((target) => target.key);
  if (new Set(keys).size !== keys.length) {
    throw profileTargetError(
      "DUPLICATE_TARGET",
      "Each Last Train target may be entered only once.",
    );
  }
  const expectedKeys = profile.requestedTargets.map((target) => target.key);
  if (
    keys.length !== expectedKeys.length ||
    expectedKeys.some((key) => !keys.includes(key))
  ) {
    throw profileTargetError(
      "APPROVED_PROFILE_TARGET_SET_INVALID",
      "Last Train requires the complete target set: 財布, 探す, and ～てください.",
    );
  }

  const pendingPackage = approvedLastTrainPackage();
  const cacheKey = sha256Canonical({
    profileId: profile.profileId,
    profileVersion: profile.profileVersion,
    targetKeys: expectedKeys,
    packageFingerprint: profile.package.packageFingerprint,
    contentApprovalSha256: profile.package.contentApprovalSha256,
    speechApprovalSha256: profile.package.speechApprovalSha256,
  });
  const shortHash = cacheKey.slice(0, 20);
  const payload: ApprovedProfileTrace = {
    packetFormat: "bunbun_approved_profile_selection_trace",
    packetVersion: "1.0.0",
    profileId: M8_LAST_TRAIN_PROFILE_ID,
    normalizedTargetKeys: expectedKeys,
    requestedTargetIds: profile.requestedTargets.map(
      (target) => target.targetId,
    ),
    supportingTargetIds: [...profile.supportingTargetIds],
    lessonId: profile.package.lessonId,
    revision: profile.package.revision,
    packageFingerprint: profile.package.packageFingerprint,
    contentApprovalSha256: profile.package.contentApprovalSha256,
    speechApprovalSha256: profile.package.speechApprovalSha256,
    studyCatalogId: profile.package.studyCatalogId,
  };

  return {
    mode: "APPROVED_PROFILE_SELECTION",
    profileId: M8_LAST_TRAIN_PROFILE_ID,
    compilationId: `compilation_${shortHash}`,
    cacheKey,
    normalizedTargetKeys: expectedKeys,
    payload,
    pendingPackage,
  };
}

export function approvedLastTrainPackage(): ValidatedLessonPackage {
  if (
    profile.profileFormat !== "bunbun_approved_lesson_profile" ||
    profile.profileVersion !== "1.0.0" ||
    profile.profileId !== M8_LAST_TRAIN_PROFILE_ID ||
    profile.mode !== "APPROVED_PROFILE_SELECTION"
  ) {
    throw profileInvalid("The approved compiler profile identity drifted.");
  }

  const validated = validateLessonPackage(
    structuredClone(lastTrainManifestFixture),
    structuredClone(lastTrainCatalogFixture),
  );
  if (!validated.ok) {
    throw new CompilerError(
      "APPROVED_PROFILE_PACKAGE_INVALID",
      "The approved Last Train package no longer passes validation.",
      validated.errors.map((error) => ({
        source: "SEMANTIC",
        code: error.code,
        path: error.path,
        message: error.message,
      })),
      500,
    );
  }
  const lessonPackage = validated.value;
  const runtimeErrors = validateRuntimeCapabilities(lessonPackage);
  if (runtimeErrors.length > 0) {
    throw new CompilerError(
      "APPROVED_PROFILE_RUNTIME_UNSUPPORTED",
      "The approved Last Train package is outside runtime capabilities.",
      runtimeErrors.map((error) => ({
        source: "RUNTIME_CAPABILITY",
        ...error,
      })),
      500,
    );
  }

  const requestedTargetIds = lessonPackage.manifest.learningTargets
    .filter((target) => target.role === "REQUESTED")
    .map((target) => target.targetId);
  const supportingTargetIds = lessonPackage.manifest.learningTargets
    .filter((target) => target.role === "SUPPORTING")
    .map((target) => target.targetId);
  const expectedRequested = profile.requestedTargets.map(
    (target) => target.targetId,
  );
  const actualSpeechKeys = lessonPackage.manifest.audioAssets.map(
    (asset) => asset.cacheKey,
  );
  const expectedSpeechKeys = profile.package.speech.map(
    (identity) => identity.cacheKey,
  );
  if (
    lessonPackage.manifest.lessonId !== profile.package.lessonId ||
    lessonPackage.manifest.revision !== profile.package.revision ||
    fingerprint(lessonPackage) !== profile.package.packageFingerprint ||
    lessonPackage.manifest.scene.sceneId !== "neighborhood_small" ||
    lessonPackage.manifest.provenance.source !== "AUTHORED" ||
    lessonPackage.manifest.provenance.inputHash !==
      profile.package.contentApprovalSha256 ||
    lessonPackage.manifest.provenance.promptModuleVersions.length !== 0 ||
    canonicalJson(requestedTargetIds) !== canonicalJson(expectedRequested) ||
    canonicalJson(supportingTargetIds) !==
      canonicalJson(profile.supportingTargetIds) ||
    canonicalJson(actualSpeechKeys) !== canonicalJson(expectedSpeechKeys)
  ) {
    throw profileInvalid(
      "The approved package identity, provenance, target roles, or speech bindings drifted.",
    );
  }

  validateStudyBinding(lessonPackage);
  return lessonPackage;
}

function validateStudyBinding(lessonPackage: ValidatedLessonPackage): void {
  const result = validateJapaneseTextStudyCatalogStructure(
    structuredClone(studyCatalogFixture),
  );
  if (!result.ok) {
    throw profileInvalid("The approved Japanese study catalog is invalid.");
  }
  const study = result.value;
  if (
    study.schemaVersion !== profile.package.studyCatalogVersion ||
    study.catalogId !== profile.package.studyCatalogId ||
    study.lessonId !== lessonPackage.manifest.lessonId ||
    study.lessonRevision !== lessonPackage.manifest.revision
  ) {
    throw profileInvalid(
      "The Japanese study catalog targets another package identity.",
    );
  }
  for (const audio of lessonPackage.manifest.audioAssets) {
    const record = study.records.find(
      (candidate) => candidate.audioAssetId === audio.audioAssetId,
    );
    if (record?.textJa !== audio.textJa) {
      throw profileInvalid(
        `Study audio binding '${audio.audioAssetId}' does not match exact Japanese text.`,
      );
    }
  }
}

function normalizeInputTexts(targetTexts: readonly string[]): string[] {
  if (targetTexts.length < 1 || targetTexts.length > 3) {
    throw profileTargetError(
      "TARGET_COUNT_INVALID",
      "Enter one to three supported Japanese targets.",
    );
  }
  return targetTexts.map((raw, index) => {
    const normalized = normalizeAlias(raw);
    if ([...normalized].length === 0 || [...normalized].length > 40) {
      throw new CompilerError(
        "TARGET_LENGTH_INVALID",
        "Target text must contain 1–40 Unicode characters.",
        [
          {
            source: "NORMALIZATION",
            code: "TARGET_LENGTH_INVALID",
            path: `/targets/${index}`,
            message: "Target text must contain 1–40 Unicode characters.",
          },
        ],
      );
    }
    if (
      /https?:\/\/|<[^>]+>|```|\b(?:system|assistant|ignore previous)\b/iu.test(
        normalized,
      ) ||
      [...normalized].some((character) => {
        const codePoint = character.codePointAt(0) ?? 0;
        return codePoint <= 0x1f || codePoint === 0x7f;
      })
    ) {
      throw profileTargetError(
        "TARGET_TEXT_UNSAFE",
        "Target text must be plain Japanese without URLs, markup, controls, or embedded instructions.",
      );
    }
    return normalized;
  });
}

function findApprovedTarget(
  normalizedText: string,
): ApprovedTargetDefinition | undefined {
  return profile.requestedTargets.find((target) =>
    target.aliases.some((alias) => normalizeAlias(alias) === normalizedText),
  );
}

function normalizeAlias(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ");
}

function profileTargetError(code: string, message: string): CompilerError {
  return new CompilerError(code, message, [
    {
      source: "NORMALIZATION",
      code,
      path: "/targets",
      message,
    },
  ]);
}

function profileInvalid(message: string): CompilerError {
  const diagnostic: CompilerDiagnostic = {
    source: "SEMANTIC",
    code: "APPROVED_PROFILE_DRIFT",
    path: "/profile",
    message,
  };
  return new CompilerError(
    "APPROVED_PROFILE_DRIFT",
    message,
    [diagnostic],
    500,
  );
}

function sha256Canonical(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}
