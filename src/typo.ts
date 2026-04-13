import type { AppliedMutation, MutationCandidate } from "./candidates.js";
import type { Rng } from "./rng.js";
import {
  findChineseSpans,
  findLatinSpans,
  isAllHan,
  segmentWords,
} from "./spans.js";
import { QWERTY_ADJACENT } from "./data/en-keyboard.js";
import {
  MAX_ZH_IME_SOURCE_LENGTH,
  type ZhImeReplacement,
  ZH_IME_CONFUSIONS,
} from "./data/zh-ime-confusions.generated.js";

type EnglishTypoOperation = "substitute" | "transpose" | "duplicate" | "delete";

const ENGLISH_OPERATION_WEIGHTS: Readonly<Record<EnglishTypoOperation, number>> = {
  substitute: 0.4,
  transpose: 0.3,
  duplicate: 0.2,
  delete: 0.1,
};

const ZH_HOMOPHONE_FALLBACKS: Readonly<
  Record<string, readonly ZhImeReplacement[]>
> = {
  旗下: zhFallback("homophone", "其下"),
  公司: zhFallback("homophone", "公私"),
  部分: zhFallback("homophone", "不分"),
  动画: zhFallback("near-homophone", "童话"),
  电影: zhFallback("near-homophone", "电音"),
  结束: zhFallback("homophone", "劫数"),
  上映: zhFallback("near-homophone", "上瘾"),
  达到: zhFallback("homophone", "打到"),
  作为: zhFallback("homophone", "座位"),
  首次: zhFallback("near-homophone", "手册"),
  累计: zhFallback("homophone", "累积"),
  其中: zhFallback("homophone", "期中"),
  万人: zhFallback("homophone", "完人"),
  国家: zhFallback("homophone", "郭嘉"),
  国内: zhFallback("homophone", "锅内"),
  史上: zhFallback("homophone", "世上"),
  之后: zhFallback("homophone", "滞后"),
  影院: zhFallback("near-homophone", "因缘"),
  观影: zhFallback("near-homophone", "观音"),
  影片: zhFallback("near-homophone", "饮片"),
  东宝: zhFallback("homophone", "动保"),
  需要: zhFallback("homophone", "须要"),
  稳定: zhFallback("homophone", "问鼎"),
  实现: zhFallback("homophone", "实线"),
  可以: zhFallback("homophone", "刻意"),
  安装: zhFallback("near-homophone", "按装"),
  体验: zhFallback("near-homophone", "体检"),
  生成: zhFallback("homophone", "声成", "生辰"),
  前端: zhFallback("homophone", "前段"),
  工具: zhFallback("near-homophone", "公具"),
  但是: zhFallback("homophone", "但事"),
  尝试: zhFallback("homophone", "常识"),
  今天: zhFallback("near-homophone", "金天"),
  模式: zhFallback("near-homophone", "摸式"),
  复刻: zhFallback("homophone", "复课"),
  写的: zhFallback("homophone", "写得"),
  计算: zhFallback("near-homophone", "计蒜"),
  免息: zhFallback("homophone", "面息"),
  分期: zhFallback("near-homophone", "分歧"),
  实际: zhFallback("homophone", "事迹"),
  价值: zhFallback("near-homophone", "价植"),
};

export function buildZhImeTypoCandidates(
  chars: readonly string[],
): MutationCandidate[] {
  const candidates: MutationCandidate[] = [];
  const phraseRanges: Array<readonly [number, number]> = [];

  for (const span of findChineseSpans(chars)) {
    let index = span.start;

    while (index < span.end) {
      const maxLength = Math.min(MAX_ZH_IME_SOURCE_LENGTH, span.end - index);
      let matched = false;

      for (let length = maxLength; length >= 2; length -= 1) {
        const source = chars.slice(index, index + length).join("");
        const replacements = mergeZhImeReplacements(
          ZH_IME_CONFUSIONS[source],
          ZH_HOMOPHONE_FALLBACKS[source],
        );

        if (replacements.length === 0) {
          continue;
        }

        const candidate = {
          type: "typo",
          subtype: "zh-ime",
          start: index,
          end: index + length,
          replacements,
          weight: 1,
        } as const;

        candidates.push(candidate);
        phraseRanges.push([candidate.start, candidate.end]);
        index += length;
        matched = true;
        break;
      }

      if (!matched) {
        index += 1;
      }
    }
  }

  const text = chars.join("");
  candidates.push(...buildZhHomophoneFallbackCandidates(text, phraseRanges));

  return candidates;
}

export function buildEnKeyboardTypoCandidates(
  chars: readonly string[],
): MutationCandidate[] {
  return findLatinSpans(chars)
    .filter((span) => span.text.length >= 3)
    .map((span) => ({
      type: "typo" as const,
      subtype: "en-keyboard" as const,
      start: span.start,
      end: span.end,
      token: span.text,
      weight: 1,
    }));
}

