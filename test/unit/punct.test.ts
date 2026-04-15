import { describe, expect, it } from "vitest";
import { buildPunctCandidates, materializePunct } from "../../src/punct.js";

describe("punct", () => {
  it("does not build ASCII punctuation swap candidates", () => {
    const candidates = buildPunctCandidates(Array.from("hello, world!"), new Set(["en"]));

    expect(candidates).toEqual([]);
  });

  it("builds full-width punctuation swap candidates when Chinese is enabled", () => {
    const candidates = buildPunctCandidates(Array.from("你好，世界。"), new Set(["zh"]));

    expect(candidates).toEqual([
      {
        type: "punct",
        start: 2,
        end: 3,
        replacement: ",",
        weight: 1,
      },
      {
        type: "punct",
        start: 5,
        end: 6,
        replacement: ".",
        weight: 1,
      },
    ]);
  });

  it("materializes punctuation mutations without randomness", () => {
    const [candidate] = buildPunctCandidates(Array.from("你好，世界。"), new Set(["zh"]));

    expect(materializePunct(candidate!)).toEqual({
      type: "punct",
      start: 2,
      end: 3,
      replacement: ",",
    });
  });
});
