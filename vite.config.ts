import { defineConfig } from "vite-plus";

export default defineConfig({
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
