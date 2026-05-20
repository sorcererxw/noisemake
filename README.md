# noisemake

<p align="center">
  <img src="https://raw.githubusercontent.com/sorcererxw/noisemake/main/web/public/logo.png" alt="noisemake logo" width="120" />
</p>

`noisemake` injects controlled, reproducible imperfections into text.

It is a TypeScript CLI and npm library for deterministic text perturbation, not an
LLM rewriting tool. Same input, same seed, same options, same output.

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
npx noisemake "这个 parser 很 stable" --frequency 200 --seed baseline
echo "这是一段测试文本" | npx noisemake --frequency 1000 --seed 42
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

const output = noisemake("这个 parser 很 stable", {
  frequency: 200,
  seed: "baseline",
  types: ["typo", "repeat"],
  languages: ["zh", "en"],
});
```

## Documentation

If you just want to use the package:

- This README is enough for the public surface.

If you want to understand how the package is shaped:

- [Documentation map](docs/README.md)
- [Core docs index](docs/core/README.md)
- [Core repo map](docs/core/repo-map.md)
- [Core package plan and decisions](docs/core/plan.md)
- [Core history and superseded assumptions](docs/core/history.md)

If you want to work on the web playground:

- [Live web playground](https://noisemake.xyz)
- [Web docs index](docs/web/README.md)
- [Web package plan](docs/web/plan.md)
- [Web design system](docs/web/design-system.md)
- [Web design brief](docs/web/design-brief.md)
- [Web implementation spec](docs/web/implementation-spec.md)
- [Web package commands](web/README.md)

If you want research context:

- [Research notes index](docs/research/README.md)
- [docs/research](docs/research)

If you need licensing and bundled data provenance:

- [Legal and data-boundary docs](docs/legal/README.md)
- [License boundary summary](docs/legal/license-boundary.md)
- [NOTICE](NOTICE)
- [Rime Luna source note](third_party/rime-luna-pinyin/SOURCE.md)
- [Rime Pinyin Simplified source note](third_party/rime-pinyin-simp/SOURCE.md)

If you are changing code in this repo:

- [AGENTS.md](AGENTS.md)

## Data License

The project code is MIT. Bundled Chinese IME confusion data is derived from
LGPL-3.0-or-later Rime dictionary data and remains LGPL-covered data. See
[NOTICE](NOTICE), [third_party/rime-luna-pinyin/SOURCE.md](third_party/rime-luna-pinyin/SOURCE.md),
and [third_party/rime-pinyin-simp/SOURCE.md](third_party/rime-pinyin-simp/SOURCE.md).
