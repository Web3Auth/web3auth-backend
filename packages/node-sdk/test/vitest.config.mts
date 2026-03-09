import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: "verbose",
    coverage: {
      reporter: ["text"],
      provider: "istanbul",
      include: ["src/**/*.ts"],
    },
    environment: "node",
    testTimeout: 5000,
  },
});
