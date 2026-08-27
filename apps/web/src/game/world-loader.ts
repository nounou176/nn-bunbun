import { loadNeighborhoodWorld } from "./neighborhood-world.js";
import { loadParkWorld, type RuntimeWorld } from "./park-world.js";
import type { WorldSceneDefinition } from "./scene-definition.js";

export function loadWorld(
  definition: WorldSceneDefinition,
  simulateAssetFailure: boolean,
): Promise<RuntimeWorld> {
  return definition.kind === "park-fixture"
    ? loadParkWorld(definition, simulateAssetFailure)
    : loadNeighborhoodWorld(definition, simulateAssetFailure);
}
