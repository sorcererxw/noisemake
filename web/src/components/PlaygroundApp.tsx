import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ChevronDown, Languages, Moon, Sun } from "lucide-react";
import { noisemake, type Language, type NoiseType } from "noisemake";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
  framing: string;
  cliLabel: string;
  cliBadge: string;
  heroPrimaryAction: string;
  heroSecondaryAction: string;
  commandCopied: string;
  commandCopyError: string;
  playgroundLabel: string;
  playgroundIntro: string;
  inputLabel: string;
  controlsLabel: string;
  outputLabel: string;
  parity: string;
  run: string;
  running: string;
  copy: string;
  copied: string;
  copyError: string;
  inputPlaceholder: string;
  outputPlaceholder: string;
  stale: string;
  noChange: string;
  frequencyHelper: string;
  seedHelper: string;
  randomSeedLabel: string;
  randomSeedHelper: string;
  lastGeneratedSeed: string;
  typoHelper: string;
  repeatHelper: string;
  zhHelper: string;
  enHelper: string;
  frequencyError: string;
  typeError: string;
  languageError: string;
  inputRequired: string;
  runtimeError: string;
  footerPromise: string;
  footerLicense: string;
  footerLinksLabel: string;
  footerSource: string;
  footerDocs: string;
  footerDataNotice: string;
  languageLabel: string;
  themeLabel: string;
  status: Record<WorkbenchState, string>;
  defaultInput: string;
  labels: Record<NoiseType | Language, string>;
  theme: Record<ThemeMode, string>;
};

