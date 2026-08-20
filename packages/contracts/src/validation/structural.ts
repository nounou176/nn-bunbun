import Ajv2020Module, {
  type AnySchema,
  type ErrorObject,
  type ValidateFunction,
} from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";

import {
  AbandonSessionRequestSchema,
  AbandonSessionResultSchema,
  CatalogSnapshotSchema,
  EvidenceEventSchema,
  LessonAuthoringRequestSchema,
  LessonAuthoringRequestV2Schema,
  LessonAuthoringResultSchema,
  LessonAuthoringResultV2Schema,
  LocalPreferencesSchema,
  LessonManifestSchema,
  ProgressSummaryResultSchema,
  ResetLocalDataRequestSchema,
  ResetLocalDataResultSchema,
  ResumableSessionResultSchema,
  SessionCheckpointSchema,
  SessionCommitRequestSchema,
  SessionCommitResultSchema,
  SessionCreateRequestSchema,
  StorageSummarySchema,
  UpdatePreferencesRequestSchema,
  type AbandonSessionRequest,
  type AbandonSessionResult,
  type CatalogSnapshot,
  type EvidenceEvent,
  type LessonAuthoringRequest,
  type LessonAuthoringRequestV2,
  type LessonAuthoringResult,
  type LessonAuthoringResultV2,
  type LocalPreferences,
  type LessonManifest,
  type ProgressSummaryResult,
  type ResetLocalDataRequest,
  type ResetLocalDataResult,
  type ResumableSessionResult,
  type SessionCheckpoint,
  type SessionCommitRequest,
  type SessionCommitResult,
  type SessionCreateRequest,
  type StorageSummary,
  type UpdatePreferencesRequest,
} from "../schema/index.js";
import {
  type BunbunValidationError,
  type ValidationResult,
  type ValidationSource,
  validationFailure,
  validationSuccess,
} from "./errors.js";

const Ajv2020 =
  Ajv2020Module as unknown as typeof import("ajv/dist/2020.js").default;
const addFormats =
  addFormatsModule as unknown as typeof import("ajv-formats").default;

const ajv = new Ajv2020({
  allErrors: true,
  coerceTypes: false,
  removeAdditional: false,
  strict: true,
  useDefaults: false,
  validateFormats: true,
});

addFormats(ajv);

const catalogValidator = ajv.compile<CatalogSnapshot>(
  CatalogSnapshotSchema as AnySchema,
);
const manifestValidator = ajv.compile<LessonManifest>(
  LessonManifestSchema as AnySchema,
);
const evidenceEventValidator = ajv.compile<EvidenceEvent>(
  EvidenceEventSchema as AnySchema,
);
const lessonAuthoringRequestValidator = ajv.compile<LessonAuthoringRequest>(
  LessonAuthoringRequestSchema as AnySchema,
);
const lessonAuthoringResultValidator = ajv.compile<LessonAuthoringResult>(
  LessonAuthoringResultSchema as AnySchema,
);
const lessonAuthoringRequestV2Validator = ajv.compile<LessonAuthoringRequestV2>(
  LessonAuthoringRequestV2Schema as AnySchema,
);
const lessonAuthoringResultV2Validator = ajv.compile<LessonAuthoringResultV2>(
  LessonAuthoringResultV2Schema as AnySchema,
);
const sessionCheckpointValidator = ajv.compile<SessionCheckpoint>(
  SessionCheckpointSchema as AnySchema,
);
const sessionCreateRequestValidator = ajv.compile<SessionCreateRequest>(
  SessionCreateRequestSchema as AnySchema,
);
const sessionCommitRequestValidator = ajv.compile<SessionCommitRequest>(
  SessionCommitRequestSchema as AnySchema,
);
const sessionCommitResultValidator = ajv.compile<SessionCommitResult>(
  SessionCommitResultSchema as AnySchema,
);
const resumableSessionResultValidator = ajv.compile<ResumableSessionResult>(
  ResumableSessionResultSchema as AnySchema,
);
const abandonSessionRequestValidator = ajv.compile<AbandonSessionRequest>(
  AbandonSessionRequestSchema as AnySchema,
);
const abandonSessionResultValidator = ajv.compile<AbandonSessionResult>(
  AbandonSessionResultSchema as AnySchema,
);
const localPreferencesValidator = ajv.compile<LocalPreferences>(
  LocalPreferencesSchema as AnySchema,
);
const updatePreferencesRequestValidator = ajv.compile<UpdatePreferencesRequest>(
  UpdatePreferencesRequestSchema as AnySchema,
);
const progressSummaryResultValidator = ajv.compile<ProgressSummaryResult>(
  ProgressSummaryResultSchema as AnySchema,
);
const storageSummaryValidator = ajv.compile<StorageSummary>(
  StorageSummarySchema as AnySchema,
);
const resetLocalDataRequestValidator = ajv.compile<ResetLocalDataRequest>(
  ResetLocalDataRequestSchema as AnySchema,
);
const resetLocalDataResultValidator = ajv.compile<ResetLocalDataResult>(
  ResetLocalDataResultSchema as AnySchema,
);

export function validateCatalogStructure(
  input: unknown,
): ValidationResult<CatalogSnapshot> {
  return runStructuralValidation(input, catalogValidator, "CATALOG");
}

export function validateManifestStructure(
  input: unknown,
): ValidationResult<LessonManifest> {
  return runStructuralValidation(input, manifestValidator, "MANIFEST");
}

export function validateEvidenceEventStructure(
  input: unknown,
): ValidationResult<EvidenceEvent> {
  return runStructuralValidation(input, evidenceEventValidator, "PERSISTENCE");
}

