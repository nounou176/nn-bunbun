import {
  validateLessonPackage,
  type ValidatedLessonPackage,
} from "@bunbun/contracts";
import catalogFixture from "@bunbun/contracts/fixtures/basic-catalog" with { type: "json" };
import manifestFixture from "@bunbun/contracts/fixtures/valid-complete-primitive-loop" with { type: "json" };
import cachedSpeechFixture from "@bunbun/contracts/fixtures/valid-m8-cached-speech" with { type: "json" };
import lastTrainManifestFixture from "@bunbun/contracts/fixtures/m8-last-train" with { type: "json" };
import lastTrainCatalogFixture from "@bunbun/contracts/fixtures/m8-last-train-catalog" with { type: "json" };

import { validateRuntimeCapabilities } from "./capabilities.js";
import { assertM8LastTrainSpeechApproval } from "./production-approvals.js";

export class LessonContentError extends Error {
  constructor(
    readonly code:
      | "RUNTIME_MANIFEST_INVALID"
      | "RUNTIME_CAPABILITY_UNSUPPORTED"
      | "RUNTIME_STUDY_CATALOG_INVALID",
    message: string,
  ) {
    super(message);
  }
}

export function loadCachedSpeechLesson(
  simulateManifestFailure: boolean,
): ValidatedLessonPackage {
  const manifestInput = structuredClone(cachedSpeechFixture) as unknown;
  const catalogInput = structuredClone(catalogFixture) as unknown;
  if (simulateManifestFailure && isRecord(manifestInput)) {
    manifestInput.schemaVersion = "broken";
  }
  return loadLessonPackage(manifestInput, catalogInput);
}

export function loadLastTrainLesson(
  simulateManifestFailure: boolean,
): ValidatedLessonPackage {
  const manifestInput = structuredClone(lastTrainManifestFixture) as unknown;
  const catalogInput = structuredClone(lastTrainCatalogFixture) as unknown;
  if (simulateManifestFailure && isRecord(manifestInput)) {
    manifestInput.schemaVersion = "broken";
  }
  const lessonPackage = loadLessonPackage(manifestInput, catalogInput);
  assertM8LastTrainSpeechApproval(lessonPackage.manifest.audioAssets);
  return lessonPackage;
}

export function loadAuthoredLesson(
  simulateManifestFailure: boolean,
): ValidatedLessonPackage {
  const manifestInput = structuredClone(manifestFixture) as unknown;
  const catalogInput = structuredClone(catalogFixture) as unknown;

  if (simulateManifestFailure && isRecord(manifestInput)) {
    manifestInput.schemaVersion = "broken";
  }

  return loadLessonPackage(manifestInput, catalogInput);
}

export function loadLessonPackage(
  manifestInput: unknown,
  catalogInput: unknown,
): ValidatedLessonPackage {
  const result = validateLessonPackage(manifestInput, catalogInput);
  if (!result.ok) {
    const first = result.errors[0];
    throw new LessonContentError(
      "RUNTIME_MANIFEST_INVALID",
      first === undefined
        ? "The lesson package did not pass validation."
        : `${first.code} at ${first.path}: ${first.message}`,
    );
  }

  const capabilityErrors = validateRuntimeCapabilities(result.value);
  const firstCapabilityError = capabilityErrors[0];
  if (firstCapabilityError !== undefined) {
    throw new LessonContentError(
      "RUNTIME_CAPABILITY_UNSUPPORTED",
      `${firstCapabilityError.code} at ${firstCapabilityError.path}: ${firstCapabilityError.message}`,
    );
  }

  return result.value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
