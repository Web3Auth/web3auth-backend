import { createRequire } from "node:module";

import replace from "@rollup/plugin-replace";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

// Replaces the `__WEB3AUTH_SDK_VERSION__` build-time constant (declared in src/analytics.ts)
// with the package version, so the SDK doesn't need to read package.json at runtime.
export const baseConfig = {
  plugins: [
    replace({
      preventAssignment: true,
      values: {
        __WEB3AUTH_SDK_VERSION__: JSON.stringify(pkg.version),
      },
    }),
  ],
};
