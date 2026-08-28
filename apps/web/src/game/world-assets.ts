import { NEIGHBORHOOD_SCENE_DEFINITION } from "./neighborhood-definition.js";
import { PARK_SCENE_DEFINITION } from "./park-definition.js";
import type { WorldSceneDefinition } from "./scene-definition.js";

const WORLD_ASSET_URLS = {
  neighborhood_rainy_static_v1: new URL(
    "../assets/world/neighborhood-rainy-evening/v1/neighborhood-rainy-evening-static.glb",
    import.meta.url,
  ).href,
  neighborhood_actor_aoi_v1: new URL(
    "../assets/world/neighborhood-rainy-evening/v1/actor-aoi.glb",
    import.meta.url,
  ).href,
  neighborhood_actor_tanaka_v1: new URL(
    "../assets/world/neighborhood-rainy-evening/v1/actor-tanaka.glb",
    import.meta.url,
  ).href,
  neighborhood_actor_momo_v1: new URL(
    "../assets/world/neighborhood-rainy-evening/v1/actor-momo.glb",
    import.meta.url,
  ).href,
} as const;

export type WorldAssetId = keyof typeof WORLD_ASSET_URLS;
export type WorldSceneId = WorldSceneDefinition["sceneId"];

const WORLD_SCENES = {
  park_small: PARK_SCENE_DEFINITION,
  neighborhood_small: NEIGHBORHOOD_SCENE_DEFINITION,
} as const satisfies Record<WorldSceneId, WorldSceneDefinition>;

export function resolveWorldAssetUrl(assetId: WorldAssetId): string {
  return WORLD_ASSET_URLS[assetId];
}

export function resolveWorldScene(sceneId: string): WorldSceneDefinition {
  if (!(sceneId in WORLD_SCENES)) {
    throw new Error(`World scene '${sceneId}' has no local definition.`);
  }
  return WORLD_SCENES[sceneId as WorldSceneId];
}
