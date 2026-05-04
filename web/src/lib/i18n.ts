import type { Language, NoiseType } from "@/lib/transform";

export type UiLang = "en" | "zh";

export type UiCopy = {
  headline: string;
  proof: string;
  cliLabel: string;
  tryPlayground: string;
  playgroundLabel: string;
  playgroundIntro: string;
  explainerTitle: string;
  explainerIntro: string;
  explainerItems: string[];
  inputLabel: string;
  controlsLabel: string;
  outputLabel: string;
  frequencyLabel: string;
  seedLabel: string;
  randomLabel: string;
  typesLabel: string;
  languagesLabel: string;
  run: string;
  running: string;
  copyCliCommand: string;
  copyOutput: string;
  copied: string;
  copyError: string;
  inputPlaceholder: string;
  outputPlaceholder: string;
  noChange: string;
  frequencyHelper: string;
  seedHelper: string;
  frequencyError: string;
  typeError: string;
  languageError: string;
  footerOpenSource: string;
  footerNpm: string;
  languageLabel: string;
  themeLabel: string;
  defaultInput: string;
  labels: Record<NoiseType, string>;
  typeHelpers: Record<NoiseType, string>;
  languageLabels: Record<Language, string>;
  languageHelpers: Record<Language, string>;
};

export const UI_COPY: Record<UiLang, UiCopy> = {
  en: {
    headline: "Make text less polished",
    proof: "Inject small mistakes so text feels more hand-written",
    cliLabel: "CLI usage",
    tryPlayground: "Try Playground",
    playgroundLabel: "Playground",
    playgroundIntro: "Paste polished text, set deterministic options, and reproduce the same noisy output.",
    explainerTitle: "Add a little controlled mess",
    explainerIntro:
      "Use noisemake when your sample text feels too clean. Pick a seed, choose the kinds of rough edges you want, and get the same result again when you need it.",
    explainerItems: [
      "Keep a fixed seed when you want repeatable examples.",
      "Mix typos, small repeats, spacing slips, and punctuation changes.",
      "Limit changes to Chinese, English, or both.",
      "Run it in the browser, from the CLI, or as a package.",
    ],
    inputLabel: "Paste polished text",
    controlsLabel: "Set deterministic noise",
    outputLabel: "Reproducible noisy output",
    frequencyLabel: "Frequency",
    seedLabel: "Seed",
    randomLabel: "random",
    typesLabel: "Noise types",
    languagesLabel: "Languages",
    run: "Run noisemake",
    running: "Running...",
    copyCliCommand: "Copy command",
    copyOutput: "Copy output",
    copied: "Copied.",
    copyError: "Could not copy. Select the text manually.",
    inputPlaceholder: "Paste polished text here.",
    outputPlaceholder: "Output appears after you run noisemake.",
    noChange:
      "No eligible mutation was selected for this seed and frequency. Try a lower frequency or a different seed.",
    frequencyHelper: "Higher means less noise.",
    seedHelper: "Same input + same seed = same output.",
    frequencyError: "Use a positive whole number.",
    typeError: "Choose at least one noise type.",
    languageError: "Choose at least one language.",
    footerOpenSource: "Open source",
    footerNpm: "npm",
    languageLabel: "Language",
    themeLabel: "Toggle theme",
    defaultInput:
      "Every weekday at 3:15 p.m., the small public library on Maple Street changes mood without making any obvious announcement. The front tables still hold the same local history books, the clock above the returns desk still runs two minutes fast, and the pencil cup beside computer terminal 4 is still full of short yellow stubs, but the room feels different as students arrive one by one and then in pairs. A man in a navy coat claims the newspaper chair near the radiator. Two sisters spread notebooks across the long oak table, whisper for ten minutes, then fall quiet. Someone rolls a cart of returned books past the windows, then rolls the same cart back again because a red atlas and a gardening manual were shelved in the wrong order.\n\nThe library follows a pattern that only looks accidental from the door. At 3:20, the copy machine wakes up with a click. At 3:30, the after-school line reaches the checkout counter. At 3:40, the reading room grows steadier, quieter, fuller. The same sounds repeat at low volume: chair legs against linoleum, page turns, soft coughs, the scanner beep at the desk, the scanner beep again. A sign beside the stairs asks visitors to carry drinks with lids, and nearly everyone ignores it in the same polite way, setting paper cups on the windowsill and glancing up only when a librarian walks by. By four o'clock, the building feels less like a room with shelves and more like a shared routine that people briefly help keep in order.",
    labels: {
      typo: "typo",
      repeat: "repeat",
      spacing: "spacing",
      punct: "punct",
    },
    typeHelpers: {
      typo: "IME-style Chinese substitutions and keyboard-like English typos.",
      repeat: "Light word or phrase repetition.",
      spacing: "Whitespace glitches across words, punctuation, and mixed Chinese-English boundaries.",
      punct: "Normalize full-width Chinese punctuation into ASCII marks.",
    },
    languageLabels: {
      zh: "Chinese",
      en: "English",
    },
    languageHelpers: {
      zh: "Apply Chinese strategies.",
      en: "Apply English strategies.",
    },
  },
  zh: {
    headline: "让文本别那么工整",
    proof: "给文本注入一些小错误，让它更像手工写出来的",
    cliLabel: "CLI 用法",
    tryPlayground: "尝试一下",
    playgroundLabel: "Playground",
    playgroundIntro: "粘贴干净文本，设置确定性选项，复现同一份噪声输出。",
    explainerTitle: "给文本加一点可控的小瑕疵",
    explainerIntro:
      "如果一段文本看起来太干净，可以用 noisemake 加入轻微错字、重复、空格或标点变化。固定种子后，下次还能得到同样结果。",
    explainerItems: [
      "固定种子，方便复现和对比。",
      "按需要混合错别字、重复、空格和标点变化。",
      "可以只改中文、只改英文，或两种都处理。",
      "浏览器、CLI 和包里都能用。",
    ],
    inputLabel: "原文",
    controlsLabel: "设置",
    outputLabel: "输出",
    frequencyLabel: "频率",
    seedLabel: "种子",
    randomLabel: "随机",
    typesLabel: "噪声类型",
    languagesLabel: "语言",
    run: "运行",
    running: "运行中...",
    copyCliCommand: "复制命令",
    copyOutput: "复制输出",
    copied: "已复制。",
    copyError: "复制失败，请手动选择文本。",
    inputPlaceholder: "在这里粘贴一段待扰动文本。",
    outputPlaceholder: "运行后会显示输出。",
    noChange: "这个种子和频率没有选中可用扰动。试试调低频率，或者换个种子。",
    frequencyHelper: "数值越高，噪声越少。",
    seedHelper: "同一输入 + 同一种子 = 同一输出。",
    frequencyError: "请输入正整数。",
    typeError: "至少选择一种噪声类型。",
    languageError: "至少选择一种语言。",
    footerOpenSource: "开源",
    footerNpm: "npm",
    languageLabel: "语言",
    themeLabel: "切换主题",
    defaultInput:
      "每到下午三点一刻，城北那间不算大的图书馆都会慢慢换一种节奏。门口的公告栏还是贴着上周的活动海报，借还书台上那只蓝色圆珠笔还是总被人顺手拿走又放回，靠窗的四号座位还是最先坐满，可房间里的空气会一点一点变得更紧、更满，也更安静。先是两个背书包的学生进来，把练习册和水杯平码在长桌上；接着是一位穿深灰外套的老人，照旧去翻当天的报纸；再过几分钟，管理员推着小车从东侧书架走到西侧书架，又因为一本地方志和一本植物图鉴放错了位置，原路折回来。\n\n这里几乎没有显眼的事情发生，正因为没有显眼的事情，人才会注意到那些细小而重复的秩序：复印机在三点二十发出第一声轻响，借书扫码器在三点半以后开始连续地滴两三下，楼梯口那块“饮料请加盖”的提示牌每天都被看见，也几乎每天都被轻轻忽略。儿童区的矮书架前常常有人把书抽出来又塞回去，顺序乱一点，又被下一位读者顺手理齐一点。到了四点，整间图书馆不像一个单纯放书的地方，更像一套被许多人短暂共享的日常安排。",
    labels: {
      typo: "错别字",
      repeat: "口吃",
      spacing: "空格",
      punct: "标点",
    },
    typeHelpers: {
      typo: "中文 IME 式替换和英文键盘式拼写错误。",
      repeat: "词语或短语的轻微重复。",
      spacing: "词间空格、标点后空格和中英边界空格扰动。",
      punct: "把全角中文标点变成半角英文标点。",
    },
    languageLabels: {
      zh: "中文",
      en: "英文",
    },
    languageHelpers: {
      zh: "应用中文扰动策略。",
      en: "应用英文扰动策略。",
    },
  },
};

export const SEO_COPY: Record<
  UiLang,
  {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  }
> = {
  en: {
    title: "noisemake - Deterministic Text Noise for AI Evals and CLI",
    description:
      "Generate reproducible text perturbations with seeded typos, repeats, spacing, and punctuation noise for evals, fixtures, CLI workflows, and research.",
    ogTitle: "noisemake - Deterministic Text Noise for AI Evals and CLI",
    ogDescription:
      "Generate reproducible text perturbations with seeded typos, repeats, spacing, and punctuation noise for evals, fixtures, CLI workflows, and research.",
  },
  zh: {
    title: "noisemake - 给评测用的可复现文本噪声",
    description:
      "用种子生成可复现的错别字、重复、空格和标点扰动，适合评测、测试夹具、CLI 工作流和文本研究。",
    ogTitle: "noisemake - 给评测用的可复现文本噪声",
    ogDescription:
      "用种子生成可复现的错别字、重复、空格和标点扰动，适合评测、测试夹具、CLI 工作流和文本研究。",
  },
};

export function isUiLang(value: unknown): value is UiLang {
  return value === "zh" || value === "en";
}
