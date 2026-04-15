import type { AppliedMutation, MutationCandidate } from "./candidates.js";
import type { Language } from "./options.js";

const ASCII_TO_FULLWIDTH: Readonly<Record<string, string>> = {
  ",": "，",
  ".": "。",
  "!": "！",
  "?": "？",
  ":": "：",
  ";": "；",
};

const FULLWIDTH_TO_ASCII: Readonly<Record<string, string>> = {
  "，": ",",
  "。": ".",
  "！": "!",
  "？": "?",
  "：": ":",
  "；": ";",
};

export function buildPunctCandidates(
  chars: readonly string[],
  languages: ReadonlySet<Language>,
): MutationCandidate[] {
  const candidates: MutationCandidate[] = [];
  const allowFullwidthPunctuation = languages.has("zh");

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];

    if (char === undefined) {
      continue;
    }

    if (allowFullwidthPunctuation && FULLWIDTH_TO_ASCII[char] !== undefined) {
      candidates.push({
        type: "punct",
        start: index,
        end: index + 1,
        replacement: FULLWIDTH_TO_ASCII[char] as string,
        weight: 1,
      });
    }
  }

  return candidates;
}

export function materializePunct(
  candidate: Extract<MutationCandidate, { type: "punct" }>,
): AppliedMutation {
  return {
    type: "punct",
    start: candidate.start,
    end: candidate.end,
    replacement: candidate.replacement,
  };
}
