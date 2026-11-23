import type { Skeleton } from "../Skeleton";
import type { Slot } from "../Slot";
import { type NumberArrayLike, Utils } from "../Utils";

const _empty: number[] = [];

/** The base class for all attachments. Multiple {@link Skeleton} instances, slots, or skins can use the same attachments. */
export abstract class Attachment {
  name: string;

  /** Timelines for the timeline attachment are also applied to this attachment.
   * @return May be null if no attachment-specific timelines should be applied. */
  timelineAttachment?: Attachment;

  /** Slots that can have attachments whose {@link timelineAttachment} is this attachment. */
  timelineSlots: number[] = _empty;

  constructor(name: string) {
    if (!name) throw new Error("name cannot be null.");
    this.name = name;
    this.timelineAttachment = this;
  }

  abstract copy(): Attachment;

  /** Returns true if the {@code slotIndex} or any {@link timelineSlots} have an attachment whose {@link timelineAttachment} is
   * this attachment.
   * @param slots The {@link Skeleton.slots}.
   * @param slotIndex The timeline's primary slot index. */
  public isTimelineActive(slots: Slot[], slotIndex: number, appliedPose: boolean): boolean {
    let slot = slots[slotIndex];
    if (slot.bone.isActive()) {
      const other = (appliedPose ? slot.getAppliedPose() : slot.getPose()).getAttachment();
      if (other != null && other.timelineAttachment === this) return true;
    }
    for (let i = 0, n = this.timelineSlots.length; i < n; i++) {
      slot = slots[this.timelineSlots[i]];
      if (!slot.bone.isActive()) continue;
      const other = (appliedPose ? slot.getAppliedPose() : slot.getPose()).getAttachment();
      if (other != null && other.timelineAttachment === this) return true;
    }
    return false;
  }
}

let _nextID = 0;

/** Base class for an attachment with vertices that are transformed by one or more bones and can be deformed by
 * {@link SlotPose.deform}. */
export abstract class VertexAttachment extends Attachment {
  /** The unique ID for this attachment. */
  id = _nextID++;

  /** The bones that affect the {@link vertices}. The entries are, for each vertex, the number of bones affecting the vertex
   * followed by that many bone indices, which is {@link Skeleton.getBones} index. Null if this attachment has no weights. */
  bones: Array<number> | null = null;

  /** The vertex positions in the bone's coordinate system. For a non-weighted attachment, the values are `x,y`
   * entries for each vertex. For a weighted attachment, the values are `x,y,weight` triplets for each bone affecting
   * each vertex. */
  vertices: NumberArrayLike = [];

  /** The maximum number of world vertex values that can be output by
   * {@link computeWorldVertices} using the `count` parameter. */
  worldVerticesLength = 0;

  constructor(name: string) {
    super(name);
  }

  /** Transforms the attachment's local {@link vertices} to world coordinates. If {@link SlotPose.getDeform} is not empty, it
   * is used to deform the vertices.
   *
   * See <a href="https://esotericsoftware.com/spine-runtime-skeletons#World-transforms">World transforms</a> in the Spine
   * Runtimes Guide.
   * @param start The index of the first {@link vertices} value to transform. Each vertex has 2 values, x and y.
   * @param count The number of world vertex values to output. Must be <= {@link worldVerticesLength} - `start`.
   * @param worldVertices The output world vertices. Must have a length >= `offset` + `count` *
   *           `stride` / 2.
   * @param offset The `worldVertices` index to begin writing values.
   * @param stride The number of `worldVertices` entries between the value pairs written. */
  computeWorldVertices(
    skeleton: Skeleton,
    slot: Slot,
    start: number,
    count: number,
    worldVertices: NumberArrayLike,
    offset: number,
    stride: number,
  ) {
    count = offset + (count >> 1) * stride;
    const deformArray = slot.appliedPose.deform;
    let vertices = this.vertices;
    const bones = this.bones;
    if (!bones) {
      if (deformArray.length > 0) vertices = deformArray;
      const bone = slot.bone.appliedPose;
      const x = bone.worldX;
      const y = bone.worldY;
      const a = bone.a,
        b = bone.b,
        c = bone.c,
        d = bone.d;
      for (let v = start, w = offset; w < count; v += 2, w += stride) {
        const vx = vertices[v],
          vy = vertices[v + 1];
        worldVertices[w] = vx * a + vy * b + x;
        worldVertices[w + 1] = vx * c + vy * d + y;
      }
      return;
    }
    let v = 0,
      skip = 0;
    for (let i = 0; i < start; i += 2) {
      const n = bones[v];
      v += n + 1;
      skip += n;
    }
    const skeletonBones = skeleton.bones;
    if (deformArray.length === 0) {
      for (let w = offset, b = skip * 3; w < count; w += stride) {
        let wx = 0,
          wy = 0;
        let n = bones[v++];
        n += v;
        for (; v < n; v++, b += 3) {
          const bone = skeletonBones[bones[v]].appliedPose;
          const vx = vertices[b],
            vy = vertices[b + 1],
            weight = vertices[b + 2];
          wx += (vx * bone.a + vy * bone.b + bone.worldX) * weight;
          wy += (vx * bone.c + vy * bone.d + bone.worldY) * weight;
        }
        worldVertices[w] = wx;
        worldVertices[w + 1] = wy;
      }
    } else {
      const deform = deformArray;
      for (let w = offset, b = skip * 3, f = skip << 1; w < count; w += stride) {
        let wx = 0,
          wy = 0;
        let n = bones[v++];
        n += v;
        for (; v < n; v++, b += 3, f += 2) {
          const bone = skeletonBones[bones[v]].appliedPose;
          const vx = vertices[b] + deform[f],
            vy = vertices[b + 1] + deform[f + 1],
            weight = vertices[b + 2];
          wx += (vx * bone.a + vy * bone.b + bone.worldX) * weight;
          wy += (vx * bone.c + vy * bone.d + bone.worldY) * weight;
        }
        worldVertices[w] = wx;
        worldVertices[w + 1] = wy;
      }
    }
  }

  /** Does not copy id (generated) or name (set on construction). **/
  copyTo(attachment: VertexAttachment) {
    if (this.bones) {
      attachment.bones = [];
      Utils.arrayCopy(this.bones, 0, attachment.bones, 0, this.bones.length);
    } else attachment.bones = null;

    if (this.vertices) {
      attachment.vertices = Utils.newFloatArray(this.vertices.length);
      Utils.arrayCopy(this.vertices, 0, attachment.vertices, 0, this.vertices.length);
    }

    attachment.worldVerticesLength = this.worldVerticesLength;
    attachment.timelineAttachment = this.timelineAttachment;
    attachment.timelineSlots = this.timelineSlots;
  }
}
