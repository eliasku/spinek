import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { Animation, TranslateTimeline } from "spinek/core/Animation";
import { AnimationState } from "spinek/core/AnimationState";
import { AnimationStateData } from "spinek/core/AnimationStateData";
import { AssetCache, AssetManagerBase } from "spinek/core/AssetManagerBase";
import { AtlasAttachmentLoader } from "spinek/core/AtlasAttachmentLoader";
import { BoundingBoxAttachment } from "spinek/core/attachments/BoundingBoxAttachment";
import { MeshAttachment } from "spinek/core/attachments/MeshAttachment";
import { RegionAttachment } from "spinek/core/attachments/RegionAttachment";
import { Inherit } from "spinek/core/BoneData";
import { ScaleYMode } from "spinek/core/ConstraintData";
import { PositionMode, RotateMode, SpacingMode } from "spinek/core/PathConstraintData";
import { Physics } from "spinek/core/Physics";
import { Skeleton } from "spinek/core/Skeleton";
import { SkeletonBinary } from "spinek/core/SkeletonBinary";
import { SkeletonJson } from "spinek/core/SkeletonJson";
import { BlendMode } from "spinek/core/SlotData";
import { FakeTexture, TextureFilter } from "spinek/core/Texture";
import { TextureAtlas } from "spinek/core/TextureAtlas";
import { Color, Vector2 } from "spinek/core/Utils";

const asset = (name: string) => new URL(`../public/assets/${name}`, import.meta.url);

function loader() {
  const atlas = new TextureAtlas(readFileSync(asset("spineboy.atlas"), "utf8"));
  for (const page of atlas.pages) page.setTexture(new FakeTexture({ width: page.width, height: page.height }));
  return new AtlasAttachmentLoader(atlas);
}

it("keeps the optimized color arithmetic unclamped until explicitly requested", () => {
  const color = new Color().set(1.5, -0.5, 0.25, 1).add(0.5, 0.25, 0, 0);
  expect([color.r, color.g, color.b, color.a]).toEqual([2, -0.25, 0.25, 1]);
  color.clamp();
  expect([color.r, color.g, color.b, color.a]).toEqual([1, 0, 0.25, 1]);
});

it("releases prefixed assets only after the last cache reference", () => {
  const cache = new AssetCache();
  const texture = new (class extends FakeTexture {
    disposals = 0;
    dispose() {
      this.disposals++;
    }
  })({});
  cache.assets["assets/image.png"] = texture;
  cache.assetsRefCount["assets/image.png"] = 2;
  const manager = new AssetManagerBase((image) => new FakeTexture(image), "assets/", undefined, cache);
  manager.disposeAsset("image.png");
  expect(texture.disposals).toBe(0);
  expect(manager.get("image.png")).toBe(texture);
  manager.disposeAsset("image.png");
  expect(texture.disposals).toBe(1);
  expect(manager.get("image.png")).toBeUndefined();
});

it("parses non-default inheritance, blending, and constraint modes", () => {
  const data = new SkeletonJson(loader()).readSkeletonData({
    bones: [{ name: "root", inherit: "noScaleOrReflection" }],
    slots: [{ name: "slot", bone: "root", blend: "Additive" }],
    constraints: [
      { type: "ik", name: "ik", bones: ["root"], target: "root", scaleY: "volume" },
      {
        type: "path",
        name: "path",
        bones: ["root"],
        slot: "slot",
        positionMode: "fixed",
        spacingMode: "proportional",
        rotateMode: "chainScale",
      },
      { type: "physics", name: "physics", bone: "root", scaleY: "Uniform" },
    ],
  });
  expect(data.bones[0].setupPose.inherit).toBe(Inherit.NoScaleOrReflection);
  expect(data.slots[0].blendMode).toBe(BlendMode.Additive);
  expect(data.constraints).toMatchObject([
    { scaleYMode: ScaleYMode.Volume },
    { positionMode: PositionMode.Fixed, spacingMode: SpacingMode.Proportional, rotateMode: RotateMode.ChainScale },
    { scaleYMode: ScaleYMode.Uniform },
  ]);
});

it("preserves atlas mipmap aliases and lower-case initials", () => {
  const atlas = new TextureAtlas("page.png\nsize: 1, 1\nfilter: mipMapLinearLinear, nearest\n");
  expect([atlas.pages[0].minFilter, atlas.pages[0].magFilter]).toEqual([TextureFilter.MipMap, TextureFilter.Nearest]);
});

