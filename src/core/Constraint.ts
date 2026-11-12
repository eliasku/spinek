import type { ConstraintData } from "./ConstraintData.js";
import type { Physics } from "./Physics.js";
import type { Pose } from "./Pose.js";
import { PosedActive } from "./PosedActive.js";
import type { Skeleton } from "./Skeleton.js";
import type { Update } from "./Update.js";

export abstract class Constraint<T extends Constraint<T, D, P>, D extends ConstraintData<T, P>, P extends Pose<P>>
  extends PosedActive<D, P>
  implements Update
{
  constructor(data: D, pose: P, constrained: P) {
    super(data, pose, constrained);
  }

  abstract copy(skeleton: Skeleton): T;

  abstract sort(skeleton: Skeleton): void;

  abstract update(skeleton: Skeleton, physics: Physics): void;

  isSourceActive(): boolean {
    return true;
  }
}
