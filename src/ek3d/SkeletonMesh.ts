import { Object3D } from "ek3d/core/Object3D";
import { Side } from "ek3d/constants";
import { Vector3 } from "ek3d/math/Vector3";
import { Quaternion } from "ek3d/math/Quaternion";
import { Matrix4 } from "ek3d/math/Matrix4";
import { SkeletonMeshMaterial, type MaterialWithMap, type MaterialParameters, MeshBatcher } from "./MeshBatcher.js";
import { AnimationState } from "../core/AnimationState.js";
import { AnimationStateData } from "../core/AnimationStateData.js";
import { ClippingAttachment } from "../core/attachments/ClippingAttachment.js";
import { Color, NumberArrayLike, Utils, Vector2 } from "../core/Utils.js";
import { MeshAttachment } from "../core/attachments/MeshAttachment.js";
import { Physics } from "../core/Physics.js";
import { RegionAttachment } from "../core/attachments/RegionAttachment.js";
import { Skeleton } from "../core/Skeleton.js";
import { SkeletonClipping } from "../core/SkeletonClipping.js";
import { SkeletonData } from "../core/SkeletonData.js";
import { SkeletonPhysicsMovement, type SkeletonPhysicsMovementTransform } from "../core/SkeletonPhysicsMovement.js";

import { Ek3dTexture } from "./Ek3dTexture.js";

export type SkeletonMeshConfiguration = {
  /** The skeleton data object loaded by using {@link SkeletonJson} or {@link SkeletonBinary} */
  skeletonData: SkeletonData;

  /** Set it to true to enable tint black rendering */
  twoColorTint?: boolean;

  /** Factory for materials with a texture map. Built-in ek3d mesh materials are
   * adapted for two-color tint; the default is an unlit Spine shader. */
  materialFactory?: (parameters: MaterialParameters) => MaterialWithMap;
};

export class SkeletonMesh extends Object3D {
  /** Default material settings passed to the material factory. */
  public static readonly DEFAULT_MATERIAL_PARAMETERS: MaterialParameters = {
    side: Side.Double,
    depthWrite: true,
    depthTest: true,
    transparent: true,
    alphaTest: 0.001,
    vertexColors: true,
    premultipliedAlpha: true,
    forceSinglePass: true,
  };

  tempPos: Vector2 = new Vector2();
  tempUv: Vector2 = new Vector2();
  tempLight = new Color();
  tempDark = new Color();
  skeleton: Skeleton;
  state: AnimationState;
  readonly skeletonPhysics: SkeletonPhysicsMovement;
  zOffset: number = 0.1;

  private batches = new Array<MeshBatcher>();
  private materialFactory: (parameters: MaterialParameters) => MaterialWithMap;
  private nextBatchIndex = 0;
  private clipper: SkeletonClipping = new SkeletonClipping();

  static QUAD_TRIANGLES = [0, 1, 2, 2, 3, 0];
  static VERTEX_SIZE = 2 + 2 + 4;
  private vertexSize = 2 + 2 + 4;
  private twoColorTint;

  private vertices = Utils.newFloatArray(1024);
  private tempColor = new Color();
  private tempDarkColor = new Color();

  private _castShadow = false;
  private _receiveShadow = false;
  private readonly physicsWorldPosition = new Vector3();
  private readonly physicsWorldQuaternion = new Quaternion();
  private readonly physicsPreviousWorldQuaternion = new Quaternion();
  private readonly physicsRelativeQuaternion = new Quaternion();
  private readonly physicsDecomposedPosition = new Vector3();
  private readonly physicsDecomposedQuaternion = new Quaternion();
  private readonly physicsDecomposedScale = new Vector3();
  private readonly physicsWorldToLocal = new Matrix4();
  private physicsWorldToLocalValid = false;
  private physicsHasWorldQuaternion = false;
  private physicsRotation = 0;

  /**
   * Create an Object3D containing meshes representing your Spine animation.
   * Personalize your material providing a {@link SkeletonMeshConfiguration}
   * @param skeletonData
   */
  constructor(configuration: SkeletonMeshConfiguration) {
    super();

    this.twoColorTint = configuration.twoColorTint ?? true;
    if (this.twoColorTint) {
      this.vertexSize += 4;
    }

    this.materialFactory = configuration.materialFactory ?? ((parameters) => new SkeletonMeshMaterial(parameters));
    this.skeleton = new Skeleton(configuration.skeletonData);
    this.skeletonPhysics = new SkeletonPhysicsMovement(this.skeleton, {
      readTransform: (out, readRotation) => this.readPhysicsTransform(out, readRotation),
      worldToSkeleton: (point) => this.physicsWorldToSkeleton(point),
    });
    let animData = new AnimationStateData(configuration.skeletonData);
    this.state = new AnimationState(animData);

    Object.defineProperty(this, "castShadow", {
      get: () => this._castShadow,
      set: (value: boolean) => {
        this._castShadow = value;
        this.traverse((child) => {
          if (child instanceof MeshBatcher) {
            child.castShadow = value;
          }
        });
      },
    });

    Object.defineProperty(this, "receiveShadow", {
      get: () => this._receiveShadow,
      set: (value: boolean) => {
        this._receiveShadow = value;
        // Propagate to children
        this.traverse((child) => {
          if (child instanceof MeshBatcher) {
            child.receiveShadow = value;
          }
        });
      },
    });
  }