export function validateLessonAuthoringRequestStructure(
  input: unknown,
): ValidationResult<LessonAuthoringRequest> {
  return runStructuralValidation(
    input,
    lessonAuthoringRequestValidator,
    "AUTHORING",
  );
}

export function validateLessonAuthoringResultStructure(
  input: unknown,
): ValidationResult<LessonAuthoringResult> {
  return runStructuralValidation(
    input,
    lessonAuthoringResultValidator,
    "AUTHORING",
  );
}

export function validateLessonAuthoringRequestV2Structure(
  input: unknown,
): ValidationResult<LessonAuthoringRequestV2> {
  return runStructuralValidation(
    input,
    lessonAuthoringRequestV2Validator,
    "AUTHORING",
  );
}

export function validateLessonAuthoringResultV2Structure(
  input: unknown,
): ValidationResult<LessonAuthoringResultV2> {
  return runStructuralValidation(
    input,
    lessonAuthoringResultV2Validator,
    "AUTHORING",
  );
}

export function validateSessionCheckpointStructure(
  input: unknown,
): ValidationResult<SessionCheckpoint> {
  return runStructuralValidation(
    input,
    sessionCheckpointValidator,
    "PERSISTENCE",
  );
}

export function validateSessionCreateRequestStructure(
  input: unknown,
): ValidationResult<SessionCreateRequest> {
  return runStructuralValidation(
    input,
    sessionCreateRequestValidator,
    "PERSISTENCE",
  );
}

export function validateSessionCommitRequestStructure(
  input: unknown,
): ValidationResult<SessionCommitRequest> {
  return runStructuralValidation(
    input,
    sessionCommitRequestValidator,
    "PERSISTENCE",
  );
}

export function validateSessionCommitResultStructure(
  input: unknown,
): ValidationResult<SessionCommitResult> {
  return runStructuralValidation(
    input,
    sessionCommitResultValidator,
    "PERSISTENCE",
  );
}

export function validateResumableSessionResultStructure(
  input: unknown,
): ValidationResult<ResumableSessionResult> {
  return runStructuralValidation(
    input,
    resumableSessionResultValidator,
    "PERSISTENCE",
  );
}

export function validateAbandonSessionRequestStructure(
  input: unknown,
): ValidationResult<AbandonSessionRequest> {
  return runStructuralValidation(
    input,
    abandonSessionRequestValidator,
    "PERSISTENCE",
  );
}

export function validateAbandonSessionResultStructure(
  input: unknown,
): ValidationResult<AbandonSessionResult> {
  return runStructuralValidation(
    input,
    abandonSessionResultValidator,
    "PERSISTENCE",
  );
}

export function validateLocalPreferencesStructure(
  input: unknown,
): ValidationResult<LocalPreferences> {
  return runStructuralValidation(
    input,
    localPreferencesValidator,
    "PERSISTENCE",
  );
}

export function validateUpdatePreferencesRequestStructure(
  input: unknown,
): ValidationResult<UpdatePreferencesRequest> {
  return runStructuralValidation(
    input,
    updatePreferencesRequestValidator,
    "PERSISTENCE",
  );
}

export function validateProgressSummaryResultStructure(
  input: unknown,
): ValidationResult<ProgressSummaryResult> {
  return runStructuralValidation(
    input,
    progressSummaryResultValidator,
    "PERSISTENCE",
  );
}

export function validateStorageSummaryStructure(
  input: unknown,
): ValidationResult<StorageSummary> {
  return runStructuralValidation(input, storageSummaryValidator, "PERSISTENCE");
}

export function validateResetLocalDataRequestStructure(
  input: unknown,
): ValidationResult<ResetLocalDataRequest> {
  return runStructuralValidation(
    input,
    resetLocalDataRequestValidator,
    "PERSISTENCE",
  );
}

export function validateResetLocalDataResultStructure(
  input: unknown,
): ValidationResult<ResetLocalDataResult> {
  return runStructuralValidation(
    input,
    resetLocalDataResultValidator,
    "PERSISTENCE",
  );
}

function runStructuralValidation<Value>(
  input: unknown,
  validator: ValidateFunction<Value>,
  source: ValidationSource,
): ValidationResult<Value> {
  if (validator(input)) {
    return validationSuccess(input);
  }

  const errors = (validator.errors ?? []).map((error) =>
    normalizeAjvError(error, source),
  );

  return validationFailure(errors);
}

function normalizeAjvError(
  error: ErrorObject,
  source: ValidationSource,
): BunbunValidationError {
  const path = structuralErrorPath(error);
  const keyword = error.keyword.replace(/([a-z])([A-Z])/g, "$1_$2");

  return {
    source,
    layer: "STRUCTURAL",
    code: `STRUCTURAL_${keyword.toUpperCase()}`,
    path,
    message: error.message ?? `Failed ${error.keyword} validation.`,
  };
}

function structuralErrorPath(error: ErrorObject): string {
  if (error.keyword === "required") {
    const property = readStringParameter(error.params, "missingProperty");
    return appendJsonPointer(error.instancePath, property);
  }

  if (error.keyword === "additionalProperties") {
    const property = readStringParameter(error.params, "additionalProperty");
    return appendJsonPointer(error.instancePath, property);
  }

  return error.instancePath || "/";
}

function readStringParameter(
  parameters: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = parameters[key];
  return typeof value === "string" ? value : undefined;
}

function appendJsonPointer(path: string, segment: string | undefined): string {
  if (segment === undefined) {
    return path || "/";
  }

  const escaped = segment.replaceAll("~", "~0").replaceAll("/", "~1");
  return `${path}/${escaped}`;
}
