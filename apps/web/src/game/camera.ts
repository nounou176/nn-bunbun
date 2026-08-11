import { OrthographicCamera, Vector3 } from "three";

import type { Point3 } from "./scene-definition.js";

export const MIN_ZOOM = 0.85;
export const MAX_ZOOM = 1.35;
export const DEFAULT_ZOOM = 1;
const VIEW_HEIGHT = 10.5;

export interface OrthographicFrustum {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function computeOrthographicFrustum(
  width: number,
  height: number,
  zoom: number,
): OrthographicFrustum {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const halfHeight = VIEW_HEIGHT / 2 / clampZoom(zoom);
  const halfWidth = halfHeight * (safeWidth / safeHeight);

  return {
    left: -halfWidth,
    right: halfWidth,
    top: halfHeight,
    bottom: -halfHeight,
  };
}

export function createIsometricCamera(target: Point3): OrthographicCamera {
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 60);
  camera.position.set(9.5, 9.5, 9.5);
  camera.lookAt(new Vector3(target.x, target.y, target.z));
  camera.updateMatrixWorld();
  return camera;
}

export function resizeOrthographicCamera(
  camera: OrthographicCamera,
  width: number,
  height: number,
  zoom: number,
): void {
  const frustum = computeOrthographicFrustum(width, height, zoom);
  camera.left = frustum.left;
  camera.right = frustum.right;
  camera.top = frustum.top;
  camera.bottom = frustum.bottom;
  camera.updateProjectionMatrix();
}
