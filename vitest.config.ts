import { defineConfig } from "vitest/config";
import path from "node:path";
import os from "node:os";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      DB_FILE: path.join(os.tmpdir(), `gadget-hub-test-${process.pid}.json`),
      STORE_BACKEND: "json"
    }
  }
});