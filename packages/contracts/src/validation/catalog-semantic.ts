import type { CatalogSnapshot, SceneCatalogEntry } from "../schema/index.js";
import { type BunbunValidationError, semanticError } from "./errors.js";
import { indexUnique, pushUnknownReference } from "./helpers.js";

export interface CatalogIndexes {
  scenes: Map<
    string,
    { value: CatalogSnapshot["scenes"][number]; index: number }
  >;
  assetBundles: Map<
    string,
    { value: CatalogSnapshot["assetBundles"][number]; index: number }
  >;
  locations: Map<
    string,
    { value: CatalogSnapshot["locations"][number]; index: number }
  >;
  entities: Map<
    string,
    { value: CatalogSnapshot["entities"][number]; index: number }
  >;
  objects: Map<
    string,
    { value: CatalogSnapshot["objects"][number]; index: number }
  >;
  presentationCues: Map<
    string,
    { value: CatalogSnapshot["presentationCues"][number]; index: number }
  >;
  voiceProfiles: Map<
    string,
    { value: CatalogSnapshot["voiceProfiles"][number]; index: number }
  >;
  referenceRecords: Map<
    string,
    { value: CatalogSnapshot["referenceRecords"][number]; index: number }
  >;
}

export interface CatalogSemanticResult {
  indexes: CatalogIndexes;
  errors: BunbunValidationError[];
}

export function validateCatalogSemantics(
  catalog: CatalogSnapshot,
): CatalogSemanticResult {
  const errors: BunbunValidationError[] = [];

  const indexes: CatalogIndexes = {
    scenes: indexUnique(
      catalog.scenes,
      (entry) => entry.sceneId,
      "/scenes",
      "CATALOG",
      "DUPLICATE_SCENE_ID",
      errors,
    ),
    assetBundles: indexUnique(
      catalog.assetBundles,
      (entry) => entry.assetBundleId,
      "/assetBundles",
      "CATALOG",
      "DUPLICATE_ASSET_BUNDLE_ID",
      errors,
    ),
    locations: indexUnique(
      catalog.locations,
      (entry) => entry.catalogLocationId,
      "/locations",
      "CATALOG",
      "DUPLICATE_CATALOG_LOCATION_ID",
      errors,
    ),
    entities: indexUnique(
      catalog.entities,
      (entry) => entry.catalogEntityId,
      "/entities",
      "CATALOG",
      "DUPLICATE_CATALOG_ENTITY_ID",
      errors,
    ),
    objects: indexUnique(
      catalog.objects,
      (entry) => entry.catalogObjectId,
      "/objects",
      "CATALOG",
      "DUPLICATE_CATALOG_OBJECT_ID",
      errors,
    ),
    presentationCues: indexUnique(
      catalog.presentationCues,
      (entry) => entry.cueId,
      "/presentationCues",
      "CATALOG",
      "DUPLICATE_CUE_ID",
      errors,
    ),
    voiceProfiles: indexUnique(
      catalog.voiceProfiles,
      (entry) => entry.voiceProfileId,
      "/voiceProfiles",
      "CATALOG",
      "DUPLICATE_VOICE_PROFILE_ID",
      errors,
    ),
    referenceRecords: indexUnique(
      catalog.referenceRecords,
      (entry) => entry.referenceId,
      "/referenceRecords",
      "CATALOG",
      "DUPLICATE_REFERENCE_ID",
      errors,
    ),
  };

  catalog.scenes.forEach((scene, sceneIndex) => {
    indexUnique(
      scene.spawnPoints,
      (spawnPoint) => spawnPoint.spawnPointId,
      `/scenes/${sceneIndex}/spawnPoints`,
      "CATALOG",
      "DUPLICATE_SPAWN_POINT_ID",
      errors,
    );
  });

  catalog.assetBundles.forEach((bundle, bundleIndex) => {
    validateSceneReferences(
      bundle.sceneIds,
      `/assetBundles/${bundleIndex}/sceneIds`,
      indexes,
      errors,
    );
  });

  catalog.locations.forEach((location, locationIndex) => {
    validateSceneReference(
      location.sceneId,
      `/locations/${locationIndex}/sceneId`,
      indexes,
      errors,
    );
  });

  catalog.entities.forEach((entity, entityIndex) => {
    validateSceneReferences(
      entity.sceneIds,
      `/entities/${entityIndex}/sceneIds`,
      indexes,
      errors,
    );
  });

  catalog.objects.forEach((object, objectIndex) => {
    validateSceneReferences(
      object.sceneIds,
      `/objects/${objectIndex}/sceneIds`,
      indexes,
      errors,
    );
  });

  catalog.presentationCues.forEach((cue, cueIndex) => {
    validateSceneReference(
      cue.sceneId,
      `/presentationCues/${cueIndex}/sceneId`,
      indexes,
      errors,
    );
  });

  return { indexes, errors };
}

export function findSpawnPoint(scene: SceneCatalogEntry, spawnPointId: string) {
  return scene.spawnPoints.find(
    (spawnPoint) => spawnPoint.spawnPointId === spawnPointId,
  );
}

function validateSceneReferences(
  sceneIds: readonly string[],
  basePath: string,
  indexes: CatalogIndexes,
  errors: BunbunValidationError[],
): void {
  sceneIds.forEach((sceneId, sceneIndex) => {
    validateSceneReference(
      sceneId,
      `${basePath}/${sceneIndex}`,
      indexes,
      errors,
    );
  });
}

function validateSceneReference(
  sceneId: string,
  path: string,
  indexes: CatalogIndexes,
  errors: BunbunValidationError[],
): void {
  if (!indexes.scenes.has(sceneId)) {
    pushUnknownReference(
      errors,
      "CATALOG",
      "UNKNOWN_CATALOG_SCENE_REFERENCE",
      path,
      "scene",
      sceneId,
    );
  }
}

export function catalogCompatibilityError(
  code: string,
  path: string,
  message: string,
): BunbunValidationError {
  return semanticError("CATALOG", code, path, message);
}
