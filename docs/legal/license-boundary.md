# License Boundary

`noisemake` has a mixed boundary between project code and bundled language data.

## Short Version

- The repo's original source code is MIT-licensed.
- The Chinese IME confusion dataset is generated from vendored third-party Rime
  dictionaries.
- Because bundled generated data is derived from those sources, the published
  package must not be described as pure MIT.

## What Lives Where

Project-owned code:

- `src/*.ts` except bundled/generated data files
- `tools/*.ts`
- `web/src/*`
- tests, docs, and build config

Bundled third-party source data and provenance:

- `third_party/rime-luna-pinyin/*`
- `third_party/rime-pinyin-simp/*`
- `NOTICE`

Generated data with third-party lineage:

- `src/data/zh-ime-confusions.generated.ts`

## Current Practical Rule

When talking about the package:

- Do say: "MIT code with bundled third-party Chinese IME data."
- Do say: "See NOTICE and third_party source notes for data provenance."
- Do not say: "The npm package is pure MIT."

## Why `package.json` Uses A Mixed License Expression

The package publishes both project code and generated data derived from upstream
dictionaries. That is why the package metadata uses:

```json
"license": "MIT AND LGPL-3.0-or-later"
```

That expression is about the published package contents, not a claim that every
file in the repo shares the same terms.

## Source Notes

- `rime-luna-pinyin` provenance:
  [third_party/rime-luna-pinyin/SOURCE.md](../../third_party/rime-luna-pinyin/SOURCE.md)
- `rime-pinyin-simp` provenance:
  [third_party/rime-pinyin-simp/SOURCE.md](../../third_party/rime-pinyin-simp/SOURCE.md)

If this boundary changes in the future, update this file, `NOTICE`, and any
public-facing copy together.
