import type { Bone } from "./Bone.js";

/** Converts points between Spine skeleton coordinates and host runtime game coordinates. */
export interface SkeletonCoordinateConverter {
  /**
   * Converts `point` in-place from skeleton coordinates to host runtime game coordinates.
   * @param point The point to convert.
   */
  skeletonToGame(point: { x: number; y: number }): void;

  /**
   * Converts `point` in-place from host runtime game coordinates to skeleton coordinates.
   * @param point The point to convert.
   */
  gameToSkeleton(point: { x: number; y: number }): void;

  /**
   * Converts `point` in-place from host runtime game coordinates to the local coordinates of `bone`.
   * @param point The point to convert.
   * @param bone The bone whose local coordinates should receive the converted point.
   */
  gameToBone(point: { x: number; y: number }, bone: Bone): void;
}
