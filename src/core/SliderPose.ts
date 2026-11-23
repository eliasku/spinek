import type { Pose } from "./Pose";

/** Stores a pose for a slider. */
export class SliderPose implements Pose<SliderPose> {
  /** The time in the {@link SliderData.animation} to apply the animation. */
  time = 0;

  /** A percentage (unbounded) that controls the mix between the constrained and unconstrained poses. */
  mix = 0;

  set(pose: SliderPose) {
    this.time = pose.time;
    this.mix = pose.mix;
  }
}
