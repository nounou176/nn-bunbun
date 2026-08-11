export interface RuntimeConfig {
  forceWebGL2: boolean;
  diagnosticsOpen: boolean;
  simulateAssetFailure: boolean;
}

export function readRuntimeConfig(search: string): RuntimeConfig {
  const parameters = new URLSearchParams(search);
  return {
    forceWebGL2: parameters.get("renderer") === "webgl2",
    diagnosticsOpen: parameters.get("debug") === "1",
    simulateAssetFailure: parameters.get("assetFailure") === "1",
  };
}
