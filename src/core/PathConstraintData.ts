import type { BoneData } from "./BoneData.js";
import { ConstraintData } from "./ConstraintData.js";
import { PathConstraint } from "./PathConstraint.js";
import { PathConstraintPose } from "./PathConstraintPose.js";
import type { Skeleton } from "./Skeleton.js";
import type { SlotData } from "./SlotData.js";

/** Stores the setup pose for a {@link PathConstraint}.
 *
 * See [path constraints](http://esotericsoftware.com/spine-path-constraints) in the Spine User Guide. */
export class PathConstraintData extends ConstraintData<PathConstraint, PathConstraintPose> {
  /** The bones that will be modified by this path constraint. */
  bones = [] as BoneData[];

  /** The slot whose path attachment will be used to constrained the bones. */
  public set slot(slotData: SlotData) {
    this._slot = slotData;
  }
  public get slot() {
    if (!this._slot) throw new Error("SlotData not set.");
    else return this._slot;
  }
  private _slot: SlotData | null = null;

  /** The mode for positioning the first bone on the path. */
  positionMode: PositionMode = PositionMode.Fixed;

  /** The mode for positioning the bones after the first bone on the path. */
  spacingMode: SpacingMode = SpacingMode.Fixed;

  /** The mode for adjusting the rotation of the bones. */
  rotateMode: RotateMode = RotateMode.Chain;

  /** An offset added to the constrained bone rotation. */
  offsetRotation: number = 0;

  constructor(name: string) {
    super(name, new PathConstraintPose());
  }

  public create(skeleton: Skeleton) {
    return new PathConstraint(this, skeleton);
  }
}

/** Controls how the first bone is positioned along the path.
 *
 * See [position](http://esotericsoftware.com/spine-path-constraints#Position) in the Spine User Guide. */
export const enum PositionMode {
  Fixed,
  Percent,
}

/** Controls how bones after the first bone are positioned along the path.
 *
 * See [spacing](http://esotericsoftware.com/spine-path-constraints#Spacing) in the Spine User Guide. */
export const enum SpacingMode {
  Length,
  Fixed,
  Percent,
  Proportional,
}

/** Controls how bones are rotated, translated, and scaled to match the path.
 *
 * See [rotate mix](http://esotericsoftware.com/spine-path-constraints#Rotate-Mix) in the Spine User Guide. */
export const enum RotateMode {
  Tangent,
  Chain,
  ChainScale,
}
