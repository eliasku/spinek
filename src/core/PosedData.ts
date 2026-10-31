import type { Pose } from "./Pose.js";

/** The base class for storing setup data for a posed object. May be shared with multiple instances. */
export abstract class PosedData<P extends Pose<P>> {
  readonly name: string;

  readonly setupPose: P;

  /** When true, {@link Skeleton.updateWorldTransform} only updates this constraint if the {@link Skeleton.skin}
   * contains this constraint.
   *
   * See {@link Skin.constraints}. */
  skinRequired = false;

  constructor(name: string, setupPose: P) {
    if (name == null) throw new Error("name cannot be null.");
    this.name = name;
    this.setupPose = setupPose;
  }
}
