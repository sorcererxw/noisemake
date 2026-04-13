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

const MAX_ZH_HOMOPHONE_FALLBACK_REPLACEMENTS = 5;

const ENGLISH_OPERATION_WEIGHTS: Readonly<Record<EnglishTypoOperation, number>> = {
  substitute: 0.4,
  transpose: 0.3,
  duplicate: 0.2,
  delete: 0.1,
};

// Common same-pinyin groups keep simplified Chinese from depending entirely on the
// generated phrase table, which is sparse for modern news-style text.
const ZH_HOMOPHONE_FALLBACK_GROUPS = [
  "的得地",
  "一衣依",
  "是事世式试市使始史驶士",
  "在再载",
  "和何河合盒",
  "已以乙意易亿忆艺议义",
  "为维围唯味未位胃",
  "这浙者着",
  "个各哥歌格隔",
  "公工功攻宫供共",
  "司私思斯丝四寺",
  "宣轩喧",
  "布步部不",
  "动洞东冬",
  "画话花化",
  "电点店典",
  "影映应营英颖",
  "结节洁杰",
  "束数树术述",
  "全权泉拳",
  "球求",
  "票漂飘",
  "房防方芳访",
  "收手首守",
  "入如",
  "达答搭",
  "到道倒",
  "作做坐",
  "本奔笨",
  "次刺词辞",
  "突图徒途涂",
  "破迫坡",
  "创窗疮",
  "历力立利例",
  "年念",
  "高告糕",
  "累类泪",
  "计记季际继",
  "观关官冠",
  "人仁任认",
  "其期齐棋旗",
  "中终钟忠",
  "海还害",
  "外歪",
  "多朵躲",
  "国过锅果郭",
  "家加佳夹价架假嘉",
  "区去取曲",
  "播波玻",
  "近进尽仅紧锦",
  "上尚",
  "片篇偏骗",
  "之只知支",
  "后候厚",
  "也野冶",
  "集急级及极即",
  "团湍抟",
  "索锁所",
  "尼泥呢",
  "下夏吓",
  "出初",
  "元原园员圆源",
] as const;

const ZH_HOMOPHONE_FALLBACKS = buildZhHomophoneFallbacks(
  ZH_HOMOPHONE_FALLBACK_GROUPS,
);

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
        const replacements = ZH_IME_CONFUSIONS[source];

        if (!replacements || replacements.length === 0) {
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

  candidates.push(
    ...buildZhHomophoneFallbackCandidates(chars.join(""), phraseRanges),
  );

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

    const replacements = buildZhHomophoneTokenReplacements(token.text);

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

function buildZhHomophoneTokenReplacements(token: string): ZhImeReplacement[] {
  const chars = Array.from(token);
  const replacements: ZhImeReplacement[] = [];
  const seen = new Set<string>();
  const maxAlternatives = chars.reduce(
    (max, char) => Math.max(max, ZH_HOMOPHONE_FALLBACKS[char]?.length ?? 0),
    0,
  );

  for (
    let alternativeIndex = 0;
    alternativeIndex < maxAlternatives;
    alternativeIndex += 1
  ) {
    for (let index = 0; index < chars.length; index += 1) {
      const source = chars[index];

      if (source === undefined) {
        continue;
      }

      const replacement = ZH_HOMOPHONE_FALLBACKS[source]?.[alternativeIndex];

      if (!replacement) {
        continue;
      }

      const next = [...chars];
      next[index] = replacement;
      const text = next.join("");

      if (text === token || seen.has(text)) {
        continue;
      }

      seen.add(text);
      replacements.push({
        text,
        reason: "homophone",
        score: 0.75,
      });

      if (replacements.length >= MAX_ZH_HOMOPHONE_FALLBACK_REPLACEMENTS) {
        return replacements;
      }
    }
  }

  return replacements;
}

function buildZhHomophoneFallbacks(
  groups: readonly string[],
): Readonly<Record<string, readonly string[]>> {
  const result: Record<string, string[]> = {};

  for (const group of groups) {
    const chars = Array.from(group);

    for (const char of chars) {
      const replacements = result[char] ?? [];
      const seen = new Set(replacements);

      for (const replacement of chars) {
        if (replacement === char || seen.has(replacement)) {
          continue;
        }

        replacements.push(replacement);
        seen.add(replacement);
      }

      result[char] = replacements;
    }
  }

  return result;
}

function overlapsAny(
  start: number,
  end: number,
  ranges: readonly (readonly [number, number])[],
): boolean {
  return ranges.some(([rangeStart, rangeEnd]) => start < rangeEnd && end > rangeStart);
}
