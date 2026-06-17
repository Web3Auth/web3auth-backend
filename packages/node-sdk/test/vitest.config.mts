import { readFileSync } from "node:fs";

import dotenv from "dotenv";
import { defineConfig } from "vitest/config";

dotenv.config({ path: `.env.test` });

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

export default defineConfig({
  define: {
    __WEB3AUTH_SDK_VERSION__: JSON.stringify(pkg.version),
  },
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
