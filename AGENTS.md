# AGENTS.md

## Purpose

This file is the operating manual for autonomous coding agents working on
`noisemake`.

Codex discovers this repo-root `AGENTS.md` automatically. Keep it concise enough to
fit inside Codex's project-instruction budget.

`noisemake` is a TypeScript CLI and npm library for controlled, reproducible text
perturbation. It is not an LLM rewriting tool. The product promise is:

```text
same input + same seed + same options = same output
```

Protect that promise before optimizing anything else.

## Read First

Before changing code, read the smallest set of source docs that matches the task:

- `PLAN.md` for product intent, current decisions, package shape, and known scope.
- `README.md` for public CLI/library usage.
- `DESIGN.md`, `web-design-brief.md`, and `web-implementation-spec.md` only for web
  playground or UI work.
- `NOTICE` and `third_party/rime-luna-pinyin/SOURCE.md` before touching Chinese IME
  confusion data or package licensing.

Do not use Claude Code-specific files or gstack skill definitions as repo guidance.
This repo is being driven from Codex. Prefer this file plus the docs above.

## Repo Map

```text
src/
  index.ts        public library exports
  cli.ts          Node-only CLI adapter
  noisemake.ts    pure engine orchestration
  options.ts      option defaults and validation
  rng.ts          deterministic seeded RNG
  spans.ts        Unicode/code-point/token span helpers
  candidates.ts   candidate selection and mutation application
  typo.ts         Chinese IME and English keyboard typo candidates
  repeat.ts       repeat candidates
  data/           generated/static perturbation data
test/
  unit/           pure module tests
  cli.test.ts     dist CLI behavior tests
  package.test.ts dist package import/require tests
tools/
  build-zh-ime-confusions.ts  generated Chinese confusion data builder
web/
  Astro playground; separate app boundary using the root package
third_party/
  LGPL-covered source data and attribution
```

## Hard Invariants

- Determinism is the top invariant. Seeded calls must stay reproducible.
- Do not change public CLI or library behavior without updating tests and docs.
- Core modules under `src/*.ts`, except `src/cli.ts`, must stay runtime-neutral.
  Do not add `node:*`, `process`, `fs`, or other Node-only APIs outside `src/cli.ts`.
- Keep CLI stdout clean. Successful CLI runs write only transformed text to stdout.
  Errors and usage messages go to stderr with non-zero exit codes.
- Preserve input formatting. Do not trim input or add a trailing newline that was not
  already present.
- If both positional text and stdin are provided, keep the usage error behavior.
- `types` and `languages` are enabled sets, not priority lists. Order must not affect
  behavior.
- Chinese confusion data derived from Rime remains LGPL-covered data. Do not describe
  the package as pure MIT while that data is bundled.
- No runtime data downloads. Generated/static data must be present in the package.
- Do not mix web UI labels with algorithm API names. UI copy can be localized and
  product-facing; engine values such as `typo`, `repeat`, `zh`, and `en` stay stable.

## Core Package Workflow

For engine, CLI, option, typo, repeat, span, RNG, or data changes:

1. Read `PLAN.md`, `src/noisemake.ts`, `src/options.ts`, and the directly relevant
   module.
2. Read the matching tests under `test/unit/` and any dist tests that cover public
   behavior.
3. Make the smallest coherent change. Avoid broad refactors unless the task is
   explicitly a refactor.
4. Add or update tests for deterministic behavior, edge cases, and public errors.
5. Run the narrowest useful check first, then the broader check if public behavior or
   build output changed.

Useful commands:

```bash
pnpm run test:unit
pnpm run test:dist
pnpm run check
pnpm run build
```

`pnpm run test:dist` already builds first. Use it when changing exports, CLI behavior,
package shape, `tsup.config.ts`, or anything in `dist` expectations.

## Determinism Checklist

When changing candidate generation, selection, RNG, Unicode spans, or mutation
application, verify:

- Same input/options/seed returns the same output across repeated calls.
- Different fixed seeds can produce different outputs on sufficiently long text.
- Very low noise can return unchanged text.
- `languages: ["zh"]` leaves English text untouched for typo-only runs.
- `languages: ["en"]` leaves Chinese text untouched for typo-only runs.
- Overlapping candidates are resolved deterministically.
- Mutation application still runs from right to left so earlier ranges are not shifted.
- Unicode handling is code-point aware, not UTF-16-index fragile.

