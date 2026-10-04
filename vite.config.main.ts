import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  build: {
    target: "node20",
    outDir: "dist-electron/main",
    emptyOutDir: true,
    ssr: true,
    lib: {
      entry: "src/main/index.ts",
      formats: ["cjs"],
      fileName: () => "index.cjs",
    },
    rollupOptions: {
      external: ["electron", "maxmind", "node:net", "node:dns", "node:dns/promises", "node:crypto", "node:path", "node:fs", "node:url"],
    },
  },
  resolve: {
    alias: {
      "@engine": path.resolve(__dirname, "src/engine"),
      "@main": path.resolve(__dirname, "src/main"),
    },
  },
});
