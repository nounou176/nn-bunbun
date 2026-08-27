export interface RuntimeConfig {
  forceWebGL2: boolean;
  diagnosticsOpen: boolean;
  simulateAssetFailure: boolean;
  simulateManifestFailure: boolean;
  simulateAudioFailure: boolean;
  simulateMovementFailure: boolean;
  simulateCarryFailure: boolean;
  simulatePersistenceFailure: boolean;
  nonSpeechFailure: "ambience" | "effects" | "music" | undefined;
}

export function readRuntimeConfig(search: string): RuntimeConfig {
  const parameters = new URLSearchParams(search);
  const nonSpeechFailure = parameters.get("nonSpeechFailure");
  return {
    forceWebGL2: parameters.get("renderer") === "webgl2",
    diagnosticsOpen: parameters.get("debug") === "1",
    simulateAssetFailure: parameters.get("assetFailure") === "1",
    simulateManifestFailure: parameters.get("manifestFailure") === "1",
    simulateAudioFailure: parameters.get("audioFailure") === "1",
    simulateMovementFailure: parameters.get("movementFailure") === "1",
    simulateCarryFailure: parameters.get("carryFailure") === "1",
    simulatePersistenceFailure: parameters.get("persistenceFailure") === "1",
    nonSpeechFailure:
      nonSpeechFailure === "ambience" ||
      nonSpeechFailure === "effects" ||
      nonSpeechFailure === "music"
        ? nonSpeechFailure
        : undefined,
  };
}
