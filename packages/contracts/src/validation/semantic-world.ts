import type {
  CatalogSnapshot,
  LessonManifest,
  SceneCatalogEntry,
} from "../schema/index.js";
import { findSpawnPoint, type CatalogIndexes } from "./catalog-semantic.js";
import { type BunbunValidationError, semanticError } from "./errors.js";
import { pushUnknownReference } from "./helpers.js";
import type { ManifestIndexes } from "./manifest-indexes.js";

export function validateManifestWorld(
  manifest: LessonManifest,
  catalog: CatalogSnapshot,
  catalogIndexes: CatalogIndexes,
  manifestIndexes: ManifestIndexes,
  errors: BunbunValidationError[],
): void {
  const sceneEntry = catalogIndexes.scenes.get(manifest.scene.sceneId)?.value;

  if (sceneEntry === undefined) {
    pushUnknownReference(
      errors,
      "MANIFEST",
      "UNKNOWN_SCENE_REFERENCE",
      "/scene/sceneId",
      "scene",
      manifest.scene.sceneId,
    );
  } else {
    validateSceneSelection(manifest, sceneEntry, catalogIndexes, errors);
    validateWorldInstances(manifest, sceneEntry, catalogIndexes, errors);
  }

  validateTargetReferences(manifest, catalogIndexes, errors);
  validateScenarioReferences(manifest, manifestIndexes, errors);
  validateAudioAssets(manifest, catalogIndexes, errors);
  validateCues(manifest, catalogIndexes, errors);
  validateProvenance(manifest, catalog, catalogIndexes, errors);
}

function validateSceneSelection(
  manifest: LessonManifest,
  scene: SceneCatalogEntry,
  catalogIndexes: CatalogIndexes,
  errors: BunbunValidationError[],
): void {
  if (
    manifest.scene.variantId !== undefined &&
    !scene.variantIds.includes(manifest.scene.variantId)
  ) {
    errors.push(
      semanticError(
        "MANIFEST",
        "INCOMPATIBLE_SCENE_VARIANT",
        "/scene/variantId",
        `Variant '${manifest.scene.variantId}' is not registered for scene '${scene.sceneId}'.`,
      ),
    );
  }

  if (!scene.cameraPresetIds.includes(manifest.scene.cameraPresetId)) {
    errors.push(
      semanticError(
        "MANIFEST",
        "UNKNOWN_CAMERA_PRESET",
        "/scene/cameraPresetId",
        `Camera preset '${manifest.scene.cameraPresetId}' is not registered for scene '${scene.sceneId}'.`,
      ),
    );
  }

  manifest.scene.assetBundleIds.forEach((assetBundleId, index) => {
    const bundle = catalogIndexes.assetBundles.get(assetBundleId)?.value;
    if (bundle === undefined) {
      pushUnknownReference(
        errors,
        "MANIFEST",
        "UNKNOWN_ASSET_BUNDLE_REFERENCE",
        `/scene/assetBundleIds/${index}`,
        "asset bundle",
        assetBundleId,
      );
      return;
    }

    if (
      !scene.assetBundleIds.includes(assetBundleId) ||
      !bundle.sceneIds.includes(scene.sceneId)
    ) {
      errors.push(
        semanticError(
          "MANIFEST",
          "INCOMPATIBLE_ASSET_BUNDLE",
          `/scene/assetBundleIds/${index}`,
          `Asset bundle '${assetBundleId}' is not compatible with scene '${scene.sceneId}'.`,
        ),
      );
    }
  });

  validateSpawnPoint(
    scene,
    manifest.scene.playerSpawnPointId,
    "PLAYER",
    "/scene/playerSpawnPointId",
    errors,
  );
}

