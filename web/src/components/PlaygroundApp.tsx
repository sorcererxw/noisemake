import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { ArrowDown, ChevronDown, CircleHelp, Copy, Languages, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { diffOutput, type Segment } from "@/lib/diff-output";
import {
  TRANSFORM_ENDPOINT,
  type Language,
  type NoiseType,
  type TransformRequest,
  type TransformResponse,
  type TransformSuccessResponse,
} from "@/lib/transform";
import { UI_COPY, type UiCopy, type UiLang } from "@/lib/i18n";

type ThemeMode = "light" | "dark";
type WorkbenchState = "idle" | "dirty" | "invalid" | "running" | "success" | "no-change";
type ToastState = string | null;

const DEFAULT_TYPES: NoiseType[] = ["typo", "repeat", "spacing", "punct", "swap"];
const DEFAULT_LANGUAGES: Language[] = ["zh", "en"];
const SOURCE_URL = "https://github.com/sorcererxw/noisemake";
const NPM_URL = "https://www.npmjs.com/package/noisemake";
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
  "flex h-8 min-w-0 items-center gap-1 rounded-md border px-2 py-1 text-left text-muted-foreground transition-all hover:-translate-y-px";
const TAG_INDICATOR_BASE_CLASSES =
  "size-2.5 shrink-0 rounded-full border border-muted-foreground/50 opacity-70 transition-all";

async function copyTextToClipboard(text: string) {
  if (fallbackCopyText(text)) {
    return true;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function fallbackCopyText(text: string) {
  const textarea = document.createElement("textarea");
  const previousActiveElement = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
  const selection = document.getSelection();
  const previousSelection = selection?.rangeCount
    ? selection.getRangeAt(0).cloneRange()
    : null;

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
    if (previousSelection) {
      selection?.removeAllRanges();
      selection?.addRange(previousSelection);
    }
    previousActiveElement?.focus();
  }
}

export default function PlaygroundApp({ lang }: { lang: UiLang }) {
  const copy = UI_COPY[lang];
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

    if (await copyTextToClipboard(output)) {
      setToast(copy.copied);
    } else {
      setToast(copy.copyError);
    }
  }

  async function copyCliCommand() {
    if (await copyTextToClipboard(copy.cliCommand)) {
      setToast(copy.copied);
    } else {
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
        <HeaderBar lang={lang} copy={copy} />
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

        <ExplainerSection copy={copy} />

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

function SiteFooter({ copy }: { copy: UiCopy }) {
  const footerLinks = [
    [copy.footerOpenSource, SOURCE_URL],
    [copy.footerNpm, NPM_URL],
  ] as const;

  return (
    <footer className="mt-1 flex flex-col items-start justify-end gap-2 py-3 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-center">
      <div className="flex w-full flex-wrap justify-start gap-x-3 gap-y-1 sm:justify-end">
        {footerLinks.map(([label, href]) => (
          <a
            key={href}
            className="inline-flex min-h-11 items-center font-medium text-foreground underline underline-offset-4 decoration-foreground/35 hover:decoration-primary"
            href={href}
            target="_blank"
            rel="noreferrer"
          >
            {label}
          </a>
        ))}
      </div>
    </footer>
  );
}

function HeaderBar({ lang, copy }: { lang: UiLang; copy: UiCopy }) {
  return (
    <header className="flex flex-col items-start justify-between gap-4 pt-4 pb-2 sm:flex-row sm:items-center">
      <a
        className="inline-flex items-center gap-2 font-display text-xl font-semibold text-foreground no-underline"
        href={`/${lang}`}
        aria-label={copy.brandName}
      >
        <img className="block size-6 shrink-0" src="/noise-face.svg" alt="" width="24" height="24" />
        <span>{copy.brandName}</span>
      </a>
      <div className="flex min-w-0 flex-wrap items-center justify-start gap-x-2 gap-y-1 sm:justify-end">
        <LanguageSwitch lang={lang} copy={copy} />
        <span className="h-4 w-px bg-border/80" aria-hidden="true" />
        <ThemeSwitch copy={copy} />
      </div>
    </header>
  );
}

function Hero({
  copy,
  copyCliCommand,
}: {
  copy: UiCopy;
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
          className="max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl lg:leading-none"
        >
          {copy.headline}
        </h1>
        <p className="mt-3 max-w-2xl break-words text-base leading-7 text-muted-foreground sm:text-lg">
          {copy.proof}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="button" size="lg" className="px-3 font-semibold" onClick={copyCliCommand}>
            <Copy aria-hidden="true" size={16} />
            {copy.copyCliCommand}
          </Button>
          <Button asChild variant="outline" size="lg" className="px-3 font-semibold">
            <a href="#playground">
              <ArrowDown aria-hidden="true" size={16} />
              {copy.tryPlayground}
            </a>
          </Button>
        </div>
      </div>
      <CliUsagePanel copy={copy} copyCliCommand={copyCliCommand} />
    </section>
  );
}

function ExplainerSection({ copy }: { copy: UiCopy }) {
  return (
    <section className="grid gap-4 pt-8 pb-6 md:grid-cols-12 md:pt-10 md:pb-8" aria-labelledby="explainer-title">
      <div className="min-w-0 md:col-span-5">
        <h2 id="explainer-title" className="font-display text-2xl font-semibold leading-tight">
          {copy.explainerTitle}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{copy.explainerIntro}</p>
      </div>
      <ul className="grid min-w-0 gap-2 text-sm leading-6 text-muted-foreground md:col-span-7 sm:grid-cols-2">
        {copy.explainerItems.map((item) => (
          <li key={item} className="border-l border-border pl-3">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CliUsagePanel({
  copy,
  copyCliCommand,
}: {
  copy: UiCopy;
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
          aria-label={copy.copyCliCommand}
          title={copy.copyCliCommand}
          onClick={copyCliCommand}
        >
          <Copy aria-hidden="true" size={14} />
        </Button>
      </div>
      <pre className="m-0 overflow-x-auto p-4 font-mono text-sm leading-7 text-foreground whitespace-pre-wrap break-words">
        <code>
          <span className="text-muted-foreground select-none" aria-hidden="true">$ </span>
          {copy.cliCommand}
        </code>
      </pre>
    </aside>
  );
}

function LanguageSwitch({ lang, copy }: { lang: UiLang; copy: UiCopy }) {
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

function ThemeSwitch({ copy }: { copy: UiCopy }) {
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
  copy: UiCopy;
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
  copy: UiCopy;
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
        "border-t md:col-span-2 md:row-start-2 md:border-l-0 lg:col-span-2 lg:h-[36rem] lg:row-start-auto lg:border-t-0 lg:border-l",
      )}
      aria-labelledby="controls-label"
    >
      <div className={PANEL_HEADER_CLASSES}>
        <h2 id="controls-label" className={PANEL_TITLE_CLASSES}>
          {copy.controlsLabel}
        </h2>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto lg:pr-1">
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

        <MultiTagSelectorField
          legend={copy.typesLabel}
          error={typeError}
          showValue={false}
          values={["typo", "repeat", "spacing", "punct", "swap"] as const}
          selectedValues={types}
          labels={copy.labels}
          helpers={copy.typeHelpers}
          onToggle={toggleType}
        />

        <MultiTagSelectorField
          legend={copy.languagesLabel}
          error={languageError}
          showValue={false}
          values={["zh", "en"] as const}
          selectedValues={languages}
          labels={copy.languageLabels}
          helpers={copy.languageHelpers}
          onToggle={toggleLanguage}
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-4 lg:pt-6">
        <Button className="w-full px-3 font-semibold" type="button" size="lg" onClick={run} disabled={runDisabled}>
          {runLabel}
        </Button>
      </div>
    </section>
  );
}

function MultiTagSelectorField<T extends string>({
  legend,
  error,
  showValue = true,
  values,
  selectedValues,
  labels,
  helpers,
  onToggle,
}: {
  legend: string;
  error: string;
  showValue?: boolean;
  values: readonly T[];
  selectedValues: readonly T[];
  labels: Record<T, string>;
  helpers: Record<T, string>;
  onToggle: (value: T) => void;
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
        {values.map((value) => {
          const helper = helpers[value];
          const active = selectedValues.includes(value);
          const button = (
            <button
              key={value}
              className={cn(
                TAG_BUTTON_BASE_CLASSES,
                active
                  ? "border-primary/60 bg-accent/60 text-accent-foreground"
                  : "border-border bg-background",
              )}
              type="button"
              aria-pressed={active}
              aria-describedby={helper ? `${legend}-${value}-helper` : undefined}
              onClick={() => onToggle(value)}
            >
              <span
                className={cn(
                  TAG_INDICATOR_BASE_CLASSES,
                  active && "border-primary bg-primary opacity-100 ring-3 ring-primary/20",
                )}
                aria-hidden="true"
              />
              {showValue ? (
                <span className="shrink-0 font-mono text-xs font-bold leading-none">
                  {value}
                </span>
              ) : null}
              <span className="max-w-full flex-1 truncate text-xs font-semibold leading-none whitespace-nowrap">
                {labels[value]}
              </span>
              {helper ? (
                <span className="sr-only" id={`${legend}-${value}-helper`}>
                  {helper}
                </span>
              ) : null}
            </button>
          );

          if (!helper) {
            return button;
          }

          return (
            <TooltipProvider key={value} delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent>
                  <p>{helper}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
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
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex size-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
            type="button"
            aria-label={text}
          >
            <CircleHelp aria-hidden="true" size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
  copy: UiCopy;
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
          className="size-7 text-muted-foreground hover:text-foreground"
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={copy.copyOutput}
          title={copy.copyOutput}
          onClick={copyOutput}
          disabled={copyDisabled}
        >
          <Copy aria-hidden="true" size={16} />
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
