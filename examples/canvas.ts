import {
  AnimationState,
  AnimationStateData,
  AssetManager,
  Physics,
  Skeleton,
  SkeletonRenderer,
} from "spinek/canvas";
import { canvas, loadSkeletonData, runExample, showError } from "./common.js";

try {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is not available in this browser.");
  const assets = new AssetManager("../assets/");
  try {
    const skeleton = new Skeleton(await loadSkeletonData(assets));
    const state = new AnimationState(new AnimationStateData(skeleton.data));
    const renderer = new SkeletonRenderer(context);
    renderer.triangleRendering = true;
    runExample(state, (delta) => {
      state.update(delta);
      state.apply(skeleton);
      skeleton.update(delta);
      skeleton.updateWorldTransform(Physics.update);
      const width = Math.round(canvas.clientWidth * devicePixelRatio);
      const height = Math.round(canvas.clientHeight * devicePixelRatio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#12171f";
      context.fillRect(0, 0, width, height);
      const scale = Math.min(width / 1000, height / 850);
      context.setTransform(scale, 0, 0, -scale, width / 2, height / 2 + 350 * scale);
      renderer.draw(skeleton);
    }, () => assets.dispose());
  } catch (error) {
    assets.dispose();
    throw error;
  }
} catch (error) {
  showError(error);
}
