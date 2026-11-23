import type { SlotPose } from "../SlotPose";
import type { TextureRegion } from "../Texture";
import { type NumberArrayLike, Utils } from "../Utils";
import type { HasSequence } from "./HasSequence";
import { MeshAttachment } from "./MeshAttachment";
import { RegionAttachment } from "./RegionAttachment";

let _nextID = 0;

/** Holds texture regions, UVs, and vertex offsets for rendering a region or mesh attachment. {@link regions Regions} must be
 * populated and {@link update} called before use. */
export class Sequence {
  id = _nextID++;

  /** The list of texture regions this sequence will display. */
  regions: Array<TextureRegion | null>;

  readonly pathSuffix: boolean;
  uvs?: NumberArrayLike[];

  /** Returns vertex offsets from the center of a {@link RegionAttachment}. Invalid to call for a {@link MeshAttachment}. */
  offsets?: number[][];

  /** The starting number for the numeric {@link getPath | path} suffix. */
  start = 0;

  /** The minimum number of digits in the numeric {@link getPath | path} suffix, for zero padding. 0 for no zero
   * padding. */
  digits = 0;

  /** The index of the region to show for the setup pose. */
  setupIndex = 0;

  /** @param count The number of texture regions this sequence will display.
   * @param pathSuffix If true, the {@link getPath | path} has a numeric suffix. If false, all regions will use the
   * same path, so `count` should be 1. */
  constructor(count: number, pathSuffix: boolean) {
    this.regions = new Array<TextureRegion>(count);
    this.pathSuffix = pathSuffix;
  }

  copy(): Sequence {
    const regionCount = this.regions.length;
    const copy = new Sequence(regionCount, this.pathSuffix);
    Utils.arrayCopy(this.regions, 0, copy.regions, 0, regionCount);
    copy.start = this.start;
    copy.digits = this.digits;
    copy.setupIndex = this.setupIndex;

    if (this.uvs != null) {
      const length = this.uvs[0].length;
      copy.uvs = [];
      for (let i = 0; i < regionCount; i++) {
        copy.uvs[i] = Utils.newFloatArray(length);
        Utils.arrayCopy(this.uvs[i], 0, copy.uvs[i], 0, length);
      }
    }
    if (this.offsets != null) {
      copy.offsets = [];
      for (let i = 0; i < regionCount; i++) {
        copy.offsets[i] = [];
        Utils.arrayCopy(this.offsets[i], 0, copy.offsets[i], 0, 8);
      }
    }

    return copy;
  }

  /** Computes UVs and offsets for the specified attachment. Must be called if the regions or attachment properties are
   * changed. */
  public update(attachment: HasSequence) {
    const regionCount = this.regions.length;
    if (attachment instanceof RegionAttachment) {
      this.uvs = [];
      this.offsets = [];
      for (let i = 0; i < regionCount; i++) {
        this.uvs[i] = Utils.newFloatArray(8);
        this.offsets[i] = [];
        RegionAttachment.computeUVs(
          this.regions[i],
          attachment.x,
          attachment.y,
          attachment.scaleX,
          attachment.scaleY,
          attachment.rotation,
          attachment.width,
          attachment.height,
          this.offsets[i],
          this.uvs[i],
        );
      }
    } else if (attachment instanceof MeshAttachment) {
      const regionUVs = attachment.regionUVs;
      this.uvs = [];
      this.offsets = undefined;
      for (let i = 0; i < regionCount; i++) {
        this.uvs[i] = Utils.newFloatArray(regionUVs.length);
        MeshAttachment.computeUVs(this.regions[i], regionUVs, this.uvs[i]);
      }
    }
  }

  /** Returns the {@link regions} index for the {@link SlotPose.getSequenceIndex}. */
  resolveIndex(pose: SlotPose): number {
    let index = pose.sequenceIndex;
    if (index === -1) index = this.setupIndex;
    if (index >= this.regions.length) index = this.regions.length - 1;
    return index;
  }

  /** Returns the UVs for the specified index. {@link regions Regions} must be populated and {@link update} called
   * before calling this method. */
  getUVs(index: number): Float32Array {
    return this.uvs![index] as Float32Array;
  }

  /** Returns true if the {@link getPath | path} has a numeric suffix. */
  hasPathSuffix(): boolean {
    return this.pathSuffix;
  }

  /** Returns the specified base path with an optional numeric suffix for the specified index. */
  getPath(basePath: string, index: number): string {
    if (!this.pathSuffix) return basePath;
    let result = basePath;
    const frame = (this.start + index).toString();
    for (let i = this.digits - frame.length; i > 0; i--) result += "0";
    result += frame;
    return result;
  }
}

/** Controls how {@link Sequence.regions} are displayed over time. */
export const enum SequenceMode {
  hold = 0,
  once = 1,
  loop = 2,
  pingpong = 3,
  onceReverse = 4,
  loopReverse = 5,
  pingpongReverse = 6,
}

export const SequenceModeValues = [
  SequenceMode.hold,
  SequenceMode.once,
  SequenceMode.loop,
  SequenceMode.pingpong,
  SequenceMode.onceReverse,
  SequenceMode.loopReverse,
  SequenceMode.pingpongReverse,
];
