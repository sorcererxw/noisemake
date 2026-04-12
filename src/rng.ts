export interface Rng {
  next(): number;
  int(maxExclusive: number): number;
  pick<T>(values: readonly T[]): T;
}

export function createRng(seed?: string | number): Rng {
  const normalizedSeed =
    seed === undefined ? Math.floor(Math.random() * 0xffffffff) : hashSeed(seed);

  return createMulberry32(normalizedSeed);
}

export function hashSeed(seed: string | number): number {
  const text = String(seed);
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function createMulberry32(seed: number): Rng {
  let state = seed >>> 0;

  const rng: Rng = {
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    int(maxExclusive: number) {
      if (!Number.isInteger(maxExclusive) || maxExclusive < 1) {
        throw new RangeError("maxExclusive must be a positive integer");
      }

      return Math.floor(rng.next() * maxExclusive);
    },
    pick<T>(values: readonly T[]): T {
      if (values.length === 0) {
        throw new RangeError("cannot pick from an empty list");
      }

      return values[rng.int(values.length)] as T;
    },
  };

  return rng;
}
