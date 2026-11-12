import type { Bone } from "./Bone.js";
import { Posed } from "./Posed.js";
import type { Skeleton } from "./Skeleton.js";
import type { SlotData } from "./SlotData.js";
import { SlotPose } from "./SlotPose.js";
import { Color } from "./Utils.js";

/** Organizes attachments for {@link Skeleton.drawOrder} purposes and provide a place to store state for an attachment.
 *
 * State cannot be stored in an attachment itself because attachments are stateless and may be shared across multiple
 * skeletons. */
export class Slot extends Posed<SlotData, SlotPose> {
  readonly skeleton: Skeleton;

  /** The bone this slot belongs to. */
  readonly bone: Bone;

  attachmentState: number = 0;

  constructor(data: SlotData, skeleton: Skeleton) {
    super(data, new SlotPose(), new SlotPose());
    if (!skeleton) throw new Error("skeleton cannot be null.");
    this.skeleton = skeleton;
    this.bone = skeleton.bones[data.boneData.index];
    if (data.setupPose.darkColor != null) {
      this.pose.darkColor = new Color();
      this.constrainedPose.darkColor = new Color();
    }
    this.setupPose();
  }

  /** Copy constructor. */
  public copy(slot: Slot, bone: Bone, skeleton: Skeleton) {
    const copy = new Slot(slot.data, this.skeleton);
    if (this.data.setupPose.darkColor != null) {
      copy.pose.darkColor = new Color();
      copy.constrainedPose.darkColor = new Color();
    }
    copy.pose.set(slot.pose);
    return copy;
  }

  setupPose() {
    this.pose.color.setFromColor(this.data.setupPose.color);
    if (this.pose.darkColor) this.pose.darkColor.setFromColor(this.data.setupPose.darkColor!);
    this.pose.sequenceIndex = this.data.setupPose.sequenceIndex;
    if (!this.data.attachmentName) this.pose.setAttachment(null);
    else {
      this.pose.attachment = null;
      this.pose.setAttachment(this.skeleton.getAttachment(this.data.index, this.data.attachmentName));
    }
  }
}
