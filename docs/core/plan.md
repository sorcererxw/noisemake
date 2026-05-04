# noisemake Plan

This file is the current-state contract for the root npm package.

It should describe constraints that are still active today. Historical rollout
notes and superseded assumptions live in [history.md](history.md).

## Goal

`noisemake` is a TypeScript npm package that is both a CLI and a library.

It takes text and injects controlled imperfections, such as Chinese IME-style wrong words, English keyboard typos, and light repetition, so researchers and agent workflows can generate reproducible noisy variants of otherwise polished text.

The core goal is controlled, reproducible text perturbation. It is not an LLM rewriting tool.

Positioning copy may explicitly say that `noisemake` helps make text less obviously AI-polished, while still framing the mechanism as controlled, reproducible perturbation rather than LLM rewriting.

## User-Facing Shape

CLI:

```bash
npx noisemake "这是一段测试文本" --frequency 1000 --seed 42
echo "这是一段测试文本" | npx noisemake --frequency 1000 --seed 42
npx noisemake --file ./input.txt --seed 42
npx noisemake --file ./input.txt --out ./output.txt --seed 42
npx noisemake "这是一段测试文本" --frequency 200 --seed baseline --types typo,repeat
npx noisemake "这个 parser 很 stable" --languages zh,en
npx noisemake "这个 parser 很 stable" --languages zh
```

CLI help draft:

```text
Usage:
  noisemake [options] [text...]

Options:
  --frequency <n>   Average one perturbation per n eligible tokens (default: "200")
  --seed <seed>     Seed for deterministic output
  --types <list>    Enabled noise types: typo,repeat,spacing,punct,swap (default: "typo,repeat,spacing,punct,swap")
  --languages <list> Enabled languages: zh,en (default: zh,en)
  --file <path>     Read input text from a UTF-8 file
  --out <path>      Write output text to a UTF-8 file, creating parent directories if needed
  -h, --help        Show help
```

Library:

```ts
import { noisemake } from "noisemake";

const output = noisemake("这是一段测试文本", {
  frequency: 1000,
  seed: 42,
  types: ["typo", "repeat"],
  languages: ["zh", "en"],
});
```

## Current Decisions

- Package name: `noisemake`.
- One npm package, not a monorepo for MVP.
- Root `src/` is the package source.
- `/web` is a separate app boundary for the playground and should continue to
  consume the root package rather than reimplement the core engine.
- Runtime target: Node.js `>=22`.
- Build output supports both ESM and CJS from the first release.
- CLI supports positional text argument, stdin, or `--file`.
- CLI supports `--out` to write transformed text to a file instead of stdout, creating parent directories if needed.
- CLI supports long flags only in MVP: `--frequency`, `--seed`, `--types`, and `--help`.
- CLI also supports `--languages zh,en`, `--file <path>`, and `--out <path>`.
- Commander also exposes `-h` as an alias for `--help`.
- If multiple input sources are provided at once, CLI exits non-zero with a clear stderr message.
- Multiple positional text arguments are joined with a single space.
- Preserve input formatting: do not trim input and do not append an extra trailing newline. `echo` input keeps its newline; `printf` input stays newline-free.
- `--types` is strictly validated.
- `types` order does not affect behavior; it is an enabled-type set, not a priority list.
- `languages` order does not affect behavior; it is an enabled-language set, not a priority list.
- `typo` supports two MVP strategies:
  - Chinese word/phrase-level IME confusion using a vendored third-party confusion set after license and quality review.
  - English keyboard typo simulation using deterministic local rules.
- English keyboard typo candidates should prefer content words: ignore short words below length `4`, keep a small built-in ignore set for number words, and preserve the first and last character when materializing edits.
- Chinese IME typo materialization should use deterministic weighted selection from replacement `score` values, rather than uniform random choice.
- No runtime data downloads.
- Core modules stay pure TypeScript and avoid Node-only APIs. Only `src/cli.ts` may use Node runtime APIs.
- MVP does not expose reports or operation logs, but internally uses `MutationCandidate -> AppliedMutation` so overlap handling, deterministic materialization, and application order stay explicit.
- License boundary: project code can be MIT, while vendored LGPL dictionary data and generated data derived from it remain LGPL. Do not present the npm package as pure MIT if LGPL data is bundled.

