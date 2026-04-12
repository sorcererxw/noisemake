import { noisemake } from "../../dist/index.js";

const output = noisemake("稳定 stable", {
  frequency: 1000,
  seed: "esm",
});

if (typeof output !== "string") {
  throw new Error("expected string output");
}

console.log("esm-ok");
