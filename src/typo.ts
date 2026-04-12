import type { AppliedMutation, MutationCandidate } from "./candidates.js";
import type { Rng } from "./rng.js";
import { findChineseSpans, findLatinSpans } from "./spans.js";
import { QWERTY_ADJACENT } from "./data/en-keyboard.js";
import {
  MAX_ZH_IME_SOURCE_LENGTH,
  ZH_IME_CONFUSIONS,
} from "./data/zh-ime-confusions.generated.js";

type EnglishTypoOperation = "substitute" | "transpose" | "duplicate" | "delete";

const ENGLISH_OPERATION_WEIGHTS: Readonly<Record<EnglishTypoOperation, number>> = {
  substitute: 0.4,
  transpose: 0.3,
  duplicate: 0.2,
  delete: 0.1,
};

export function buildZhImeTypoCandidates(
  chars: readonly string[],
): MutationCandidate[] {
  const candidates: MutationCandidate[] = [];

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

        candidates.push({
          type: "typo",
          subtype: "zh-ime",
          start: index,
          end: index + length,
          replacements,
          weight: 1,
        });
        index += length;
        matched = true;
        break;
      }

      if (!matched) {
        index += 1;
      }
    }
  }

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
