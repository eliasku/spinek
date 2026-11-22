# spinek

TypeScript port of the **Spine 4.3** runtime, with a standalone core, WebGL and Canvas 2D renderers, and native [ek3d](https://github.com/eliasku/ek3d) integration. Loads Spine Editor 4.3 JSON and binary exports with texture atlases. No Three.js dependency.

## Installation

```sh
npm install spinek
```

spinek ships TypeScript source. Use a bundler that processes TypeScript dependencies.
The core, WebGL and Canvas 2D modules do not need ek3d. For `spinek/ek3d/*`, install both packages:

```sh
npm install spinek ek3d
```

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

Requires Node.js `^22.22.2 || ^24.15.0 || >=26.0.0` and npm 12.2.2. Vite+ is pinned to 1.7.0. In the repository directory:

```sh
npm ci
npm run dev
```

Open the local URL printed by the dev server. The landing page links to all three examples, with animation selection and pause/resume controls.

```sh
npm run build    # Build the static example site into dist/
npm run preview  # Serve the built site
npm run check    # Lint and type checking
npm run verify   # Checks, tests and example site build
```

The npm package does not include the examples or their assets; use the repository to run them.

Formatting remains a separate `npm run format:check` command; the existing source formatting baseline is not clean.

TypeScript configurations live in `scripts/`: `tsconfig.base.json` provides shared options; `tsconfig.test.json`, `tsconfig.node.json`, and `tsconfig.lib.json` cover Vitest tests, Node.js scripts/configs, and browser library sources/examples. The root `tsconfig.json` only lists project references. `npm run typecheck` runs `tsc -b`, with build metadata stored in `node_modules/.cache/`.

Vite explicitly uses `scripts/tsconfig.lib.json`. Its `ES2025.Float16` types support ek3d's optional `Float16Array` usage without exposing Node.js globals to browser code; the compilation target remains ES2022.

## License

The runtime and bundled Spineboy example assets are covered by the [Spine Runtimes License Agreement](./LICENSE). See it for Spine Editor licensing requirements and redistribution obligations. The example asset license is also included in [public/assets/LICENSE](./public/assets/LICENSE).
