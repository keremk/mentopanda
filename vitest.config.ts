/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node", // Use node environment for real network operations
    setupFiles: ["./src/tests/setup.ts"],
  },
});
