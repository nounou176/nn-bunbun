export interface Point2 {
  x: number;
  z: number;
}

export interface Point3 extends Point2 {
  y: number;
}

export interface WalkableBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WorldPlacement {
  localId: string;
  catalogId: string;
  position: Point3;
}

export interface LocationPlacement {
  localId: string;
  catalogId: string;
  position: Point3;
}

interface BaseSceneDefinition {
  sceneId: "park_small" | "neighborhood_small";
  assetBundleId: string;
  cameraPresetId: string;
  playerSpawn: Point3;
  cameraTarget: Point3;
  walkableBounds: WalkableBounds;
  entities: readonly WorldPlacement[];
  objects: readonly WorldPlacement[];
  locations: readonly LocationPlacement[];
  ambienceAssetIds: readonly NonSpeechAudioAssetId[];
  catReactionObjectId?: string;
}

export interface ParkSceneDefinition extends BaseSceneDefinition {
  kind: "park-fixture";
  sceneId: "park_small";
  assetBundleId: "park_core";
  cameraPresetId: "park_isometric_default";
  assetUrl: string;
}

export interface ActorAssetPlacement extends WorldPlacement {
  assetId:
    | "neighborhood_actor_aoi_v1"
    | "neighborhood_actor_tanaka_v1"
    | "neighborhood_actor_momo_v1";
  rootNodeName: string;
  idleClipName: string;
  role: "entity" | "object";
}

export interface NeighborhoodSceneDefinition extends BaseSceneDefinition {
  kind: "neighborhood-glb";
  sceneId: "neighborhood_small";
  assetBundleId: "neighborhood_rainy_core_v1";
  cameraPresetId: "neighborhood_isometric_default";
  staticAssetId: "neighborhood_rainy_static_v1";
  fixtureRootName: "neighborhood_fixture_root";
  walkableNodeName: "walkable_ground";
  actorAssets: readonly ActorAssetPlacement[];
}

export type WorldSceneDefinition =
  ParkSceneDefinition | NeighborhoodSceneDefinition;
import type { NonSpeechAudioAssetId } from "../audio/assets.js";
