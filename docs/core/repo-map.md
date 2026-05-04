# Repo Map

This is the short orientation doc for people changing the package itself.

If you need the full product and behavior contract, read
[plan.md](plan.md) next. If you only need to know where code lives and what to
run, this file is enough.

## Top-Level Layout

```text
src/         package source
test/        unit and dist behavior tests
tools/       one-off generation scripts
docs/        human-facing project docs
web/         separate playground app boundary
third_party/ bundled upstream dictionaries and provenance
```

## Core Package Files

```text
src/index.ts        public library exports
src/cli.ts          Node-only CLI adapter
src/noisemake.ts    core orchestration
src/options.ts      option normalization and validation
src/rng.ts          deterministic seeded RNG
src/spans.ts        text span helpers
src/candidates.ts   candidate selection and mutation application
src/typo.ts         typo candidate generation
src/repeat.ts       repetition candidate generation
src/spacing.ts      whitespace perturbation candidates
src/punct.ts        punctuation normalization candidates
src/swap.ts         adjacent word-swap candidates
src/data/           generated or static data
```

## Test Layout

```text
test/unit/          pure module tests
test/cli.test.ts    built CLI behavior
test/package.test.ts dist package import/require behavior
test/unit/web-diff-output.test.ts web-side diff helper coverage
```

## Important Boundaries

- Determinism is the top invariant.
- `src/cli.ts` is the only Node-only source file in the package core.
- `web/` is a separate app, not an excuse to move UI logic into root `src/`.
- Chinese IME data has a third-party license boundary. Check
  [../legal/license-boundary.md](../legal/license-boundary.md) before touching it.

## Common Commands

```bash
pnpm run test:unit
pnpm run test:dist
pnpm run check
pnpm run build
pnpm --dir web run build
pnpm --dir web run dev
```

## Reading Order

1. [../../README.md](../../README.md) for the public surface
2. [repo-map.md](repo-map.md) for code layout
3. [plan.md](plan.md) for package rules and decisions
4. [../../AGENTS.md](../../AGENTS.md) for editing and verification rules
