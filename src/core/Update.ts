import type { Physics } from "./Physics.js";
import type { Skeleton } from "./Skeleton.js";

/** The interface for items updated by {@link Skeleton.updateWorldTransform}. */
export interface Update {
	/** @param physics Determines how physics and other non-deterministic updates are applied. */
	update (skeleton: Skeleton, physics: Physics): void;
}
