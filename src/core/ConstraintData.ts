import type { Constraint } from "./Constraint";
import type { Pose } from "./Pose";
import { PosedData } from "./PosedData";
import type { Skeleton } from "./Skeleton";

/** The base class for all constraint datas. */
export abstract class ConstraintData<
  T extends Constraint<T, ConstraintData<T, P>, P>,
  P extends Pose<P>,
> extends PosedData<P> {
  constructor(name: string, setup: P) {
    super(name, setup);
  }

  abstract create(skeleton: Skeleton): T;
}

/** Determines how the {@link BonePose.scaleY} changes when {@link BonePose.scaleX} is set. */
export const enum ScaleYMode {
  /** scaleY is not changed. */
  None,
  /** scaleY is multiplied by the scaleX factor, preserving the bone's aspect ratio. */
  Uniform,
  /** scaleY is divided by the scaleX factor, preserving the bone's area. */
  Volume,
}
