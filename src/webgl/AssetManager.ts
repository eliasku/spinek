import { AssetManagerBase, Downloader } from "../core/AssetManagerBase";
import { GLTexture } from "./GLTexture";
import type { ManagedWebGLRenderingContext } from "./WebGL";

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
