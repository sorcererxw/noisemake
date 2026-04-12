# noisemake

`noisemake` injects controlled, reproducible imperfections into text so polished writing can look less mechanically AI-generated.

It is both a CLI and an npm library. The MVP supports Chinese IME-style wrong-word substitutions, English keyboard typos, and light word repetition.

## CLI

```bash
npx noisemake "这个 parser 很 stable" --frequency 200 --seed baseline
echo "这是一段测试文本" | npx noisemake --frequency 1000 --seed 42
```

Options:

```text
--frequency <n>    Average one perturbation per n eligible tokens (default: 200)
--seed <seed>      Seed for deterministic output
--types <list>     Enabled noise types: typo,repeat (default: typo,repeat)
--languages <list> Enabled languages: zh,en (default: zh,en)
--help             Show help
```

## Library

```ts
import { noisemake } from "noisemake";

const output = noisemake("这个 parser 很 stable", {
  frequency: 200,
  seed: "baseline",
  types: ["typo", "repeat"],
  languages: ["zh", "en"],
});
```

## Data License

The project code is MIT. Bundled Chinese IME confusion data is derived from LGPL-3.0 Rime dictionary data and remains LGPL-covered data. See `NOTICE` and `third_party/rime-luna-pinyin/SOURCE.md`.
