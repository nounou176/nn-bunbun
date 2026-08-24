import {
  validateLessonPackage,
  type ValidatedLessonPackage,
} from "@bunbun/contracts";
import catalogFixture from "@bunbun/contracts/fixtures/basic-catalog" with { type: "json" };
import manifestFixture from "@bunbun/contracts/fixtures/valid-complete-primitive-loop" with { type: "json" };

import { validateRuntimeCapabilities } from "./capabilities.js";

export class LessonContentError extends Error {
  constructor(
    readonly code:
      "RUNTIME_MANIFEST_INVALID" | "RUNTIME_CAPABILITY_UNSUPPORTED",
    message: string,
  ) {
    super(message);
  }
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