function validateWorldInstances(
  manifest: LessonManifest,
  scene: SceneCatalogEntry,
  catalogIndexes: CatalogIndexes,
  errors: BunbunValidationError[],
): void {
  const occupiedSpawnPoints = new Map<string, string>();
  occupySpawnPoint(
    scene,
    manifest.scene.playerSpawnPointId,
    "/scene/playerSpawnPointId",
    occupiedSpawnPoints,
    errors,
  );

  manifest.locations.forEach((location, index) => {
    const catalogLocation = catalogIndexes.locations.get(
      location.catalogLocationId,
    )?.value;
    const basePath = `/locations/${index}`;

    if (catalogLocation === undefined) {
      pushUnknownReference(
        errors,
        "MANIFEST",
        "UNKNOWN_LOCATION_CATALOG_REFERENCE",
        `${basePath}/catalogLocationId`,
        "catalog location",
        location.catalogLocationId,
      );
      return;
    }

    if (catalogLocation.sceneId !== scene.sceneId) {
      errors.push(
        semanticError(
          "MANIFEST",
          "INCOMPATIBLE_LOCATION_SCENE",
          `${basePath}/catalogLocationId`,
          `Location '${location.catalogLocationId}' is not registered for scene '${scene.sceneId}'.`,
        ),
      );
    }

    validateInitialState(
      location.initialStateId,
      catalogLocation.stateIds,
      `${basePath}/initialStateId`,
      errors,
    );
  });

  manifest.entities.forEach((entity, index) => {
    const catalogEntity = catalogIndexes.entities.get(
      entity.catalogEntityId,
    )?.value;
    const basePath = `/entities/${index}`;

    if (catalogEntity === undefined) {
      pushUnknownReference(
        errors,
        "MANIFEST",
        "UNKNOWN_ENTITY_CATALOG_REFERENCE",
        `${basePath}/catalogEntityId`,
        "catalog entity",
        entity.catalogEntityId,
      );
    } else {
      if (!catalogEntity.sceneIds.includes(scene.sceneId)) {
        errors.push(
          semanticError(
            "MANIFEST",
            "INCOMPATIBLE_ENTITY_SCENE",
            `${basePath}/catalogEntityId`,
            `Entity '${entity.catalogEntityId}' is not compatible with scene '${scene.sceneId}'.`,
          ),
        );
      }
      if (!catalogEntity.roles.includes(entity.role)) {
        errors.push(
          semanticError(
            "MANIFEST",
            "INCOMPATIBLE_ENTITY_ROLE",
            `${basePath}/role`,
            `Entity '${entity.catalogEntityId}' does not support role '${entity.role}'.`,
          ),
        );
      }
      validateInitialState(
        entity.initialStateId,
        catalogEntity.stateIds,
        `${basePath}/initialStateId`,
        errors,
      );
    }

    validateSpawnPoint(
      scene,
      entity.spawnPointId,
      "ENTITY",
      `${basePath}/spawnPointId`,
      errors,
    );
    occupySpawnPoint(
      scene,
      entity.spawnPointId,
      `${basePath}/spawnPointId`,
      occupiedSpawnPoints,
      errors,
    );
  });

  manifest.objects.forEach((object, index) => {
    const catalogObject = catalogIndexes.objects.get(
      object.catalogObjectId,
    )?.value;
    const basePath = `/objects/${index}`;

    if (catalogObject === undefined) {
      pushUnknownReference(
        errors,
        "MANIFEST",
        "UNKNOWN_OBJECT_CATALOG_REFERENCE",
        `${basePath}/catalogObjectId`,
        "catalog object",
        object.catalogObjectId,
      );
    } else {
      if (!catalogObject.sceneIds.includes(scene.sceneId)) {
        errors.push(
          semanticError(
            "MANIFEST",
            "INCOMPATIBLE_OBJECT_SCENE",
            `${basePath}/catalogObjectId`,
            `Object '${object.catalogObjectId}' is not compatible with scene '${scene.sceneId}'.`,
          ),
        );
      }
      if (
        object.interactive &&
        !catalogObject.affordances.includes("INTERACTIVE")
      ) {
        errors.push(
          semanticError(
            "MANIFEST",
            "MISSING_INTERACTIVE_AFFORDANCE",
            `${basePath}/interactive`,
            `Object '${object.catalogObjectId}' is marked interactive but its catalog entry lacks INTERACTIVE.`,
          ),
        );
      }
      validateInitialState(
        object.initialStateId,
        catalogObject.stateIds,
        `${basePath}/initialStateId`,
        errors,
      );
    }

    validateSpawnPoint(
      scene,
      object.spawnPointId,
      "OBJECT",
      `${basePath}/spawnPointId`,
      errors,
    );
    occupySpawnPoint(
      scene,
      object.spawnPointId,
      `${basePath}/spawnPointId`,
      occupiedSpawnPoints,
      errors,
    );
  });
}

