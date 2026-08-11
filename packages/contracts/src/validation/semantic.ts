import type { CatalogSnapshot, LessonManifest } from "../schema/index.js";
import { validateCatalogSemantics } from "./catalog-semantic.js";
import {
  type BunbunValidationError,
  type ValidationResult,
  validationFailure,
  validationSuccess,
} from "./errors.js";
import { validateManifestGraph } from "./semantic-graph.js";
import { validateManifestInteractions } from "./semantic-interactions.js";
import { validateManifestLearning } from "./semantic-learning.js";
import { validateManifestWorld } from "./semantic-world.js";
import {
  validateCatalogStructure,
  validateManifestStructure,
} from "./structural.js";
import { buildManifestIndexes } from "./manifest-indexes.js";

export interface ValidatedLessonPackage {
  manifest: LessonManifest;
  catalog: CatalogSnapshot;
}

export function validateLessonPackage(
  manifestInput: unknown,
  catalogInput: unknown,
): ValidationResult<ValidatedLessonPackage> {
  const catalogResult = validateCatalogStructure(catalogInput);
  const manifestResult = validateManifestStructure(manifestInput);

  if (!catalogResult.ok || !manifestResult.ok) {
    return validationFailure([
      ...catalogResult.errors,
      ...manifestResult.errors,
    ]);
  }

  const errors = validateLessonPackageSemantics(
    manifestResult.value,
    catalogResult.value,
  );

  if (errors.length > 0) {
    return validationFailure(errors);
  }

  return validationSuccess({
    manifest: manifestResult.value,
    catalog: catalogResult.value,
  });
}

export function validateLessonPackageSemantics(
  manifest: LessonManifest,
  catalog: CatalogSnapshot,
): BunbunValidationError[] {
  const catalogResult = validateCatalogSemantics(catalog);
  const errors = [...catalogResult.errors];
  const manifestIndexes = buildManifestIndexes(manifest, errors);

  validateManifestWorld(
    manifest,
    catalog,
    catalogResult.indexes,
    manifestIndexes,
    errors,
  );
  validateManifestInteractions(
    manifest,
    catalogResult.indexes,
    manifestIndexes,
    errors,
  );
  const graphResult = validateManifestGraph(manifest, manifestIndexes, errors);
  validateManifestLearning(
    manifest,
    manifestIndexes,
    graphResult.reachableStepIds,
    errors,
  );

  return validationFailure(errors).errors;
}
