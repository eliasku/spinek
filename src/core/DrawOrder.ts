import type { Slot } from "./Slot.js";
import { Utils } from "./Utils.js";

/** Stores the skeleton's draw order, which is the order that each slot's attachment is rendered. */
export class DrawOrder {
	readonly _setupPose: Slot[];

	/** The unconstrained draw order, set by animations and application code. */
	readonly pose: Slot[];
	readonly constrainedPose: Slot[];

	/** The constrained draw order for rendering. If no constraints modify the draw order, this is the same as {@link pose}.
	 * Otherwise it is a copy of {@link pose} modified by constraints. */
	appliedPose: Slot[];

	constructor (setupPose: Slot[]) {
		this._setupPose = setupPose;
		this.pose = [...setupPose];
		this.constrainedPose = [];
		this.appliedPose = this.pose;
	}

	/** Sets the unconstrained draw order to the setup pose order. */
	setupPose () {
		this.pose.length = this._setupPose.length;
		Utils.arrayCopy(this._setupPose, 0, this.pose, 0, this._setupPose.length);
	}

	/** Sets the applied pose to the unconstrained pose, for when no constraints will modify the draw order. */
	unconstrained () {
		this.appliedPose = this.pose;
	}

	/** Sets the applied pose to the constrained pose, in anticipation of the applied pose being modified by constraints. */
	constrained () {
		this.appliedPose = this.constrainedPose;
	}

	/** Copies the unconstrained pose to the constrained pose, as a starting point for constraints to be applied. */
	resetConstrained () {
		this.constrainedPose.length = this.pose.length;
		Utils.arrayCopy(this.pose, 0, this.constrainedPose, 0, this.pose.length);
	}
}