## Proposed Structure

```text
noisemake/
├── src/
│   ├── index.ts
│   ├── cli.ts
│   ├── noisemake.ts
│   ├── options.ts
│   ├── rng.ts
│   ├── spans.ts
│   ├── candidates.ts
│   ├── typo.ts
│   ├── repeat.ts
│   └── data/
│       ├── zh-ime-confusions.generated.ts
│       └── en-keyboard.ts
├── test/
├── dist/
├── package.json
└── web/
    └── src/
```

Keep `/web` separate from the root package source. Do not move playground code
into root `src/`.

Dependency direction:

```text
CLI adapter
    |
    v
public library API
    |
    v
runtime-neutral core modules
```

Node-only boundary:
- `src/cli.ts` may use `process`, stdin, stdout, stderr, and exit codes.
- All other `src/*.ts` modules must avoid `node:*`, `process`, `fs`, and other Node-only APIs so the library can be reused by future `/web` work.

File responsibilities and starter signatures:

```ts
// src/index.ts
export { noisemake } from "./noisemake.js";
export type { NoisemakeOptions, NoiseType } from "./options.js";

// src/noisemake.ts
export function noisemake(text: string, options?: NoisemakeOptions): string;

// src/options.ts
export function normalizeOptions(options?: NoisemakeOptions): NormalizedOptions;

// src/rng.ts
export function createRng(seed?: string | number): Rng;

// src/spans.ts
export function toCodePoints(text: string): string[];
export function findChineseSpans(chars: readonly string[]): Span[];
export function findLatinSpans(chars: readonly string[]): Span[];
export function segmentWords(text: string): Token[];

// src/candidates.ts
export type MutationCandidate = /* discriminated union */;
export interface AppliedMutation { /* range + replacement */ }
export function selectMutations(
  candidates: readonly MutationCandidate[],
  options: NormalizedOptions,
  rng: Rng,
): AppliedMutation[];
export function applyMutations(
  chars: readonly string[],
  mutations: readonly AppliedMutation[],
): string;

// src/typo.ts
export function buildTypoCandidates(chars: readonly string[]): MutationCandidate[];
export function materializeTypo(
  candidate: Extract<MutationCandidate, { type: "typo" }>,
  rng: Rng,
): AppliedMutation;

// src/repeat.ts
export function buildRepeatCandidates(text: string, chars: readonly string[]): MutationCandidate[];
export function materializeRepeat(
  candidate: Extract<MutationCandidate, { type: "repeat" }>,
): AppliedMutation;
```

`MutationCandidate` and `AppliedMutation` live in `src/candidates.ts`; `typo.ts` and `repeat.ts` import them. Keep `src/noisemake.ts` as orchestration, not a type dumping ground.

## MVP API

```ts
export type NoiseType = "typo" | "repeat" | "spacing" | "punct" | "swap";
export type Language = "zh" | "en";

export interface NoisemakeOptions {
  frequency?: number;
  seed?: string | number;
  types?: NoiseType[];
  languages?: Language[];
}

export function noisemake(text: string, options?: NoisemakeOptions): string;
```

Library error policy:
- The library is a pure function and should only throw for invalid options.
- Use standard errors, not a custom error hierarchy:
  - `RangeError` for invalid `frequency`.
  - `TypeError` for invalid `types` or `languages`.
- Do not silently fall back to defaults for invalid options, because that would pollute reproducible experiments.
- CLI catches these errors, prints the message to stderr, and exits `1`.

`frequency` means average noise density over tokens or perturbation candidates: `frequency: 100` means each eligible token has a `1%` chance of perturbation; `frequency: 1000` means each eligible token has a `0.1%` chance of perturbation.

