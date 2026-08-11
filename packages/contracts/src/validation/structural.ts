import Ajv2020Module, {
  type AnySchema,
  type ErrorObject,
  type ValidateFunction,
} from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";

import {
  CatalogSnapshotSchema,
  LessonManifestSchema,
  type CatalogSnapshot,
  type LessonManifest,
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
