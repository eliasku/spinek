import { AssetManagerBase, Downloader } from "../core/AssetManagerBase.js";
import { GLTexture } from "./GLTexture.js";
import type { ManagedWebGLRenderingContext } from "./WebGL.js";

export class AssetManager extends AssetManagerBase {
  constructor(
    context: ManagedWebGLRenderingContext | WebGLRenderingContext,
    pathPrefix: string = "",
    downloader: Downloader = new Downloader(),
  ) {
    super(
      (image: HTMLImageElement | ImageBitmap, pma = false) => new GLTexture(context, image, pma),
      pathPrefix,
      downloader,
    );
  }
}