it.each([
  ["hold", [0, 0, 0]],
  ["once", [0, 1, 2]],
  ["loop", [0, 1, 1]],
  ["pingpong", [0, 1, 0]],
  ["onceReverse", [2, 1, 0]],
  ["loopReverse", [2, 1, 1]],
  ["pingpongReverse", [2, 1, 2]],
] as const)("plays JSON sequence mode %s", (mode, expected) => {
  const atlas = new TextureAtlas(
    "page.png\nsize: 3, 1\nframe0\nbounds: 0, 0, 1, 1\nframe1\nbounds: 1, 0, 1, 1\nframe2\nbounds: 2, 0, 1, 1\n",
  );
  const data = new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData({
    bones: [{ name: "root" }],
    slots: [{ name: "slot", bone: "root", attachment: "frame" }],
    skins: [
      {
        name: "default",
        attachments: { slot: { frame: { width: 1, height: 1, sequence: { count: 3, start: 0 } } } },
      },
    ],
    animations: {
      test: {
        attachments: {
          default: {
            slot: {
              frame: {
                sequence: [
                  { mode, delay: 1 },
                  { time: 10, mode },
                ],
              },
            },
          },
        },
      },
    },
  });
  const skeleton = new Skeleton(data);
  const state = new AnimationState(new AnimationStateData(data));
  state.setAnimation(0, "test", false);
  const indices = [];
  for (const delta of [0, 1, 3]) {
    state.update(delta);
    state.apply(skeleton);
    indices.push(skeleton.slots[0].pose.sequenceIndex);
  }
  expect(indices).toEqual(expected);
});

it("copies inherited weighted geometry while preserving deformation only for related attachments", () => {
  const data = new SkeletonJson(loader()).readSkeletonData({
    bones: [
      { name: "root", x: 10, y: 20 },
      { name: "child", parent: "root", x: 3, y: 4 },
    ],
    slots: [{ name: "slot", bone: "child" }],
  });
  const skeleton = new Skeleton(data);
  skeleton.updateWorldTransform(Physics.update);
  const slot = skeleton.slots[0];
  const attachment = new BoundingBoxAttachment("hitbox");
  attachment.bones = [2, 0, 1, 1, 1];
  attachment.vertices = [2, 0, 0.25, 0, 2, 0.75, 4, 6, 1];
  attachment.worldVerticesLength = 4;
  slot.pose.setAttachment(attachment);
  const expectWorldVertices = (attachment: BoundingBoxAttachment, expected: number[]) => {
    const vertices: number[] = [];
    attachment.computeWorldVertices(skeleton, slot, 0, attachment.worldVerticesLength, vertices, 0, 2);
    expect(vertices).toHaveLength(expected.length);
    for (const [index, value] of expected.entries()) expect(vertices[index]).toBeCloseTo(value, 6);
  };
  expectWorldVertices(attachment, [12.75, 24.5, 17, 30]);

  slot.pose.deform.push(4, 0, 0, 4, 0, 0);
  const copy = attachment.copy() as BoundingBoxAttachment;
  slot.pose.setAttachment(copy);
  expect(attachment.isTimelineActive(skeleton.slots, 0, false)).toBe(true);
  expectWorldVertices(copy, [13.75, 27.5, 17, 30]);

  copy.bones![1] = 1;
  copy.vertices[0] = 6;
  expectWorldVertices(copy, [15.5, 28.5, 17, 30]);
  expectWorldVertices(attachment, [13.75, 27.5, 17, 30]);

  const unrelated = new BoundingBoxAttachment("other");
  unrelated.vertices = [1, 2];
  unrelated.worldVerticesLength = 2;
  slot.pose.setAttachment(unrelated);
  expectWorldVertices(unrelated, [14, 26]);
});

it("applies independent inherited timeline frames and curves to a bone hierarchy", () => {
  const data = new SkeletonJson(loader()).readSkeletonData({
    bones: [
      { name: "root", x: 10, y: 20 },
      { name: "child", parent: "root", x: 3, y: 4 },
    ],
  });
  const child = new TranslateTimeline(3, 0, 1);
  child.setFrame(0, 0, 0, 0);
  child.setFrame(1, 1, 8, -4);
  child.setFrame(2, 2, 16, 4);
  child.setStepped(1);
  const root = new TranslateTimeline(2, 0, 0);
  root.setFrame(0, 0, 0, 0);
  root.setFrame(1, 2, 4, 8);
  root.setStepped(0);
  data.animations.push(new Animation("move", [root, child], child.getDuration()));
  const skeleton = new Skeleton(data);
  const untouched = new Skeleton(data);
  const state = new AnimationState(new AnimationStateData(data));
  state.setAnimation(0, "move", false);
  for (const [delta, x, y] of [
    [0.5, 17, 22],
    [1, 21, 20],
    [0.5, 33, 36],
  ] as const) {
    state.update(delta);
    state.apply(skeleton);
    skeleton.updateWorldTransform(Physics.update);
    expect(skeleton.bones[1].appliedPose.worldX).toBeCloseTo(x, 6);
    expect(skeleton.bones[1].appliedPose.worldY).toBeCloseTo(y, 6);
  }
  untouched.updateWorldTransform(Physics.update);
  expect(untouched.bones[1].appliedPose.worldX).toBeCloseTo(13, 6);
  expect(untouched.bones[1].appliedPose.worldY).toBeCloseTo(24, 6);
});

