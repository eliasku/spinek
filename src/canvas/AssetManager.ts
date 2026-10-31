import { AssetManagerBase, Downloader } from "../core/AssetManagerBase.js";
import { CanvasTexture } from "./CanvasTexture.js";

export class AssetManager extends AssetManagerBase {
	constructor (pathPrefix: string = "", downloader: Downloader = new Downloader()) {
		super((image: HTMLImageElement | ImageBitmap) => { return new CanvasTexture(image); }, pathPrefix, downloader);
	}
}
