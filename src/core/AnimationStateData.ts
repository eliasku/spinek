import type { Animation } from "./Animation.js";
import type { SkeletonData } from "./SkeletonData.js";
import type { StringMap } from "./Utils.js";

/** Stores mix (crossfade) durations to be applied when {@link AnimationState} animations are changed on the same track. */
export class AnimationStateData {
  /** The SkeletonData to look up animations when they are specified by name. */
  skeletonData: SkeletonData;

  animationToMixTime: StringMap<number> = {};

  /** The mix duration to use when no mix duration has been defined between two animations. */
  defaultMix = 0;

  constructor(skeletonData: SkeletonData) {
    if (!skeletonData) throw new Error("skeletonData cannot be null.");
    this.skeletonData = skeletonData;
  }

  /** Sets a mix duration by animation name.
   *
   * See {@link setMix}. */
  setMix(fromName: string, to: string, duration: number): void;

  /** Sets the mix duration when changing from the specified animation to the other.
   *
   * See {@link TrackEntry.mixDuration}. */
  setMix(from: Animation, to: Animation, duration: number): void;

  setMix(from: string | Animation, to: string | Animation, duration: number) {
    if (typeof from === "string") return this.setMix1(from, to as string, duration);
    return this.setMix2(from, to as Animation, duration);
  }

  private setMix1(fromName: string, toName: string, duration: number) {
    const from = this.skeletonData.findAnimation(fromName);
    if (!from) throw new Error(`Animation not found: ${fromName}`);
    const to = this.skeletonData.findAnimation(toName);
    if (!to) throw new Error(`Animation not found: ${toName}`);
    this.setMix2(from, to, duration);
  }

  private setMix2(from: Animation, to: Animation, duration: number) {
    if (!from) throw new Error("from cannot be null.");
    if (!to) throw new Error("to cannot be null.");
    const key = `${from.name}.${to.name}`;
    this.animationToMixTime[key] = duration;
  }

  /** Returns the mix duration to use when changing from the specified animation to the other on the same track, or the
   * {@link defaultMix} if no mix duration has been set. */
  getMix(from: Animation, to: Animation) {
    const key = `${from.name}.${to.name}`;
    const value = this.animationToMixTime[key];
    return value === undefined ? this.defaultMix : value;
  }
}
