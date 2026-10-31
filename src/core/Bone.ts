import type { BoneData } from "./BoneData.js";
import { BonePose } from "./BonePose.js";
import { PosedActive } from "./PosedActive.js";

/** A node in a skeleton's hierarchy with a transform that affects its children and their attachments. A bone has a number of
 * poses:
 * - {@link data}: The setup pose.
 * - {@link pose}: The unconstrained local pose. Set by animations and application code.
 * - {@link appliedPose}: The local pose to use for rendering. Possibly modified by constraints.
 * - World transform: the local pose combined with the parent world transform. Computed on a pose by
 * {@link BonePose.updateWorldTransform} and {@link Skeleton.updateWorldTransform}.
 */
export class Bone extends PosedActive<BoneData, BonePose> {
  /** The parent bone, or null if this is the root bone. */
  parent: Bone | null = null;

  /** The immediate children of this bone. */
  children = [] as Bone[];

  sorted = false;

  constructor(data: BoneData, parent: Bone | null) {
    super(data, new BonePose(), new BonePose());
    this.parent = parent;
    this.appliedPose.bone = this;
    this.constrainedPose.bone = this;
  }

  /** Copy constructor. Does not copy the {@link children} bones. */
  copy(parent: Bone | null): Bone {
    const copy = new Bone(this.data, parent);
    copy.pose.set(this.pose);
    return copy;
  }
}
