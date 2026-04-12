import { describe, expect, it } from "vitest";
import {
  buildEnRepeatCandidates,
  buildZhRepeatCandidates,
  materializeRepeat,
} from "../../src/repeat.js";

describe("repeat", () => {
  it("builds Chinese repeat candidates from Intl.Segmenter tokens", () => {
    const candidates = buildZhRepeatCandidates("这个方案可以先做 CLI");

    expect(candidates.map((candidate) => candidate.token)).toContain("这个");
    expect(candidates.map((candidate) => candidate.token)).toContain("方案");
  });

  it("builds English repeat candidates from word tokens", () => {
    const candidates = buildEnRepeatCandidates("this is stable");

    expect(candidates.map((candidate) => candidate.token)).toContain("stable");
  });

  it("materializes Chinese and English repeats with the right separator", () => {
    const [zh] = buildZhRepeatCandidates("这个方案");
    const [en] = buildEnRepeatCandidates("stable");

    expect(materializeRepeat(zh!).replacement).toBe(`${zh!.token}${zh!.token}`);
    expect(materializeRepeat(en!).replacement).toBe("stable stable");
  });
});
