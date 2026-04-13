import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    fixedExtension: false,
    sourcemap: true,
    target: "node22",
  },
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    dts: false,
    clean: false,
    fixedExtension: false,
    sourcemap: true,
    target: "node22",
  },
]);
