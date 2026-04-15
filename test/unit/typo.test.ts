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
      expect.arrayContaining(["声称"]),
    );
    expect(replacementsBySource.get("前端")).toEqual(["前段"]);
    expect(replacementsBySource.get("尝试")).toEqual(
      expect.arrayContaining(["常识"]),
    );
    expect(replacementsBySource.get("分期")).toEqual(
      expect.arrayContaining(["分歧"]),
    );
    expect(replacementsBySource.get("价值")?.length).toBeGreaterThan(0);
  });

  it("does not build single-character stitched non-word Chinese replacements", () => {
    const text =
      "这个工具用于构造评测样本，帮助我们观察模型在轻微文本扰动下是否仍然稳定。";
    const candidates = buildZhImeTypoCandidates(Array.from(text));
    const replacements = candidates.flatMap((candidate) =>
      candidate.replacements.map((replacement) => replacement.text),
    );

    expect(replacements).not.toEqual(
      expect.arrayContaining(["这歌", "构早", "样苯", "帮猪", "观差"]),
    );
  });

  it("builds English keyboard candidates for content words with length >= 4", () => {
    const candidates = buildEnKeyboardTypoCandidates(
      Array.from("to stable CLI seven parser"),
    );

    expect(candidates.map((candidate) => candidate.token)).toEqual([
      "stable",
      "parser",
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

  it("keeps English typo edits away from the first and last character", () => {
    const [candidate] = buildEnKeyboardTypoCandidates(Array.from("stable"));

    expect(candidate).toBeDefined();

    for (const seed of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      const mutation = materializeTypo(candidate!, createRng(seed));
      expect(mutation.replacement[0]).toBe("s");
      expect(mutation.replacement.at(-1)).toBe("e");
    }
  });

  it("supports deterministic internal insertion for English typo materialization", () => {
    const [candidate] = buildEnKeyboardTypoCandidates(Array.from("stable"));

    expect(candidate).toBeDefined();

    let nextCalls = 0;
    const rng = {
      next: () => {
        nextCalls += 1;
        return 0.7;
      },
      int: () => 0,
      pick: <T>(values: readonly T[]) => values[0] as T,
      pickWeighted: <T>(values: readonly T[], weightOf: (value: T) => number) => {
        let cursor = 0.7 * values.reduce((sum, value) => sum + weightOf(value), 0);

        for (const value of values) {
          cursor -= weightOf(value);

          if (cursor < 0) {
            return value;
          }
        }

        return values[values.length - 1] as T;
      },
    };

    const mutation = materializeTypo(candidate!, rng);

    expect(nextCalls).toBe(1);
    expect(mutation.replacement).not.toBe("stable");
    expect(mutation.replacement[0]).toBe("s");
    expect(mutation.replacement.at(-1)).toBe("e");
    expect(Array.from(mutation.replacement)).toHaveLength(7);
  });

  it("uses Chinese replacement scores for deterministic weighted selection", () => {
    const candidate = {
      type: "typo" as const,
      subtype: "zh-ime" as const,
      start: 0,
      end: 2,
      weight: 1,
      replacements: [
        { text: "低分", reason: "homophone" as const, score: 0.1 },
        { text: "高分", reason: "homophone" as const, score: 0.9 },
      ],
    };
    const rng = {
      next: () => 0.8,
      int: () => 0,
      pick: <T>(values: readonly T[]) => values[0] as T,
      pickWeighted: <T>(values: readonly T[], weightOf: (value: T) => number) => {
        let cursor = 0.8 * values.reduce((sum, value) => sum + weightOf(value), 0);

        for (const value of values) {
          cursor -= weightOf(value);

          if (cursor < 0) {
            return value;
          }
        }

        return values[values.length - 1] as T;
      },
    };

    expect(materializeTypo(candidate, rng).replacement).toBe("高分");
  });
});
