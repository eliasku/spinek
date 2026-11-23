import type { Attachment } from "./attachments/Attachment";
import { VertexAttachment } from "./attachments/Attachment";
import type { Pose } from "./Pose";
import { Color } from "./Utils";

/** Stores a slot's pose. */
export class SlotPose implements Pose<SlotPose> {
  /** The color used to tint the slot's attachment. If {@link darkColor} is set, this is used as the light color for two color
   * tinting. */
  readonly color = new Color(1, 1, 1, 1);

  /** The dark color used to tint the slot's attachment for two color tinting, or null if two color tinting is not used. The dark
   * color's alpha is not used. */
  darkColor: Color | null = null;

  /** The current attachment for the slot, or null if the slot has no attachment. */
  attachment: Attachment | null = null; // Not used in setup pose.

  /** The index of the texture region to display when the slot's attachment has a {@link Sequence}. -1 represents the
   * {@link Sequence.getSetupIndex}. */
  sequenceIndex = 0;

  /** Values to deform the slot's attachment. For an unweighted mesh, the entries are local positions for each vertex. For a
   * weighted mesh, the entries are an offset for each vertex which will be added to the mesh's local vertex positions.
   *
   * See {@link VertexAttachment.computeWorldVertices} and
   * {@link DeformTimeline}. */
  readonly deform = [] as number[];

  SlotPose() {}

  public set(pose: SlotPose): void {
    if (pose == null) throw new Error("pose cannot be null.");
    this.color.setFromColor(pose.color);
    if (this.darkColor != null && pose.darkColor != null) this.darkColor.setFromColor(pose.darkColor);
    this.attachment = pose.attachment;
    this.sequenceIndex = pose.sequenceIndex;
    this.deform.length = 0;
    this.deform.push(...pose.deform);
  }

  /** The current attachment for the slot, or null if the slot has no attachment. */
  getAttachment(): Attachment | null {
    return this.attachment;
  }

  /** Sets the slot's attachment and, if the attachment changed, resets {@link sequenceIndex} and clears the {@link deform}.
   * The deform is not cleared if the old attachment has the same {@link VertexAttachment.getTimelineAttachment} as the
   * specified attachment. */
  setAttachment(attachment: Attachment | null): void {
    if (this.attachment === attachment) return;
    if (
      !(attachment instanceof VertexAttachment) ||
      !(this.attachment instanceof VertexAttachment) ||
      attachment.timelineAttachment !== this.attachment.timelineAttachment
    ) {
      this.deform.length = 0;
    }
    this.attachment = attachment;
    this.sequenceIndex = -1;
  }
}
