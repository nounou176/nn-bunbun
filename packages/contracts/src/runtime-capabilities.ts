import type { LessonManifest } from "./schema/index.js";
import type { ValidatedLessonPackage } from "./validation/semantic.js";

const SUPPORTED_PRIMITIVES = new Set([
  "LISTEN",
  "CLICK_OBJECT",
  "CHOOSE",
  "ARRANGE",
  "TYPE",
  "MOVE_TO",
  "PICK_UP",
  "GIVE",
]);
const SUPPORTED_SCAFFOLDS = new Set([
  "REPLAY_AUDIO",
  "SHOW_JAPANESE_TEXT",
  "HIGHLIGHT_OBJECTS",
  "HIGHLIGHT_ENTITIES",
  "REDUCE_OBJECT_CANDIDATES",
  "REDUCE_CHOICE_CANDIDATES",
  "SHOW_READING",
  "SHOW_MEANING",
  "SHOW_PATTERN",
]);
const SUPPORTED_VOICE_PROFILES = new Set([
  "voice_guide_01",
  "voice_aoi_01",
  "voice_tanaka_01",
]);

interface SceneCapabilities {
  cameraId: string;
  assetIds: ReadonlySet<string>;
  cueIds: ReadonlySet<string>;
  worldIds: ReadonlySet<string>;
  locationIds: ReadonlySet<string>;
}

const SCENE_CAPABILITIES = new Map<string, SceneCapabilities>([
  [
    "park_small",
    {
      cameraId: "park_isometric_default",
      assetIds: new Set(["park_core", "animals_basic"]),
      cueIds: new Set(["guide_gesture", "dog_happy", "dog_highlight"]),
      worldIds: new Set(["guide", "visitor", "dog", "cat"]),
      locationIds: new Set(["animal_area", "bench_area"]),
    },
  ],
  [
    "neighborhood_small",
    {
      cameraId: "neighborhood_isometric_default",
      assetIds: new Set([
        "neighborhood_rainy_core_v1",
        "last_train_characters_v1",
        "neighborhood_animals_v1",
      ]),
      cueIds: new Set([
        "aoi_request",
        "tension_start",
        "tanaka_rule",
        "umbrella_correction",
        "momo_clue",
        "momo_reaction",
        "wallet_reveal",
        "wallet_pickup",
        "wallet_return",
        "feedback_correct",
        "feedback_incorrect",
        "lesson_resolution",
      ]),
      worldIds: new Set([
        "aoi",
        "tanaka",
        "momo",
        "wallet_clue",
        "mistaken_umbrella",
      ]),
      locationIds: new Set([
        "store_front",
        "park_edge",
        "umbrella_stand_area",
        "staff_only_door",
      ]),
    },
  ],
]);

export interface RuntimeCapabilityError {
  code: string;
  path: string;
  message: string;
}

