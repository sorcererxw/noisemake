# 调研报告：Evaluating Robustness of Large Language Models Against Multilingual Typographical Errors

调研日期：2026-04-13

## 来源

- 论文：Evaluating Robustness of Large Language Models Against Multilingual Typographical Errors  
  https://arxiv.org/abs/2510.09536
- 论文 PDF  
  https://arxiv.org/pdf/2510.09536
- 作者代码仓库  
  https://github.com/mainlp/Multypo-Eval

## 对 noisemake 的结论

不要直接把论文的 MulTypo 算法搬进 noisemake 核心。更合适的做法是吸收它的抽样原则，同时保留 noisemake 当前的产品边界：

```text
same input + same seed + same options = same output
```

论文目标是评估 LLM 在多语言键盘 typo 下的鲁棒性；noisemake 目标是生成可控、可复现的文本扰动。两者方向相近，但接口语义不同。论文使用 typo rate 来决定要插入多少 typo；noisemake 使用 `frequency` 对候选 mutation 做 seeded Bernoulli 采样。因此不建议把 `frequency` 改成论文式的固定 typo 数量或腐蚀率。

最有价值的迁移点：

- 按词长或短语长度给候选加权，长词更容易出 typo。
- 避开数字和数字词，避免把评测任务里的关键数值语义改掉。
- 对英文使用更像打字行为的 typo 类型、键盘邻键和词内位置权重。
- 对中文保留 IME / 拼音词级混淆，不要套用字母键盘字符邻键。

## 论文要点

MulTypo 是一个面向多语言键盘 typo 的生成算法。它模拟四类常见 typo：

- replacement：用同一键盘行的邻近键替换字符。
- insertion：在正确字符后插入邻近键字符。
- deletion：删除一个字符。
- transposition：交换相邻字符，并偏向左右手交替打字导致的相邻交换。

抽样过程分三层：

- word sampling：词被选中的概率与 `sqrt(word length)` 成正比。
- position sampling：词首字符权重为 0，第二个字符权重为 0.1，词尾权重为 0.2，中间位置线性插值，整体偏向中后部。
- operation sampling：insertion 权重 15.25%，replacement、deletion、transposition 各 28.25%。

论文还定义了 language-specific ignoring string sets，主要覆盖数字和数字词。动机是：如果把题目里的关键数字改掉，模型失败可能来自语义被破坏，而不是 typo 鲁棒性下降。

人类自然度评测覆盖英语、德语、法语、希腊语、俄语、阿拉伯语、印地语。结果显示 MulTypo 在大多数语言中比随机 typo baseline 更自然；高 typo rate 会降低自然度，但 MulTypo 仍然比 naive baseline 更接近真实打字错误。

## 当前 noisemake 差距

当前英文路径在 `src/typo.ts`：

- 英文候选来自 ASCII latin spans，长度门槛是 `>= 3`。
- 操作是 `substitute | transpose | duplicate | delete`。
- `substitute` 使用 QWERTY 邻键，但邻键表包含上下左右等邻接，不是论文里更保守的同排左右邻键。
- `transpose` 没有限制左右手交替。
- `duplicate` 是重复已有字符，不等同于论文里的 insertion。
- 候选等权，没有 `sqrt(length)` 这类长度偏置。
- 没有跳过英文数字词。

当前中文路径：

- 中文候选来自 `ZH_IME_CONFUSIONS` 的词/短语级同音或近同音混淆。
- 生成数据来自 Rime luna-pinyin，保存在 `src/data/zh-ime-confusions.generated.ts`。
- 生成脚本 `tools/build-zh-ime-confusions.ts` 已经为每个 replacement 计算了 `score`，但运行时 materialize 目前是均匀 `rng.pick`，没有使用该分数。
- 候选等权；最长匹配后会跳过对应范围。
- 有一批手写 fallback，用于补现代简体常见词。

当前 `src/candidates.ts` 的选择框架不建议重写：

- 候选按位置排序。
- 用 `1 / frequency * typeMultiplier * weight` 做独立采样。
- 使用 seeded RNG。
- 避免重叠候选。
- 从右到左应用 mutation，避免索引位移。

这部分已经契合 noisemake 的确定性承诺。

## 英文建议

英文可以较直接地吸收 MulTypo：

1. 把英文候选权重从 `1` 改成 `sqrt(token length)`。  
   注意这在 noisemake 里不是归一化概率，而是相对候选权重，会被 `frequency` 和 `typeMultipliers.typo` 继续缩放。

2. 增加英文 ignoring set。  
   先覆盖数字词和数量级词，例如 `zero`、`one`、`two`、`hundred`、`thousand`、`million`、`billion`。不建议一开始加大而泛的 stopword 过滤，因为 noisemake 不是 adversarial attack 工具，过多过滤会让低频率下更难产生变化。

3. 把 typo operation 调整到论文四类：`replace | insert | delete | transpose`。  
   如果担心输出分布变化太大，可先保留 `duplicate` 并新增 `insert`，但长期更建议用 `insert` 取代 `duplicate`。

