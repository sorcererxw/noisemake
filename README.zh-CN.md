# noisemake

<p align="center">
  <img src="https://raw.githubusercontent.com/sorcererxw/noisemake/main/web/public/logo.png" alt="noisemake logo" width="120" />
</p>

> [English README](README.md)

`noisemake` 用可控、可复现的方式给文本注入瑕疵。

它是一个用于确定性文本扰动的 TypeScript CLI 和 npm library，不是 LLM 改写工具。
同样的输入、同样的 seed、同样的选项，会得到同样的输出。

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

## 文档

如果你只是想使用这个 package：

- 这份 README 已覆盖公开使用界面。

如果你想理解 package 的设计形态：

- [文档地图](docs/README.md)
- [Core 文档索引](docs/core/README.md)
- [Core repo 地图](docs/core/repo-map.md)
- [Core package 计划与决策](docs/core/plan.md)
- [Core 历史与已废弃假设](docs/core/history.md)

如果你想开发 web playground：

- [线上 web playground](https://noisemake.xyz)
- [Web 文档索引](docs/web/README.md)
- [Web package 计划](docs/web/plan.md)
- [Web 设计系统](docs/web/design-system.md)
- [Web 设计简报](docs/web/design-brief.md)
- [Web 实现规格](docs/web/implementation-spec.md)
- [Web package 命令](web/README.md)

如果你想了解研究背景：

- [研究笔记索引](docs/research/README.md)
- [docs/research](docs/research)

如果你需要 license 和内置数据来源信息：

- [法律与数据边界文档](docs/legal/README.md)
- [License 边界摘要](docs/legal/license-boundary.md)
- [NOTICE](NOTICE)
- [Rime Luna 来源说明](third_party/rime-luna-pinyin/SOURCE.md)
- [Rime Pinyin Simplified 来源说明](third_party/rime-pinyin-simp/SOURCE.md)

如果你要修改这个 repo 的代码：

- [AGENTS.md](AGENTS.md)

## 数据 License

项目代码使用 MIT license。内置中文输入法混淆数据派生自
LGPL-3.0-or-later Rime 词典数据，并仍然属于 LGPL 覆盖的数据。见
[NOTICE](NOTICE)、[third_party/rime-luna-pinyin/SOURCE.md](third_party/rime-luna-pinyin/SOURCE.md)
和 [third_party/rime-pinyin-simp/SOURCE.md](third_party/rime-pinyin-simp/SOURCE.md)。
