import {
  AnimationState,
  AnimationStateData,
  AssetManager,
  ManagedWebGLRenderingContext,
  Physics,
  ResizeMode,
  SceneRenderer,
  Skeleton,
} from "spinek/webgl";
import { canvas, loadSkeletonData, runExample, showError } from "./common.js";

try {
  const context = new ManagedWebGLRenderingContext(canvas, { alpha: false });
  if (!context.gl) throw new Error("WebGL is not available in this browser.");
  const renderer = new SceneRenderer(canvas, context);
  const assets = new AssetManager(context, "../assets/");
  try {
    const skeleton = new Skeleton(await loadSkeletonData(assets, true));
    const state = new AnimationState(new AnimationStateData(skeleton.data));
    renderer.camera.position.set(0, 350, 0);
    runExample(state, (delta) => {
      state.update(delta);
      state.apply(skeleton);
      skeleton.update(delta);
      skeleton.updateWorldTransform(Physics.update);
      renderer.camera.setViewport(1000, 850);
      renderer.resize(ResizeMode.Fit);
      context.gl.clearColor(0.07, 0.09, 0.12, 1);
      context.gl.clear(context.gl.COLOR_BUFFER_BIT);
      renderer.begin();
      renderer.drawSkeleton(skeleton);
      renderer.end();
    }, () => {
      assets.dispose();
      renderer.dispose();
      context.dispose();
    });
  } catch (error) {
    assets.dispose();
    renderer.dispose();
    context.dispose();
    throw error;
  }
} catch (error) {
  showError(error);
}
