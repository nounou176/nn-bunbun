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

export interface ParkSceneDefinition {
  sceneId: "park_small";
  assetBundleId: "park_core";
  cameraPresetId: "park_isometric_default";
  assetUrl: string;
  playerSpawn: Point3;
  cameraTarget: Point3;
  walkableBounds: WalkableBounds;
  entities: readonly WorldPlacement[];
  objects: readonly WorldPlacement[];
  locations: readonly LocationPlacement[];
  ambienceAssetIds: readonly NonSpeechAudioAssetId[];
}
import type { NonSpeechAudioAssetId } from "../audio/assets.js";