function validateTargetReferences(
  manifest: LessonManifest,
  catalogIndexes: CatalogIndexes,
  errors: BunbunValidationError[],
): void {
  manifest.learningTargets.forEach((target, targetIndex) => {
    if (target.goal.minimumContexts > target.goal.minimumEncounters) {
      errors.push(
        semanticError(
          "MANIFEST",
          "CONTEXT_GOAL_EXCEEDS_ENCOUNTERS",
          `/learningTargets/${targetIndex}/goal/minimumContexts`,
          "minimumContexts cannot exceed minimumEncounters.",
        ),
      );
    }

    if (target.kind === "KANJI" && target.referenceIds.length === 0) {
      errors.push(
        semanticError(
          "MANIFEST",
          "KANJI_REFERENCE_REQUIRED",
          `/learningTargets/${targetIndex}/referenceIds`,
          `Kanji target '${target.targetId}' requires a deterministic reference record.`,
        ),
      );
    }

    target.referenceIds.forEach((referenceId, referenceIndex) => {
      const reference = catalogIndexes.referenceRecords.get(referenceId)?.value;
      const path = `/learningTargets/${targetIndex}/referenceIds/${referenceIndex}`;
      if (reference === undefined) {
        pushUnknownReference(
          errors,
          "MANIFEST",
          "UNKNOWN_REFERENCE_RECORD",
          path,
          "reference record",
          referenceId,
        );
        return;
      }

      if (!reference.targetKinds.includes(target.kind)) {
        errors.push(
          semanticError(
            "MANIFEST",
            "INCOMPATIBLE_REFERENCE_KIND",
            path,
            `Reference '${referenceId}' does not support target kind '${target.kind}'.`,
          ),
        );
      }
    });
  });
}

function validateScenarioReferences(
  manifest: LessonManifest,
  manifestIndexes: ManifestIndexes,
  errors: BunbunValidationError[],
): void {
  manifest.scenario.focusTargetIds.forEach((targetId, index) => {
    if (!manifestIndexes.targets.has(targetId)) {
      pushUnknownReference(
        errors,
        "MANIFEST",
        "UNKNOWN_FOCUS_TARGET",
        `/scenario/focusTargetIds/${index}`,
        "learning target",
        targetId,
      );
    }
  });
}

function validateAudioAssets(
  manifest: LessonManifest,
  catalogIndexes: CatalogIndexes,
  errors: BunbunValidationError[],
): void {
  const cacheInputs = new Map<string, string>();

  manifest.audioAssets.forEach((audio, audioIndex) => {
    if (!catalogIndexes.voiceProfiles.has(audio.voiceProfileId)) {
      pushUnknownReference(
        errors,
        "MANIFEST",
        "UNKNOWN_VOICE_PROFILE",
        `/audioAssets/${audioIndex}/voiceProfileId`,
        "voice profile",
        audio.voiceProfileId,
      );
    }

    const cacheInput = `${audio.voiceProfileId}\u0000${audio.textJa}`;
    const previous = cacheInputs.get(audio.cacheKey);
    if (previous !== undefined && previous !== cacheInput) {
      errors.push(
        semanticError(
          "MANIFEST",
          "CONFLICTING_AUDIO_CACHE_KEY",
          `/audioAssets/${audioIndex}/cacheKey`,
          `Cache key '${audio.cacheKey}' is reused for different speech inputs.`,
        ),
      );
    } else {
      cacheInputs.set(audio.cacheKey, cacheInput);
    }
  });
}

function validateCues(
  manifest: LessonManifest,
  catalogIndexes: CatalogIndexes,
  errors: BunbunValidationError[],
): void {
  manifest.steps.forEach((step, stepIndex) => {
    const cueLists: Array<[readonly string[], string]> = [
      [step.feedback.correct.cueIds, "feedback/correct/cueIds"],
      [step.feedback.incorrect.cueIds, "feedback/incorrect/cueIds"],
      [step.feedback.assisted.cueIds, "feedback/assisted/cueIds"],
      [step.presentation.onEnterCueIds, "presentation/onEnterCueIds"],
      [step.presentation.onSuccessCueIds, "presentation/onSuccessCueIds"],
      [step.presentation.onFailureCueIds, "presentation/onFailureCueIds"],
    ];

    cueLists.forEach(([cueIds, relativePath]) => {
      cueIds.forEach((cueId, cueIndex) => {
        const cue = catalogIndexes.presentationCues.get(cueId)?.value;
        const path = `/steps/${stepIndex}/${relativePath}/${cueIndex}`;
        if (cue === undefined) {
          pushUnknownReference(
            errors,
            "MANIFEST",
            "UNKNOWN_PRESENTATION_CUE",
            path,
            "presentation cue",
            cueId,
          );
        } else if (cue.sceneId !== manifest.scene.sceneId) {
          errors.push(
            semanticError(
              "MANIFEST",
              "INCOMPATIBLE_PRESENTATION_CUE",
              path,
              `Cue '${cueId}' does not belong to scene '${manifest.scene.sceneId}'.`,
            ),
          );
        }
      });
    });
  });
}

