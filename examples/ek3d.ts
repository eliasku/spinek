import { OrthographicCamera } from "ek3d/cameras/OrthographicCamera";
import { WebGLRenderer } from "ek3d/renderers/WebGLRenderer";
import { basicShader } from "ek3d/renderers/shaders/BasicShader";
import { Scene } from "ek3d/scenes/Scene";
import { AssetManager } from "spinek/ek3d/AssetManager";
import { SkeletonMesh } from "spinek/ek3d/SkeletonMesh";
import { canvas, loadSkeletonData, runExample, showError } from "./common.js";

try {
  const renderer = new WebGLRenderer({ canvas, antialias: true, shaders: { MeshBasicMaterial: basicShader } });
  renderer.setClearColor(0x12171f, 1);
  renderer.setPixelRatio(devicePixelRatio);
  const scene = new Scene();
  const camera = new OrthographicCamera(-500, 500, 775, -75, 0.1, 1000);
  camera.position.z = 100;
  const assets = new AssetManager("../assets/");
  try {
    const mesh = new SkeletonMesh({ skeletonData: await loadSkeletonData(assets) });
    scene.add(mesh);
    runExample(
      mesh.state,
      (delta) => {
        mesh.update(delta);
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        renderer.setSize(width, height, false);
        const scale = Math.min(width / 1000, height / 850);
        camera.left = -width / scale / 2;
        camera.right = width / scale / 2;
        camera.top = 350 + height / scale / 2;
        camera.bottom = 350 - height / scale / 2;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      },
      () => {
        mesh.dispose();
        assets.dispose();
        renderer.dispose();
      },
    );
  } catch (error) {
    assets.dispose();
    renderer.dispose();
    throw error;
  }
} catch (error) {
  showError(error);
}
