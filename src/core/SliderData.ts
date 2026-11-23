import type { Animation } from "./Animation";
import type { BoneData } from "./BoneData";
import { ConstraintData } from "./ConstraintData";
import type { Skeleton } from "./Skeleton";
import { Slider } from "./Slider";
import { SliderPose } from "./SliderPose";
import type { FromProperty } from "./TransformConstraintData";

/** Stores the setup pose for a {@link Slider}.
 *
 * See <a href="https://esotericsoftware.com/spine-slider-constraints">Slider constraints</a> in the Spine User Guide. */
export class SliderData extends ConstraintData<Slider, SliderPose> {
  /** The animation the slider will apply. */
  animation!: Animation;

  /** When true, the animation is applied by adding it to the current pose rather than overwriting it. */
  additive = false;

  /** When true, the animation repeats after its duration, otherwise the last frame is used. */
  loop = false;

  /** When set, the bone's transform property is used to set the slider's {@link SliderPose.time}. */
  bone: BoneData | null = null;

  /** When a bone is set, the specified transform property is used to set the slider's {@link SliderPose.time}. */
  property!: FromProperty;

  /** When a bone is set, this is the scale of the {@link property} value in relation to the slider time. */
  scale = 0;

  /** When a bone is set, the offset is added to the property. */
  offset = 0;

  /** When true and a bone is set, the bone's local transform property is read instead of its world transform. */
  local = false;

  // Nonessential.
  /** When a bone is set, the maximum slider time for the bone property range, or 0 if nonessential data was not exported. */
  max = 0;

  constructor(name: string) {
    super(name, new SliderPose());
  }

  public create(skeleton: Skeleton) {
    return new Slider(this, skeleton);
  }
}
