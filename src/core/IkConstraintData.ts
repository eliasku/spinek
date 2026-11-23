import type { BoneData } from "./BoneData";
import { ConstraintData, ScaleYMode } from "./ConstraintData";
import { IkConstraint } from "./IkConstraint";
import { IkConstraintPose } from "./IkConstraintPose";
import type { Skeleton } from "./Skeleton";

/** Stores the setup pose for an {@link IkConstraint}.
 *
 * See [IK constraints](http://esotericsoftware.com/spine-ik-constraints) in the Spine User Guide. */
export class IkConstraintData extends ConstraintData<IkConstraint, IkConstraintPose> {
  /** The bones that are constrained by this IK constraint. */
  bones = [] as BoneData[];

  private _target: BoneData | null = null;
  /** The bone that is the IK target. */
  public set target(boneData: BoneData) {
    this._target = boneData;
  }
  public get target() {
    if (!this._target) throw new Error("target cannot be null.");
    return this._target;
  }

  /** Determines how the {@link BonePose.scaleY} changes when {@link IkConstraintPose.compress} or
   * {@link IkConstraintPose.stretch} set {@link BonePose.scaleX}. */
  _scaleYMode = ScaleYMode.None;
  public set scaleYMode(scaleYMode: ScaleYMode) {
    this._scaleYMode = scaleYMode;
  }
  public get scaleYMode() {
    if (this._scaleYMode == null) throw new Error("scaleYMode cannot be null.");
    return this._scaleYMode;
  }

  constructor(name: string) {
    super(name, new IkConstraintPose());
  }

  public create(skeleton: Skeleton) {
    return new IkConstraint(this, skeleton);
  }
}
