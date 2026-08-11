export type ValidationSource = "CATALOG" | "MANIFEST";
export type ValidationLayer = "STRUCTURAL" | "SEMANTIC";

export interface BunbunValidationError {
  source: ValidationSource;
  layer: ValidationLayer;
  code: string;
  path: string;
  message: string;
}

export interface ValidationSuccess<Value> {
  ok: true;
  value: Value;
  errors: [];
}

export interface ValidationFailure {
  ok: false;
  errors: BunbunValidationError[];
}

export type ValidationResult<Value> =
  ValidationSuccess<Value> | ValidationFailure;

export function validationSuccess<Value>(
  value: Value,
): ValidationSuccess<Value> {
  return { ok: true, value, errors: [] };
}

export function validationFailure(
  errors: BunbunValidationError[],
): ValidationFailure {
  return { ok: false, errors: sortValidationErrors(errors) };
}

export function semanticError(
  source: ValidationSource,
  code: string,
  path: string,
  message: string,
): BunbunValidationError {
  return {
    source,
    layer: "SEMANTIC",
    code,
    path,
    message,
  };
}

export function sortValidationErrors(
  errors: BunbunValidationError[],
): BunbunValidationError[] {
  const seen = new Set<string>();

  return [...errors]
    .sort((left, right) => {
      return (
        left.source.localeCompare(right.source) ||
        left.layer.localeCompare(right.layer) ||
        left.path.localeCompare(right.path) ||
        left.code.localeCompare(right.code) ||
        left.message.localeCompare(right.message)
      );
    })
    .filter((error) => {
      const key = [
        error.source,
        error.layer,
        error.code,
        error.path,
        error.message,
      ].join("\u0000");

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}
