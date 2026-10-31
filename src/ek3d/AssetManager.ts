import { AssetManagerBase, Downloader } from "../core/AssetManagerBase.js";
import { Ek3dTexture } from "./Ek3dTexture.js";

export class AssetManager extends AssetManagerBase {
  constructor(pathPrefix = "", downloader = new Downloader()) {
    super((image: HTMLImageElement | ImageBitmap, pma = false) => new Ek3dTexture(image, pma), pathPrefix, downloader);
  }
}