Frequency behavior:
- `frequency` must be a positive integer.
- Larger `frequency` means less noise.
- Internally convert `frequency` to `probability = 1 / frequency`.
- For each eligible candidate, use the seeded RNG to decide whether it is perturbed.
- Do not force an exact number of perturbations.
- Short inputs may receive zero perturbations.
- If `frequency` is omitted, default to `200`.
- Each token/range can be perturbed at most once.
- Type weighting is implemented as an effective probability multiplier, not as a grouped type picker.
- Initial default type multipliers: `typo = 1.0`, `repeat = 0.2`, `spacing = 0.15`, `punct = 0.12`, `swap = 0.08`.
- `spacing` should cover low-cost whitespace errors that are visibly noisy but still deterministic:
  - English single space -> double space between words.
  - Punctuation-following single space -> double space.
  - Chinese-English boundary space removal, for example `这个 parser` -> `这个parser`.
  - Chinese-English boundary space insertion, for example `这个parser` -> `这个 parser`.
- `punct` should cover low-cost punctuation normalization that is visibly noisy but still deterministic:
  - Full-width Chinese punctuation -> ASCII punctuation, for example `你好，世界。` -> `你好,世界.`.
  - Do not support ASCII punctuation -> full-width Chinese punctuation.
- `swap` should cover adjacent word-order slips:
  - English adjacent words, for example `this parser` -> `parser this`.
  - Chinese adjacent words, for example `这个方案` -> `方案这个`.
  - Do not swap across punctuation or line breaks.
- Candidate trigger probability is `1 / frequency * typeMultiplier[type]`.
- User-provided `types` order does not affect these multipliers. Future custom weights should use a separate option rather than overloading order.
- More generally, each character range can be covered by at most one mutation.
- Candidate conflict handling: sort by `start` ascending, then longer range first. When a selected candidate overlaps an already selected mutation range, skip it. This protects longer Chinese phrase-level typo candidates from being split by shorter repeat candidates.

`seed` accepts `string | number`. Internally, normalize it into a stable 32-bit integer seed and use a small deterministic RNG such as `mulberry32`.

Seed behavior:
- If `seed` is provided, the same input plus same options must produce the same output.
- If `seed` is omitted, generate a random seed so normal CLI usage can vary between runs.
- String seeds are allowed for named experiments, for example `--seed baseline-zh-v1`.
- Do not add `--show-seed` in MVP. Research and agent workflows should pass `--seed` explicitly when reproducibility matters.

Language strategy:
- Default `languages = ["zh", "en"]`.
- Supported MVP values: `zh`, `en`.
- Invalid or empty `languages` fails.
- Language order does not affect behavior.
- `languages: ["zh"]` disables English keyboard typo and English repeat candidates.
- `languages: ["en"]` disables Chinese IME typo and Chinese repeat candidates.
- Disabled-language spans are skipped, not treated as errors.
- Internally use a small strategy registry, but do not expose a plugin or custom dictionary API in MVP.

## Engine Sketch

```text
noisemake(text, options)
    |
    v
normalize and validate options
    |
    v
normalize seed to uint32
    |
    v
mulberry32 RNG
    |
    v
apply typo and repeat perturbations directly
    |
    v
return transformed text
```

MVP does not emit JSON reports or operation logs. Add those later if reportability becomes important.

Internal mutation model:

```ts
type MutationCandidate =
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
    };

interface AppliedMutation {
  type: NoiseType;
  start: number;
  end: number;
  replacement: string;
}
```

Candidate flow:

```text
build mutation candidates
    |
    v
sort by start asc, longer range first
    |
    v
for each candidate:
    rng() < 1 / frequency ?
    no overlap with selected ranges ?
    materialize replacement with rng
    add AppliedMutation
    |
    v
apply selected mutations from right to left
```

## `typo` Behavior

`typo` is locale-sensitive. It is not random character replacement.

Chinese IME typo candidates and English keyboard typo candidates enter the same global candidate pool. `frequency` controls the overall typo density across mixed-language text, not a separate density per language.

### Chinese IME Typo

Chinese `typo` simulates input-method conversion mistakes: a user types a reading, then selects the wrong but plausible word or phrase.