const COPY: Record<UiLang, Copy> = {
  en: {
    headline: "Deterministic text noise for evals.",
    proof: "Same input, same seed, same output.",
    framing: "Not an LLM rewrite. Controlled perturbation.",
    cliLabel: "CLI usage",
    cliBadge: "minimal command",
    heroPrimaryAction: "Copy CLI command",
    heroSecondaryAction: "Try Playground",
    commandCopied: "Copied CLI command.",
    commandCopyError: "Could not copy. Select the command manually.",
    playgroundLabel: "Playground",
    playgroundIntro: "Run the same engine in the browser.",
    inputLabel: "Paste polished text",
    controlsLabel: "Set deterministic noise",
    outputLabel: "Reproducible noisy output",
    parity: "Same engine as the CLI and npm package.",
    run: "Run noisemake",
    running: "Running...",
    copy: "Copy output",
    copied: "Copied output.",
    copyError: "Could not copy. Select the output text manually.",
    inputPlaceholder: "Paste polished text for a deterministic noisy variant.",
    outputPlaceholder: "Run noisemake to create a reproducible noisy variant.",
    stale: "Settings changed, run again.",
    noChange:
      "No eligible mutation was selected for this seed and frequency. Try a lower frequency or a different seed.",
    frequencyHelper: "Higher means less noise. 200 = about 1 change per 200 eligible tokens.",
    seedHelper: "Same input + same seed = same output.",
    randomSeedLabel: "Random seed",
    randomSeedHelper: "Ignore the seed field and generate a new seed on every run.",
    lastGeneratedSeed: "Last generated seed",
    typoHelper: "IME-style Chinese substitutions and keyboard-like English typos.",
    repeatHelper: "Light word or phrase repetition.",
    zhHelper: "Apply Chinese strategies.",
    enHelper: "Apply English strategies.",
    frequencyError: "Use a positive whole number.",
    typeError: "Choose at least one noise type.",
    languageError: "Choose at least one language.",
    inputRequired: "Add text before running.",
    runtimeError: "Could not run noisemake with these settings.",
    footerPromise: "Same input. Same seed. Same output.",
    footerLicense: "MIT code. LGPL-covered Chinese IME data.",
    footerLinksLabel: "Project links",
    footerSource: "Source",
    footerDocs: "CLI docs",
    footerDataNotice: "Data notice",
    languageLabel: "Language",
    themeLabel: "Toggle theme",
    status: {
      idle: "ready",
      dirty: "stale",
      invalid: "check settings",
      running: "running",
      success: "reproducible",
      "no-change": "no change",
    },
    defaultInput:
      "This benchmark needs controlled text noise, not a rewrite, so repeated runs should stay reproducible.",
    labels: {
      typo: "typo",
      repeat: "repeat",
      zh: "zh",
      en: "en",
    },
    theme: {
      light: "Light",
      dark: "Dark",
    },
  },
  zh: {
    headline: "给评测用的可复现文本噪声。",
    proof: "同一输入、同一种子、同一输出。",
    framing: "不是 LLM 改写，而是可控扰动。",
    cliLabel: "CLI 用法",
    cliBadge: "最小命令",
    heroPrimaryAction: "复制 CLI 命令",
    heroSecondaryAction: "试试 Playground",
    commandCopied: "已复制 CLI 命令。",
    commandCopyError: "复制失败。请手动选中命令。",
    playgroundLabel: "Playground",
    playgroundIntro: "在浏览器里用同一个引擎试跑。",
    inputLabel: "粘贴整理好的文本",
    controlsLabel: "设置确定性扰动",
    outputLabel: "可复现的扰动输出",
    parity: "和 CLI、npm package 使用同一个引擎。",
    run: "运行 noisemake",
    running: "运行中...",
    copy: "复制输出",
    copied: "已复制输出。",
    copyError: "复制失败。请手动选中输出文本。",
    inputPlaceholder: "粘贴一段文本，生成可复现的扰动版本。",
    outputPlaceholder: "运行 noisemake 后会生成可复现的扰动文本。",
    stale: "设置已变化，请重新运行。",
    noChange: "这个 seed 和 frequency 没有选中可用扰动。可以调低 frequency，或换一个 seed。",
    frequencyHelper: "数值越高，噪声越少。200 约等于每 200 个候选 token 出现 1 次变化。",
    seedHelper: "同一输入 + 同一种子 = 同一输出。",
    randomSeedLabel: "随机 seed",
    randomSeedHelper: "开启后会忽略 seed 输入框，每次运行都生成一个新的 seed。",
    lastGeneratedSeed: "上次生成的 seed",
    typoHelper: "中文使用输入法式替换，英文使用键盘式 typo。",
    repeatHelper: "轻微重复词或短语。",
    zhHelper: "应用中文策略。",
    enHelper: "应用英文策略。",
    frequencyError: "请输入正整数。",
    typeError: "至少选择一种噪声类型。",
    languageError: "至少选择一种语言策略。",
    inputRequired: "运行前请先输入文本。",
    runtimeError: "当前设置无法运行 noisemake。",
    footerPromise: "同一输入。同一种子。同一输出。",
    footerLicense: "代码 MIT。中文输入法混淆数据保持 LGPL 覆盖。",
    footerLinksLabel: "项目链接",
    footerSource: "源码",
    footerDocs: "CLI 文档",
    footerDataNotice: "数据许可",
    languageLabel: "语言",
    themeLabel: "切换主题",
    status: {
      idle: "就绪",
      dirty: "待重跑",
      invalid: "检查设置",
      running: "运行中",
      success: "可复现",
      "no-change": "无变化",
    },
    defaultInput: "这个工具用于构造评测样本，帮助我们观察模型在轻微文本扰动下是否仍然稳定。",
    labels: {
      typo: "typo",
      repeat: "repeat",
      zh: "zh",
      en: "en",
    },
    theme: {
      light: "浅",
      dark: "深",
    },
  },
};

const DEFAULT_TYPES: NoiseType[] = ["typo", "repeat"];
const DEFAULT_LANGUAGES: Language[] = ["zh", "en"];
const HERO_CLI_COMMAND = 'npx noisemake "这是一段测试文本"';
const SOURCE_URL = "https://github.com/sorcererxw/noisemake";
const README_URL = "https://github.com/sorcererxw/noisemake#readme";
const NOTICE_URL = "https://github.com/sorcererxw/noisemake/blob/main/NOTICE";

