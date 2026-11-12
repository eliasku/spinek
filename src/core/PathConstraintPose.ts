import type { Pose } from "./Pose.js";

/** Stores a pose for a path constraint. */
export class PathConstraintPose implements Pose<PathConstraintPose> {
  /** The position along the path. */
  position: number = 0;

  /** The spacing between bones. */
  spacing: number = 0;

  /** A percentage (0-1) that controls the mix between the constrained and unconstrained rotation. */
  mixRotate = 0;

  /** A percentage (0-1) that controls the mix between the constrained and unconstrained translation X. */
  mixX = 0;

  /** A percentage (0-1) that controls the mix between the constrained and unconstrained translation Y. */
  mixY = 0;

  public set(pose: PathConstraintPose) {
    this.position = pose.position;
    this.spacing = pose.spacing;
    this.mixRotate = pose.mixRotate;
    this.mixX = pose.mixX;
    this.mixY = pose.mixY;
  }
}
