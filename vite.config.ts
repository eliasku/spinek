import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

const source = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: "spinek/webgl", replacement: source("./src/webgl/index.ts") },
      { find: "spinek/canvas", replacement: source("./src/canvas/index.ts") },
      { find: "spinek/ek3d", replacement: source("./src/ek3d/index.ts") },
      { find: "spinek", replacement: source("./src/index.ts") },
    ],
  },
  pack: {
    entry: {
      index: "src/index.ts",
      webgl: "src/webgl/index.ts",
      canvas: "src/canvas/index.ts",
      ek3d: "src/ek3d/index.ts",
    },
    format: "esm",
    target: "es2022",
    dts: true,
    sourcemap: true,
    platform: "neutral",
  },
  build: {
    outDir: "dist-examples",
    rolldownOptions: {
      input: ["index.html", "examples/webgl.html", "examples/canvas.html", "examples/ek3d.html"],
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  lint: {
    ignorePatterns: ["upstream/**", "dist/**", "dist-examples/**", "public/**"],
  },
  fmt: {
    ignorePatterns: ["upstream/**", "dist/**", "dist-examples/**", "public/**", "package-lock.json"],
  },
});
