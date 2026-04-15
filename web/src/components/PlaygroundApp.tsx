import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { ChevronDown, CircleHelp, Copy, Languages, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  TRANSFORM_ENDPOINT,
  type Language,
  type NoiseType,
  type TransformRequest,
  type TransformResponse,
  type TransformSuccessResponse,
} from "@/lib/transform";

type UiLang = "en" | "zh";
type ThemeMode = "light" | "dark";
type WorkbenchState = "idle" | "dirty" | "invalid" | "running" | "success" | "no-change";
type ToastState = string | null;

type Segment = {
  text: string;
  changed: boolean;
};

type Copy = {
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
  typoHelper: string;
  repeatHelper: string;
  frequencyError: string;
  typeError: string;
  languageError: string;
  footerOpenSource: string;
  languageLabel: string;
  themeLabel: string;
  defaultInput: string;
  labels: Record<NoiseType, string>;
  languageLabels: Record<Language, string>;
};

const COPY: Record<UiLang, Copy> = {
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
    typoHelper: "Typos and misspellings.",
    repeatHelper: "Light word or phrase repetition.",
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
    },
    languageLabels: {
      zh: "Chinese",
      en: "English",
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
    typoHelper: "错别字",
    repeatHelper: "词语轻微重复",
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
    },
    languageLabels: {
      zh: "中文",
      en: "英文",
    },
  },
};

const DEFAULT_TYPES: NoiseType[] = ["typo", "repeat"];
const DEFAULT_LANGUAGES: Language[] = ["zh", "en"];
const HERO_CLI_COMMAND = 'npx noisemake "The quick brown fox jumps over the lazy dog"';
const SOURCE_URL = "https://github.com/sorcererxw/noisemake";
const PANEL_BASE_CLASSES = "flex min-w-0 flex-col gap-3 p-3 sm:p-4 lg:h-full";
const PANEL_HEADER_CLASSES = "flex min-h-7 items-center justify-between gap-3";
const PANEL_TITLE_CLASSES = "text-sm font-semibold leading-5";
const FORM_ITEM_CLASSES = "flex flex-col gap-1.5";
const FORM_ITEM_HEADER_CLASSES = "flex min-h-5 items-center justify-between gap-2.5";
const FORM_ITEM_HEADING_CLASSES = "inline-flex min-w-0 items-center gap-1.5";
const FORM_ITEM_TITLE_CLASSES = "m-0 p-0 text-xs font-semibold leading-none text-foreground";
const CONTROL_INPUT_CLASSES =
  "h-11 w-full rounded-lg border border-input bg-card px-3 text-foreground transition-colors outline-none";
const MONO_CONTROL_INPUT_CLASSES = `${CONTROL_INPUT_CLASSES} font-mono`;
const SURFACE_TEXTAREA_CLASSES =
  "min-h-64 max-h-96 flex-1 resize-none overflow-y-auto rounded-lg border border-input bg-card p-4 leading-7 text-foreground transition-colors outline-none md:min-h-80 lg:min-h-0 lg:max-h-none";
const OUTPUT_REGION_CLASSES =
  "min-h-64 max-h-96 flex-1 overflow-y-auto rounded-lg border border-input bg-muted/40 p-4 leading-7 text-foreground whitespace-pre-wrap md:min-h-80 lg:min-h-0 lg:max-h-none";
const TAG_INPUT_CLASSES =
  "flex min-h-10 flex-wrap gap-1.5 rounded-lg border border-input bg-card p-1.5 transition-colors";
const TAG_BUTTON_BASE_CLASSES =
  "flex min-w-0 items-center gap-1 rounded-md border px-2 py-1 text-left text-muted-foreground transition-all hover:-translate-y-px";
const TAG_INDICATOR_BASE_CLASSES =
  "size-2.5 shrink-0 rounded-full border border-muted-foreground/50 opacity-70 transition-all";

