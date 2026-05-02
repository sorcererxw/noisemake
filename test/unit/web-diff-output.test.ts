import { describe, expect, it } from "vitest";

import { diffOutput } from "../../web/src/lib/diff-output.js";

describe("web diffOutput", () => {
  it("returns an unchanged segment for identical text", () => {
    expect(diffOutput("same text", "same text")).toEqual([
      { text: "same text", changed: false },
    ]);
  });

  it("does not highlight an entire long output when sparse typo edits are far apart", () => {
    const input = Array.from({ length: 220 }, (_, index) => `word${index}`)
      .join(" ");
    const output = input
      .replace("word2", "wprd2")
      .replace("word180", "wrod180");

    const segments = diffOutput(input, output);
    const changedText = segments
      .filter((segment) => segment.changed)
      .map((segment) => segment.text)
      .join("");

    expect(segments.map((segment) => segment.text).join("")).toBe(output);
    expect(changedText.length).toBeLessThan(20);
    expect(changedText).toContain("p");
    expect(changedText).toContain("r");
  });

  it("keeps inserted output text local", () => {
    const input = "The quick brown fox jumps over the lazy dog.";
    const output = "The qquick brown fox jumps over the lazy dog.";
    const segments = diffOutput(input, output);
    const changedText = segments
      .filter((segment) => segment.changed)
      .map((segment) => segment.text)
      .join("");

    expect(segments.map((segment) => segment.text).join("")).toBe(output);
    expect(changedText).toBe("q");
  });
});
