# noisemake

<p align="center">
  <img src="https://raw.githubusercontent.com/sorcererxw/noisemake/main/web/public/logo.png" alt="noisemake logo" width="120" />
</p>

> [English README](README.md)

`noisemake` 用可控、可复现的方式给文本注入瑕疵。

它是一个用于 LLM 文本改写工作流的确定性文本扰动 TypeScript CLI 和 npm library。
需要同一输入和选项得到稳定输出时，请显式传入 seed。

## 项目背景

现在 AI 生成的文本经常过于精致、平滑，不适合测试、原型验证，或模拟真实用户输入。
`noisemake` 面向的是已经有文本、但需要让它更像手写输入的场景：通过可控瑕疵降低
AI 文本的平滑感，同时尽量保留原文的措辞和结构。

当前 package 支持：

- 中文输入法风格的错词替换
- 英文键盘拼写错误，包括类似误插入的输入滑误
- 英文单词内部、标点后、中英文边界处的空格异常
- 从中文全角标点到 ASCII 标点的标点归一化
- 相邻词交换
- 轻微重复

浏览器 Playground 已上线：[`https://noisemake.xyz`](https://noisemake.xyz)。

## 快速开始

命令行：

```bash
npx noisemake "这是一段用于测试的中文文本。" --frequency 200 --seed baseline
echo "这是一段测试文本" | npx noisemake --frequency 1000 --seed 42
npx noisemake --file ./input.txt --seed 42
npx noisemake --file ./input.txt --out ./output.txt --seed 42
```

选项：

```text
--frequency <n>     平均每 n 个可扰动 token 产生一次扰动（默认："200"）
--seed <seed>       用于确定性输出的 seed
--types <list>      启用的噪声类型：typo,repeat,spacing,punct,swap（默认："typo,repeat,spacing,punct,swap"）
--languages <list>  启用的语言：zh,en（默认："zh,en"）
--file <path>       从 UTF-8 文件读取输入文本
--out <path>        将输出文本写入 UTF-8 文件，并按需创建父目录
-h, --help          显示帮助
```

输入和输出：

- 只能使用一个输入来源：位置参数文本、stdin，或 `--file <path>`。
- 多个位置参数文本会用单个空格拼接。
- `--file` 从文件读取 UTF-8 文本。
- `--out` 将 UTF-8 输出写入文件而不是 stdout，并按需创建父目录。
- 输入格式会被保留。已有的末尾换行会保持不变。
- `--frequency 100` 比 `--frequency 1000` 噪声更高。
- 短文本完全可能不产生任何变化，这是正常结果。

库用法：

```ts
import { noisemake } from "noisemake";

const output = noisemake("这是一段用于测试的中文文本。", {
  frequency: 200,
  seed: "baseline",
  types: ["typo", "repeat"],
  languages: ["zh", "en"],
});
```

## License

项目代码使用 MIT license。内置中文输入法混淆数据派生自
LGPL-3.0-or-later Rime 词典数据，并仍然属于 LGPL 覆盖的数据。见
[NOTICE](NOTICE)、[third_party/rime-luna-pinyin/SOURCE.md](third_party/rime-luna-pinyin/SOURCE.md)
和 [third_party/rime-pinyin-simp/SOURCE.md](third_party/rime-pinyin-simp/SOURCE.md)。
