import type { BoneData } from "./BoneData";
import { ConstraintData, ScaleYMode } from "./ConstraintData";
import { PhysicsConstraint } from "./PhysicsConstraint";
import { PhysicsConstraintPose } from "./PhysicsConstraintPose";
import type { Skeleton } from "./Skeleton";

/** Stores the setup pose for a {@link PhysicsConstraint}.
 *
 * See <a href="http://esotericsoftware.com/spine-physics-constraints">Physics constraints</a> in the Spine User Guide. */
export class PhysicsConstraintData extends ConstraintData<PhysicsConstraint, PhysicsConstraintPose> {
  /** The bone constrained by this physics constraint. */
  public set bone(boneData: BoneData) {
    this._bone = boneData;
  }
  public get bone() {
    if (!this._bone) throw new Error("BoneData not set.");
    else return this._bone;
  }
  private _bone: BoneData | null = null;

  /** Physics influence on x translation, 0-1. */
  x = 0;

  /** Physics influence on y translation, 0-1. */
  y = 0;

  /** Physics influence on rotation, 0-1. */
  rotate = 0;

  /** Physics influence on scaleX, 0-1. */
  scaleX = 0;

  /** Physics influence on shearX, 0-1. */
  shearX = 0;

  /** Movement greater than the limit will not have a greater affect on physics. */
  limit = 0;

  /** The time in milliseconds required to advanced the physics simulation one step. */
  step = 0;

  /** True when this constraint's inertia is controlled by global slider timelines. */
  inertiaGlobal = false;

  /** True when this constraint's strength is controlled by global slider timelines. */
  strengthGlobal = false;

  /** True when this constraint's damping is controlled by global slider timelines. */
  dampingGlobal = false;

  /** True when this constraint's mass is controlled by global slider timelines. */
  massGlobal = false;

  /** True when this constraint's wind is controlled by global slider timelines. */
  windGlobal = false;

  /** True when this constraint's gravity is controlled by global slider timelines. */
  gravityGlobal = false;

  /** True when this constraint's mix is controlled by global slider timelines. */
  mixGlobal = false;

  /** Determines how the {@link BonePose.scaleY} changes when {@link BonePose.scaleX} sets
   * {@link BonePose.scaleX}. */
  private _scaleYMode = ScaleYMode.None;
  get scaleYMode(): ScaleYMode {
    return this._scaleYMode;
  }
  set scaleYMode(scaleYMode: ScaleYMode) {
    if (scaleYMode == null) throw new Error("scaleYMode cannot be null.");
    this._scaleYMode = scaleYMode;
  }

  constructor(name: string) {
    super(name, new PhysicsConstraintPose());
  }

  public create(skeleton: Skeleton) {
    return new PhysicsConstraint(this, skeleton);
  }
}
