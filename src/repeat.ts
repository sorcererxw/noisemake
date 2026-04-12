import type { AppliedMutation, MutationCandidate } from "./candidates.js";
import { isAllHan, isAsciiWord, segmentWords } from "./spans.js";

export function buildZhRepeatCandidates(text: string): MutationCandidate[] {
  return segmentWords(text)
    .filter((token) => token.isWordLike)
    .filter((token) => isAllHan(token.text))
    .filter((token) => Array.from(token.text).length >= 2)
    .map((token) => ({
      type: "repeat" as const,
      start: token.start,
      end: token.end,
      token: token.text,
      separator: "" as const,
      weight: 1,
    }));
}

export function buildEnRepeatCandidates(text: string): MutationCandidate[] {
  return segmentWords(text)
    .filter((token) => token.isWordLike)
    .filter((token) => isAsciiWord(token.text))
    .filter((token) => token.text.length >= 2)
    .map((token) => ({
      type: "repeat" as const,
      start: token.start,
      end: token.end,
      token: token.text,
      separator: " " as const,
      weight: 1,
    }));
}

export function materializeRepeat(
  candidate: Extract<MutationCandidate, { type: "repeat" }>,
): AppliedMutation {
  return {
    type: "repeat",
    start: candidate.start,
    end: candidate.end,
    replacement: `${candidate.token}${candidate.separator}${candidate.token}`,
  };
}
