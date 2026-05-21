# noisemake

<p align="center">
  <img src="https://raw.githubusercontent.com/sorcererxw/noisemake/main/web/public/logo.png" alt="noisemake logo" width="120" />
</p>

> [中文文档](README.zh-CN.md)

`noisemake` injects controlled, reproducible imperfections into text.

It is a TypeScript CLI and npm library for deterministic text perturbation in LLM
text rewriting workflows. Provide a seed when you need stable output for the same
input and options.

## Background

AI-generated text is often too polished and smooth for testing, prototyping, or
simulating real user input. `noisemake` exists for cases where you already have
text and need it to feel more hand-typed by adding controlled imperfections,
while keeping the original wording and structure recognizable.

The current package supports:

- Chinese IME-style wrong-word substitutions
- English keyboard typos, including insertion-like slips
- Spacing glitches in English words, after punctuation, and across Chinese-English boundaries
- Punctuation normalization from full-width Chinese marks to ASCII marks
- Adjacent word swaps
- Light repetition

The browser playground is live at [`https://noisemake.xyz`](https://noisemake.xyz).

## Quick Start

CLI:

```bash
npx noisemake "This parser stays stable under repeated tests." --frequency 200 --seed baseline
echo "This is a small test sentence." | npx noisemake --frequency 1000 --seed 42
npx noisemake --file ./input.txt --seed 42
npx noisemake --file ./input.txt --out ./output.txt --seed 42
```

Options:

```text
--frequency <n>     Average one perturbation per n eligible tokens (default: "200")
--seed <seed>       Seed for deterministic output
--types <list>      Enabled noise types: typo,repeat,spacing,punct,swap (default: "typo,repeat,spacing,punct,swap")
--languages <list>  Enabled languages: zh,en (default: "zh,en")
--file <path>       Read input text from a UTF-8 file
--out <path>        Write output text to a UTF-8 file, creating parent directories if needed
-h, --help          Show help
```

Input and output:

- Use exactly one input source: positional text, stdin, or `--file <path>`.
- Multiple positional text arguments are joined with a single space.
- `--file` reads UTF-8 text from a file.
- `--out` writes UTF-8 output to a file instead of stdout, and creates parent directories if needed.
- Input formatting is preserved. Existing trailing newlines stay unchanged.
- `--frequency 100` is noisier than `--frequency 1000`.
- Short text can legitimately produce no changes.

Library:

```ts
import { noisemake } from "noisemake";

const output = noisemake("This parser stays stable under repeated tests.", {
  frequency: 200,
  seed: "baseline",
  types: ["typo", "repeat"],
  languages: ["zh", "en"],
});
```

## License

The project code is MIT. Bundled Chinese IME confusion data is derived from
LGPL-3.0-or-later Rime dictionary data and remains LGPL-covered data. See
[NOTICE](NOTICE), [third_party/rime-luna-pinyin/SOURCE.md](third_party/rime-luna-pinyin/SOURCE.md),
and [third_party/rime-pinyin-simp/SOURCE.md](third_party/rime-pinyin-simp/SOURCE.md).
