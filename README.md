# spinek

TypeScript port of the **Spine 4.3** runtime, with a standalone core, WebGL and Canvas 2D renderers, and native [ek3d](https://github.com/eliasku/ek3d) integration. Loads Spine Editor 4.3 JSON and binary exports with texture atlases. No Three.js dependency.

## Installation

## Usage

Import individual modules without a file extension. There is no root entry point or barrel export:

```ts
import { AnimationState } from "spinek/core/AnimationState";
import { SkeletonJson } from "spinek/core/SkeletonJson";
import { SkeletonBinary } from "spinek/core/SkeletonBinary";
import { SceneRenderer } from "spinek/webgl/SceneRenderer";
import { SkeletonRenderer } from "spinek/canvas/SkeletonRenderer";
```

See the complete examples for asset loading, animation updates, rendering and resource disposal:

| Renderer  | Example                           | Notes                                                                                                                      |
| --------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| WebGL     | [webgl.ts](./examples/webgl.ts)   | Binary skeleton, GPU batching, two-color tint and clipping.                                                                |
| Canvas 2D | [canvas.ts](./examples/canvas.ts) | JSON skeleton. Set `renderer.triangleRendering = true` for meshes and clipping; the default image mode only draws regions. |
| ek3d      | [ek3d.ts](./examples/ek3d.ts)     | JSON skeleton rendered by `SkeletonMesh` in an ek3d scene. Import it from `spinek/ek3d/SkeletonMesh`.                      |

- Canvas does not support RGB or two-color tint. Blending on transparent backgrounds can differ from WebGL.
- Animation update deltas are in seconds.
- Enums are `const enum`: use `Enum.Member`, not runtime reflection such as `Object.values(Enum)`.
- Core skeleton and animation logic works without a DOM. The examples and browser asset loaders require a browser.

## Run the examples

Requires Node.js `^22.18.0 || ^24.11.0 || >=26.0.0` and npm. In the repository directory:

```sh
npm install
npm run dev
```

Open the local URL printed by the dev server. The landing page links to all three examples, with animation selection and pause/resume controls.

```sh
npm run build    # Build the static example site into dist/
npm run preview  # Serve the built site
npm run check    # Type checking, tests and example site build
```

The npm package does not include the examples or their assets; use the repository to run them.

## License

The runtime and bundled Spineboy example assets are covered by the [Spine Runtimes License Agreement](./LICENSE). See it for Spine Editor licensing requirements and redistribution obligations. The example asset license is also included in [public/assets/LICENSE](./public/assets/LICENSE).
