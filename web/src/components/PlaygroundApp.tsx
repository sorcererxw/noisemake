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
    headline: "Make text less polished.",
    proof: "Inject small mistakes so text feels more hand-written.",
    cliLabel: "CLI usage",
    playgroundLabel: "Playground",
    playgroundIntro: "Try noisemake in the browser.",
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
    headline: "让文本别那么工整。",
    proof: "给文本注入一些小错误，让它更像手工写出来的。",
    cliLabel: "CLI 用法",
    playgroundLabel: "Playground",
    playgroundIntro: "在浏览器里试试 noisemake。",
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
  const frequencyRef = useRef<HTMLInputElement>(null);

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
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4">
        <HeaderBar lang={lang} />
        <Hero copy={copy} copyCliCommand={copyCliCommand} />

        <section className="playground-section" id="playground" aria-labelledby="playground-label">
          <div className="playground-heading">
            <h2 id="playground-label">{copy.playgroundLabel}</h2>
            <p>{copy.playgroundIntro}</p>
          </div>

          <section className="workbench" aria-label={copy.playgroundLabel}>
            <div className="workbench-grid">
              <InputPanel
                copy={copy}
                input={input}
                setInput={(value) => {
                  setInput(value);
                  markDirty();
                }}
              />
              <ControlRail
                copy={copy}
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
                copyOutput={copyOutput}
                copyDisabled={!canCopy}
              />
            </div>
          </section>
        </section>

        <SiteFooter copy={copy} />
      </div>

      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast ? <div className="toast">{toast}</div> : null}
      </div>
    </main>
  );
}

function SiteFooter({ copy }: { copy: Copy }) {
  return (
    <footer className="site-footer">
      <div className="footer-links">
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">
          {copy.footerOpenSource}
        </a>
      </div>
    </footer>
  );
}

function HeaderBar({ lang }: { lang: UiLang }) {
  return (
    <header className="site-header">
      <a className="brand-lockup" href={`/${lang}`} aria-label="noisemake">
        <img className="noise-face" src="/noise-face.svg" alt="" width="24" height="24" />
        <span>noisemake</span>
      </a>
      <div className="switches">
        <LanguageSwitch lang={lang} copy={COPY[lang]} />
        <span className="control-divider" aria-hidden="true" />
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
    <section className="hero-section" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title" className="hero-headline">
          {copy.headline}
        </h1>
        <p className="hero-proof">{copy.proof}</p>
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
    <aside className="cli-panel" aria-label={copy.cliLabel}>
      <div className="cli-panel-header">
        <span>{copy.cliLabel}</span>
        <Button
          className="cli-copy-button"
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
      <pre className="cli-command">
        <code>
          <span aria-hidden="true">$ </span>
          {HERO_CLI_COMMAND}
        </code>
      </pre>
    </aside>
  );
}

