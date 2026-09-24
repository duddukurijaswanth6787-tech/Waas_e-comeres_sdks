import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "boutique-sdk": "src/index.ts",
    "sdk-gatekeeper": "src/entries/gatekeeper.ts",
    "sdk-storage": "src/entries/storage.ts",
    "sdk-cms": "src/entries/cms.ts",
    "sdk-billing": "src/entries/billing.ts",
    "sdk-admin": "src/entries/admin.ts",
  },
  format: ["cjs", "esm", "iife"],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  outExtension({ format }) {
    if (format === "iife") return { js: ".min.js" };
    if (format === "esm") return { js: ".mjs" };
    return { js: ".cjs" };
  },
});