Implementation shape:

```text
text
    |
    v
split into continuous Chinese spans
    |
    v
longest-match scan each Chinese span against vendored confusion table
    |
    v
candidate words or phrases
    |
    v
filter to high-quality replacements
    |
    v
select candidates with seeded RNG and frequency
    |
    v
replace whole words or phrases
```

Data shape:

```ts
interface ZhImeReplacement {
  text: string;
  reason: "homophone" | "near-homophone" | "same-char-homophone" | "shape";
  score: number;
}

type ZhImeConfusionMap = Record<string, readonly ZhImeReplacement[]>;
```

Keep `ZhImeReplacement` and `ZhImeConfusionMap` internal in MVP. Do not export custom dictionary APIs from `src/index.ts` until the data format has survived real use.

Rules:
- Prefer deriving Chinese IME confusion candidates from an input-method dictionary, such as an LGPL Rime dictionary, instead of hand-authoring a typo table.
- Keep source dictionary files, source URLs, license text, and transformation notes in the repo.
- Treat generated confusion maps derived from LGPL dictionary data as LGPL-covered data.
- Do not use GPL-only dictionary data in MVP.
- Prefer replacements that are homophones or near-homophones.
- Prefer replacements that are common enough to look like an input-method mistake.
- Prefer replacements with at least one shared character or visually similar character when available.
- Reject low-frequency or low-score candidates. Default threshold: `score >= 0.75`.
- Do not use rare cold words just because they are homophones.
- Use longest-match scanning rather than adding a tokenizer dependency in MVP.
- If multiple sources match at the same position, choose the longest source phrase first.
- Chinese typo matching runs over continuous Chinese spans, not only over `Intl.Segmenter` token boundaries. This allows confusion entries such as multi-token phrases to match.
- Chinese typo sources must be at least 2 characters long in MVP. Do not perturb single-character Chinese words by default.

### English Keyboard Typo

English `typo` simulates mechanical keyboard mistakes only.

English typo data:
- Use a self-maintained QWERTY adjacency map in `src/data/en-keyboard.ts`.
- Do not use a common-misspellings dictionary in MVP.
- Do not add a `keyboardLayout` option in MVP. QWERTY is the only supported layout.
- Future layouts, such as AZERTY or Dvorak, can be added as a separate option later if there is demand.

Supported MVP operations:
- adjacent-key substitution, for example `a` can become nearby QWERTY keys.
- adjacent character transposition, for example `the` -> `teh`.
- adjacent-key insertion inside the word, for example `stable` -> `stqable`.
- duplicate character, for example `hello` -> `helllo`.
- delete character, for example `because` -> `becuse`.

Default operation weights:

```ts
{
  substitute: 0.35,
  transpose: 0.3,
  insert: 0.15,
  duplicate: 0.1,
  delete: 0.1,
}
```

Rules:
- Only operate on ASCII alphabetic word spans.
- Only operate on words with length `>= 3`.
- Only allow delete operations on words with length `>= 4`.
- Preserve case where practical.
- Do not implement semantic confusions like `their/there`, `your/you're`, or `its/it's` in MVP.
- Do not run English typo logic on Chinese characters, punctuation, emoji, or numbers.
- Use deterministic RNG for operation choice, position choice, and replacement choice.
- Mixed-script tokens should be split into Chinese spans and ASCII alphabetic spans before typo candidate generation. Chinese spans use IME confusion; ASCII alphabetic spans use keyboard typo logic.
- QWERTY adjacency data tests should verify coverage for `a-z`, no self replacements, and lowercase alphabetic replacements only.

## `repeat` Behavior

`repeat` repeats words or short phrases, not arbitrary single Chinese characters.

MVP should use real tokenization for repeat candidates:
- Chinese repeat candidates come from tokenizer output, then pass a quality filter.
- English repeat candidates come from ASCII word spans.
- Do not repeat punctuation, whitespace, numbers, emoji, or arbitrary single Chinese characters.
- Prefer short natural tokens over long spans.
- Replacement format:
  - Chinese: `token + token`, no inserted space.
  - English: `token + " " + token`, preserving the original token text.

