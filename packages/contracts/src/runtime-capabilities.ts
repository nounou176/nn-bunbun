import type { LessonManifest } from "./schema/index.js";
import type { ValidatedLessonPackage } from "./validation/semantic.js";

const SUPPORTED_SCENE_ID = "park_small";
const SUPPORTED_CAMERA_ID = "park_isometric_default";
const SUPPORTED_ASSET_IDS = new Set(["park_core", "animals_basic"]);
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
const SUPPORTED_CUES = new Set(["guide_gesture", "dog_happy", "dog_highlight"]);
const SUPPORTED_WORLD_IDS = new Set(["guide", "visitor", "dog", "cat"]);
const SUPPORTED_LOCATION_IDS = new Set(["animal_area", "bench_area"]);
const SUPPORTED_VOICE_PROFILES = new Set([
  "voice_guide_01",
  "voice_aoi_01",
  "voice_tanaka_01",
]);

export interface RuntimeCapabilityError {
  code: string;
  path: string;
  message: string;
}

export function validateParkRuntimeCapabilities(
  lessonPackage: ValidatedLessonPackage,
): RuntimeCapabilityError[] {
  const { manifest } = lessonPackage;
  const errors: RuntimeCapabilityError[] = [];

  if (manifest.scene.sceneId !== SUPPORTED_SCENE_ID) {
    addError(
      errors,
      "UNSUPPORTED_RUNTIME_SCENE",
      "/scene/sceneId",
      `Scene '${manifest.scene.sceneId}' has no local runtime definition.`,
    );
  }
  if (manifest.scene.cameraPresetId !== SUPPORTED_CAMERA_ID) {
    addError(
      errors,
      "UNSUPPORTED_RUNTIME_CAMERA",
      "/scene/cameraPresetId",
      `Camera '${manifest.scene.cameraPresetId}' has no local runtime definition.`,
    );
  }
  manifest.scene.assetBundleIds.forEach((assetId, index) => {
    if (!SUPPORTED_ASSET_IDS.has(assetId)) {
      addError(
        errors,
        "UNSUPPORTED_RUNTIME_ASSET",
        `/scene/assetBundleIds/${index}`,
        `Asset bundle '${assetId}' has no local resolver.`,
      );
    }
  });

  validateWorldIds(manifest, errors);
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
    [
      ...step.presentation.onEnterCueIds,
      ...step.presentation.onSuccessCueIds,
      ...step.presentation.onFailureCueIds,
      ...step.feedback.correct.cueIds,
      ...step.feedback.incorrect.cueIds,
      ...step.feedback.assisted.cueIds,
    ].forEach((cueId) => {
      if (!SUPPORTED_CUES.has(cueId)) {
        addError(
          errors,
          "UNSUPPORTED_RUNTIME_CUE",
          `/steps/${stepIndex}`,
          `Cue '${cueId}' has no local runtime handler.`,
        );
      }
    });
  });
  validateCarrySequence(manifest, errors);

  return errors.sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.code.localeCompare(right.code),
  );
}

function validateCarrySequence(
  manifest: LessonManifest,
  errors: RuntimeCapabilityError[],
): void {
  const guaranteedCarriedObjects = new Set<string>();
  manifest.steps.forEach((step, stepIndex) => {
    if (
      step.interaction.type === "PICK_UP" &&
      step.attemptPolicy.afterMaximum === "CONTINUE_ASSISTED"
    ) {
      const deterministicObject = step.scaffolds.find(
        (scaffold) =>
          scaffold.kind === "REDUCE_OBJECT_CANDIDATES" &&
          scaffold.afterAttempt === step.attemptPolicy.maximumAttempts &&
          scaffold.objectIds.length === 1 &&
          step.interaction.type === "PICK_UP" &&
          step.interaction.acceptedObjectIds.includes(
            scaffold.objectIds[0] ?? "",
          ),
      );
      if (
        deterministicObject?.kind === "REDUCE_OBJECT_CANDIDATES" &&
        deterministicObject.objectIds[0] !== undefined
      ) {
        guaranteedCarriedObjects.add(deterministicObject.objectIds[0]);
      }
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
  errors: RuntimeCapabilityError[],
): void {
  manifest.entities.forEach((entity, index) => {
    if (!SUPPORTED_WORLD_IDS.has(entity.entityId)) {
      addError(
        errors,
        "UNSUPPORTED_RUNTIME_ENTITY",
        `/entities/${index}/entityId`,
        `Entity '${entity.entityId}' has no local world placement.`,
      );
    }
  });
  manifest.objects.forEach((object, index) => {
    if (!SUPPORTED_WORLD_IDS.has(object.objectId)) {
      addError(
        errors,
        "UNSUPPORTED_RUNTIME_OBJECT",
        `/objects/${index}/objectId`,
        `Object '${object.objectId}' has no local world placement.`,
      );
    }
  });
  manifest.locations.forEach((location, index) => {
    if (!SUPPORTED_LOCATION_IDS.has(location.locationId)) {
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
