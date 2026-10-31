import { defineConfig } from "vite-plus";

export default defineConfig(({ command }) => ({
  base: "./",
  build: {
    rolldownOptions: {
      input: ["index.html", "examples/webgl.html", "examples/canvas.html", "examples/ek3d.html"],
    },
    assetsInlineLimit: 0,
    assetsDir: "",
  },
  // Let Rolldown inline const enums across modules; keep per-file transforms in development.
  oxc: command === "build" ? { exclude: /\.ts$/ } : undefined,
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  lint: {
    ignorePatterns: ["upstream/**", "dist/**", "dist-examples/**", "public/**"],
  },
  fmt: {
    ignorePatterns: [
      "upstream/**",
      "dist/**",
      "dist-examples/**",
      "public/**",
      "package-lock.json",
    ],
  },
}));
