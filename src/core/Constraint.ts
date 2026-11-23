import type { ConstraintData } from "./ConstraintData";
import type { Physics } from "./Physics";
import type { Pose } from "./Pose";
import { PosedActive } from "./PosedActive";
import type { Skeleton } from "./Skeleton";
import type { Update } from "./Update";

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