  update(deltaTime: number) {
    let state = this.state;
    let skeleton = this.skeleton;

    state.update(deltaTime);
    state.apply(skeleton);
    this.skeletonPhysics.applyTransformMovement();
    skeleton.update(deltaTime);
    skeleton.updateWorldTransform(Physics.update);

    this.updateGeometry();
  }

  private readPhysicsTransform(out: SkeletonPhysicsMovementTransform, readRotation: boolean): void {
    this.updateWorldMatrix(true, false);
    const elements = this.matrixWorld.elements;
    out.x = elements[12];
    out.y = elements[13];
    out.z = elements[14];
    this.physicsWorldToLocalValid = false;

    if (!readRotation) return;

    // a rotated object below a non-uniformly scaled parent has a sheared world matrix,
    // which cannot be decomposed into a reliable world quaternion.
    this.physicsWorldQuaternion.identity();
    for (let object: Object3D | null = this; object; object = object.parent) {
      if (object.matrixAutoUpdate) {
        this.physicsWorldQuaternion.premultiply(object.quaternion);
      } else {
        object.matrix.decompose(
          this.physicsDecomposedPosition,
          this.physicsDecomposedQuaternion,
          this.physicsDecomposedScale,
        );
        this.physicsWorldQuaternion.premultiply(this.physicsDecomposedQuaternion);
      }
    }

    if (this.physicsHasWorldQuaternion) {
      const relative = this.physicsRelativeQuaternion
        .copy(this.physicsPreviousWorldQuaternion)
        .invert()
        .multiply(this.physicsWorldQuaternion)
        .normalize();
      const twistLength = Math.hypot(relative.z, relative.w);
      if (twistLength > 0.000001) {
        this.physicsRotation += (2 * Math.atan2(relative.z / twistLength, relative.w / twistLength) * 180) / Math.PI;
      }
    }
    this.physicsPreviousWorldQuaternion.copy(this.physicsWorldQuaternion);
    this.physicsHasWorldQuaternion = true;
    out.rotation = this.physicsRotation;
  }

  private physicsWorldToSkeleton(point: { x: number; y: number; z: number }): void {
    if (!this.physicsWorldToLocalValid) {
      this.physicsWorldToLocal.copy(this.matrixWorld).invert();
      this.physicsWorldToLocalValid = true;
    }
    this.physicsWorldPosition.set(point.x, point.y, point.z).applyMatrix4(this.physicsWorldToLocal);
    point.x = this.physicsWorldPosition.x;
    point.y = this.physicsWorldPosition.y;
    point.z = this.physicsWorldPosition.z;
  }

  dispose() {
    for (var i = 0; i < this.batches.length; i++) {
      this.batches[i].dispose();
    }
  }

  private clearBatches() {
    for (var i = 0; i < this.batches.length; i++) {
      this.batches[i].clear();
      this.batches[i].visible = false;
    }
    this.nextBatchIndex = 0;
  }

  private nextBatch() {
    if (this.batches.length == this.nextBatchIndex) {
      let batch = new MeshBatcher(MeshBatcher.MAX_VERTICES, this.materialFactory, this.twoColorTint);
      batch.castShadow = this._castShadow;
      batch.receiveShadow = this._receiveShadow;
      this.add(batch);
      this.batches.push(batch);
    }
    let batch = this.batches[this.nextBatchIndex++];
    batch.visible = true;
    return batch;
  }

