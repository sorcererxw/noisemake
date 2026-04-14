import { describe, expect, it } from "vitest";
import { createRng, hashSeed } from "../../src/rng.js";

describe("rng", () => {
  it("hashes string and number seeds consistently", () => {
    expect(hashSeed("baseline")).toBe(hashSeed("baseline"));
    expect(hashSeed(42)).toBe(hashSeed(42));
  });

  it("produces repeatable sequences for the same seed", () => {
    const left = createRng("seed");
    const right = createRng("seed");

    expect([left.next(), left.next(), left.next()]).toEqual([
      right.next(),
      right.next(),
      right.next(),
    ]);
  });

  it("can pick from a list", () => {
    const rng = createRng("pick");

    expect(["a", "b", "c"]).toContain(rng.pick(["a", "b", "c"]));
  });

  it("can pick from weighted values deterministically", () => {
    const left = createRng("weighted");
    const right = createRng("weighted");
    const values = [
      { label: "low", weight: 0.1 },
      { label: "high", weight: 0.9 },
    ];

    expect(
      left.pickWeighted(values, (value) => value.weight),
    ).toEqual(right.pickWeighted(values, (value) => value.weight));
  });
});
