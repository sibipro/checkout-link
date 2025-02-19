import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "CJS Tests",
    alias: {
      "@sibipro/checkout-link": "./dist/cjs/index.js",
    },
  },
});
