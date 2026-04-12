import {
  applyMutations,
  selectMutations,
  type AppliedMutation,
  type MutationCandidate,
} from "./candidates.js";
import { normalizeOptions, type NoisemakeOptions } from "./options.js";
import { buildEnRepeatCandidates, buildZhRepeatCandidates, materializeRepeat } from "./repeat.js";
import { createRng, type Rng } from "./rng.js";
import { toCodePoints } from "./spans.js";
import {
  buildEnKeyboardTypoCandidates,
  buildZhImeTypoCandidates,
  materializeTypo,
} from "./typo.js";

export function noisemake(text: string, options?: NoisemakeOptions): string {
  const normalized = normalizeOptions(options);
  const rng = createRng(normalized.seed);
  const chars = toCodePoints(text);
  const candidates: MutationCandidate[] = [];

  if (normalized.types.has("typo")) {
    if (normalized.languages.has("zh")) {
      candidates.push(...buildZhImeTypoCandidates(chars));
    }

    if (normalized.languages.has("en")) {
      candidates.push(...buildEnKeyboardTypoCandidates(chars));
    }
  }

  if (normalized.types.has("repeat")) {
    if (normalized.languages.has("zh")) {
      candidates.push(...buildZhRepeatCandidates(text));
    }

    if (normalized.languages.has("en")) {
      candidates.push(...buildEnRepeatCandidates(text));
    }
  }

  const mutations = selectMutations(candidates, normalized, rng, materializeCandidate);

  return applyMutations(chars, mutations);
}

function materializeCandidate(
  candidate: MutationCandidate,
  rng: Rng,
): AppliedMutation {
  if (candidate.type === "typo") {
    return materializeTypo(candidate, rng);
  }

  return materializeRepeat(candidate);
}
