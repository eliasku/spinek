import type { BoneData } from "./BoneData";
import { PosedData } from "./PosedData";
import { SlotPose } from "./SlotPose";

/** Stores the setup pose for a {@link Slot}. */
export class SlotData extends PosedData<SlotPose> {
  /** The index of the slot in {@link Skeleton.slots}. */
  index: number = 0;

  /** The bone this slot belongs to. */
  boneData: BoneData;

  /** The name of the attachment that is visible for this slot in the setup pose, or null if no attachment is visible. */
  attachmentName: string | null = null;

  /** The blend mode for drawing the slot's attachment. */
  blendMode: BlendMode = BlendMode.Normal;

  // Nonessential.
  /** False if the slot was hidden in Spine and nonessential data was exported. Does not affect runtime rendering. */
  visible = true;

  constructor(index: number, name: string, boneData: BoneData) {
    super(name, new SlotPose());
    if (index < 0) throw new Error("index must be >= 0.");
    if (!boneData) throw new Error("boneData cannot be null.");
    this.index = index;
    this.boneData = boneData;
  }
}

/** Determines how images are blended with existing pixels when drawn. */
export const enum BlendMode {
  Normal,
  Additive,
  Multiply,
  Screen,
}
