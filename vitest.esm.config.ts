import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "ESM Tests",
    alias: {
      "@sibipro/checkout-link": "./dist/esm/index.js",
    },
  },
});
