import { type StringMap, TimeKeeper } from "../core/Utils.js";
import { AssetManager } from "./AssetManager.js";
import { Input } from "./Input.js";
import { SceneRenderer } from "./SceneRenderer.js";
import { ManagedWebGLRenderingContext } from "./WebGL.js";

/** An app running inside a {@link SpineCanvas}. The app life-cycle
 * is as follows:
 *
 * 1. `loadAssets()` is called. The app can queue assets for loading via {@link SpineCanvas.assetManager}.
 * 2. `initialize()` is called when all assets are loaded. The app can setup anything it needs to enter the main application logic.
 * 3. `update()` is called periodically at screen refresh rate. The app can update its state.
 * 4. `render()` is called periodically at screen refresh rate. The app can render its state via {@link SpineCanvas.renderer} or directly via the WebGL context in {@link SpineCanvas.gl}.
 *
 * The `error()` method is called in case the assets could not be loaded. The `dispose()` method is called in case the canvas has been disposed via {@link SpineCanvas.dispose}.
 */
export interface SpineCanvasApp {
  loadAssets?(canvas: SpineCanvas): void;
  initialize?(canvas: SpineCanvas): void;
  update?(canvas: SpineCanvas, delta: number): void;
  render?(canvas: SpineCanvas): void;
  error?(canvas: SpineCanvas, errors: StringMap<string>): void;
  dispose?(canvas: SpineCanvas): void;
}

/** Configuration passed to the {@link SpineCanvas} constructor */
export interface SpineCanvasConfig {
  /* The {@link SpineCanvasApp} to be run in the canvas. */
  app: SpineCanvasApp;
  /* The path prefix to be used by the {@link AssetManager}. */
  pathPrefix?: string;
  /* The WebGL context configuration */
  webglConfig?: WebGLContextAttributes;
}

/** Manages the life-cycle and WebGL context of a {@link SpineCanvasApp}. The app loads
 * assets and initializes itself, then updates and renders its state at the screen refresh rate. */
export class SpineCanvas {
  readonly context: ManagedWebGLRenderingContext;

  /** Tracks the current time, delta, and other time related statistics. */
  readonly time = new TimeKeeper();
  /** The HTML canvas to render to. */
  readonly htmlCanvas: HTMLCanvasElement;
  /** The WebGL rendering context. */
  readonly gl: WebGLRenderingContext;
  /** The scene renderer for easy drawing of skeletons, shapes, and images. */
  readonly renderer: SceneRenderer;
  /** The asset manager to load assets with. */
  readonly assetManager: AssetManager;
  /** The input processor used to listen to mouse, touch, and keyboard events. */
  readonly input: Input;

  private disposed = false;

  /** Constructs a new spine canvas, rendering to the provided HTML canvas. */
  constructor(
    canvas: HTMLCanvasElement,
    private config: SpineCanvasConfig,
  ) {
    if (!config.pathPrefix) config.pathPrefix = "";
    if (!config.app)
      config.app = {
        loadAssets: () => {},
        initialize: () => {},
        update: () => {},
        render: () => {},
        error: () => {},
        dispose: () => {},
      };
    if (!config.webglConfig) config.webglConfig = { alpha: true };

    this.htmlCanvas = canvas;
    this.context = new ManagedWebGLRenderingContext(canvas, config.webglConfig);
    this.renderer = new SceneRenderer(canvas, this.context);
    this.gl = this.context.gl;
    this.assetManager = new AssetManager(this.context, config.pathPrefix);
    this.input = new Input(canvas);

    if (config.app.loadAssets) config.app.loadAssets(this);

    const loop = () => {
      if (this.disposed) return;
      requestAnimationFrame(loop);
      this.time.update();
      if (config.app.update) config.app.update(this, this.time.delta);
      if (config.app.render) config.app.render(this);
    };

    const waitForAssets = () => {
      if (this.disposed) return;
      if (this.assetManager.isLoadingComplete()) {
        if (this.assetManager.hasErrors()) {
          if (config.app.error) config.app.error(this, this.assetManager.getErrors());
        } else {
          if (config.app.initialize) config.app.initialize(this);
          loop();
        }
        return;
      }
      requestAnimationFrame(waitForAssets);
    };
    requestAnimationFrame(waitForAssets);
  }

  /** Clears the canvas with the given color. The color values are given in the range [0,1]. */
  clear(r: number, g: number, b: number, a: number) {
    this.gl.clearColor(r, g, b, a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /** Disposes the app, so the update() and render() functions are no longer called. Calls the dispose() callback.*/
  dispose() {
    if (this.config.app.dispose) this.config.app.dispose(this);
    this.disposed = true;
  }
}
