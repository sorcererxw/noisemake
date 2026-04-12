import { describe, expect, it } from "vitest";
import { noisemake } from "../../src/index.js";

const SAMPLE =
  "这个方案需要稳定实现，this parser should stay stable and predictable. " +
  "后面可以开发一个网页版部署在 Cloudflare。";

describe("noisemake", () => {
  it("is deterministic with a seed", () => {
    expect(
      noisemake(SAMPLE, {
        frequency: 2,
        seed: "baseline",
        types: ["typo", "repeat"],
        languages: ["zh", "en"],
      }),
    ).toBe(
      noisemake(SAMPLE, {
        frequency: 2,
        seed: "baseline",
        types: ["typo", "repeat"],
        languages: ["zh", "en"],
      }),
    );
  });

  it("can produce changes across fixed seeds", () => {
    const outputs = new Set(
      ["a", "b", "c", "d", "e"].map((seed) =>
        noisemake(SAMPLE.repeat(20), {
          frequency: 3,
          seed,
          types: ["typo", "repeat"],
          languages: ["zh", "en"],
        }),
      ),
    );

    expect(outputs.size).toBeGreaterThan(1);
  });

  it("respects language filters", () => {
    const zhOnly = noisemake("稳定 stable", {
      frequency: 1,
      seed: "language",
      types: ["typo"],
      languages: ["zh"],
    });
    const enOnly = noisemake("稳定 stable", {
      frequency: 1,
      seed: "language",
      types: ["typo"],
      languages: ["en"],
    });

    expect(zhOnly.includes("stable")).toBe(true);
    expect(enOnly.includes("稳定")).toBe(true);
  });

  it("can return unchanged text for very low noise", () => {
    expect(
      noisemake("短文本", {
        frequency: 1000,
        seed: "low-noise",
      }),
    ).toBe("短文本");
  });
});