export function materializeTypo(
  candidate: Extract<MutationCandidate, { type: "typo" }>,
  rng: Rng,
): AppliedMutation {
  if (candidate.subtype === "zh-ime") {
    return {
      type: "typo",
      start: candidate.start,
      end: candidate.end,
      replacement: rng.pick(candidate.replacements).text,
    };
  }

  return {
    type: "typo",
    start: candidate.start,
    end: candidate.end,
    replacement: applyEnglishKeyboardTypo(candidate.token, rng),
  };
}

function applyEnglishKeyboardTypo(token: string, rng: Rng): string {
  const operations = getAvailableEnglishOperations(token);
  const operation = pickWeighted(operations, ENGLISH_OPERATION_WEIGHTS, rng);

  switch (operation) {
    case "substitute":
      return substituteAdjacentKey(token, rng);
    case "transpose":
      return transposeAdjacentCharacters(token, rng);
    case "duplicate":
      return duplicateCharacter(token, rng);
    case "delete":
      return deleteCharacter(token, rng);
  }
}

function getAvailableEnglishOperations(token: string): EnglishTypoOperation[] {
  const operations: EnglishTypoOperation[] = ["substitute", "transpose", "duplicate"];

  if (token.length >= 4) {
    operations.push("delete");
  }

  return operations;
}

function substituteAdjacentKey(token: string, rng: Rng): string {
  const chars = Array.from(token);
  const indices = chars
    .map((char, index) => ({ char, index }))
    .filter(({ char }) => QWERTY_ADJACENT[char.toLowerCase()]);

  if (indices.length === 0) {
    return token;
  }

  const { char, index } = rng.pick(indices);
  const replacement = rng.pick(QWERTY_ADJACENT[char.toLowerCase()] ?? []);
  chars[index] = preserveCase(char, replacement);

  return chars.join("");
}

function transposeAdjacentCharacters(token: string, rng: Rng): string {
  const chars = Array.from(token);
  const index = rng.int(chars.length - 1);
  const current = chars[index] as string;
  chars[index] = chars[index + 1] as string;
  chars[index + 1] = current;

  return chars.join("");
}

function duplicateCharacter(token: string, rng: Rng): string {
  const chars = Array.from(token);
  const index = rng.int(chars.length);
  chars.splice(index, 0, chars[index] as string);

  return chars.join("");
}

function deleteCharacter(token: string, rng: Rng): string {
  const chars = Array.from(token);
  chars.splice(rng.int(chars.length), 1);

  return chars.join("");
}

function pickWeighted<T extends string>(
  values: readonly T[],
  weights: Readonly<Record<T, number>>,
  rng: Rng,
): T {
  const total = values.reduce((sum, value) => sum + weights[value], 0);
  let cursor = rng.next() * total;

  for (const value of values) {
    cursor -= weights[value];

    if (cursor <= 0) {
      return value;
    }
  }

  return values[values.length - 1] as T;
}

function preserveCase(source: string, replacement: string): string {
  if (source === source.toUpperCase()) {
    return replacement.toUpperCase();
  }

  return replacement;
}

function buildZhHomophoneFallbackCandidates(
  text: string,
  phraseRanges: readonly (readonly [number, number])[],
): MutationCandidate[] {
  const candidates: MutationCandidate[] = [];

  for (const token of segmentWords(text)) {
    if (
      !token.isWordLike ||
      !isAllHan(token.text) ||
      Array.from(token.text).length < 2 ||
      overlapsAny(token.start, token.end, phraseRanges)
    ) {
      continue;
    }

    const replacements = ZH_HOMOPHONE_FALLBACKS[token.text] ?? [];

    if (replacements.length === 0) {
      continue;
    }

    candidates.push({
      type: "typo",
      subtype: "zh-ime",
      start: token.start,
      end: token.end,
      replacements,
      weight: 1,
    });
  }

  return candidates;
}

function overlapsAny(
  start: number,
  end: number,
  ranges: readonly (readonly [number, number])[],
): boolean {
  return ranges.some(([rangeStart, rangeEnd]) => start < rangeEnd && end > rangeStart);
}

function zhFallback(
  reason: ZhImeReplacement["reason"],
  ...texts: readonly string[]
): readonly ZhImeReplacement[] {
  return texts.map((text) => ({
    text,
    reason,
    score: reason === "homophone" ? 0.8 : 0.75,
  }));
}

function mergeZhImeReplacements(
  generated: readonly ZhImeReplacement[] | undefined,
  fallback: readonly ZhImeReplacement[] | undefined,
): readonly ZhImeReplacement[] {
  const replacements = [...(generated ?? []), ...(fallback ?? [])];
  const seen = new Set<string>();
  const deduped: ZhImeReplacement[] = [];

  for (const replacement of replacements) {
    if (seen.has(replacement.text)) {
      continue;
    }

    seen.add(replacement.text);
    deduped.push(replacement);
  }

  return deduped;
}