Tokenizer decision:
- Use `Intl.Segmenter` as the default tokenizer for MVP.
- Do not add a native tokenizer such as jieba in MVP.
- Validate `Intl.Segmenter` quality with sample Chinese sentences before relying on repeat output quality.
- If `Intl.Segmenter` is unavailable in a supported runtime, disable Chinese repeat candidates with a clear internal fallback rather than guessing from single characters.

Observed on local Node during planning:
- `这个方案可以先做 CLI` segments into `这个`, `方案`, `可以`, `先`, `做`, `CLI`.
- `我觉得这个实现路径比较稳定` segments into `我`, `觉得`, `这个`, `实现`, `路径`, `比较`, `稳定`.
- `网页版` may segment as `网页`, `版`; acceptable for MVP, but tests should capture this boundary.

## Required Tests

Suggested test layout:

```text
test/
├── unit/
│   ├── options.test.ts
│   ├── rng.test.ts
│   ├── typo.test.ts
│   ├── repeat.test.ts
│   └── noisemake.test.ts
├── cli.test.ts
├── package.test.ts
└── fixtures/
    ├── esm-consumer.mjs
    └── cjs-consumer.cjs
```

`package.test.ts` should run after build and execute the ESM/CJS fixtures against `dist/`.

Test command split:

```json
{
  "scripts": {
    "build": "tsdown",
    "test": "vitest run",
    "test:unit": "vitest run test/unit",
    "test:dist": "npm run build && vitest run test/cli.test.ts test/package.test.ts",
    "check": "npm run test:unit && npm run test:dist",
    "prepublishOnly": "npm run check"
  }
}
```

Unit tests exercise source modules. CLI and package import tests exercise built `dist/` output so shebang, bin, ESM, and CJS packaging issues are caught before publish.

- Same input plus same options plus same seed returns the same output.
- Multiple fixed seeds should be tested against a sufficiently long sample to prove the perturbation path can produce changes without making tests depend on one lucky seed.
- Short text with `frequency` larger than the candidate count may return input unchanged.
- Empty string returns empty string.
- Invalid `frequency` values, including `0`, negative numbers, decimals, and non-numeric input, fail.
- `frequency: 1` perturbs every eligible candidate, unless prevented by overlap or safety filters.
- Invalid or empty `types` fails.
- Duplicate `types` are deduped.
- Invalid or empty `languages` fails.
- Duplicate `languages` are deduped.
- CLI writes only transformed text to stdout.
- CLI preserves trailing newlines and surrounding whitespace from input.
- CLI errors write to stderr and exit non-zero.
- Both positional argument and stdin returns a usage error.
- Built package can be imported from ESM.
- Built package can be required from CJS.
- Vendored Chinese word/phrase confusion-set data has source/license attribution and automated shape validation.
- English keyboard typo uses a local adjacency map and does not include semantic English confusions such as `their/there` in MVP.
- Runtime-neutral core modules do not import `process`, `fs`, or other Node-only APIs.

Suggested data/license layout:

```text
third_party/rime-luna-pinyin/
├── LICENSE
├── SOURCE.md
└── luna_pinyin.dict.yaml

tools/build-zh-ime-confusions.ts
src/data/zh-ime-confusions.generated.ts
NOTICE
```

Runtime must not parse the Rime dictionary. Runtime imports the generated compact map from `src/data/zh-ime-confusions.generated.ts`.

Generation script responsibilities:

```text
tools/build-zh-ime-confusions.ts
    |
    ├── read third_party/rime-luna-pinyin/luna_pinyin.dict.yaml
    ├── parse dictionary entries
    ├── normalize pinyin
    ├── group by normalized pinyin
    ├── compute scores
    ├── filter by score and quality rules
    ├── keep top 5 replacements
    └── write src/data/zh-ime-confusions.generated.ts
```

