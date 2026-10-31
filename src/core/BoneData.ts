import { BonePose } from "./BonePose.js";
import { PosedData } from "./PosedData.js";
import { Color } from "./Utils.js";

/** The setup pose for a bone. */
export class BoneData extends PosedData<BonePose> {
  /** The index of the bone in {@link Skeleton.bones}. */
  index: number = 0;

  /** The parent bone, or null if this bone is the root. */
  parent: BoneData | null = null;

  /** The bone's length. */
  length: number = 0;

  // Nonessential.
  /** The color of the bone as it was in Spine. Available only when nonessential data was exported. Bones are not usually
   * rendered at runtime. */
  readonly color = new Color();

  /** The bone icon name as it was in Spine, or null if nonessential data was not exported. */
  icon?: string;

  /** The bone icon's display size scale, or 1 if nonessential data was not exported. */
  iconSize = 1;

  /** The bone icon's display rotation in degrees, or 0 if nonessential data was not exported. */
  iconRotation = 0;

  /** False if the bone was hidden in Spine and nonessential data was exported. Does not affect runtime rendering. */
  visible = false;

  constructor(index: number, name: string, parent: BoneData | null) {
    super(name, new BonePose());
    if (index < 0) throw new Error("index must be >= 0.");
    if (!name) throw new Error("name cannot be null.");
    this.index = index;
    this.parent = parent;
  }

  copy(parent: BoneData | null): BoneData {
    const copy = new BoneData(this.index, this.name, parent);
    copy.length = this.length;
    copy.setupPose.set(this.setupPose);
    return copy;
  }
}

/** Determines how a bone inherits world transforms from parent bones. */
export const enum Inherit {
  Normal,
  OnlyTranslation,
  NoRotationOrReflection,
  NoScale,
  NoScaleOrReflection,
}
