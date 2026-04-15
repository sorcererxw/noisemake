import type { NormalizedOptions, NoiseType } from "./options.js";
import type { Rng } from "./rng.js";
import type { ZhImeReplacement } from "./data/zh-ime-confusions.generated.js";

export type MutationCandidate =
  | {
      type: "typo";
      subtype: "zh-ime";
      start: number;
      end: number;
      replacements: readonly ZhImeReplacement[];
      weight: number;
    }
  | {
      type: "typo";
      subtype: "en-keyboard";
      start: number;
      end: number;
      token: string;
      weight: number;
    }
  | {
      type: "repeat";
      start: number;
      end: number;
      token: string;
      separator: "" | " ";
      weight: number;
    }
  | {
      type: "spacing";
      start: number;
      end: number;
      replacement: "" | " " | "  ";
      weight: number;
    }
  | {
      type: "punct";
      start: number;
      end: number;
      replacement: string;
      weight: number;
    };

export interface AppliedMutation {
  type: NoiseType;
  start: number;
  end: number;
  replacement: string;
}

export type MaterializeCandidate = (
  candidate: MutationCandidate,
  rng: Rng,
) => AppliedMutation;

export function selectMutations(
  candidates: readonly MutationCandidate[],
  options: NormalizedOptions,
  rng: Rng,
  materialize: MaterializeCandidate,
): AppliedMutation[] {
  const selected: AppliedMutation[] = [];
  const occupied: Array<readonly [number, number]> = [];
  const sorted = [...candidates].sort(compareCandidates);

  for (const candidate of sorted) {
    const probability =
      (1 / options.frequency) * options.typeMultipliers[candidate.type] * candidate.weight;

    if (rng.next() >= Math.min(1, probability)) {
      continue;
    }

    if (overlapsAny(candidate.start, candidate.end, occupied)) {
      continue;
    }

    const mutation = materialize(candidate, rng);

    selected.push(mutation);
    occupied.push([mutation.start, mutation.end]);
  }

  return selected;
}

export function applyMutations(
  chars: readonly string[],
  mutations: readonly AppliedMutation[],
): string {
  const next = [...chars];
  const sorted = [...mutations].sort((left, right) => right.start - left.start);

  for (const mutation of sorted) {
    next.splice(
      mutation.start,
      mutation.end - mutation.start,
      ...Array.from(mutation.replacement),
    );
  }

  return next.join("");
}

function compareCandidates(
  left: MutationCandidate,
  right: MutationCandidate,
): number {
  if (left.start !== right.start) {
    return left.start - right.start;
  }

  return right.end - right.start - (left.end - left.start);
}

function overlapsAny(
  start: number,
  end: number,
  ranges: readonly (readonly [number, number])[],
): boolean {
  return ranges.some(([rangeStart, rangeEnd]) => start < rangeEnd && end > rangeStart);
}
