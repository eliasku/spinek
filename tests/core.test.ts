import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { AnimationState } from "spinek/core/AnimationState";
import { AnimationStateData } from "spinek/core/AnimationStateData";
import { AssetCache, AssetManagerBase } from "spinek/core/AssetManagerBase";
import { AtlasAttachmentLoader } from "spinek/core/AtlasAttachmentLoader";
import { MeshAttachment } from "spinek/core/attachments/MeshAttachment";
import { RegionAttachment } from "spinek/core/attachments/RegionAttachment";
import { Physics } from "spinek/core/Physics";
import { Skeleton } from "spinek/core/Skeleton";
import { SkeletonBinary } from "spinek/core/SkeletonBinary";
import { SkeletonJson } from "spinek/core/SkeletonJson";
import { FakeTexture } from "spinek/core/Texture";
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