  private updateGeometry() {
    this.clearBatches();

    const clipper = this.clipper;

    let vertices: NumberArrayLike = this.vertices;
    let triangles: Array<number> | null = null;
    let uvs: NumberArrayLike | null = null;
    const skeleton = this.skeleton;
    const drawOrder = skeleton.drawOrder.appliedPose;
    let batch = this.nextBatch();
    batch.begin();
    let z = 0;
    const zOffset = this.zOffset;
    const vertexSize = this.vertexSize;
    for (let i = 0, n = drawOrder.length; i < n; i++) {
      const slot = drawOrder[i];
      if (!slot.bone.active) {
        clipper.clipEnd(slot);
        continue;
      }
      const pose = slot.appliedPose;
      const attachment = pose.attachment;
      let attachmentColor: Color | null;
      let texture: Ek3dTexture | null;
      let numFloats = 0;
      if (attachment instanceof RegionAttachment) {
        attachmentColor = attachment.color;
        vertices = this.vertices;
        numFloats = vertexSize * 4;

        const sequence = attachment.sequence;
        const sequenceIndex = sequence.resolveIndex(pose);
        attachment.computeWorldVertices(slot, attachment.getOffsets(pose), vertices, 0, vertexSize);

        triangles = SkeletonMesh.QUAD_TRIANGLES;
        uvs = sequence.getUVs(sequenceIndex);
        texture = sequence.regions[sequenceIndex]?.texture;
      } else if (attachment instanceof MeshAttachment) {
        attachmentColor = attachment.color;
        vertices = this.vertices;
        numFloats = (attachment.worldVerticesLength >> 1) * vertexSize;
        if (numFloats > vertices.length) {
          vertices = this.vertices = Utils.newFloatArray(numFloats);
        }
        attachment.computeWorldVertices(skeleton, slot, 0, attachment.worldVerticesLength, vertices, 0, vertexSize);
        triangles = attachment.triangles;

        const sequence = attachment.sequence;
        const sequenceIndex = sequence.resolveIndex(pose);

        uvs = sequence.getUVs(sequenceIndex);
        texture = sequence.regions[sequenceIndex]?.texture;
      } else if (attachment instanceof ClippingAttachment) {
        clipper.clipEnd(slot);
        clipper.clipStart(skeleton, slot, attachment);
        continue;
      } else {
        clipper.clipEnd(slot);
        continue;
      }

      if (texture != null) {
        const skeletonColor = skeleton.color;
        const slotColor = pose.color;
        const alpha = skeletonColor.a * slotColor.a * attachmentColor.a;
        const color = this.tempColor;
        color.set(
          skeletonColor.r * slotColor.r * attachmentColor.r * alpha,
          skeletonColor.g * slotColor.g * attachmentColor.g * alpha,
          skeletonColor.b * slotColor.b * attachmentColor.b * alpha,
          alpha,
        );

        const darkColor = this.tempDarkColor;
        if (!pose.darkColor) darkColor.set(0, 0, 0, 1);
        else {
          darkColor.r = pose.darkColor.r * alpha;
          darkColor.g = pose.darkColor.g * alpha;
          darkColor.b = pose.darkColor.b * alpha;
          darkColor.a = 1;
        }

        let finalVertices: NumberArrayLike;
        let finalVerticesLength: number;
        let finalIndices: NumberArrayLike;
        let finalIndicesLength: number;

        if (
          clipper.isClipping() &&
          clipper.clipTriangles(
            vertices,
            triangles,
            triangles.length,
            uvs,
            color,
            darkColor,
            this.twoColorTint,
            vertexSize,
          )
        ) {
          const clippedVertices = clipper.clippedVertices;
          const clippedTriangles = clipper.clippedTriangles;
          finalVertices = clippedVertices;
          finalVerticesLength = clippedVertices.length;
          finalIndices = clippedTriangles;
          finalIndicesLength = clippedTriangles.length;
        } else {
          const verts = vertices;
          if (!this.twoColorTint) {
            for (let v = 2, u = 0, n = numFloats; v < n; v += vertexSize, u += 2) {
              verts[v] = color.r;
              verts[v + 1] = color.g;
              verts[v + 2] = color.b;
              verts[v + 3] = color.a;
              verts[v + 4] = uvs[u];
              verts[v + 5] = uvs[u + 1];
            }
          } else {
            for (let v = 2, u = 0, n = numFloats; v < n; v += vertexSize, u += 2) {
              verts[v] = color.r;
              verts[v + 1] = color.g;
              verts[v + 2] = color.b;
              verts[v + 3] = color.a;
              verts[v + 4] = uvs[u];
              verts[v + 5] = uvs[u + 1];
              verts[v + 6] = darkColor.r;
              verts[v + 7] = darkColor.g;
              verts[v + 8] = darkColor.b;
              verts[v + 9] = darkColor.a;
            }
          }

          finalVertices = vertices;
          finalVerticesLength = numFloats;
          finalIndices = triangles;
          finalIndicesLength = triangles.length;
        }

        if (finalVerticesLength === 0 || finalIndicesLength === 0) {
          clipper.clipEnd(slot);
          continue;
        }

        // Start new batch if this one can't hold vertices/indices
        if (!batch.canBatch(finalVerticesLength / this.vertexSize, finalIndicesLength)) {
          batch.end();
          batch = this.nextBatch();
          batch.begin();
          if (!batch.canBatch(finalVerticesLength / this.vertexSize, finalIndicesLength))
            throw new Error("Attachment exceeds batch capacity");
        }

        const slotBlendMode = slot.data.blendMode;
        const slotTexture = texture.texture;
        const materialGroup = batch.findMaterialGroup(slotTexture, slotBlendMode);

        batch.addMaterialGroup(finalIndicesLength, materialGroup);
        batch.batch(finalVertices, finalVerticesLength, finalIndices, finalIndicesLength, z);
        z += zOffset;
      }

      clipper.clipEnd(slot);
    }
    clipper.clipEnd();
    batch.end();
  }
}
