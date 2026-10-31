import type { Pose } from "./Pose.js";

/** Stores a pose for a transform constraint. */
export class TransformConstraintPose implements Pose<TransformConstraintPose> {
	/** A percentage (unbounded) that controls the mix between the constrained and unconstrained rotation. */
	mixRotate = 0;

	/** A percentage (unbounded) that controls the mix between the constrained and unconstrained translation X. */
	mixX = 0;

	/** A percentage (unbounded) that controls the mix between the constrained and unconstrained translation Y. */
	mixY = 0;

	/** A percentage (unbounded) that controls the mix between the constrained and unconstrained scale X. */
	mixScaleX = 0;

	/** A percentage (unbounded) that controls the mix between the constrained and unconstrained scale Y. */
	mixScaleY = 0;

	/** A percentage (unbounded) that controls the mix between the constrained and unconstrained shear Y. */
	mixShearY = 0;

	public set (pose: TransformConstraintPose) {
		this.mixRotate = pose.mixRotate;
		this.mixX = pose.mixX;
		this.mixY = pose.mixY;
		this.mixScaleX = pose.mixScaleX;
		this.mixScaleY = pose.mixScaleY;
		this.mixShearY = pose.mixShearY;
	}
}
