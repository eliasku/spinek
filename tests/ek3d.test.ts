import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vite-plus/test";
import { InterleavedBufferAttribute } from "ek3d/core/InterleavedBufferAttribute";
import { Scene } from "ek3d/scenes/Scene";
import { AtlasAttachmentLoader } from "spinek/core/AtlasAttachmentLoader";
import { SkeletonJson } from "spinek/core/SkeletonJson";
import { TextureAtlas } from "spinek/core/TextureAtlas";
import { Ek3dTexture } from "spinek/ek3d/Ek3dTexture";
import { MeshBatcher } from "spinek/ek3d/MeshBatcher";
import { SkeletonMesh } from "spinek/ek3d/SkeletonMesh";

const asset = (name: string) => new URL(`../public/assets/${name}`, import.meta.url);

describe("ek3d adapter", () => {
  it.each([false, true])("updates geometry and disposes resources (two color: %s)", (twoColorTint) => {
    const atlas = new TextureAtlas(readFileSync(asset("spineboy.atlas"), "utf8"));
    const textures = atlas.pages.map((page) => {
      const texture = new Ek3dTexture({ width: page.width, height: page.height } as HTMLImageElement);
      page.setTexture(texture);
      return texture;
    });
    const data = new SkeletonJson(new AtlasAttachmentLoader(atlas)).readSkeletonData(
      readFileSync(asset("spineboy-pro.json"), "utf8"),
    );
    const mesh = new SkeletonMesh({ skeletonData: data, twoColorTint });
    const scene = new Scene();
    scene.add(mesh);
    mesh.state.setAnimation(0, "walk", true);
    mesh.update(0);
    const batch = mesh.children[0] as MeshBatcher;
    expect(batch).toBeInstanceOf(MeshBatcher);
    expect(batch.geometry.drawRange.count).toBeGreaterThan(0);
    expect(batch.geometry.groups.reduce((count, group) => count + group.count, 0)).toBe(batch.geometry.drawRange.count);
    const index = batch.geometry.getIndex()!;
    const position = batch.geometry.getAttribute("position") as InterleavedBufferAttribute;
    const before = Array.from(position.data.array.slice(0, position.data.stride * 4));
    expect(index.array[0]).toBeLessThan(position.count);
    expect(Boolean(batch.geometry.getAttribute("darkcolor"))).toBe(twoColorTint);
    mesh.update(0.2);
    expect(Array.from(position.data.array.slice(0, position.data.stride * 4))).not.toEqual(before);
    const geometryDispose = vi.spyOn(batch.geometry, "dispose");
    const materialDisposals = batch.material.map((material) => vi.spyOn(material, "dispose"));
    const textureDisposals = textures.map((texture) => vi.spyOn(texture.texture, "dispose"));
    mesh.dispose();
    expect(geometryDispose).toHaveBeenCalledOnce();
    for (const dispose of materialDisposals) expect(dispose).toHaveBeenCalledOnce();
    atlas.dispose();
    for (const dispose of textureDisposals) expect(dispose).toHaveBeenCalledOnce();
  });
});
