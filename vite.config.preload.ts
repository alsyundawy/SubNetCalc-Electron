import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  build: {
    target: "node20",
    outDir: "dist-electron/preload",
    emptyOutDir: true,
    ssr: true,
    lib: {
      entry: "src/preload/index.ts",
      formats: ["cjs"],
      fileName: () => "index.cjs",
    },
    rollupOptions: {
      external: ["electron"],
    },
  },
  resolve: {
    alias: {
      "@engine": path.resolve(__dirname, "src/engine"),
    },
  },
});