Rime dictionary parsing:
- Do not add a YAML parser. Skip header lines until the first line equal to `...`, then parse the tabular body.
- Skip empty lines and comment lines.
- Split entries by tab.
- `col[0]` is `word`.
- `col[1]` is `pinyin`.
- `col[2]` is `weight` when present and numeric.
- If `weight` is missing or invalid, keep the entry with fallback `weight = 1`.
- Keep only all-Han words with length `>= 2`.
- Require non-empty pinyin and non-empty normalized pinyin.

Generated file header:

```ts
// Generated by tools/build-zh-ime-confusions.ts.
// Source: rime/rime-luna-pinyin luna_pinyin.dict.yaml
// License: LGPL-3.0
// Do not edit manually.
```

npm package contents:
- Include generated data plus license/source/notice files.
- Do not include the full raw Rime dictionary in the npm tarball by default.
- Keep the raw Rime dictionary in the git repo so generation is reproducible.
- Commit both the raw dictionary and generated map to git.
- Exclude the raw dictionary from the npm tarball via the package `files` list.

Chinese confusion generation defaults:

```text
parse dictionary lines
    |
    v
keep entries with word length >= 2
    |
    v
keep entries with pinyin and usable frequency
    |
    v
group by normalized pinyin
    |
    v
for each source word:
    candidates = same-pinyin words
    reject self
    reject too-low-frequency candidates
    reject length distance > 1
    score remaining candidates
    keep candidates with score >= 0.75
    keep top 5
```

Source filtering:
- Source words only need to pass the base filters: all-Han, length `>= 2`, pinyin present, normalized pinyin present.
- Do not require a minimum source frequency in MVP.
- Candidate quality is controlled by score filtering.

Initial score:

```text
score =
  frequencyScore * 0.60 +
  sharedCharScore * 0.25 +
  lengthSimilarityScore * 0.15
```

Score components:

```ts
frequencyScore =
  Math.log1p(candidate.weight) / Math.log1p(maxWeightInPinyinGroup);

sharedCharScore =
  sharedCharCount(source, candidate) / Math.max(source.length, candidate.length);

lengthSimilarityScore =
  1 - Math.abs(source.length - candidate.length) / Math.max(source.length, candidate.length);
```

Do not infer shape similarity unless the selected data source contains reliable shape-neighbor metadata.

Do not require shared characters between source and candidate. Shared characters improve score, but high-frequency same-pinyin candidates without shared characters may still pass if their total score is high enough.

Generate the full confusion map from the selected source in MVP. Do not add package-size warnings or hard output-size limits until the first real generation result is inspected.

Pinyin normalization:
- Lowercase.
- Remove spaces.
- Remove tone marks.
- Remove tone digits.
- Normalize `ü` consistently before grouping.
- Group by toneless pinyin. This better matches pinyin input-method candidate pools; quality filtering handles noisy homophones.

## Build And Package

Dependencies:
- TypeScript.
- Vitest for tests.
- `tsdown` for build output.
- No native tokenizer in MVP.
- Commander for CLI parsing. Keep it isolated to `src/cli.ts`; runtime-neutral core modules must not depend on it.

Build strategy:
- Use two tsdown build targets.
- Library target: `src/index.ts`, ESM + CJS, declaration output, no shebang.
- CLI target: `src/cli.ts`, ESM only, shebang banner, no declaration output.
- Verify actual tsdown output filenames during implementation before finalizing `package.json` exports.

Expected package surface:

```json
{
  "name": "noisemake",
  "type": "module",
  "bin": {
    "noisemake": "./dist/cli.js"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "engines": {
    "node": ">=22"
  }
}
```

## Not In Scope For MVP

- JSON report output.
- Batch directory processing.
- LLM rewriting.
- Detector integration.
- Streaming multi-GB corpora.
- `filler` / discourse marker insertion. Natural placement for words like `其实`, `就是`, `感觉`, and `所以` requires semantic context; random insertion is more likely to look fake than useful.
- Weighted `--types`, such as `typo:0.8,repeat:0.2`.
- Independent `packages/*` workspace layout.
