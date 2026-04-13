import { describe, expect, it } from "vitest";
import { QWERTY_ADJACENT } from "../../src/data/en-keyboard.js";
import {
  MAX_ZH_IME_SOURCE_LENGTH,
  ZH_IME_CONFUSIONS,
} from "../../src/data/zh-ime-confusions.generated.js";

describe("data", () => {
  it("keeps QWERTY adjacency map well shaped", () => {
    const letters = "abcdefghijklmnopqrstuvwxyz";

    for (const letter of letters) {
      const replacements = QWERTY_ADJACENT[letter];

      expect(replacements?.length).toBeGreaterThan(0);
      expect(replacements).not.toContain(letter);

      for (const replacement of replacements ?? []) {
        expect(replacement).toMatch(/^[a-z]$/u);
      }
    }
  });

  it("keeps Chinese IME confusion map well shaped", () => {
    expect(MAX_ZH_IME_SOURCE_LENGTH).toBeGreaterThanOrEqual(2);

    for (const [source, replacements] of Object.entries(ZH_IME_CONFUSIONS)) {
      expect(Array.from(source).length).toBeGreaterThanOrEqual(2);
      expect(replacements.length).toBeGreaterThan(0);

      for (const replacement of replacements) {
        expect(replacement.text).not.toBe(source);
        expect(Array.from(replacement.text).length).toBeGreaterThanOrEqual(2);
        expect(replacement.score).toBeGreaterThanOrEqual(0.75);
      }
    }
  }, 15_000);
});
