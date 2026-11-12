import type { AttachmentLoader } from "./attachments/AttachmentLoader.js";
import { BoundingBoxAttachment } from "./attachments/BoundingBoxAttachment.js";
import { ClippingAttachment } from "./attachments/ClippingAttachment.js";
import { MeshAttachment } from "./attachments/MeshAttachment.js";
import { PathAttachment } from "./attachments/PathAttachment.js";
import { PointAttachment } from "./attachments/PointAttachment.js";
import { RegionAttachment } from "./attachments/RegionAttachment.js";
import type { Sequence } from "./attachments/Sequence.js";
import type { Skin } from "./Skin.js";
import type { TextureAtlas } from "./TextureAtlas.js";

/** An {@link AttachmentLoader} that configures attachments using texture regions from an {@link TextureAtlas}.
 *
 * See [Loading skeleton data](http://esotericsoftware.com/spine-loading-skeleton-data#JSON-and-binary-data) in the
 * Spine Runtimes Guide. */
export class AtlasAttachmentLoader implements AttachmentLoader {
  atlas: TextureAtlas;
  allowMissingRegions: boolean;

  constructor(atlas: TextureAtlas, allowMissingRegions = false) {
    this.atlas = atlas;
    this.allowMissingRegions = allowMissingRegions;
  }

  /** Sets each {@link Sequence.regions} by calling {@link findRegion} for each texture region using
   * {@link Sequence.getPath}. */
  protected findRegions(name: string, basePath: string, sequence: Sequence) {
    const regions = sequence.regions;
    for (let i = 0, n = regions.length; i < n; i++) regions[i] = this.findRegion(name, sequence.getPath(basePath, i));
  }

  /** Looks for the region with the specified path. If not found and {@link allowMissingRegions} is false, an error is
   * raised. */
  protected findRegion(name: string, path: string) {
    const region = this.atlas.findRegion(path);
    if (!region && !this.allowMissingRegions)
      throw new Error(`Region not found in atlas: ${path} (attachment: ${name})`);
    return region;
  }

  newRegionAttachment(
    skin: Skin,
    placeholder: string,
    name: string,
    path: string,
    sequence: Sequence,
  ): RegionAttachment {
    this.findRegions(name, path, sequence);
    return new RegionAttachment(name, sequence);
  }

  newMeshAttachment(skin: Skin, placeholder: string, name: string, path: string, sequence: Sequence): MeshAttachment {
    this.findRegions(name, path, sequence);
    return new MeshAttachment(name, sequence);
  }

  newBoundingBoxAttachment(skin: Skin, placeholder: string, name: string): BoundingBoxAttachment {
    return new BoundingBoxAttachment(name);
  }

  newPathAttachment(skin: Skin, placeholder: string, name: string): PathAttachment {
    return new PathAttachment(name);
  }

  newPointAttachment(skin: Skin, placeholder: string, name: string): PointAttachment {
    return new PointAttachment(name);
  }

  newClippingAttachment(skin: Skin, placeholder: string, name: string): ClippingAttachment {
    return new ClippingAttachment(name);
  }
}