If unseeded behavior changes, call it out explicitly. `src/rng.ts` may use
`Math.random()` only for seedless calls.

## CLI Checklist

When changing `src/cli.ts` or README CLI examples, verify:

- Argument input works.
- Stdin input works.
- Stdin trailing newlines are preserved.
- Providing both argument text and stdin fails clearly.
- Missing input fails clearly.
- Invalid `--frequency`, `--types`, or `--languages` fails clearly.
- stdout contains only transformed text on success.
- stderr contains all errors.
- exit code is non-zero on errors.

## Data And License Checklist

Before touching `src/data/zh-ime-confusions.generated.ts`,
`tools/build-zh-ime-confusions.ts`, or `third_party/rime-luna-pinyin/`:

- Read `NOTICE` and `third_party/rime-luna-pinyin/SOURCE.md`.
- Preserve source attribution and LGPL-3.0-or-later data boundaries.
- Keep generated output deterministic.
- Do not add runtime downloads or network-dependent generation.
- Do not edit generated data by hand unless the task explicitly requires a small,
  reviewed emergency patch and the reason is documented.

The confusion-data build can hit sandbox IPC permission issues through `tsx`. If
`pnpm run build:zh-confusions` fails with an IPC/EPERM-looking sandbox error, rerun
it with approval rather than rewriting the tool.

## Web Boundary

The web playground is already implemented under `web/`. For web work:

- Read `DESIGN.md`, `web-design-brief.md`, and `web-implementation-spec.md`.
- Keep the playground workbench-first. Do not turn it into a generic SaaS landing
  page.
- Keep `/web` as a separate app boundary. Do not move web code into root `src/`.
- The web app should use the root package through `noisemake: "workspace:*"`.
- Do not change the core perturbation algorithm just to support UI highlights.
  Use a UI-side diff unless a core report API is explicitly planned.
- Respect localized routes `/zh` and `/en`, theme behavior, and mobile ordering from
  the design docs.

### Live Web Domain

The canonical live domain is:

```text
https://noisemake.xyz
```

When the task is web debugging, design review, planning, or production verification,
agents may use direct cloud/browser access to inspect `https://noisemake.xyz`.

Use the live site to:

- Reproduce user-visible bugs before changing code.
- Compare local changes against the deployed production baseline.
- Verify responsive design, interaction states, copy, and routing behavior.
- Check whether a problem is local-only, production-only, or deploy drift.

Live-site access is read-only. Do not deploy, mutate production configuration, or
change DNS/cloud settings unless the user explicitly asks for that operation.

## Testing Expectations

Use the blast radius to choose checks:

```text
pure module change        -> pnpm run test:unit
CLI or package surface    -> pnpm run test:dist
release-facing change     -> pnpm run check
web-only change           -> run the relevant web package checks from web/package.json
data generation change    -> pnpm run build:zh-confusions, then relevant unit tests
```

Current web commands:

```bash
pnpm --dir web run build
pnpm --dir web run generate-types
pnpm --dir web run dev
```

If you cannot run a check, report exactly why and what you did instead.

## Git And Worktree Safety

- The worktree may contain user changes. Never revert changes you did not make.
- If unrelated files are dirty, ignore them.
- If a file you need to edit is already dirty, inspect it first and preserve the
  existing intent.
- Do not run destructive git commands such as `git reset --hard` or `git checkout --`
  unless the user explicitly asks for that exact operation.
- Do not commit or push unless the user asks.

## Style

- Prefer explicit code over clever abstractions.
- Reuse existing module patterns before adding new ones.
- Keep public API changes rare and tested.
- Keep comments short and only where they explain non-obvious mechanics.
- Default to ASCII for new text unless the file already needs Chinese examples or
  user-facing Chinese copy.

## When In Doubt

Choose the path that best preserves deterministic research tooling:

```text
controlled perturbation > natural-sounding rewrite
stable seed behavior    > surprising variety
small public surface    > premature platform split
static reviewed data    > runtime downloads
pure core engine        > Node-coupled convenience
```