function LanguageSwitch({ lang, copy }: { lang: UiLang; copy: Copy }) {
  const [languageOpen, setLanguageOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const [supportsHover, setSupportsHover] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    function syncHoverSupport() {
      setSupportsHover(mediaQuery.matches);
    }

    syncHoverSupport();
    mediaQuery.addEventListener("change", syncHoverSupport);

    return () => {
      mediaQuery.removeEventListener("change", syncHoverSupport);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  function cancelLanguageClose() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openLanguageMenu() {
    cancelLanguageClose();
    setLanguageOpen(true);
  }

  function closeLanguageMenu() {
    cancelLanguageClose();
    closeTimerRef.current = window.setTimeout(() => {
      setLanguageOpen(false);
      closeTimerRef.current = null;
    }, 120);
  }

  function storeLang(nextLang: UiLang) {
    localStorage.setItem("noisemake-lang", nextLang);
    setLanguageOpen(false);
  }

  return (
    <DropdownMenu open={languageOpen} onOpenChange={setLanguageOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className="language-trigger"
          type="button"
          aria-label={copy.languageLabel}
          onPointerEnter={() => {
            if (supportsHover) {
              openLanguageMenu();
            }
          }}
          onPointerLeave={() => {
            if (supportsHover) {
              closeLanguageMenu();
            }
          }}
          onMouseEnter={() => {
            if (supportsHover) {
              openLanguageMenu();
            }
          }}
          onMouseLeave={() => {
            if (supportsHover) {
              closeLanguageMenu();
            }
          }}
          onPointerDown={(event) => {
            if (supportsHover) {
              event.preventDefault();
            }
          }}
          onFocus={() => {
            if (supportsHover) {
              openLanguageMenu();
            }
          }}
          onBlur={() => {
            if (supportsHover) {
              closeLanguageMenu();
            }
          }}
        >
          <Languages aria-hidden="true" size={15} />
          <ChevronDown className="language-chevron" aria-hidden="true" size={12} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="language-menu"
        onPointerEnter={() => {
          if (supportsHover) {
            openLanguageMenu();
          }
        }}
        onPointerLeave={() => {
          if (supportsHover) {
            closeLanguageMenu();
          }
        }}
        onMouseEnter={() => {
          if (supportsHover) {
            openLanguageMenu();
          }
        }}
        onMouseLeave={() => {
          if (supportsHover) {
            closeLanguageMenu();
          }
        }}
        onFocusCapture={() => {
          if (supportsHover) {
            openLanguageMenu();
          }
        }}
        onBlurCapture={(event) => {
          if (
            supportsHover &&
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            closeLanguageMenu();
          }
        }}
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
            className={cn("language-menu-item", item === lang && "is-active")}
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
    <div className="theme-switch-control">
      <Button
        className="theme-toggle-button"
        type="button"
        variant="ghost"
        size="icon"
        aria-label={copy.themeLabel}
        aria-pressed={mounted && theme === "dark"}
        suppressHydrationWarning
        title={copy.themeLabel}
        onClick={toggleTheme}
      >
        <Sun className="theme-icon theme-icon-sun" aria-hidden="true" size={16} />
        <Moon className="theme-icon theme-icon-moon" aria-hidden="true" size={16} />
      </Button>
    </div>
  );
}

function InputPanel({
  copy,
  input,
  setInput,
}: {
  copy: Copy;
  input: string;
  setInput: (value: string) => void;
}) {
  return (
    <section className="panel input-panel" aria-labelledby="input-label">
      <div className="panel-heading">
        <h2 id="input-label">{copy.inputLabel}</h2>
      </div>
      <textarea
        className="text-field input-textarea"
        value={input}
        placeholder={copy.inputPlaceholder}
        onChange={(event) => setInput(event.target.value)}
      />
    </section>
  );
}

function ControlRail({
  copy,
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
    <section className="panel control-panel" aria-labelledby="controls-label">
      <div className="panel-heading">
        <h2 id="controls-label">{copy.controlsLabel}</h2>
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
          className="control-input mono-value"
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
          <label className={cn("random-seed-checkbox", randomSeed && "is-active")}>
            <Checkbox
              className="random-seed-input"
              checked={randomSeed}
              onCheckedChange={(checked) => setRandomSeed(checked === true)}
            />
            <span>{copy.randomLabel}</span>
          </label>
        }
      >
        <input
          className="control-input mono-value"
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
        options={(["zh", "en"] as const).map((value) => ({
          value,
          label: copy.languageLabels[value],
          helper: "",
          active: languages.includes(value),
          toggle: () => toggleLanguage(value),
        }))}
      />

      <div className="control-actions">
        <Button className="run-button !px-3" type="button" onClick={run} disabled={runDisabled}>
          {runLabel}
        </Button>
      </div>
    </section>
  );
}

function TagSelectorField({
  legend,
  error,
  options,
}: {
  legend: string;
  error: string;
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
      <div className="type-token-input" data-invalid={Boolean(error)}>
        {options.map((option) => (
          <button
            key={option.value}
            className={cn("type-token", option.active && "is-active")}
            type="button"
            aria-pressed={option.active}
            aria-describedby={option.helper ? `${legend}-${option.value}-helper` : undefined}
            title={option.helper || undefined}
            onClick={option.toggle}
          >
            <span className="type-token-indicator" aria-hidden="true" />
            <span className="type-token-key">{option.value}</span>
            <span className="type-token-label">{option.label}</span>
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
    <p className="field-error" id={errorId}>
      {error}
    </p>
  ) : null;

  if (asFieldset) {
    const titleId = `${title}-form-item-title`;

    return (
      <div
        className="form-item chip-fieldset"
        role="group"
        aria-labelledby={titleId}
        {...fieldsetProps}
      >
        <div className="form-item-header">
          <span className="form-item-heading">
            <span className="form-item-title" id={titleId}>
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
    <div className="form-item">
      <div className="form-item-header">
        <span className="form-item-heading">
          <label className="form-item-title" htmlFor={htmlFor}>
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
    <button className="form-item-help" type="button" aria-label={text} data-tooltip={text}>
      <CircleHelp aria-hidden="true" size={14} />
    </button>
  );
}

function OutputPanel({
  copy,
  state,
  output,
  segments,
  copyOutput,
  copyDisabled,
}: {
  copy: Copy;
  state: WorkbenchState;
  output: string;
  segments: Segment[];
  copyOutput: () => void;
  copyDisabled: boolean;
}) {
  const showOutput = Boolean(output);

  return (
    <section className="panel output-panel" aria-labelledby="output-label">
      <div className="panel-heading">
        <h2 id="output-label">{copy.outputLabel}</h2>
        <Button
          className="output-copy-button !px-3"
          type="button"
          variant="outline"
          onClick={copyOutput}
          disabled={copyDisabled}
        >
          {copy.copy}
        </Button>
      </div>
      <div className="output-region" aria-live="polite" aria-atomic="false">
        {showOutput ? <ChangedTextOutput segments={segments} /> : <p>{copy.outputPlaceholder}</p>}
      </div>
      {state === "no-change" ? <p className="notice-text">{copy.noChange}</p> : null}
    </section>
  );
}

function ChangedTextOutput({ segments }: { segments: Segment[] }) {
  return (
    <p className="changed-output">
      {segments.map((segment, index) =>
        segment.changed ? (
          <mark className="changed-span" key={`${segment.text}-${index}`}>
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
