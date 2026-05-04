import type { AppliedMutation, MutationCandidate } from "./candidates.js";
import type { Language } from "./options.js";
import { isAllHan, isAsciiWord, segmentWords, type Token } from "./spans.js";

type SwapCandidate = Extract<MutationCandidate, { type: "swap" }>;

export function buildSwapCandidates(
  text: string,
  languages: ReadonlySet<Language>,
): SwapCandidate[] {
  const chars = Array.from(text);
  const tokens = segmentWords(text)
    .filter((token) => token.isWordLike)
    .map((token) => ({ token, language: getTokenLanguage(token) }))
    .filter(
      (entry): entry is { token: Token; language: Language } =>
        entry.language !== undefined && languages.has(entry.language),
    );
  const candidates: SwapCandidate[] = [];

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const first = tokens[index]!;
    const second = tokens[index + 1]!;

    if (!languages.has(first.language) || !languages.has(second.language)) {
      continue;
    }

    const separator = chars.slice(first.token.end, second.token.start).join("");

    if (!isSwappableSeparator(separator)) {
      continue;
    }

    candidates.push({
      type: "swap",
      start: first.token.start,
      end: second.token.end,
      firstToken: first.token.text,
      secondToken: second.token.text,
      separator,
      weight: 1,
    });
  }

  return candidates;
}

export function materializeSwap(candidate: SwapCandidate): AppliedMutation {
  return {
    type: "swap",
    start: candidate.start,
    end: candidate.end,
    replacement: `${candidate.secondToken}${candidate.separator}${candidate.firstToken}`,
  };
}

function getTokenLanguage(token: Token): Language | undefined {
  if (isAllHan(token.text)) {
    return "zh";
  }

  if (isAsciiWord(token.text)) {
    return "en";
  }

  return undefined;
}

function isSwappableSeparator(separator: string): boolean {
  return separator === "" || /^[ \t]+$/u.test(separator);
}
