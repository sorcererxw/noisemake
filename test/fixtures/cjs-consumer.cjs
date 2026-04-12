const { noisemake } = require("../../dist/index.cjs");

const output = noisemake("稳定 stable", {
  frequency: 1000,
  seed: "cjs",
});

if (typeof output !== "string") {
  throw new Error("expected string output");
}

console.log("cjs-ok");
