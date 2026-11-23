import type { SlotData } from "../SlotData";
import { Color } from "../Utils";
import { type Attachment, VertexAttachment } from "./Attachment";

/** An attachment with vertices that make up a polygon used for clipping the rendering of other attachments. */
export class ClippingAttachment extends VertexAttachment {
  /** Clipping is performed between the clipping attachment's slot and the end slot. If null, clipping is done until the end of
   * the skeleton's rendering. */
  endSlot: SlotData | null = null;

  /** When true the clipping polygon is treated as convex for more efficient clipping. If the polygon deforms to concave then the
   * convex hull is used. When false the clipping polygon can be concave and if so has an additional CPU cost. Inverse clipping
   * always uses convex. */
  convex = false;

  /** When false, everything inside the clipping polygon is visible. When true, everything outside the clipping polygon is
   * visible and clipping is convex. */
  inverse = false;

  // Nonessential.
  /** The color of the clipping polygon as it was in Spine. Available only when nonessential data was exported. Clipping polygons
   * are not usually rendered at runtime. */
  color = new Color(0.2275, 0.2275, 0.8078, 1); // ce3a3aff

  constructor(name: string) {
    super(name);
  }

  copy(): Attachment {
    const copy = new ClippingAttachment(this.name);
    this.copyTo(copy);
    copy.endSlot = this.endSlot;
    copy.convex = this.convex;
    copy.inverse = this.inverse;
    copy.color.setFromColor(this.color);
    return copy;
  }
}
