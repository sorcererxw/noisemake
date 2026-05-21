# 调研报告：Combating Adversarial Misspellings with Robust Word Recognition

调研日期：2026-04-13

## 来源

- 论文：Combating Adversarial Misspellings with Robust Word Recognition, ACL 2019  
  https://aclanthology.org/P19-1561/
- 论文 PDF  
  https://aclanthology.org/P19-1561.pdf
- 作者代码仓库  
  https://github.com/danishpruthi/Adversarial-Misspellings

## 对 noisemake 的结论

不要把论文里的 robust word recognition 模型直接并入 noisemake 核心。

论文的主目标是防御 adversarial misspellings：在下游 NLP 模型前面加一层词识别/纠错模块，把攻击性拼写归一化回原词。noisemake 的目标相反，是生成可控、可复现的文本扰动。引入词识别模型会带来训练语料、词表、模型权重、backoff 策略和运行时体积问题，也会把核心引擎从静态规则扰动推向模型推断。这不符合当前产品边界。

更适合吸收的是论文攻击侧的字符扰动约束。它们能让 noisemake 的英文 typo 更像有意构造的可读 misspelling，同时保持纯规则、静态数据和确定性 RNG。

## 论文里值得借鉴的算法点

论文攻击侧围绕英文词内部字符做扰动，重点是生成能欺骗模型但人仍可读的 misspelling。对 noisemake 有价值的规则是：

- 只扰动词内部字符，保留首字符和尾字符。
- 跳过 stopwords。
- 跳过长度小于 4 的词。
- 使用字符级扰动操作：相邻字符交换、字符删除、键盘邻近替换、字符插入。
- 扰动预算应由外部概率/频率控制，而不是强行保证每个句子都有变化。

这些规则和 noisemake 当前的候选池 + seeded RNG 设计兼容。

## 当前 noisemake 差距

当前英文 typo 逻辑在 `src/typo.ts`：

- 候选词来自 ASCII latin spans，长度门槛是 `>= 3`。
- 支持操作是 `substitute | transpose | duplicate | delete`。
- `substitute`、`transpose`、`duplicate`、`delete` 都可能改到首字符或尾字符。
- 没有 stopword 过滤。
- `duplicate` 更像重复某个已有字符，不完全等价于论文里的 arbitrary add/insert。

当前选择框架在 `src/candidates.ts` 已经合适：

- 候选按位置排序。
- 用 `1 / frequency * typeMultiplier * weight` 做独立采样。
- 通过 seeded RNG 决定是否命中以及如何 materialize。
- 避免候选范围重叠。
- 从右到左应用 mutation，避免早期替换移动后续索引。

这部分不建议改。

## 建议改法

### 1. 英文 typo 只改内部字符

把英文 typo 操作的可编辑范围收窄到词内部：

- `substitute`: 可选索引 `1..length - 2`
- `delete`: 可选索引 `1..length - 2`
- `transpose`: 可选起点 `1..length - 3`，交换 `index` 和 `index + 1`
- `insert`: 可选插入点 `1..length - 1`

这样 `stable` 可以变成 `satble`、`stbale`、`stale`、`stabkle`，但不应变成首尾损坏的形式。

### 2. 候选词门槛改为长度 `>= 4`

把英文 typo candidate 过滤从 `span.text.length >= 3` 改为 `span.text.length >= 4`。

原因：

- 论文跳过短词。
- 三字母词扰动后可读性更差。
- 当前测试里 `CLI` 会进入候选池，按这个规则应被跳过。

### 3. 加静态 stopword 过滤

新增小型内置 stopword set，不引入运行时依赖，不下载数据。

建议先覆盖常见 function words，例如：

```text
a, an, and, are, as, at, be, but, by, for, from, has, have, he, her, his, i,
in, is, it, its, of, on, or, she, that, the, their, them, they, this, to,
was, we, were, with, you, your
```

这类列表应保留在 `src/typo.ts` 或 `src/data/en-stopwords.ts`。如果未来需要扩展，再考虑单独数据文件。

### 4. 用 `insert` 替换或补充 `duplicate`

论文里的 add 是插入字符，不是只能重复已有字符。对 noisemake 来说有两种可选实现：

- 保守版本：把 `duplicate` 改名/改义为 `insert`，在词内部插入一个相邻键或随机 ASCII 小写字母。
- 兼容版本：保留 `duplicate`，新增 `insert`，重新分配权重。

如果不想改变已有输出分布太多，建议先采用兼容版本：

```ts
type EnglishTypoOperation =
  | "substitute"
  | "transpose"
  | "duplicate"
  | "delete"
  | "insert";
```

然后降低 `duplicate` 权重，把一部分权重给 `insert`。例如：

```ts
{
  substitute: 0.35,
  transpose: 0.3,
  insert: 0.15,
  duplicate: 0.1,
  delete: 0.1,
}
```

如果希望更贴近论文，则可以移除 `duplicate`，把操作集改成：

```ts
{
  substitute: 0.35,
  transpose: 0.3,
  insert: 0.2,
  delete: 0.15,
}
```

### 5. 保持 API 不变

不建议新增公开选项，例如 `mode: "adversarial"` 或 `preserveEdges`。

原因：

- 这是英文 typo 的质量改进，不需要扩大 public API。
- 当前 `frequency`、`types`、`languages` 已能表达用户意图。
- API 扩大会给 CLI、README、web copy 和 dist 测试增加额外维护面。

## 测试计划

更新或新增 `test/unit/typo.test.ts`：

- 英文候选只包含长度 `>= 4` 的词。
- 常见 stopwords 不进入英文 typo 候选。
- 英文 typo materialize 后保留原词首字符和尾字符。
- 同一 seed 下 materialize 结果保持确定。
- `insert` 或 `duplicate` 操作不会在词首前或词尾后生成扰动。

更新或新增 `test/unit/noisemake.test.ts`：

- `languages: ["zh"]` 仍不改英文。
- `languages: ["en"]` 仍不改中文。
- 同一 input/options/seed 仍输出一致。
- 低噪声频率仍可返回原文。

建议先跑：

```bash
pnpm run test:unit
```

如果改动会影响 dist fixtures 或 README 示例输出，再跑：

```bash
pnpm run test:dist
```

## 非目标

- 不引入 ScRNN 或其他 word recognition 模型。
- 不引入训练语料、词表下载或 runtime data downloads。
- 不新增英文 common-misspellings dictionary。
- 不改变中文 IME confusion 逻辑。
- 不改变 candidate selection、overlap resolution 或 mutation application 顺序。
- 不改变 CLI stdout/stderr 行为。

## 推荐实施顺序

1. 在英文 typo candidate 阶段加长度 `>= 4` 和 stopword 过滤。
2. 把英文 typo materialization 的索引选择限制到词内部。
3. 新增 `insert` 操作，或把 `duplicate` 调整为更接近插入型扰动。
4. 更新 unit tests。
5. 运行 `pnpm run test:unit`。
