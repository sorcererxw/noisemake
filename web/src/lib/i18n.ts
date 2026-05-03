import type { Language, NoiseType } from "@/lib/transform";

export type UiLang = "en" | "zh";

export type UiCopy = {
  headline: string;
  proof: string;
  cliLabel: string;
  playgroundLabel: string;
  playgroundIntro: string;
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
  copy: string;
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
    playgroundLabel: "Playground",
    playgroundIntro: "Try noisemake in the browser",
    inputLabel: "Paste your text",
    controlsLabel: "Noise settings",
    outputLabel: "Output text",
    frequencyLabel: "frequency",
    seedLabel: "seed",
    randomLabel: "random",
    typesLabel: "Noise types",
    languagesLabel: "Languages",
    run: "Run",
    running: "Running...",
    copy: "Copy",
    copied: "Copied.",
    copyError: "Could not copy. Please copy it manually.",
    inputPlaceholder: "Paste some text here.",
    outputPlaceholder: "Your output will show up here.",
    noChange:
      "Nothing changed this time. Try a lower frequency or a different seed.",
    frequencyHelper: "Higher = less noise.",
    seedHelper: "Same seed = same output.",
    frequencyError: "Use a positive whole number.",
    typeError: "Choose at least one noise type.",
    languageError: "Choose at least one language.",
    footerOpenSource: "Open source",
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
      typo: "Typos and misspellings.",
      repeat: "Light word or phrase repetition.",
      spacing: "Whitespace glitches across words, punctuation, and mixed-script boundaries.",
      punct: "Normalize full-width Chinese punctuation into ASCII marks.",
    },
    languageLabels: {
      zh: "Chinese",
      en: "English",
    },
    languageHelpers: {
      zh: "",
      en: "",
    },
  },
  zh: {
    headline: "让文本别那么工整",
    proof: "给文本注入一些小错误，让它更像手工写出来的",
    cliLabel: "CLI 用法",
    playgroundLabel: "Playground",
    playgroundIntro: "在浏览器里试试 noisemake",
    inputLabel: "粘贴你的文本",
    controlsLabel: "噪声设置",
    outputLabel: "输出文本",
    frequencyLabel: "频率",
    seedLabel: "种子",
    randomLabel: "随机",
    typesLabel: "噪声类型",
    languagesLabel: "语言",
    run: "运行",
    running: "运行中...",
    copy: "复制",
    copied: "已复制",
    copyError: "复制失败，请手动复制",
    inputPlaceholder: "在这里粘贴一段文本。",
    outputPlaceholder: "输出结果会显示在这里。",
    noChange: "这次没变化。试试调低频率，或者换个种子",
    frequencyHelper: "数值越高，噪声越少。",
    seedHelper: "同一种子，同一输出。",
    frequencyError: "请输入正整数。",
    typeError: "至少选择一种噪声类型。",
    languageError: "至少选择一种语言。",
    footerOpenSource: "开源",
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
      typo: "错别字",
      repeat: "词语轻微重复",
      spacing: "词间空格、标点后空格和中英边界空格扰动。",
      punct: "把全角中文标点变成半角英文标点。",
    },
    languageLabels: {
      zh: "中文",
      en: "英文",
    },
    languageHelpers: {
      zh: "",
      en: "",
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
    title: "noisemake - Make text less polished",
    description:
      "Generate controlled text perturbations for evals, research, and agent workflows. Same input, same seed, same options, same output.",
    ogTitle: "noisemake social preview",
    ogDescription:
      "Make text less polished. Inject small mistakes so text feels more hand-written.",
  },
  zh: {
    title: "noisemake - 让文本别那么工整",
    description:
      "给评测、研究和 agent 工作流生成可控文本扰动。同一输入、同一种子、同一选项，得到同一输出。",
    ogTitle: "noisemake 社媒预览图",
    ogDescription: "让文本别那么工整。给文本注入一些小错误，让它更像手工写出来的。",
  },
};

export function isUiLang(value: unknown): value is UiLang {
  return value === "zh" || value === "en";
}
