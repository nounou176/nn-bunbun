import type { NonSpeechAudioAssetId } from "./assets.js";

interface PresentationCue {
  visualTargetIds: readonly string[];
  audioAssetIds: readonly NonSpeechAudioAssetId[];
}

const PRESENTATION_CUES = new Map<string, PresentationCue>([
  [
    "guide_gesture",
    { visualTargetIds: ["guide"], audioAssetIds: ["sfx_neutral_001"] },
  ],
  ["dog_happy", { visualTargetIds: ["dog"], audioAssetIds: [] }],
  [
    "dog_highlight",
    { visualTargetIds: ["dog"], audioAssetIds: ["sfx_clue_wood_001"] },
  ],
]);

export function visualTargetsForCues(cueIds: readonly string[]): string[] {
  return cueIds.flatMap(
    (cueId) => PRESENTATION_CUES.get(cueId)?.visualTargetIds ?? [],
  );
}

export function audioAssetsForCues(
  cueIds: readonly string[],
): NonSpeechAudioAssetId[] {
  return cueIds.flatMap(
    (cueId) => PRESENTATION_CUES.get(cueId)?.audioAssetIds ?? [],
  );
}
