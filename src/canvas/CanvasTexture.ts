import { Texture, type TextureFilter, type TextureWrap } from "../core/Texture.js";

export class CanvasTexture extends Texture {
  constructor(image: HTMLImageElement | ImageBitmap) {
    super(image);
  }

  setFilters(minFilter: TextureFilter, magFilter: TextureFilter) {}
  setWraps(uWrap: TextureWrap, vWrap: TextureWrap) {}
  dispose() {}
}
