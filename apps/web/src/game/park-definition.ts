import type { ParkSceneDefinition } from "./scene-definition.js";

const parkAssetUrl = new URL("../assets/park-small.gltf", import.meta.url).href;

export const PARK_SCENE_DEFINITION = {
  sceneId: "park_small",
  assetBundleId: "park_core",
  cameraPresetId: "park_isometric_default",
  assetUrl: parkAssetUrl,
  playerSpawn: { x: 0, y: 0.38, z: 2.35 },
  cameraTarget: { x: 0, y: 0, z: 0 },
  walkableBounds: {
    minX: -3.8,
    maxX: 3.8,
    minZ: -2.65,
    maxZ: 2.65,
  },
  guide: {
    localId: "guide",
    catalogId: "npc_guide_basic",
    position: { x: -2.4, y: 0, z: -1.6 },
  },
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
} as const satisfies ParkSceneDefinition;
