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
  [
    "aoi_request",
    { visualTargetIds: ["aoi"], audioAssetIds: ["sfx_neutral_001"] },
  ],
  [
    "tension_start",
    { visualTargetIds: [], audioAssetIds: ["music_tension_pulse_01"] },
  ],
  [
    "tanaka_rule",
    { visualTargetIds: ["tanaka"], audioAssetIds: ["sfx_neutral_001"] },
  ],
  [
    "umbrella_correction",
    {
      visualTargetIds: ["mistaken_umbrella"],
      audioAssetIds: ["sfx_incorrect_004"],
    },
  ],
  [
    "momo_clue",
    { visualTargetIds: ["momo"], audioAssetIds: ["sfx_cat_mew_01"] },
  ],
  [
    "momo_reaction",
    { visualTargetIds: ["momo"], audioAssetIds: ["sfx_cat_mew_01"] },
  ],
  [
    "wallet_reveal",
    {
      visualTargetIds: ["wallet_clue"],
      audioAssetIds: ["sfx_clue_wood_001"],
    },
  ],
  [
    "wallet_pickup",
    {
      visualTargetIds: ["wallet_clue"],
      audioAssetIds: ["sfx_pickup_generic_000"],
    },
  ],
  [
    "wallet_return",
    { visualTargetIds: ["aoi"], audioAssetIds: ["sfx_give_soft_001"] },
  ],
  ["feedback_correct", { visualTargetIds: [], audioAssetIds: [] }],
  ["feedback_incorrect", { visualTargetIds: [], audioAssetIds: [] }],
  ["lesson_resolution", { visualTargetIds: ["aoi"], audioAssetIds: [] }],
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
