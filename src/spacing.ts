import type { AppliedMutation, MutationCandidate } from "./candidates.js";
import type { Language } from "./options.js";
import { isAsciiLetter, isHan } from "./spans.js";

const SPACE_EXPANDING_PUNCTUATION = new Set([",", ".", "!", "?", ":", ";", "，", "。"]);

export function buildSpacingCandidates(
  chars: readonly string[],
  languages: ReadonlySet<Language>,
): MutationCandidate[] {
  const candidates: MutationCandidate[] = [];
  const allowEnglishSpacing = languages.has("en");
  const allowMixedBoundarySpacing = languages.has("zh") && languages.has("en");

  for (let index = 1; index < chars.length - 1; index += 1) {
    if (chars[index] !== " ") {
      continue;
    }

    const previous = chars[index - 1];
    const next = chars[index + 1];

    if (previous === " " || next === " ") {
      continue;
    }

    if (
      allowEnglishSpacing &&
      previous !== undefined &&
      next !== undefined &&
      SPACE_EXPANDING_PUNCTUATION.has(previous)
    ) {
      candidates.push({
        type: "spacing",
        start: index,
        end: index + 1,
        replacement: "  ",
        weight: 1,
      });
      continue;
    }

    if (
      allowEnglishSpacing &&
      previous !== undefined &&
      next !== undefined &&
      isAsciiLetter(previous) &&
      isAsciiLetter(next)
    ) {
      candidates.push({
        type: "spacing",
        start: index,
        end: index + 1,
        replacement: "  ",
        weight: 1,
      });
      continue;
    }

    if (
      allowMixedBoundarySpacing &&
      previous !== undefined &&
      next !== undefined &&
      ((isHan(previous) && isAsciiLetter(next)) ||
        (isAsciiLetter(previous) && isHan(next)))
    ) {
      candidates.push({
        type: "spacing",
        start: index,
        end: index + 1,
        replacement: "",
        weight: 1,
      });
    }
  }

  if (allowMixedBoundarySpacing) {
    for (let index = 1; index < chars.length; index += 1) {
      const previous = chars[index - 1];
      const current = chars[index];

      if (previous === undefined || current === undefined) {
        continue;
      }

      if (previous === " " || current === " ") {
        continue;
      }

      if (
        (isHan(previous) && isAsciiLetter(current)) ||
        (isAsciiLetter(previous) && isHan(current))
      ) {
        candidates.push({
          type: "spacing",
          start: index,
          end: index,
          replacement: " ",
          weight: 1,
        });
      }
    }
  }

  return candidates;
}

export function materializeSpacing(
  candidate: Extract<MutationCandidate, { type: "spacing" }>,
): AppliedMutation {
  return {
    type: "spacing",
    start: candidate.start,
    end: candidate.end,
    replacement: candidate.replacement,
  };
}
