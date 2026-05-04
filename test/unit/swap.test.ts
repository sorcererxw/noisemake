import { describe, expect, it } from "vitest";
import { buildSwapCandidates, materializeSwap } from "../../src/swap.js";

describe("swap", () => {
  it("builds adjacent English word swap candidates", () => {
    const candidates = buildSwapCandidates(
      "this parser should stay stable",
      new Set(["en"]),
    );

    expect(candidates).toHaveLength(4);
    expect(candidates[0]).toMatchObject({
      type: "swap",
      firstToken: "this",
      secondToken: "parser",
      separator: " ",
    });
    expect(materializeSwap(candidates[0]!).replacement).toBe("parser this");
  });

  it("builds adjacent Chinese word swap candidates", () => {
    const candidates = buildSwapCandidates("这个方案可以先做", new Set(["zh"]));

    expect(candidates.length).toBeGreaterThan(0);
    expect(materializeSwap(candidates[0]!).replacement).toBe(
      `${candidates[0]!.secondToken}${candidates[0]!.separator}${candidates[0]!.firstToken}`,
    );
  });

  it("does not swap across punctuation or disabled languages", () => {
    expect(buildSwapCandidates("this, parser", new Set(["en"]))).toHaveLength(0);
    expect(buildSwapCandidates("稳定 stable", new Set(["zh"]))).toHaveLength(0);
    expect(buildSwapCandidates("稳定 stable", new Set(["en"]))).toHaveLength(0);
  });
});
