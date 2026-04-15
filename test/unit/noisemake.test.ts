import { describe, expect, it } from "vitest";
import { noisemake } from "../../src/index.js";

const SAMPLE =
  "这个方案需要稳定实现，this parser should stay stable and predictable. " +
  "后面可以开发一个网页版部署在 Cloudflare。";

describe("noisemake", () => {
  it("is deterministic with a seed", () => {
    expect(
      noisemake(SAMPLE, {
        frequency: 2,
        seed: "baseline",
        types: ["typo", "repeat"],
        languages: ["zh", "en"],
      }),
    ).toBe(
      noisemake(SAMPLE, {
        frequency: 2,
        seed: "baseline",
        types: ["typo", "repeat"],
        languages: ["zh", "en"],
      }),
    );
  });

  it("can produce changes across fixed seeds", () => {
    const outputs = new Set(
      ["a", "b", "c", "d", "e"].map((seed) =>
        noisemake(SAMPLE.repeat(20), {
          frequency: 3,
          seed,
          types: ["typo", "repeat"],
          languages: ["zh", "en"],
        }),
      ),
    );

    expect(outputs.size).toBeGreaterThan(1);
  });

  it("respects language filters", () => {
    const zhOnly = noisemake("稳定 stable", {
      frequency: 1,
      seed: "language",
      types: ["typo"],
      languages: ["zh"],
    });
    const enOnly = noisemake("稳定 stable", {
      frequency: 1,
      seed: "language",
      types: ["typo"],
      languages: ["en"],
    });

    expect(zhOnly.includes("stable")).toBe(true);
    expect(enOnly.includes("稳定")).toBe(true);
  });

  it("can produce Chinese typo changes for modern simplified paragraphs", () => {
    const text =
      "索尼集团旗下的公司宣布，动画电影已结束上映，全球票房收入达到1179亿日元。" +
      "这部电影在海外多个国家和地区播出，日本国内票房排在史上第2位。";

    expect(
      noisemake(text, {
        frequency: 1,
        seed: "simplified-zh",
        types: ["typo"],
        languages: ["zh"],
      }),
    ).not.toBe(text);
  });

  it("avoids stitched non-word Chinese typos for evaluation sample text", () => {
    const text =
      "这个工具用于构造评测样本，帮助我们观察模型在轻微文本扰动下是否仍然稳定。";

    expect(
      noisemake(text, {
        frequency: 1,
        seed: "0r7ezqx-0qgyra9",
        types: ["typo"],
        languages: ["zh"],
      }),
    ).not.toMatch(/这歌|构早|样苯|帮猪|观差/u);
  });

  it("can return unchanged text for very low noise", () => {
    expect(
      noisemake("短文本", {
        frequency: 1000,
        seed: "low-noise",
      }),
    ).toBe("短文本");
  });

  it("can produce deterministic spacing noise for English text", () => {
    const left = noisemake("this parser should stay stable", {
      frequency: 1,
      seed: "spacing-en",
      types: ["spacing"],
      languages: ["en"],
    });
    const right = noisemake("this parser should stay stable", {
      frequency: 1,
      seed: "spacing-en",
      types: ["spacing"],
      languages: ["en"],
    });

    expect(left).toBe(right);
    expect(left).toContain("  ");
  });

  it("can remove mixed-script spacing when both languages are enabled", () => {
    const text = "这个 parser 这个 parser 这个 parser 这个 parser";

    expect(
      noisemake(text, {
        frequency: 1,
        seed: "spacing-mixed",
        types: ["spacing"],
        languages: ["zh", "en"],
      }),
    ).not.toBe(text);
  });

  it("can insert mixed-script spacing when boundaries are collapsed", () => {
    expect(
      noisemake("这个parser这个parser这个parser这个parser", {
        frequency: 1,
        seed: "seed-0",
        types: ["spacing"],
        languages: ["zh", "en"],
      }),
    ).toContain("这个 parser");
  });

  it("can add extra spacing after punctuation", () => {
    expect(
      noisemake("hello, world. hello, world. hello, world.", {
        frequency: 1,
        seed: "seed-0",
        types: ["spacing"],
        languages: ["en"],
      }),
    ).toContain(",  world");
  });

  it("can produce deterministic punctuation noise for Chinese text", () => {
    const text = "你好，世界。你好，世界。你好，世界。";
    const left = noisemake(text, {
      frequency: 1,
      seed: "seed-0",
      types: ["punct"],
      languages: ["zh"],
    });
    const right = noisemake(text, {
      frequency: 1,
      seed: "seed-0",
      types: ["punct"],
      languages: ["zh"],
    });

    expect(left).toBe(right);
    expect(left).not.toBe(text);
  });
});
