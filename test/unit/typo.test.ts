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

  it("preserves curated word-level Chinese fallback replacements", () => {
    const candidates = buildZhImeTypoCandidates(Array.from("动画，电影，票房"));
    const replacements = candidates
      .filter((candidate) => candidate.subtype === "zh-ime")
      .flatMap((candidate) =>
        candidate.replacements.map((replacement) => replacement.text),
      );

    expect(replacements).toContain("童话");
    expect(replacements).toContain("电音");
    expect(replacements).not.toEqual(
      expect.arrayContaining(["点影", "店影", "票芳"]),
    );
  });

  it("builds Chinese typo candidates for modern simplified tool-writing text", () => {
    const text =
      "看到 brew 终于有 Trae 的 cask 了，安装一个试试看。" +
      "之前体验过AI生成生成前端的工具，但是从来没有尝试过生成一个正儿八经的小工具。" +
      "今天试试看用 Trae builder 模式“复刻”了下我的一年前的写的小工具，" +
      "可以用来计算免息分期的实际价值。";
    const candidates = buildZhImeTypoCandidates(Array.from(text));
    const replacementsBySource = new Map(
      candidates.map((candidate) => [
        Array.from(text).slice(candidate.start, candidate.end).join(""),
        candidate.replacements.map((replacement) => replacement.text),
      ]),
    );

    expect(candidates.length).toBeGreaterThanOrEqual(10);
    expect(replacementsBySource.get("生成")).toEqual(
      expect.arrayContaining(["声成"]),
    );
    expect(replacementsBySource.get("工具")).toEqual(
      expect.arrayContaining(["公具"]),
    );
    expect(replacementsBySource.get("计算")).toEqual(
      expect.arrayContaining(["计蒜"]),
    );
    expect(replacementsBySource.get("价值")?.length).toBeGreaterThan(0);
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
