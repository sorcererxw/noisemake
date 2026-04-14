# Core History

This file keeps historical planning context that is still useful to preserve but
should not sit in the main current-state plan.

Use it when you need to answer:

- what the original MVP rollout order was,
- which assumptions were later superseded,
- why some plan language sounds like it came from an earlier repo state.

If a rule is still active today, it belongs in [plan.md](plan.md), not here.

## Superseded Assumptions

- Early MVP planning assumed the `/web` app was out of scope.
  That is no longer true. The web playground now exists as a separate app
  boundary under `web/`, with its current contract defined in
  [../web/plan.md](../web/plan.md).

## Original Implementation Order

This was the original build-out sequence for the core package:

1. Create package scaffolding: `package.json`, `tsconfig.json`,
   `tsdown.config.ts`, Vitest config if needed.
2. Add license/data skeleton:
   - `NOTICE`
   - `third_party/rime-luna-pinyin/LICENSE`
   - `third_party/rime-luna-pinyin/SOURCE.md`
   - `third_party/rime-luna-pinyin/luna_pinyin.dict.yaml`
   - `src/data/en-keyboard.ts`
   - `src/data/zh-ime-confusions.generated.ts`
   - `tools/build-zh-ime-confusions.ts`
3. Add data integrity tests for the QWERTY map and generated Chinese confusion
   map.
4. Implement `rng.ts`, `options.ts`, and `spans.ts`.
5. Implement `typo.ts` and `repeat.ts`.
6. Implement `candidates.ts` and orchestration in `noisemake.ts`.
7. Implement `index.ts` public exports.
8. Implement `cli.ts` with Commander.
9. Add dist-level CLI/package tests.
10. Add README usage examples and publish notes.

## Why Keep This

The rollout order still explains some of the repo shape:

- why data/provenance files are treated as first-class source material,
- why dist tests are separate from unit tests,
- why the core package keeps a strict runtime-neutral boundary,
- why web integration is treated as a consumer of the package instead of part of
  the package source tree.