4. 对英文位置采样加入词内权重。  
   保留词首，偏向中后部。是否保留词尾需要权衡：论文给词尾 0.2 权重，2019 robust word recognition 的思路通常保留首尾。对 noisemake 来说，建议优先采用论文权重，因为本任务是模拟真实 typo，不是保持人类可读 adversarial misspelling。

5. 对 replacement / insertion 使用同一行左右邻键。  
   当前 `QWERTY_ADJACENT` 范围更宽，会生成上下行误触。MulTypo 更保守，认为水平邻键更常见。可以新增一个内部 helper 从 `qwertyuiop`、`asdfghjkl`、`zxcvbnm` 取左右邻键，而不是删除现有数据文件。

6. 对 transposition 只交换左右手交替字符。  
   这更贴近论文假设，但需要一个键位到左手/右手的静态映射。

## 中文建议

中文不应直接套用 MulTypo 的键盘字符模型。论文没有中文评测语言；它的主要机制依赖 language-specific keyboard layout 和 alphabetic character positions。中文输入错误更常见于拼音输入、候选词选择、同音/近音替换、分词边界和简繁/异体字数据质量，而不是对汉字做邻键字符替换。

更适合 noisemake 的中文改进是：

1. 保留 IME 词/短语级混淆作为核心策略。  
   `zh-ime` 当前的抽象是对的：用拼音归一化后的同音词/近似词作为 replacement，而不是改单个汉字笔画或随机替换。

2. 使用 generated replacement `score` 做加权选择。  
   `tools/build-zh-ime-confusions.ts` 已经综合候选词频、共享字符、长度相似度生成 `score`。运行时如果继续均匀选择，会浪费这部分质量信号。建议把 `rng.pick(candidate.replacements)` 改成按 `replacement.score` 加权的 deterministic pick。

3. 中文候选也可以按 `sqrt(phrase length)` 加权，但要谨慎。  
   对英文，长词更容易打错；对中文 IME，长短语误选也可能发生，但过度偏向长短语会放大 Rime 数据里的罕见长词。建议先只在候选长度 2 到 4 的常见短语范围内加权，或者对 `sqrt(length)` 做上限，例如 `min(2, sqrt(length))`。

4. 增加中文数字保护。  
   论文跳过数字和数字词，这一点可以迁移。中文侧建议从保守规则开始：只跳过纯数字汉字短语，例如 `五百`、`一千`、`三十`，以及包含阿拉伯数字的 token。不要简单跳过所有包含数字汉字的词，因为 `两会`、`十一届`、`一线` 这类词未必都是数值。

5. 不要把中文 `frequency` 改成固定 typo rate。  
   noisemake 的 `frequency` 是平均频率，允许低噪声不改文本；论文的 typo rate 更适合评测集批处理。保持现有语义更符合 CLI 和库 API。

6. 优先改生成数据质量，再扩算法。  
   当前生成数据包含一些罕见字、繁体、异体字和历史词条。对于现代简体文本，候选质量比抽样策略更关键。后续可以在 `tools/build-zh-ime-confusions.ts` 里增加：
   - 简体/繁体模式或现代简体优先模式。
   - 更强的 Rime weight 阈值。
   - 对罕见 Unicode 区段或扩展汉字的过滤选项。
   - 对 replacement 长度差和共享字符的更严格阈值。

7. 手写 fallback 只是短期补洞。  
   当前 `ZH_HOMOPHONE_FALLBACKS` 能保证常见现代词有演示效果，但长期应尽量让生成脚本覆盖这些词，避免核心模块里积累不可解释的手工词表。

## 不建议做的事

- 不要引入运行时数据下载或外部拼音服务。
- 不要把中文 typo 改成单字随机替换。
- 不要用 LLM 生成中文错别字。
- 不要把论文支持的 12 种语言作为 noisemake 的 public `languages` API 扩展依据；那需要键盘布局数据、输入法假设、测试和文档一起跟上。
- 不要改变 `types` 或 `languages` 的 enabled-set 语义。
- 不要为了实现论文 typo rate 改动 `selectMutations` 的核心采样模型。

## 推荐实施顺序

1. 先只更新英文 typo：长度权重、数字词 ignoring set、operation 权重、位置权重、同排邻键、跨手 transpose。
2. 再更新中文 runtime 选择：replacement `score` 加权、纯中文数字保护、谨慎的短语长度权重。
3. 最后单独做中文数据生成质量评审，评估是否过滤罕见字、繁体或极低频词。

## 测试计划

英文测试：

- 长词候选权重大于短词候选。
- 英文数字词不进入 typo 候选。
- 同一 seed 下 materialize 结果确定。
- `languages: ["zh"]` 仍不改英文。
- 低频率仍可返回原文。

中文测试：

- `replacement.score` 更高的候选在固定 RNG 区间下被选中。
- 纯中文数字短语不进入 `zh-ime` 候选。
- `languages: ["en"]` 仍不改中文。
- 中文候选生成仍使用最长匹配并保持确定性。
- 生成数据变更时必须跑 `pnpm run build:zh-confusions`，然后跑相关 unit tests。

建议命令：

```bash
pnpm run test:unit
```

如果触及 CLI、公开导出或构建输出，再跑：

```bash
pnpm run test:dist
```

