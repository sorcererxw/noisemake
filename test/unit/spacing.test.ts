import { describe, expect, it } from "vitest";
import { buildSpacingCandidates, materializeSpacing } from "../../src/spacing.js";

describe("spacing", () => {
  it("builds double-space candidates for English word boundaries", () => {
    const candidates = buildSpacingCandidates(Array.from("this parser"), new Set(["en"]));

    expect(candidates).toEqual([
      {
        type: "spacing",
        start: 4,
        end: 5,
        replacement: "  ",
        weight: 1,
      },
    ]);
  });

  it("builds mixed-script space-removal candidates only when both languages are enabled", () => {
    const both = buildSpacingCandidates(Array.from("这个 parser"), new Set(["zh", "en"]));
    const zhOnly = buildSpacingCandidates(Array.from("这个 parser"), new Set(["zh"]));

    expect(both).toEqual([
      {
        type: "spacing",
        start: 2,
        end: 3,
        replacement: "",
        weight: 1,
      },
    ]);
    expect(zhOnly).toEqual([]);
  });

  it("builds mixed-script space-insertion candidates when boundaries are collapsed", () => {
    const candidates = buildSpacingCandidates(Array.from("这个parser"), new Set(["zh", "en"]));

    expect(candidates).toEqual([
      {
        type: "spacing",
        start: 2,
        end: 2,
        replacement: " ",
        weight: 1,
      },
    ]);
  });

  it("builds double-space candidates after punctuation", () => {
    const candidates = buildSpacingCandidates(
      Array.from("hello, world"),
      new Set(["en"]),
    );

    expect(candidates).toEqual([
      {
        type: "spacing",
        start: 6,
        end: 7,
        replacement: "  ",
        weight: 1,
      },
    ]);
  });

  it("materializes spacing mutations without randomness", () => {
    const [candidate] = buildSpacingCandidates(Array.from("this parser"), new Set(["en"]));

    expect(materializeSpacing(candidate!)).toEqual({
      type: "spacing",
      start: 4,
      end: 5,
      replacement: "  ",
    });
  });
});
