import { describe, expect, it } from "vitest";
import {
  buildEnKeyboardTypoCandidates,
  buildZhImeTypoCandidates,
  materializeTypo,
} from "../../src/typo.js";
import { createRng } from "../../src/rng.js";
import { ZH_IME_CONFUSIONS } from "../../src/data/zh-ime-confusions.generated.js";

describe("typo", () => {
  it("builds Chinese IME candidates with longest matches", () => {
    const source = Object.keys(ZH_IME_CONFUSIONS)[0]!;
    const candidates = buildZhImeTypoCandidates(Array.from(`前缀${source}后缀`));

    expect(candidates.some((candidate) => candidate.subtype === "zh-ime")).toBe(
      true,
    );
    expect(
      candidates.some(
        (candidate) =>
          candidate.start === 2 && candidate.end === 2 + Array.from(source).length,
      ),
    ).toBe(true);
  });

  it("builds English keyboard candidates for words with length >= 3", () => {
    const candidates = buildEnKeyboardTypoCandidates(Array.from("to stable CLI"));

    expect(candidates.map((candidate) => candidate.token)).toEqual([
      "stable",
      "CLI",
    ]);
  });

  it("materializes English typo deterministically with the same seed", () => {
    const [candidate] = buildEnKeyboardTypoCandidates(Array.from("stable"));

    expect(candidate).toBeDefined();

    const left = materializeTypo(candidate!, createRng("seed"));
    const right = materializeTypo(candidate!, createRng("seed"));

    expect(left).toEqual(right);
    expect(left.replacement).not.toBe("stable");
  });
});