export function validateRuntimeCapabilities(
  lessonPackage: ValidatedLessonPackage,
): RuntimeCapabilityError[] {
  const { manifest } = lessonPackage;
  const errors: RuntimeCapabilityError[] = [];
  const scene = SCENE_CAPABILITIES.get(manifest.scene.sceneId);

  if (scene === undefined) {
    addError(
      errors,
      "UNSUPPORTED_RUNTIME_SCENE",
      "/scene/sceneId",
      `Scene '${manifest.scene.sceneId}' has no local runtime definition.`,
    );
  } else {
    if (manifest.scene.cameraPresetId !== scene.cameraId) {
      addError(
        errors,
        "UNSUPPORTED_RUNTIME_CAMERA",
        "/scene/cameraPresetId",
        `Camera '${manifest.scene.cameraPresetId}' has no local runtime definition.`,
      );
    }
    manifest.scene.assetBundleIds.forEach((assetId, index) => {
      if (!scene.assetIds.has(assetId)) {
        addError(
          errors,
          "UNSUPPORTED_RUNTIME_ASSET",
          `/scene/assetBundleIds/${index}`,
          `Asset bundle '${assetId}' has no local resolver.`,
        );
      }
    });
    validateWorldIds(manifest, scene, errors);
  }

  manifest.audioAssets.forEach((audio, index) => {
    if (!SUPPORTED_VOICE_PROFILES.has(audio.voiceProfileId)) {
      addError(
        errors,
        "UNSUPPORTED_RUNTIME_VOICE",
        `/audioAssets/${index}/voiceProfileId`,
        `Voice profile '${audio.voiceProfileId}' has no local playback adapter.`,
      );
    }
  });

  manifest.steps.forEach((step, stepIndex) => {
    if (!SUPPORTED_PRIMITIVES.has(step.interaction.type)) {
      addError(
        errors,
        "UNSUPPORTED_RUNTIME_PRIMITIVE",
        `/steps/${stepIndex}/interaction/type`,
        `Primitive '${step.interaction.type}' has no local executor.`,
      );
    }
    step.scaffolds.forEach((scaffold, scaffoldIndex) => {
      if (!SUPPORTED_SCAFFOLDS.has(scaffold.kind)) {
        addError(
          errors,
          "UNSUPPORTED_RUNTIME_SCAFFOLD",
          `/steps/${stepIndex}/scaffolds/${scaffoldIndex}/kind`,
          `Scaffold '${scaffold.kind}' has no local executor.`,
        );
      }
    });
    if (scene !== undefined) {
      [
        ...step.presentation.onEnterCueIds,
        ...step.presentation.onSuccessCueIds,
        ...step.presentation.onFailureCueIds,
        ...step.feedback.correct.cueIds,
        ...step.feedback.incorrect.cueIds,
        ...step.feedback.assisted.cueIds,
      ].forEach((cueId) => {
        if (!scene.cueIds.has(cueId)) {
          addError(
            errors,
            "UNSUPPORTED_RUNTIME_CUE",
            `/steps/${stepIndex}`,
            `Cue '${cueId}' has no local runtime handler.`,
          );
        }
      });
    }
  });
  validateCarrySequence(manifest, errors);

  return errors.sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.code.localeCompare(right.code),
  );
}

/** @deprecated Use validateRuntimeCapabilities for all closed local scenes. */
export const validateParkRuntimeCapabilities = validateRuntimeCapabilities;

function validateCarrySequence(
  manifest: LessonManifest,
  errors: RuntimeCapabilityError[],
): void {
  const guaranteedCarriedObjects = new Set<string>();
  manifest.steps.forEach((step, stepIndex) => {
    if (
      step.interaction.type === "PICK_UP" &&
      step.attemptPolicy.afterMaximum === "CONTINUE_ASSISTED" &&
      step.interaction.acceptedObjectIds.length === 1
    ) {
      const objectId = step.interaction.acceptedObjectIds[0];
      if (objectId !== undefined) guaranteedCarriedObjects.add(objectId);
    }
    if (step.interaction.type !== "GIVE") return;
    step.interaction.acceptedPairs.forEach((pair, pairIndex) => {
      if (!guaranteedCarriedObjects.has(pair.objectId)) {
        addError(
          errors,
          "UNSUPPORTED_RUNTIME_CARRY_PATH",
          `/steps/${stepIndex}/interaction/acceptedPairs/${pairIndex}/objectId`,
          `GIVE object '${pair.objectId}' is not guaranteed by an earlier deterministic PICK_UP step.`,
        );
      }
    });
  });
}

function validateWorldIds(
  manifest: LessonManifest,
  scene: SceneCapabilities,
  errors: RuntimeCapabilityError[],
): void {
  manifest.entities.forEach((entity, index) => {
    if (!scene.worldIds.has(entity.entityId)) {
      addError(
        errors,
        "UNSUPPORTED_RUNTIME_ENTITY",
        `/entities/${index}/entityId`,
        `Entity '${entity.entityId}' has no local world placement.`,
      );
    }
  });
  manifest.objects.forEach((object, index) => {
    if (!scene.worldIds.has(object.objectId)) {
      addError(
        errors,
        "UNSUPPORTED_RUNTIME_OBJECT",
        `/objects/${index}/objectId`,
        `Object '${object.objectId}' has no local world placement.`,
      );
    }
  });
  manifest.locations.forEach((location, index) => {
    if (!scene.locationIds.has(location.locationId)) {
      addError(
        errors,
        "UNSUPPORTED_RUNTIME_LOCATION",
        `/locations/${index}/locationId`,
        `Location '${location.locationId}' has no local world target.`,
      );
    }
  });
}

function addError(
  errors: RuntimeCapabilityError[],
  code: string,
  path: string,
  message: string,
): void {
  errors.push({ code, path, message });
}
