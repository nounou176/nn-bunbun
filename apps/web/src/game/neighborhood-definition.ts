import type { NeighborhoodSceneDefinition } from "./scene-definition.js";

export const NEIGHBORHOOD_SCENE_DEFINITION = {
  kind: "neighborhood-glb",
  sceneId: "neighborhood_small",
  assetBundleId: "neighborhood_rainy_core_v1",
  cameraPresetId: "neighborhood_isometric_default",
  staticAssetId: "neighborhood_rainy_static_v1",
  fixtureRootName: "neighborhood_fixture_root",
  walkableNodeName: "walkable_ground",
  ambienceAssetIds: [
    "amb_rain_03",
    "amb_distant_road_01",
    "amb_distant_rail_01",
  ],
  catReactionObjectId: "momo",
  playerSpawn: { x: 0, y: 0.38, z: 2.85 },
  cameraTarget: { x: 0, y: 0.35, z: 0.8 },
  walkableBounds: {
    minX: -4.8,
    maxX: 4.8,
    minZ: -1.2,
    maxZ: 3.7,
  },
  actorAssets: [
    {
      localId: "aoi",
      catalogId: "npc_aoi_student",
      assetId: "neighborhood_actor_aoi_v1",
      rootNodeName: "actor_aoi_root",
      idleClipName: "idle",
      role: "entity",
      position: { x: -1.35, y: 0, z: 1.35 },
    },
    {
      localId: "tanaka",
      catalogId: "npc_tanaka_clerk",
      assetId: "neighborhood_actor_tanaka_v1",
      rootNodeName: "actor_tanaka_root",
      idleClipName: "idle",
      role: "entity",
      position: { x: 2, y: 0, z: -0.75 },
    },
    {
      localId: "momo",
      catalogId: "animal_momo_cat",
      assetId: "neighborhood_actor_momo_v1",
      rootNodeName: "actor_momo_root",
      idleClipName: "idle",
      role: "object",
      position: { x: -3.25, y: 0, z: 2.55 },
    },
  ],
  entities: [
    {
      localId: "aoi",
      catalogId: "npc_aoi_student",
      position: { x: -1.35, y: 0, z: 1.35 },
    },
    {
      localId: "tanaka",
      catalogId: "npc_tanaka_clerk",
      position: { x: 2, y: 0, z: -0.75 },
    },
  ],
  objects: [
    {
      localId: "momo",
      catalogId: "animal_momo_cat",
      position: { x: -3.25, y: 0, z: 2.55 },
    },
    {
      localId: "wallet_clue",
      catalogId: "object_wallet_clue",
      position: { x: -2.75, y: 0.08, z: 2.15 },
    },
    {
      localId: "mistaken_umbrella",
      catalogId: "object_mistaken_umbrella",
      position: { x: 0.8, y: 0.08, z: -0.8 },
    },
  ],
  locations: [
    {
      localId: "store_front",
      catalogId: "neighborhood_store_front",
      position: { x: 2, y: 0, z: -0.65 },
    },
    {
      localId: "park_edge",
      catalogId: "neighborhood_park_edge",
      position: { x: -3.1, y: 0, z: 2.45 },
    },
    {
      localId: "road_crossing",
      catalogId: "neighborhood_road_crossing",
      position: { x: 0, y: 0, z: 0.65 },
    },
    {
      localId: "umbrella_stand_area",
      catalogId: "neighborhood_umbrella_stand",
      position: { x: 0.8, y: 0, z: -0.65 },
    },
    {
      localId: "staff_only_door",
      catalogId: "neighborhood_staff_door",
      position: { x: 3.35, y: 0, z: -0.65 },
    },
  ],
} as const satisfies NeighborhoodSceneDefinition;
