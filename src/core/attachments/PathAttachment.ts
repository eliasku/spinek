import { Color, Utils } from "../Utils.js";
import { type Attachment, VertexAttachment } from "./Attachment.js";

/** An attachment whose vertices make up a composite Bezier curve.
 *
 * See {@link PathConstraint} and [Paths](http://esotericsoftware.com/spine-paths) in the Spine User Guide. */
export class PathAttachment extends VertexAttachment {
  /** The lengths along the path in the setup pose from the start of the path to the end of each Bezier curve. */
  lengths: Array<number> = [];

  /** If true, the start and end knots are connected. */
  closed = false;

  /** If true, additional calculations are performed to make computing positions along the path more accurate so movement along
   * the path has a constant speed. */
  constantSpeed = false;

  /** The color of the path as it was in Spine. Available only when nonessential data was exported. Paths are not usually
   * rendered at runtime. */
  color = new Color(1, 1, 1, 1);

  constructor(name: string) {
    super(name);
  }

  copy(): Attachment {
    const copy = new PathAttachment(this.name);
    this.copyTo(copy);
    copy.lengths = [];
    Utils.arrayCopy(this.lengths, 0, copy.lengths, 0, this.lengths.length);
    copy.closed = this.closed;
    copy.constantSpeed = this.constantSpeed;
    copy.color.setFromColor(this.color);
    return copy;
  }
}
