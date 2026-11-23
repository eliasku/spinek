import type { Bone } from "./Bone";
import type { BonePose } from "./BonePose";
import { Constraint } from "./Constraint";
import type { Physics } from "./Physics";
import type { Skeleton } from "./Skeleton";
import type { TransformConstraintData } from "./TransformConstraintData";
import { TransformConstraintPose } from "./TransformConstraintPose";
import { MathUtils } from "./Utils";

/** Adjusts the world transform of the constrained bones to match that of the source bone.
 *
 * See [Transform constraints](http://esotericsoftware.com/spine-transform-constraints) in the Spine User Guide. */
export class TransformConstraint extends Constraint<
  TransformConstraint,
  TransformConstraintData,
  TransformConstraintPose
> {
  /** The bones that will be modified by this transform constraint. */
  bones: Array<BonePose>;

  /** The bone whose world transform will be copied to the constrained bones. */
  source: Bone;

  constructor(data: TransformConstraintData, skeleton: Skeleton) {
    super(data, new TransformConstraintPose(), new TransformConstraintPose());
    if (!skeleton) throw new Error("skeleton cannot be null.");

    this.bones = [] as BonePose[];
    for (const boneData of data.bones) this.bones.push(skeleton.bones[boneData.index].constrainedPose);

    const source = skeleton.bones[data.source.index];
    if (source == null) throw new Error("source cannot be null.");
    this.source = source;
  }

  public copy(skeleton: Skeleton) {
    var copy = new TransformConstraint(this.data, skeleton);
    copy.pose.set(this.pose);
    return copy;
  }

  update(skeleton: Skeleton, physics: Physics) {
    const p = this.appliedPose;
    if (
      p.mixRotate === 0 &&
      p.mixX === 0 &&
      p.mixY === 0 &&
      p.mixScaleX === 0 &&
      p.mixScaleY === 0 &&
      p.mixShearY === 0
    )
      return;

    const data = this.data;
    const localSource = data.localSource,
      localTarget = data.localTarget,
      additive = data.additive,
      clamp = data.clamp;
    const offsets = data.offsets;
    const source = this.source.appliedPose;
    if (localSource) source.validateLocalTransform(skeleton);
    const fromItems = data.properties;
    const fn = data.properties.length;
    const bones = this.bones;
    for (let i = 0, n = this.bones.length; i < n; i++) {
      const bone = bones[i];
      if (localTarget) bone.modifyLocal(skeleton);
      else bone.modifyWorld(skeleton);
      for (let f = 0; f < fn; f++) {
        const from = fromItems[f];
        const value = from.value(skeleton, source, localSource, offsets) - from.offset;
        const toItems = from.to;
        for (let t = 0, tn = from.to.length; t < tn; t++) {
          const to = toItems[t];
          if (to.mix(p) !== 0) {
            let clamped = to.offset + value * to.scale;
            if (clamp) {
              if (to.offset < to.max) clamped = MathUtils.clamp(clamped, to.offset, to.max);
              else clamped = MathUtils.clamp(clamped, to.max, to.offset);
            }
            to.apply(skeleton, p, bone, clamped, localTarget, additive);
          }
        }
      }
    }
  }

  sort(skeleton: Skeleton) {
    if (!this.data.localSource) skeleton.sortBone(this.source);
    const bones = this.bones;
    const boneCount = this.bones.length;
    const worldTarget = !this.data.localTarget;
    if (worldTarget) {
      for (let i = 0; i < boneCount; i++) skeleton.sortBone(bones[i].bone);
    }
    skeleton._updateCache.push(this);
    for (let i = 0; i < boneCount; i++) {
      const bone = bones[i].bone;
      skeleton.sortReset(bone.children);
      skeleton.constrained(bone);
    }
    for (let i = 0; i < boneCount; i++) bones[i].bone.sorted = worldTarget;
  }

  isSourceActive() {
    return this.source.active;
  }
}