function validateProvenance(
  manifest: LessonManifest,
  catalog: CatalogSnapshot,
  catalogIndexes: CatalogIndexes,
  errors: BunbunValidationError[],
): void {
  if (
    manifest.provenance.source === "AI_ASSISTED" &&
    manifest.provenance.promptModuleVersions.length === 0
  ) {
    errors.push(
      semanticError(
        "MANIFEST",
        "MISSING_PROMPT_PROVENANCE",
        "/provenance/promptModuleVersions",
        "AI_ASSISTED manifests require at least one prompt module version.",
      ),
    );
  }

  const declaredProviders = new Set(
    manifest.provenance.referenceDataVersions.map(
      (reference) => `${reference.id}\u0000${reference.version}`,
    ),
  );
  const usedReferenceIds = new Set(
    manifest.learningTargets.flatMap((target) => target.referenceIds),
  );

  for (const referenceId of usedReferenceIds) {
    const reference = catalogIndexes.referenceRecords.get(referenceId)?.value;
    if (reference === undefined) {
      continue;
    }
    const providerKey = `${reference.providerId}\u0000${reference.providerVersion}`;
    if (!declaredProviders.has(providerKey)) {
      errors.push(
        semanticError(
          "MANIFEST",
          "MISSING_REFERENCE_PROVENANCE",
          "/provenance/referenceDataVersions",
          `Reference provider '${reference.providerId}' version '${reference.providerVersion}' is used but not declared.`,
        ),
      );
    }
  }

  if (catalog.revision < 1) {
    errors.push(
      semanticError(
        "CATALOG",
        "INVALID_CATALOG_REVISION",
        "/revision",
        "Catalog revision must be positive.",
      ),
    );
  }
}

function validateSpawnPoint(
  scene: SceneCatalogEntry,
  spawnPointId: string,
  expectedKind: "PLAYER" | "ENTITY" | "OBJECT",
  path: string,
  errors: BunbunValidationError[],
): void {
  const spawnPoint = findSpawnPoint(scene, spawnPointId);
  if (spawnPoint === undefined) {
    pushUnknownReference(
      errors,
      "MANIFEST",
      "UNKNOWN_SPAWN_POINT",
      path,
      "spawn point",
      spawnPointId,
    );
    return;
  }

  if (spawnPoint.kind !== expectedKind) {
    errors.push(
      semanticError(
        "MANIFEST",
        "INCOMPATIBLE_SPAWN_POINT_KIND",
        path,
        `Spawn point '${spawnPointId}' is '${spawnPoint.kind}', expected '${expectedKind}'.`,
      ),
    );
  }

  if (!spawnPoint.reachableFromPlayer) {
    errors.push(
      semanticError(
        "MANIFEST",
        "UNREACHABLE_SPAWN_POINT",
        path,
        `Spawn point '${spawnPointId}' is not reachable from the player.`,
      ),
    );
  }
}

function occupySpawnPoint(
  scene: SceneCatalogEntry,
  spawnPointId: string,
  path: string,
  occupied: Map<string, string>,
  errors: BunbunValidationError[],
): void {
  const spawnPoint = findSpawnPoint(scene, spawnPointId);
  if (spawnPoint?.exclusiveOccupancy !== true) {
    return;
  }

  const previousPath = occupied.get(spawnPointId);
  if (previousPath !== undefined) {
    errors.push(
      semanticError(
        "MANIFEST",
        "OVERLAPPING_EXCLUSIVE_SPAWN",
        path,
        `Exclusive spawn point '${spawnPointId}' is already occupied at '${previousPath}'.`,
      ),
    );
    return;
  }

  occupied.set(spawnPointId, path);
}

function validateInitialState(
  initialStateId: string | undefined,
  allowedStateIds: readonly string[],
  path: string,
  errors: BunbunValidationError[],
): void {
  if (
    initialStateId !== undefined &&
    !allowedStateIds.includes(initialStateId)
  ) {
    errors.push(
      semanticError(
        "MANIFEST",
        "UNKNOWN_INITIAL_STATE",
        path,
        `Initial state '${initialStateId}' is not registered for this catalog item.`,
      ),
    );
  }
}