export default function PlaygroundApp({ lang }: { lang: UiLang }) {
  const copy = COPY[lang];
  const [input, setInput] = useState(copy.defaultInput);
  const [frequency, setFrequency] = useState("200");
  const [seed, setSeed] = useState("42");
  const [randomSeed, setRandomSeed] = useState(false);
  const [lastRunSeed, setLastRunSeed] = useState("");
  const [types, setTypes] = useState<NoiseType[]>(DEFAULT_TYPES);
  const [languages, setLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [output, setOutput] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [state, setState] = useState<WorkbenchState>("idle");
  const [toast, setToast] = useState<ToastState>(null);
  const [runError, setRunError] = useState("");
  const frequencyRef = useRef<HTMLInputElement>(null);

  const validation = useMemo(() => {
    const parsedFrequency = Number(frequency);

    return {
      parsedFrequency,
      input: input.trim().length > 0 ? "" : copy.inputRequired,
      frequency:
        Number.isInteger(parsedFrequency) && parsedFrequency > 0 ? "" : copy.frequencyError,
      types: types.length > 0 ? "" : copy.typeError,
      languages: languages.length > 0 ? "" : copy.languageError,
    };
  }, [copy, frequency, input, languages.length, types.length]);

  const hasValidationError = Boolean(
    validation.input || validation.frequency || validation.types || validation.languages,
  );
  const runDisabled = state === "running" || hasValidationError;
  const canCopy = Boolean(output) && (state === "success" || state === "no-change" || state === "dirty");

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function markDirty() {
    setRunError("");
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
    setRunError("");

    await new Promise((resolve) => window.setTimeout(resolve, 120));

    try {
      const runSeed = randomSeed ? createRandomSeed() : seed;
      setLastRunSeed(runSeed);
      const nextOutput = noisemake(input, {
        frequency: validation.parsedFrequency,
        seed: runSeed,
        types,
        languages,
      });
      setOutput(nextOutput);
      setSegments(diffOutput(input, nextOutput));
      setState(nextOutput === input ? "no-change" : "success");
    } catch {
      setRunError(copy.runtimeError);
      setState("invalid");
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
      setToast(copy.commandCopied);
    } catch {
      setToast(copy.commandCopyError);
    }
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
                error={validation.input}
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
                setRandomSeed={(value) => {
                  setRandomSeed(value);
                  markDirty();
                }}
                lastRunSeed={lastRunSeed}
                types={types}
                languages={languages}
                toggleType={updateTypes}
                toggleLanguage={updateLanguages}
                frequencyError={validation.frequency}
                typeError={validation.types}
                languageError={validation.languages}
                runLabel={state === "running" ? copy.running : copy.run}
                run={run}
                runDisabled={runDisabled}
                copyOutput={copyOutput}
                copyDisabled={!canCopy}
              />
              <OutputPanel
                copy={copy}
                state={state}
                output={output}
                segments={segments}
                runError={runError}
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
      <div className="footer-copy">
        <p>{copy.footerPromise}</p>
        <p>{copy.footerLicense}</p>
      </div>
      <nav className="footer-links" aria-label={copy.footerLinksLabel}>
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">
          {copy.footerSource}
        </a>
        <a href={README_URL} target="_blank" rel="noreferrer">
          {copy.footerDocs}
        </a>
        <a href={NOTICE_URL} target="_blank" rel="noreferrer">
          {copy.footerDataNotice}
        </a>
      </nav>
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
      <div className="switches" aria-label="Page controls">
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
        <p className="section-kicker">{copy.parity}</p>
        <h1 id="hero-title" className="hero-headline">
          {copy.headline}
        </h1>
        <p className="hero-proof">
          {copy.proof} <span>{copy.framing}</span>
        </p>
        <div className="hero-actions">
          <Button className="hero-primary" type="button" onClick={copyCliCommand}>
            {copy.heroPrimaryAction}
          </Button>
          <Button className="hero-secondary" variant="outline" asChild>
            <a href="#playground">{copy.heroSecondaryAction}</a>
          </Button>
        </div>
      </div>
      <CliUsagePanel copy={copy} />
    </section>
  );
}

function CliUsagePanel({ copy }: { copy: Copy }) {
  return (
    <aside className="cli-panel" aria-label={copy.cliLabel}>
      <div className="cli-panel-header">
        <span>{copy.cliLabel}</span>
        <span>{copy.cliBadge}</span>
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
          onPointerEnter={openLanguageMenu}
          onPointerLeave={closeLanguageMenu}
          onMouseEnter={openLanguageMenu}
          onMouseLeave={closeLanguageMenu}
          onPointerDown={(event) => {
            event.preventDefault();
          }}
          onFocus={openLanguageMenu}
          onBlur={closeLanguageMenu}
        >
          <Languages aria-hidden="true" size={15} />
          <ChevronDown className="language-chevron" aria-hidden="true" size={12} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="language-menu"
        onPointerEnter={openLanguageMenu}
        onPointerLeave={closeLanguageMenu}
        onMouseEnter={openLanguageMenu}
        onMouseLeave={closeLanguageMenu}
        onFocusCapture={openLanguageMenu}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            closeLanguageMenu();
          }
        }}
        onEscapeKeyDown={() => setLanguageOpen(false)}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {(["zh", "en"] as const).map((item) => (
          <DropdownMenuItem
            key={item}
            asChild
            className={cn("language-menu-item", item === lang && "is-active")}
          >
            <a href={`/${item}`} onClick={() => storeLang(item)}>
              <span>{item}</span>
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
    <div className="theme-switch-control" aria-label="Theme">
      <Button
        className="theme-toggle-button"
        type="button"
        variant="ghost"
        size="icon"
        aria-label={copy.themeLabel}
        aria-pressed={mounted && theme === "dark"}
        suppressHydrationWarning
        title={copy.themeLabel}
        onPointerDown={(event) => {
          event.preventDefault();
          toggleTheme();
        }}
        onClick={(event) => {
          if (event.detail === 0) {
            toggleTheme();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleTheme();
          }
        }}
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
  error,
}: {
  copy: Copy;
  input: string;
  setInput: (value: string) => void;
  error: string;
}) {
  return (
    <section className="panel input-panel" aria-labelledby="input-label">
      <div className="panel-heading">
        <h2 id="input-label">{copy.inputLabel}</h2>
      </div>
      <textarea
        className="text-field input-textarea"
        value={input}
        aria-describedby={error ? "input-error" : undefined}
        aria-invalid={Boolean(error)}
        placeholder={copy.inputPlaceholder}
        onChange={(event) => setInput(event.target.value)}
      />
      {error ? (
        <p className="field-error" id="input-error">
          {error}
        </p>
      ) : null}
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
  lastRunSeed,
  types,
  languages,
  toggleType,
  toggleLanguage,
  frequencyError,
  typeError,
  languageError,
  runLabel,
  run,
  runDisabled,
  copyOutput,
  copyDisabled,
}: {
  copy: Copy;
  frequency: string;
  frequencyRef: RefObject<HTMLInputElement | null>;
  setFrequency: (value: string) => void;
  seed: string;
  setSeed: (value: string) => void;
  randomSeed: boolean;
  setRandomSeed: (value: boolean) => void;
  lastRunSeed: string;
  types: NoiseType[];
  languages: Language[];
  toggleType: (type: NoiseType) => void;
  toggleLanguage: (language: Language) => void;
  frequencyError: string;
  typeError: string;
  languageError: string;
  runLabel: string;
  run: () => void;
  runDisabled: boolean;
  copyOutput: () => void;
  copyDisabled: boolean;
}) {
  return (
    <section className="panel control-panel" aria-labelledby="controls-label">
      <div className="panel-heading">
        <h2 id="controls-label">{copy.controlsLabel}</h2>
      </div>

      <label className="field-label" htmlFor="frequency">
        frequency
      </label>
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
      <p className="helper-text" id="frequency-helper">
        {copy.frequencyHelper}
      </p>
      {frequencyError ? (
        <p className="field-error" id="frequency-error">
          {frequencyError}
        </p>
      ) : null}

      <label className="field-label" htmlFor="seed">
        seed
      </label>
      <input
        className="control-input mono-value"
        id="seed"
        value={seed}
        disabled={randomSeed}
        aria-describedby="seed-helper"
        onChange={(event) => setSeed(event.target.value)}
      />
      <p className="helper-text" id="seed-helper">
        {copy.seedHelper}
      </p>
      <div className="switch-row">
        <button
          className={cn("switch-button", randomSeed && "is-active")}
          type="button"
          role="switch"
          aria-checked={randomSeed}
          onClick={() => setRandomSeed(!randomSeed)}
        >
          <span className="switch-track" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
          <span>{copy.randomSeedLabel}</span>
        </button>
        <p className="helper-text">{copy.randomSeedHelper}</p>
        {randomSeed && lastRunSeed ? (
          <p className="helper-text">
            {copy.lastGeneratedSeed}: <code className="mono-value">{lastRunSeed}</code>
          </p>
        ) : null}
      </div>

      <ChipGroup
        legend="types"
        error={typeError}
        options={(["typo", "repeat"] as const).map((value) => ({
          value,
          label: copy.labels[value],
          helper: value === "typo" ? copy.typoHelper : copy.repeatHelper,
          active: types.includes(value),
          toggle: () => toggleType(value),
        }))}
      />

      <ChipGroup
        legend="languages"
        error={languageError}
        options={(["zh", "en"] as const).map((value) => ({
          value,
          label: copy.labels[value],
          helper: value === "zh" ? copy.zhHelper : copy.enHelper,
          active: languages.includes(value),
          toggle: () => toggleLanguage(value),
        }))}
      />

      <div className="control-actions">
        <Button className="run-button" type="button" onClick={run} disabled={runDisabled}>
          {runLabel}
        </Button>
        <Button type="button" variant="outline" onClick={copyOutput} disabled={copyDisabled}>
          {copy.copy}
        </Button>
      </div>
    </section>
  );
}

function ChipGroup({
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
    <fieldset className="chip-fieldset" aria-describedby={error ? errorId : undefined}>
      <legend>{legend}</legend>
      <div className="chip-row">
        {options.map((option) => (
          <button
            key={option.value}
            className={cn("choice-chip", option.active && "is-active")}
            type="button"
            aria-pressed={option.active}
            title={option.helper}
            onClick={option.toggle}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="helper-text">{options.map((option) => option.helper).join(" ")}</p>
      {error ? (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

function OutputPanel({
  copy,
  state,
  output,
  segments,
  runError,
}: {
  copy: Copy;
  state: WorkbenchState;
  output: string;
  segments: Segment[];
  runError: string;
}) {
  const showOutput = Boolean(output);

  return (
    <section className="panel output-panel" aria-labelledby="output-label">
      <div className="panel-heading">
        <h2 id="output-label">{copy.outputLabel}</h2>
        <span className={cn("status-pill", state === "dirty" && "is-stale")}>
          {copy.status[state]}
        </span>
      </div>
      <div className="output-region" aria-live="polite" aria-atomic="false">
        {showOutput ? <ChangedTextOutput segments={segments} /> : <p>{copy.outputPlaceholder}</p>}
      </div>
      {state === "no-change" ? <p className="notice-text">{copy.noChange}</p> : null}
      {state === "dirty" ? <p className="notice-text">{copy.stale}</p> : null}
      {runError ? <p className="field-error">{runError}</p> : null}
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

  return Array.from(bytes, (value) => value.toString(36).padStart(7, "0")).join("-");
}