export default function PlaygroundApp({ lang }: { lang: UiLang }) {
  const copy = COPY[lang];
  const [input, setInput] = useState(copy.defaultInput);
  const [frequency, setFrequency] = useState("5");
  const [seed, setSeed] = useState("42");
  const [randomSeed, setRandomSeed] = useState(false);
  const [types, setTypes] = useState<NoiseType[]>(DEFAULT_TYPES);
  const [languages, setLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [output, setOutput] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [state, setState] = useState<WorkbenchState>("idle");
  const [toast, setToast] = useState<ToastState>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [controlPanelHeight, setControlPanelHeight] = useState<number | null>(null);
  const frequencyRef = useRef<HTMLInputElement>(null);
  const controlPanelRef = useRef<HTMLElement>(null);

  const validation = useMemo(() => {
    const parsedFrequency = Number(frequency);

    return {
      parsedFrequency,
      frequency:
        Number.isInteger(parsedFrequency) && parsedFrequency > 0 ? "" : copy.frequencyError,
      types: types.length > 0 ? "" : copy.typeError,
      languages: languages.length > 0 ? "" : copy.languageError,
    };
  }, [copy, frequency, languages.length, types.length]);

  const hasValidationError = Boolean(validation.frequency || validation.types || validation.languages);
  const runDisabled = state === "running" || hasValidationError;
  const canCopy =
    Boolean(output) && (state === "success" || state === "no-change" || state === "dirty");

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    function syncIsDesktop() {
      setIsDesktop(mediaQuery.matches);
    }

    syncIsDesktop();
    mediaQuery.addEventListener("change", syncIsDesktop);

    return () => {
      mediaQuery.removeEventListener("change", syncIsDesktop);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop || !controlPanelRef.current) {
      setControlPanelHeight(null);
      return;
    }

    const element = controlPanelRef.current;

    function updateHeight() {
      setControlPanelHeight(Math.ceil(element.getBoundingClientRect().height));
    }

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isDesktop]);

  function markDirty() {
    setState((current) =>
      current === "success" || current === "no-change" || current === "dirty"
        ? "dirty"
        : current,
    );
  }

  function updateTypes(type: NoiseType) {
    setTypes((current) =>
      current.includes(type)
        ? current.filter((value) => value !== type)
        : [...current, type],
    );
    markDirty();
  }

  function updateLanguages(language: Language) {
    setLanguages((current) =>
      current.includes(language)
        ? current.filter((value) => value !== language)
        : [...current, language],
    );
    markDirty();
  }

  async function run() {
    if (hasValidationError) {
      setState("invalid");
      if (validation.frequency) {
        frequencyRef.current?.focus();
      }
      return;
    }

    setState("running");

    await new Promise((resolve) => window.setTimeout(resolve, 120));

    try {
      const runSeed = randomSeed ? createRandomSeed() : seed;
      if (randomSeed) {
        setSeed(runSeed);
      }
      const result = await transformText({
        text: input,
        frequency: validation.parsedFrequency,
        seed: runSeed,
        types,
        languages,
      });
      const nextOutput = result.output;
      setOutput(nextOutput);
      setSegments(diffOutput(input, nextOutput));
      setState(nextOutput === input ? "no-change" : "success");
    } catch (error) {
      console.error(error);
      setState(output ? "dirty" : "idle");
    }
  }

  async function copyOutput() {
    if (!canCopy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      setToast(copy.copied);
    } catch {
      setToast(copy.copyError);
    }
  }

  async function copyCliCommand() {
    try {
      await navigator.clipboard.writeText(HERO_CLI_COMMAND);
      setToast(copy.copied);
    } catch {
      setToast(copy.copyError);
    }
  }

  function updateRandomSeed(nextRandomSeed: boolean) {
    setRandomSeed(nextRandomSeed);
    markDirty();
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <HeaderBar lang={lang} />
        <Hero copy={copy} copyCliCommand={copyCliCommand} />

        <section
          className="flex scroll-mt-4 flex-col gap-3"
          id="playground"
          aria-labelledby="playground-label"
        >
          <div className="max-w-2xl pt-1">
            <h2
              id="playground-label"
              className="font-display text-2xl font-semibold leading-tight"
            >
              {copy.playgroundLabel}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              {copy.playgroundIntro}
            </p>
          </div>

          <section
            className="overflow-hidden rounded-xl border bg-card shadow-sm"
            aria-label={copy.playgroundLabel}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 lg:items-stretch">
              <InputPanel
                copy={copy}
                input={input}
                panelHeight={isDesktop ? controlPanelHeight : null}
                setInput={(value) => {
                  setInput(value);
                  markDirty();
                }}
              />
              <ControlRail
                copy={copy}
                panelRef={controlPanelRef}
                frequency={frequency}
                frequencyRef={frequencyRef}
                setFrequency={(value) => {
                  setFrequency(value);
                  markDirty();
                }}
                seed={seed}
                setSeed={(value) => {
                  setSeed(value);
                  markDirty();
                }}
                randomSeed={randomSeed}
                setRandomSeed={updateRandomSeed}
                types={types}
                toggleType={updateTypes}
                languages={languages}
                toggleLanguage={updateLanguages}
                frequencyError={validation.frequency}
                typeError={validation.types}
                languageError={validation.languages}
                runLabel={state === "running" ? copy.running : copy.run}
                run={run}
                runDisabled={runDisabled}
              />
              <OutputPanel
                copy={copy}
                state={state}
                output={output}
                segments={segments}
                panelHeight={isDesktop ? controlPanelHeight : null}
                copyOutput={copyOutput}
                copyDisabled={!canCopy}
              />
            </div>
          </section>
        </section>

        <SiteFooter copy={copy} />
      </div>

      <div
        className="pointer-events-none fixed right-4 bottom-4 z-40"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast ? (
          <div className="max-w-xs rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg">
            {toast}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function SiteFooter({ copy }: { copy: Copy }) {
  return (
    <footer className="mt-1 flex flex-col items-start justify-end gap-2 py-3 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-center">
      <div className="flex w-full flex-wrap justify-start gap-x-3 gap-y-1 sm:justify-end">
        <a
          className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4 decoration-foreground/35 hover:decoration-primary"
          href={SOURCE_URL}
          target="_blank"
          rel="noreferrer"
        >
          {copy.footerOpenSource}
        </a>
      </div>
    </footer>
  );
}

function HeaderBar({ lang }: { lang: UiLang }) {
  return (
    <header className="flex flex-col items-start justify-between gap-4 pt-4 pb-2 sm:flex-row sm:items-center">
      <a
        className="inline-flex items-center gap-2 font-display text-xl font-semibold text-foreground no-underline"
        href={`/${lang}`}
        aria-label="noisemake"
      >
        <img className="block size-6 shrink-0" src="/noise-face.svg" alt="" width="24" height="24" />
        <span>noisemake</span>
      </a>
      <div className="flex min-w-0 flex-wrap items-center justify-start gap-x-2 gap-y-1 sm:justify-end">
        <LanguageSwitch lang={lang} copy={COPY[lang]} />
        <span className="h-4 w-px bg-border/80" aria-hidden="true" />
        <ThemeSwitch copy={COPY[lang]} />
      </div>
    </header>
  );
}

function Hero({
  copy,
  copyCliCommand,
}: {
  copy: Copy;
  copyCliCommand: () => void;
}) {
  return (
    <section
      className="grid items-center gap-6 py-6 md:gap-8 md:py-8 lg:grid-cols-12 lg:py-10"
      aria-labelledby="hero-title"
    >
      <div className="min-w-0 lg:col-span-7">
        <h1
          id="hero-title"
          className="max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl lg:leading-none"
        >
          {copy.headline}
        </h1>
        <p className="mt-3 max-w-2xl break-words text-base leading-7 text-muted-foreground sm:text-lg">
          {copy.proof}
        </p>
      </div>
      <CliUsagePanel copy={copy} copyCliCommand={copyCliCommand} />
    </section>
  );
}

function CliUsagePanel({
  copy,
  copyCliCommand,
}: {
  copy: Copy;
  copyCliCommand: () => void;
}) {
  return (
    <aside className="overflow-hidden rounded-lg border bg-card shadow-sm lg:col-span-5" aria-label={copy.cliLabel}>
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2 text-xs font-semibold text-muted-foreground">
        <span>{copy.cliLabel}</span>
        <Button
          className="size-8 rounded-md text-muted-foreground hover:text-foreground"
          type="button"
          variant="ghost"
          size="icon"
          aria-label={copy.copy}
          title={copy.copy}
          onClick={copyCliCommand}
        >
          <Copy aria-hidden="true" size={14} />
        </Button>
      </div>
      <pre className="m-0 overflow-x-auto p-4 font-mono text-sm leading-7 text-foreground whitespace-pre-wrap break-words">
        <code>
          <span className="text-muted-foreground select-none" aria-hidden="true">$ </span>
          {HERO_CLI_COMMAND}
        </code>
      </pre>
    </aside>
  );
}

function LanguageSwitch({ lang, copy }: { lang: UiLang; copy: Copy }) {
  const [languageOpen, setLanguageOpen] = useState(false);

  function storeLang(nextLang: UiLang) {
    localStorage.setItem("noisemake-lang", nextLang);
    setLanguageOpen(false);
  }

  return (
    <DropdownMenu open={languageOpen} onOpenChange={setLanguageOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-xs font-medium text-muted-foreground transition-colors data-[state=open]:text-foreground"
          type="button"
          aria-label={copy.languageLabel}
        >
          <Languages className="size-4" aria-hidden="true" size={15} />
          <ChevronDown className="size-3" aria-hidden="true" size={12} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-20"
        onEscapeKeyDown={() => setLanguageOpen(false)}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {([
          ["zh", "中文"],
          ["en", "English"],
        ] as const).map(([item, label]) => (
          <DropdownMenuItem
            key={item}
            asChild
            className={cn(
              "justify-between text-muted-foreground",
              item === lang && "bg-muted font-semibold text-foreground",
            )}
          >
            <a href={`/${item}`} onClick={() => storeLang(item)}>
              <span>{label}</span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeSwitch({ copy }: { copy: Copy }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const stored = localStorage.getItem("noisemake-theme") as ThemeMode | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    setMounted(true);
  }, []);

  function updateTheme(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    localStorage.setItem("noisemake-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  function toggleTheme() {
    updateTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <div className="inline-flex items-center justify-center">
      <Button
        className="text-muted-foreground aria-pressed:text-foreground"
        type="button"
        variant="ghost"
        size="icon"
        aria-label={copy.themeLabel}
        aria-pressed={mounted && theme === "dark"}
        suppressHydrationWarning
        title={copy.themeLabel}
        onClick={toggleTheme}
      >
        <Sun className="size-4 dark:hidden" aria-hidden="true" size={16} />
        <Moon className="hidden size-4 dark:block" aria-hidden="true" size={16} />
      </Button>
    </div>
  );
}

function InputPanel({
  copy,
  input,
  panelHeight,
  setInput,
}: {
  copy: Copy;
  input: string;
  panelHeight: number | null;
  setInput: (value: string) => void;
}) {
  return (
    <section
      className={cn(PANEL_BASE_CLASSES, "overflow-hidden lg:col-span-3")}
      style={panelHeight ? { height: `${panelHeight}px` } : undefined}
      aria-labelledby="input-label"
    >
      <div className={PANEL_HEADER_CLASSES}>
        <h2 id="input-label" className={PANEL_TITLE_CLASSES}>
          {copy.inputLabel}
        </h2>
      </div>
      <textarea
        className={SURFACE_TEXTAREA_CLASSES}
        value={input}
        placeholder={copy.inputPlaceholder}
        onChange={(event) => setInput(event.target.value)}
      />
    </section>
  );
}

function ControlRail({
  copy,
  panelRef,
  frequency,
  frequencyRef,
  setFrequency,
  seed,
  setSeed,
  randomSeed,
  setRandomSeed,
  types,
  toggleType,
  languages,
  toggleLanguage,
  frequencyError,
  typeError,
  languageError,
  runLabel,
  run,
  runDisabled,
}: {
  copy: Copy;
  panelRef: RefObject<HTMLElement | null>;
  frequency: string;
  frequencyRef: RefObject<HTMLInputElement | null>;
  setFrequency: (value: string) => void;
  seed: string;
  setSeed: (value: string) => void;
  randomSeed: boolean;
  setRandomSeed: (value: boolean) => void;
  types: NoiseType[];
  toggleType: (type: NoiseType) => void;
  languages: Language[];
  toggleLanguage: (language: Language) => void;
  frequencyError: string;
  typeError: string;
  languageError: string;
  runLabel: string;
  run: () => void;
  runDisabled: boolean;
}) {
  return (
    <section
      ref={panelRef}
      className={cn(
        PANEL_BASE_CLASSES,
        "border-t md:col-span-2 md:row-start-2 md:border-l-0 lg:col-span-2 lg:row-start-auto lg:border-t-0 lg:border-l",
      )}
      aria-labelledby="controls-label"
    >
      <div className={PANEL_HEADER_CLASSES}>
        <h2 id="controls-label" className={PANEL_TITLE_CLASSES}>
          {copy.controlsLabel}
        </h2>
      </div>

      <FormItem
        title={copy.frequencyLabel}
        htmlFor="frequency"
        helper={copy.frequencyHelper}
        helperId="frequency-helper"
        error={frequencyError}
        errorId="frequency-error"
      >
        <input
          ref={frequencyRef}
          className={cn(MONO_CONTROL_INPUT_CLASSES, "aria-invalid:border-destructive")}
          id="frequency"
          inputMode="numeric"
          value={frequency}
          aria-describedby="frequency-helper frequency-error"
          aria-invalid={Boolean(frequencyError)}
          onChange={(event) => setFrequency(event.target.value)}
        />
      </FormItem>

      <FormItem
        title={copy.seedLabel}
        htmlFor="seed"
        helper={copy.seedHelper}
        helperId="seed-helper"
        action={
          <label
            className={cn(
              "inline-flex min-h-6 w-fit items-center gap-1.5 rounded-md px-0.5 text-xs font-semibold text-muted-foreground transition-colors",
              randomSeed && "text-accent-foreground",
            )}
          >
            <Checkbox
              checked={randomSeed}
              onCheckedChange={(checked) => setRandomSeed(checked === true)}
            />
            <span>{copy.randomLabel}</span>
          </label>
        }
      >
        <input
          className={cn(
            MONO_CONTROL_INPUT_CLASSES,
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
          id="seed"
          value={seed}
          disabled={randomSeed}
          aria-describedby="seed-helper"
          onChange={(event) => setSeed(event.target.value)}
        />
      </FormItem>

      <TagSelectorField
        legend={copy.typesLabel}
        error={typeError}
        showValue={false}
        options={(["typo", "repeat"] as const).map((value) => ({
          value,
          label: copy.labels[value],
          helper: value === "typo" ? copy.typoHelper : copy.repeatHelper,
          active: types.includes(value),
          toggle: () => toggleType(value),
        }))}
      />

      <TagSelectorField
        legend={copy.languagesLabel}
        error={languageError}
        showValue={false}
        options={(["zh", "en"] as const).map((value) => ({
          value,
          label: copy.languageLabels[value],
          helper: "",
          active: languages.includes(value),
          toggle: () => toggleLanguage(value),
        }))}
      />

      <div className="mt-auto flex flex-wrap gap-2">
        <Button className="w-full px-3 font-semibold" type="button" size="lg" onClick={run} disabled={runDisabled}>
          {runLabel}
        </Button>
      </div>
    </section>
  );
}

function TagSelectorField({
  legend,
  error,
  showValue = true,
  options,
}: {
  legend: string;
  error: string;
  showValue?: boolean;
  options: Array<{
    value: string;
    label: string;
    helper: string;
    active: boolean;
    toggle: () => void;
  }>;
}) {
  const errorId = `${legend}-error`;

  return (
    <FormItem
      title={legend}
      error={error}
      errorId={errorId}
      asFieldset
      aria-describedby={error ? errorId : undefined}
    >
      <div
        className={cn(
          TAG_INPUT_CLASSES,
          error && "border-destructive",
        )}
        data-invalid={Boolean(error)}
      >
        {options.map((option) => (
          <button
            key={option.value}
            className={cn(
              TAG_BUTTON_BASE_CLASSES,
              option.active
                ? "border-primary/60 bg-accent/60 text-accent-foreground"
                : "border-border bg-background",
            )}
            type="button"
            aria-pressed={option.active}
            aria-describedby={option.helper ? `${legend}-${option.value}-helper` : undefined}
            title={option.helper || undefined}
            onClick={option.toggle}
          >
            <span
              className={cn(
                TAG_INDICATOR_BASE_CLASSES,
                option.active && "border-primary bg-primary opacity-100 ring-3 ring-primary/20",
              )}
              aria-hidden="true"
            />
            {showValue ? (
              <span className="shrink-0 font-mono text-xs font-bold leading-none">
                {option.value}
              </span>
            ) : null}
            <span className="max-w-full flex-1 text-xs font-semibold leading-none break-words">
              {option.label}
            </span>
            {option.helper ? (
              <span className="sr-only" id={`${legend}-${option.value}-helper`}>
                {option.helper}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </FormItem>
  );
}

function FormItem({
  title,
  htmlFor,
  action,
  helper,
  helperId,
  error,
  errorId,
  asFieldset,
  children,
  ...fieldsetProps
}: {
  title: string;
  htmlFor?: string;
  action?: ReactNode;
  helper?: string;
  helperId?: string;
  error?: string;
  errorId?: string;
  asFieldset?: boolean;
  children: ReactNode;
  "aria-describedby"?: string;
}) {
  const helperDescription = helper ? (
    <span className="sr-only" id={helperId}>
      {helper}
    </span>
  ) : null;
  const helpTip = helper ? <HelpTip text={helper} /> : null;
  const errorText = error ? (
    <p className="text-sm leading-5 font-medium text-destructive" id={errorId}>
      {error}
    </p>
  ) : null;

  if (asFieldset) {
    const titleId = `${title}-form-item-title`;

    return (
      <div
        className={FORM_ITEM_CLASSES}
        role="group"
        aria-labelledby={titleId}
        {...fieldsetProps}
      >
        <div className={FORM_ITEM_HEADER_CLASSES}>
          <span className={FORM_ITEM_HEADING_CLASSES}>
            <span className={FORM_ITEM_TITLE_CLASSES} id={titleId}>
              {title}
            </span>
            {helpTip}
          </span>
          {action}
        </div>
        {children}
        {helperDescription}
        {errorText}
      </div>
    );
  }

  return (
    <div className={FORM_ITEM_CLASSES}>
      <div className={FORM_ITEM_HEADER_CLASSES}>
        <span className={FORM_ITEM_HEADING_CLASSES}>
          <label className={FORM_ITEM_TITLE_CLASSES} htmlFor={htmlFor}>
            {title}
          </label>
          {helpTip}
        </span>
        {action}
      </div>
      {children}
      {helperDescription}
      {errorText}
    </div>
  );
}

function HelpTip({ text }: { text: string }) {
  return (
    <button
      className="inline-flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
      type="button"
      aria-label={text}
      title={text}
    >
      <CircleHelp aria-hidden="true" size={14} />
    </button>
  );
}

function OutputPanel({
  copy,
  state,
  output,
  segments,
  panelHeight,
  copyOutput,
  copyDisabled,
}: {
  copy: Copy;
  state: WorkbenchState;
  output: string;
  segments: Segment[];
  panelHeight: number | null;
  copyOutput: () => void;
  copyDisabled: boolean;
}) {
  const showOutput = Boolean(output);

  return (
    <section
      className={cn(
        PANEL_BASE_CLASSES,
        "overflow-hidden border-t md:col-start-2 md:row-start-1 md:border-l lg:col-span-3 lg:col-start-auto lg:row-start-auto lg:border-t-0",
      )}
      style={panelHeight ? { height: `${panelHeight}px` } : undefined}
      aria-labelledby="output-label"
    >
      <div className={PANEL_HEADER_CLASSES}>
        <h2 id="output-label" className={PANEL_TITLE_CLASSES}>
          {copy.outputLabel}
        </h2>
        <Button
          className="px-3 text-xs font-semibold"
          type="button"
          variant="outline"
          size="lg"
          onClick={copyOutput}
          disabled={copyDisabled}
        >
          {copy.copy}
        </Button>
      </div>
      <div
        className={OUTPUT_REGION_CLASSES}
        aria-live="polite"
        aria-atomic="false"
      >
        {showOutput ? (
          <ChangedTextOutput segments={segments} />
        ) : (
          <p className="text-muted-foreground">{copy.outputPlaceholder}</p>
        )}
      </div>
      {state === "no-change" ? (
        <p className="text-sm leading-6 text-muted-foreground">{copy.noChange}</p>
      ) : null}
    </section>
  );
}

function ChangedTextOutput({ segments }: { segments: Segment[] }) {
  return (
    <p className="text-foreground">
      {segments.map((segment, index) =>
        segment.changed ? (
          <mark
            className="rounded-sm bg-primary/20 px-0.5 text-inherit underline decoration-primary/70 underline-offset-2"
            key={`${segment.text}-${index}`}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={`${segment.text}-${index}`}>{segment.text}</span>
        ),
      )}
    </p>
  );
}

function diffOutput(input: string, output: string): Segment[] {
  if (input === output) {
    return [{ text: output, changed: false }];
  }

  const inputChars = Array.from(input);
  const outputChars = Array.from(output);
  let prefix = 0;
  while (
    prefix < inputChars.length &&
    prefix < outputChars.length &&
    inputChars[prefix] === outputChars[prefix]
  ) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix + prefix < inputChars.length &&
    suffix + prefix < outputChars.length &&
    inputChars[inputChars.length - 1 - suffix] === outputChars[outputChars.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const inputMiddle = inputChars.slice(prefix, inputChars.length - suffix);
  const outputMiddle = outputChars.slice(prefix, outputChars.length - suffix);
  const segments: Segment[] = [];

  if (prefix > 0) {
    segments.push({ text: outputChars.slice(0, prefix).join(""), changed: false });
  }

  if (inputMiddle.length * outputMiddle.length > 250_000) {
    segments.push({ text: outputMiddle.join(""), changed: true });
  } else {
    segments.push(...diffMiddle(inputMiddle, outputMiddle));
  }

  if (suffix > 0) {
    segments.push({
      text: outputChars.slice(outputChars.length - suffix).join(""),
      changed: false,
    });
  }

  return mergeSegments(segments.filter((segment) => segment.text.length > 0));
}

function diffMiddle(inputChars: string[], outputChars: string[]): Segment[] {
  const rows = inputChars.length + 1;
  const cols = outputChars.length + 1;
  const dp = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = inputChars.length - 1; i >= 0; i -= 1) {
    for (let j = outputChars.length - 1; j >= 0; j -= 1) {
      dp[i][j] =
        inputChars[i] === outputChars[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const unchanged = new Set<number>();
  let i = 0;
  let j = 0;
  while (i < inputChars.length && j < outputChars.length) {
    if (inputChars[i] === outputChars[j]) {
      unchanged.add(j);
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }

  return mergeSegments(
    outputChars.map((char, index) => ({
      text: char,
      changed: !unchanged.has(index),
    })),
  );
}

function mergeSegments(segments: Segment[]): Segment[] {
  const merged: Segment[] = [];

  for (const segment of segments) {
    const previous = merged[merged.length - 1];
    if (previous && previous.changed === segment.changed) {
      previous.text += segment.text;
    } else {
      merged.push({ ...segment });
    }
  }

  return merged;
}

function createRandomSeed(): string {
  const bytes = new Uint32Array(2);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    bytes[0] = Math.floor(Math.random() * 0xffffffff);
    bytes[1] = Math.floor(Math.random() * 0xffffffff);
  }

  return ((BigInt(bytes[0]) << 32n) | BigInt(bytes[1])).toString(10);
}

async function transformText(
  payload: TransformRequest,
): Promise<TransformSuccessResponse> {
  const response = await fetch(TRANSFORM_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as TransformResponse;
  if (!response.ok || "error" in result) {
    throw new Error("error" in result ? result.error.message : "Transform failed.");
  }

  return result;
}
