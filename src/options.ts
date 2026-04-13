export const NOISE_TYPES = ["typo", "repeat"] as const;
export type NoiseType = (typeof NOISE_TYPES)[number];

export const LANGUAGES = ["zh", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

export interface NoisemakeOptions {
  frequency?: number;
  seed?: string | number;
  types?: NoiseType[];
  languages?: Language[];
}

export interface NormalizedOptions {
  frequency: number;
  seed?: string | number;
  types: ReadonlySet<NoiseType>;
  languages: ReadonlySet<Language>;
  typeMultipliers: Readonly<Record<NoiseType, number>>;
}

const DEFAULT_FREQUENCY = 200;
const DEFAULT_TYPES: readonly NoiseType[] = ["typo", "repeat"];
const DEFAULT_LANGUAGES: readonly Language[] = ["zh", "en"];

const TYPE_MULTIPLIERS: Readonly<Record<NoiseType, number>> = {
  typo: 2,
  repeat: 0.05,
};

export function normalizeOptions(options: NoisemakeOptions = {}): NormalizedOptions {
  const frequency = options.frequency ?? DEFAULT_FREQUENCY;
  assertFrequency(frequency);

  const types = normalizeSet(options.types ?? DEFAULT_TYPES, NOISE_TYPES, "types");
  const languages = normalizeSet(
    options.languages ?? DEFAULT_LANGUAGES,
    LANGUAGES,
    "languages",
  );

  return {
    frequency,
    seed: options.seed,
    types,
    languages,
    typeMultipliers: TYPE_MULTIPLIERS,
  };
}

function assertFrequency(value: number): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 1) {
    throw new RangeError("frequency must be a positive integer");
  }
}

function normalizeSet<T extends string>(
  values: readonly T[],
  allowedValues: readonly T[],
  name: string,
): ReadonlySet<T> {
  if (values.length === 0) {
    throw new TypeError(`${name} must include at least one value`);
  }

  const allowed = new Set<string>(allowedValues);
  const result = new Set<T>();

  for (const value of values) {
    if (!allowed.has(value)) {
      throw new TypeError(`${name} must contain only: ${allowedValues.join(",")}`);
    }

    result.add(value);
  }

  return result;
}
