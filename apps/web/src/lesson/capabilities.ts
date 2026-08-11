import type { LessonManifest, ValidatedLessonPackage } from "@bunbun/contracts";

const SUPPORTED_SCENE_ID = "park_small";
const SUPPORTED_CAMERA_ID = "park_isometric_default";
const SUPPORTED_ASSET_IDS = new Set(["park_core", "animals_basic"]);
const SUPPORTED_PRIMITIVES = new Set(["LISTEN", "CLICK_OBJECT", "CHOOSE"]);
const SUPPORTED_SCAFFOLDS = new Set([
  "REPLAY_AUDIO",
  "SHOW_JAPANESE_TEXT",
  "HIGHLIGHT_OBJECTS",
  "REDUCE_OBJECT_CANDIDATES",
  "REDUCE_CHOICE_CANDIDATES",
  "SHOW_READING",
]);
const SUPPORTED_CUES = new Set(["guide_gesture", "dog_happy", "dog_highlight"]);
const SUPPORTED_AUDIO_IDS = new Set(["audio_find_dog"]);
const SUPPORTED_WORLD_IDS = new Set(["guide", "dog", "cat"]);

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
    if (!SUPPORTED_AUDIO_IDS.has(audio.audioAssetId)) {
      addError(
        errors,
        "UNSUPPORTED_RUNTIME_AUDIO",
        `/audioAssets/${index}/audioAssetId`,
        `Audio '${audio.audioAssetId}' has no Milestone 4 playback adapter.`,
      );
    }
  });

  manifest.steps.forEach((step, stepIndex) => {
    if (!SUPPORTED_PRIMITIVES.has(step.interaction.type)) {
      addError(
        errors,
        "UNSUPPORTED_RUNTIME_PRIMITIVE",
        `/steps/${stepIndex}/interaction/type`,
        `Primitive '${step.interaction.type}' is not implemented in Milestone 4.`,
      );
    }
    step.scaffolds.forEach((scaffold, scaffoldIndex) => {
      if (!SUPPORTED_SCAFFOLDS.has(scaffold.kind)) {
        addError(
          errors,
          "UNSUPPORTED_RUNTIME_SCAFFOLD",
          `/steps/${stepIndex}/scaffolds/${scaffoldIndex}/kind`,
          `Scaffold '${scaffold.kind}' is not implemented in Milestone 4.`,
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

  return errors.sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.code.localeCompare(right.code),
  );
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
}

function addError(
  errors: RuntimeCapabilityError[],
  code: string,
  path: string,
  message: string,
): void {
  errors.push({ code, path, message });
}
