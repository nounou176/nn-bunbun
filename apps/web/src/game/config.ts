export interface RuntimeConfig {
  forceWebGL2: boolean;
  diagnosticsOpen: boolean;
  simulateAssetFailure: boolean;
  simulateManifestFailure: boolean;
  simulateAudioFailure: boolean;
  simulateMovementFailure: boolean;
  simulateCarryFailure: boolean;
}

export function readRuntimeConfig(search: string): RuntimeConfig {
  const parameters = new URLSearchParams(search);
  return {
    forceWebGL2: parameters.get("renderer") === "webgl2",
    diagnosticsOpen: parameters.get("debug") === "1",
    simulateAssetFailure: parameters.get("assetFailure") === "1",
    simulateManifestFailure: parameters.get("manifestFailure") === "1",
    simulateAudioFailure: parameters.get("audioFailure") === "1",
    simulateMovementFailure: parameters.get("movementFailure") === "1",
    simulateCarryFailure: parameters.get("carryFailure") === "1",
  };
}
