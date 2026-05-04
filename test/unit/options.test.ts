import { describe, expect, it } from "vitest";
import { normalizeOptions } from "../../src/options.js";

describe("normalizeOptions", () => {
  it("applies defaults", () => {
    const options = normalizeOptions();

    expect(options.frequency).toBe(200);
    expect([...options.types]).toEqual(["typo", "repeat", "spacing", "punct", "swap"]);
    expect([...options.languages]).toEqual(["zh", "en"]);
  });

  it("dedupes types and languages", () => {
    const options = normalizeOptions({
      types: ["typo", "typo", "repeat"],
      languages: ["zh", "zh", "en"],
    });

    expect([...options.types]).toEqual(["typo", "repeat"]);
    expect([...options.languages]).toEqual(["zh", "en"]);
  });

  it("biases default noise toward typo over repeat", () => {
    const options = normalizeOptions();

    expect(options.typeMultipliers.typo).toBeGreaterThan(
      options.typeMultipliers.repeat,
    );
    expect(options.typeMultipliers.repeat).toBeLessThanOrEqual(0.05);
    expect(options.typeMultipliers.spacing).toBeGreaterThan(
      options.typeMultipliers.repeat,
    );
    expect(options.typeMultipliers.punct).toBeGreaterThan(
      options.typeMultipliers.repeat,
    );
    expect(options.typeMultipliers.swap).toBeGreaterThan(
      options.typeMultipliers.repeat,
    );
  });

  it("rejects invalid frequency", () => {
    expect(() => normalizeOptions({ frequency: 0 })).toThrow(RangeError);
    expect(() => normalizeOptions({ frequency: 1.5 })).toThrow(RangeError);
    expect(() => normalizeOptions({ frequency: Number.NaN })).toThrow(RangeError);
  });

  it("rejects invalid types and languages", () => {
    expect(() => normalizeOptions({ types: [] })).toThrow(TypeError);
    expect(() => normalizeOptions({ types: ["filler" as "typo"] })).toThrow(
      TypeError,
    );
    expect(() => normalizeOptions({ languages: [] })).toThrow(TypeError);
    expect(() => normalizeOptions({ languages: ["ja" as "zh"] })).toThrow(
      TypeError,
    );
  });
});
