import type { BonePose } from "../BonePose.js";
import { Color, MathUtils, type Vector2 } from "../Utils.js";
import { type Attachment, VertexAttachment } from "./Attachment.js";

/** An attachment which is a single point and a rotation. This can be used to spawn projectiles, particles, etc. A bone can be
 * used in similar ways, but a PointAttachment is slightly less expensive to compute and can be hidden, shown, and placed in a
 * skin.
 *
 * See [Point Attachments](https://esotericsoftware.com/spine-points) in the Spine User Guide. */
export class PointAttachment extends VertexAttachment {
  /** The local x position. */
  x: number = 0;

  /** The local y position. */
  y: number = 0;

  /** The local rotation in degrees, counter clockwise. */
  rotation: number = 0;

  /** The color of the point attachment as it was in Spine. Available only when nonessential data was exported. Point attachments
   * are not usually rendered at runtime. */
  color = new Color(0.38, 0.94, 0, 1);

  constructor(name: string) {
    super(name);
  }

  /** Computes the world position from the local position. */
  computeWorldPosition(bone: BonePose, point: Vector2) {
    point.x = this.x * bone.a + this.y * bone.b + bone.worldX;
    point.y = this.x * bone.c + this.y * bone.d + bone.worldY;
    return point;
  }

  /** Computes the world rotation from the local rotation. */
  computeWorldRotation(bone: BonePose) {
    const r = this.rotation * MathUtils.degRad,
      cos = Math.cos(r),
      sin = Math.sin(r);
    const x = cos * bone.a + sin * bone.b;
    const y = cos * bone.c + sin * bone.d;
    return MathUtils.atan2Deg(y, x);
  }

  copy(): Attachment {
    const copy = new PointAttachment(this.name);
    copy.x = this.x;
    copy.y = this.y;
    copy.rotation = this.rotation;
    copy.color.setFromColor(this.color);
    return copy;
  }
}