describe.each(["json", "binary"] as const)("spineboy %s", (format) => {
  it("parses, advances animation, and transforms finite geometry", () => {
    const attachmentLoader = loader();
    const bytes = readFileSync(asset("spineboy-pro.skel"));
    const padded = new Uint8Array(bytes.length + 8);
    padded.set(bytes, 4);
    const data =
      format === "json"
        ? new SkeletonJson(attachmentLoader).readSkeletonData(readFileSync(asset("spineboy-pro.json"), "utf8"))
        : new SkeletonBinary(attachmentLoader).readSkeletonData(padded.subarray(4, 4 + bytes.length));
    expect(data.bones.length).toBeGreaterThan(1);
    expect(data.findAnimation("walk")).not.toBeNull();
    const skeleton = new Skeleton(data);
    const state = new AnimationState(new AnimationStateData(data));
    const entry = state.setAnimation(0, "walk", true);
    state.apply(skeleton);
    skeleton.updateWorldTransform(Physics.update);
    const before = skeleton.bones.map(({ appliedPose: bone }) => [
      bone.worldX,
      bone.worldY,
      bone.a,
      bone.b,
      bone.c,
      bone.d,
    ]);
    state.update(0.25);
    skeleton.update(0.25);
    state.apply(skeleton);
    skeleton.updateWorldTransform(Physics.update);
    expect(entry.trackTime).toBeCloseTo(0.25);
    expect(
      skeleton.bones.map(({ appliedPose: bone }) => [bone.worldX, bone.worldY, bone.a, bone.b, bone.c, bone.d]),
    ).not.toEqual(before);
    let count = 0;
    for (const slot of skeleton.drawOrder.appliedPose) {
      const attachment = slot.appliedPose.getAttachment();
      if (attachment instanceof RegionAttachment) {
        const vertices = new Array<number>(8);
        const sequence = attachment.sequence;
        const index = sequence.resolveIndex(slot.appliedPose);
        attachment.computeWorldVertices(slot, attachment.getOffsets(slot.appliedPose), vertices, 0, 2);
        expect(vertices.every(Number.isFinite)).toBe(true);
        expect(sequence.regions[index]?.texture).toBeTruthy();
        expect(Array.from(sequence.getUVs(index)).every(Number.isFinite)).toBe(true);
        count++;
      } else if (attachment instanceof MeshAttachment) {
        const vertices = new Array<number>(attachment.worldVerticesLength);
        attachment.computeWorldVertices(skeleton, slot, 0, vertices.length, vertices, 0, 2);
        expect(vertices.every(Number.isFinite)).toBe(true);
        expect(
          Array.from(attachment.sequence.getUVs(attachment.sequence.resolveIndex(slot.appliedPose))).every(
            Number.isFinite,
          ),
        ).toBe(true);
        count++;
      }
    }
    expect(count).toBeGreaterThan(0);
    const offset = new Vector2(),
      size = new Vector2();
    skeleton.getBounds(offset, size);
    expect([offset.x, offset.y, size.x, size.y].every(Number.isFinite)).toBe(true);
    expect(size.x).toBeGreaterThan(0);
    expect(size.y).toBeGreaterThan(0);
  });
});
it("separates constrained slot and draw-order poses from animation poses", () => {
  const data = new SkeletonJson(loader()).readSkeletonData(readFileSync(asset("spineboy-pro.json"), "utf8"));
  const skeleton = new Skeleton(data);
  const slot = skeleton.slots.find((slot) => slot.pose.attachment != null)!;
  const originalAttachment = slot.pose.attachment;
  slot.constrained();
  slot.resetConstrained();
  slot.appliedPose.setAttachment(null);
  expect(slot.pose.attachment).toBe(originalAttachment);
  expect(slot.appliedPose.attachment).toBeNull();
  slot.unconstrained();
  expect(slot.appliedPose.attachment).toBe(originalAttachment);

  const order = skeleton.drawOrder;
  const first = order.pose[0];
  order.constrained();
  order.resetConstrained();
  order.appliedPose.reverse();
  expect(order.pose[0]).toBe(first);
  expect(order.appliedPose[0]).not.toBe(first);
  order.unconstrained();
  expect(order.appliedPose[0]).toBe(first);
});
