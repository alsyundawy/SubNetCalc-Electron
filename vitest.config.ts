import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.{test,spec}.ts"],
  },
  resolve: {
    alias: {
      "@engine": path.resolve(__dirname, "src/engine"),
    },
  },
});
