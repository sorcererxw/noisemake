# Legal And Data Boundary

This section explains the repo's mixed-license boundary in plain language.

Read this when you need to answer any of these questions:

- Is `noisemake` pure MIT?
- Why does `package.json` use a mixed license expression?
- Which files are project code vs bundled data?
- What can be said publicly about the package license?

## Read Order

1. [license-boundary.md](license-boundary.md) for the short explanation
2. [../../NOTICE](../../NOTICE) for the shipped notice text
3. [../../third_party/rime-luna-pinyin/SOURCE.md](../../third_party/rime-luna-pinyin/SOURCE.md)
4. [../../third_party/rime-pinyin-simp/SOURCE.md](../../third_party/rime-pinyin-simp/SOURCE.md)

## Rule Of Thumb

- Project code: MIT
- Bundled Chinese IME source data: third-party licensed
- Generated Chinese confusion data derived from that source: not pure MIT

If you are unsure how to describe the package, say it is a mixed-license package
with MIT code and bundled third-party data coverage. That is the safe summary.
