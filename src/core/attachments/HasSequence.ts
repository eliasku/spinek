import type { Color } from "../Utils.js";
import type { Sequence } from "./Sequence.js";

/** Interface for an attachment that gets 1 or more texture regions from a {@link Sequence}. */
export interface HasSequence {
  /** The base path for the attachment's texture region. */
  path?: string;

  /** The color the attachment is tinted, to be combined with {@link SlotPose.getColor}. */
  color: Color;

  /** Calls {@link Sequence.update} on this attachment's sequence. */
  updateSequence(): void;

  /** The sequence that provides texture regions, UVs, and vertex offsets for rendering this attachment. */
  sequence: Sequence;
}
