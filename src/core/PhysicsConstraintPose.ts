import type { Pose } from "./Pose.js";

/** Stores a pose for a physics constraint. */
export class PhysicsConstraintPose implements Pose<PhysicsConstraintPose> {
  /** Controls how much bone movement is converted into physics movement. */
  inertia = 0;

  /** The amount of force used to return properties to the unconstrained value. */
  strength = 0;

  /** Reduces the speed of physics movements, with more of a reduction at higher speeds. */
  damping = 0;

  /** Determines susceptibility to acceleration. */
  massInverse = 0;

  /** Applies a constant force along the {@link Skeleton.windX}, {@link Skeleton.windY} vector. */
  wind = 0;

  /** Applies a constant force along the {@link Skeleton.gravityX}, {@link Skeleton.gravityY} vector. */
  gravity = 0;

  /** A percentage (0+) that controls the mix between the constrained and unconstrained poses. */
  mix = 0;

  public set(pose: PhysicsConstraintPose) {
    this.inertia = pose.inertia;
    this.strength = pose.strength;
    this.damping = pose.damping;
    this.massInverse = pose.massInverse;
    this.wind = pose.wind;
    this.gravity = pose.gravity;
    this.mix = pose.mix;
  }
}
