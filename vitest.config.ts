import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Тесты — чистая логика, DOM не нужен (jsdom несовместим с Node 20.8.1).
    environment: "node",
  },
});
