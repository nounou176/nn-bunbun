import type { Point2, WalkableBounds } from "./scene-definition.js";

export interface MovementStep {
  position: Point2;
  arrived: boolean;
}

export function isInsideWalkableBounds(
  point: Point2,
  bounds: WalkableBounds,
): boolean {
  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.z >= bounds.minZ &&
    point.z <= bounds.maxZ
  );
}

export function clampToWalkableBounds(
  point: Point2,
  bounds: WalkableBounds,
): Point2 {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, point.x)),
    z: Math.min(bounds.maxZ, Math.max(bounds.minZ, point.z)),
  };
}

export function stepToward(
  current: Point2,
  target: Point2,
  maximumDistance: number,
): MovementStep {
  const deltaX = target.x - current.x;
  const deltaZ = target.z - current.z;
  const distance = Math.hypot(deltaX, deltaZ);

  if (distance === 0 || maximumDistance >= distance) {
    return { position: { ...target }, arrived: true };
  }

  if (maximumDistance <= 0) {
    return { position: { ...current }, arrived: false };
  }

  const ratio = maximumDistance / distance;
  return {
    position: {
      x: current.x + deltaX * ratio,
      z: current.z + deltaZ * ratio,
    },
    arrived: false,
  };
}
