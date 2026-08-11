import type { LessonManifest } from "../schema/index.js";
import type { BunbunValidationError } from "./errors.js";
import { indexUnique, type IndexedItem } from "./helpers.js";

export interface ManifestIndexes {
  targets: Map<string, IndexedItem<LessonManifest["learningTargets"][number]>>;
  locations: Map<string, IndexedItem<LessonManifest["locations"][number]>>;
  entities: Map<string, IndexedItem<LessonManifest["entities"][number]>>;
  objects: Map<string, IndexedItem<LessonManifest["objects"][number]>>;
  audioAssets: Map<string, IndexedItem<LessonManifest["audioAssets"][number]>>;
  steps: Map<string, IndexedItem<LessonManifest["steps"][number]>>;
}

export function buildManifestIndexes(
  manifest: LessonManifest,
  errors: BunbunValidationError[],
): ManifestIndexes {
  return {
    targets: indexUnique(
      manifest.learningTargets,
      (target) => target.targetId,
      "/learningTargets",
      "MANIFEST",
      "DUPLICATE_TARGET_ID",
      errors,
    ),
    locations: indexUnique(
      manifest.locations,
      (location) => location.locationId,
      "/locations",
      "MANIFEST",
      "DUPLICATE_LOCATION_ID",
      errors,
    ),
    entities: indexUnique(
      manifest.entities,
      (entity) => entity.entityId,
      "/entities",
      "MANIFEST",
      "DUPLICATE_ENTITY_ID",
      errors,
    ),
    objects: indexUnique(
      manifest.objects,
      (object) => object.objectId,
      "/objects",
      "MANIFEST",
      "DUPLICATE_OBJECT_ID",
      errors,
    ),
    audioAssets: indexUnique(
      manifest.audioAssets,
      (audio) => audio.audioAssetId,
      "/audioAssets",
      "MANIFEST",
      "DUPLICATE_AUDIO_ASSET_ID",
      errors,
    ),
    steps: indexUnique(
      manifest.steps,
      (step) => step.stepId,
      "/steps",
      "MANIFEST",
      "DUPLICATE_STEP_ID",
      errors,
    ),
  };
}
