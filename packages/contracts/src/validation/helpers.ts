import type { BunbunValidationError, ValidationSource } from "./errors.js";
import { semanticError } from "./errors.js";

export interface IndexedItem<Value> {
  value: Value;
  index: number;
}

export function indexUnique<Value>(
  values: readonly Value[],
  getId: (value: Value) => string,
  basePath: string,
  source: ValidationSource,
  duplicateCode: string,
  errors: BunbunValidationError[],
): Map<string, IndexedItem<Value>> {
  const index = new Map<string, IndexedItem<Value>>();

  values.forEach((value, itemIndex) => {
    const id = getId(value);
    if (index.has(id)) {
      errors.push(
        semanticError(
          source,
          duplicateCode,
          `${basePath}/${itemIndex}`,
          `Duplicate identifier '${id}'.`,
        ),
      );
      return;
    }

    index.set(id, { value, index: itemIndex });
  });

  return index;
}

export function pushUnknownReference(
  errors: BunbunValidationError[],
  source: ValidationSource,
  code: string,
  path: string,
  kind: string,
  id: string,
): void {
  errors.push(semanticError(source, code, path, `Unknown ${kind} '${id}'.`));
}

export function isSubset(
  candidates: readonly string[],
  accepted: readonly string[],
): boolean {
  const candidateSet = new Set(candidates);
  return accepted.every((value) => candidateSet.has(value));
}

export function duplicateStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  }

  return [...duplicates].sort();
}

export function escapeJsonPointer(segment: string): string {
  return segment.replaceAll("~", "~0").replaceAll("/", "~1");
}
