import type { Pose } from "./Pose";
import { Posed } from "./Posed";
import type { PosedData } from "./PosedData";

/** A posed object that may be active or inactive. */
export abstract class PosedActive<D extends PosedData<P>, P extends Pose<P>> extends Posed<D, P> {
  active = false;

  protected constructor(data: D, pose: P, constrained: P) {
    super(data, pose, constrained);
    this.setupPose();
  }

  /** Returns false when this constraint won't be updated by
   * {@link Skeleton.updateWorldTransform} because a skin is required and the
   * {@link Skeleton.skin active skin} does not contain this item. See {@link Skin.bones}, {@link Skin.constraints},
   * {@link PosedData.skinRequired}, and {@link Skeleton.updateCache}. */
  public isActive(): boolean {
    return this.active;
  }
}
