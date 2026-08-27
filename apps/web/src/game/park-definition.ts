import type { ParkSceneDefinition } from "./scene-definition.js";
import { PARK_AMBIENCE_ASSET_IDS } from "../audio/assets.js";

const parkAssetUrl = new URL("../assets/park-small.gltf", import.meta.url).href;

export const PARK_SCENE_DEFINITION = {
  kind: "park-fixture",
  sceneId: "park_small",
  assetBundleId: "park_core",
  cameraPresetId: "park_isometric_default",
  assetUrl: parkAssetUrl,
  ambienceAssetIds: PARK_AMBIENCE_ASSET_IDS,
  catReactionObjectId: "cat",
  playerSpawn: { x: 0, y: 0.38, z: 2.35 },
  cameraTarget: { x: 0, y: 0, z: 0 },
  walkableBounds: {
    minX: -3.8,
    maxX: 3.8,
    minZ: -2.65,
    maxZ: 2.65,
  },
  entities: [
    {
      localId: "guide",
      catalogId: "npc_guide_basic",
      position: { x: -2.4, y: 0, z: -1.6 },
    },
    {
      localId: "visitor",
      catalogId: "npc_visitor_basic",
      position: { x: 2.95, y: 0, z: 1.85 },
    },
  ],
  objects: [
    {
      localId: "dog",
      catalogId: "animal_dog_small",
      position: { x: 2.1, y: 0, z: -1.4 },
    },
    {
      localId: "cat",
      catalogId: "animal_cat_small",
      position: { x: 2.75, y: 0, z: 1.25 },
    },
  ],
  locations: [
    {
      localId: "animal_area",
      catalogId: "park_animal_area",
      position: { x: 2.1, y: 0, z: -0.75 },
    },
    {
      localId: "bench_area",
      catalogId: "park_bench_area",
      position: { x: -2.25, y: 0, z: 1.3 },
    },
  ],
} as const satisfies ParkSceneDefinition;
