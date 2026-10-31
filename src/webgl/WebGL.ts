import { type Disposable, type Restorable } from "../core/Utils.js";

export class ManagedWebGLRenderingContext implements Disposable, Restorable {
	public canvas: HTMLCanvasElement | OffscreenCanvas;
	public gl: WebGLRenderingContext;
	private restorables = [] as Restorable[];

	constructor (canvasOrContext: HTMLCanvasElement | WebGLRenderingContext, contextConfig: WebGLContextAttributes = { alpha: true }) {
		if (!((canvasOrContext instanceof WebGLRenderingContext) || (typeof WebGL2RenderingContext !== 'undefined' && canvasOrContext instanceof WebGL2RenderingContext))) {
			const canvas: HTMLCanvasElement = canvasOrContext;
			this.gl = <WebGLRenderingContext>(canvas.getContext("webgl2", contextConfig) || canvas.getContext("webgl", contextConfig));
			this.canvas = canvas;
			canvas.addEventListener("webglcontextlost", this.contextLostHandler);
			canvas.addEventListener("webglcontextrestored", this.contextRestoredHandler);
		} else {
			this.gl = canvasOrContext;
			this.canvas = this.gl.canvas;
		}
	}

	private contextLostHandler = (e: Event) => {
		if (e) e.preventDefault();
	}

	private contextRestoredHandler = () => {
		this.restore();
	}

	restore (): void {
		for (let i = 0, n = this.restorables.length; i < n; i++)
			this.restorables[i].restore();
	}

	dispose (): void {
		this.canvas.removeEventListener("webglcontextlost", this.contextLostHandler);
		this.canvas.removeEventListener("webglcontextrestored", this.contextRestoredHandler);
	}

	addRestorable (restorable: Restorable) {
		this.restorables.push(restorable);
	}

	removeRestorable (restorable: Restorable) {
		const index = this.restorables.indexOf(restorable);
		if (index > -1) this.restorables.splice(index, 1);
	}

}
