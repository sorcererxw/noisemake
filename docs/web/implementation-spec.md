# Web Implementation Spec

## Inputs

Read these first:

- `docs/web/plan.md`
- `docs/web/design-system.md`
- `docs/web/design-brief.md`
- `web/src/styles/global.css`
- root package exports from `src/index.ts`

This spec is the engineering handoff. `docs/web/plan.md` defines the package
boundary and scope. `docs/web/design-system.md` is the design system.
`docs/web/design-brief.md` is the product and interaction brief.

## Repo Setup Note

The generated `web/` directory currently appears to contain its own `.git/`
metadata. Before implementation, decide whether `web/` is meant to be a normal
package inside the root pnpm workspace or an intentionally separate repository.

Expected direction for this project: `web/` should be a normal workspace package
owned by the root repo. If so, remove the nested git boundary in a deliberate
repo-maintenance step before relying on root-level git status, commits, or PRs.

## Goal

Build the `noisemake` web playground as a Hugging Face-inspired open research playground:

- CLI-led tool page, not a generic landing page.
- Friendly and community-native, not an enterprise dashboard.
- Deterministic and trustworthy: same input, same seed, same output.
- Uses the root package via `noisemake: "workspace:*"`.
- Does not change CLI behavior or the core perturbation algorithm.

## Routes

- `/` redirects server-side based on `Accept-Language`.
- `/zh` renders the Chinese page.
- `/en` renders the English page.

Language behavior:

- Manual language switch is visible in the header.
- Manual choice is stored in `localStorage`.
- `/` still uses server-side `Accept-Language` detection.
- If a user manually switches language on `/zh` or `/en`, navigate to the matching route and persist the choice.

Theme behavior:

- Use class-based dark mode.
- Support light, dark, and system modes.
- Store explicit user theme choice in `localStorage`.

## Page Structure

```text
--------------------------------------------------------------+
| noise face  noisemake                         zh/en theme    |
+--------------------------------------------------------------+
| Hero                                                         |
| Deterministic text noise for evals.      +----------------+  |
| Same input, same seed, same output.      | $ npx          |  |
| Not an LLM rewrite. Controlled noise.    |   noisemake    |  |
| Same engine as CLI and package.          |   "..."        |  |
|                                          +----------------+  |
+--------------------------------------------------------------+
| Playground                                                   |
| Workbench surface                                           |
| +------------------+-------------------+-------------------+ |
| | Input panel      | Control rail      | Output panel      | |
| | textarea         | frequency         | output            | |
| |                  | seed              | changed spans     | |
| |                  | type chips        | copy status       | |
| |                  | language chips    |                   | |
| |                  | Run / Copy        |                   | |
| +------------------+-------------------+-------------------+ |
+--------------------------------------------------------------+
```

Component split:

- `NoiseFaceMark`
- `HeaderBar`
- `Hero`
- `CliUsagePanel`
- `LanguageSwitch`
- `ThemeSwitch`
- `PlaygroundSection`
- `Workbench`
- `InputPanel`
- `ControlRail`
- `OutputPanel`
- `ChangedTextOutput`

Keep the main workbench as one surface with internal panel dividers. Do not build it as three unrelated decorative cards. The CLI usage panel may be framed like a terminal because it is content and instruction, not decoration.

`CliUsagePanel` should show one real minimal command and may include a small copy command
action. Copying a command should use the same toast pattern as output copy. Do
not add any command execution behavior in the browser.

The hero command must stay flagless. Detailed flags belong in GitHub docs and
`noisemake --help`, not the first screen.

Hero actions:

- Primary button: `Copy CLI command`, copying the hero CLI command.
- Secondary button/link: `Try Playground`, scrolling or jumping to the
  `PlaygroundSection`.
- Chinese copy may keep `Playground` as the section label and use surrounding
  Chinese helper copy to explain that this is the browser playground.

## Noise Face SVG

Create a small SVG asset:

- Path: prefer `web/src/assets/noise-face.svg` if Astro import is convenient; otherwise `web/public/noise-face.svg`.
- Size target: readable at 16-24px.
- Shape: rounded square.
- Details: two offset dot eyes, slightly jagged mouth.
- No emoji.
- No large mascot or hero character.
- Use near the localized wordmark only: `noisemake` in English, `造声` in Chinese.

## Copy

English:

- Headline: `Deterministic text noise for evals.`
- Proof line: `Same input, same seed, same output.`
- Framing: `Not an LLM rewrite. Controlled perturbation.`
- Hero CLI label: `CLI usage`
- Hero CLI command: `npx noisemake "This parser stays stable"`
- Hero primary action: `Copy CLI command`
- Hero secondary action: `Try Playground`
- Playground label: `Playground`
- Input label: `Paste polished text`
- Controls label: `Set deterministic noise`
- Output label: `Reproducible noisy output`
- Parity hint: `Same engine as the CLI and npm package.`
- Run: `Run noisemake`
- Copy: `Copy output`

Chinese:

- Brand name: `造声`
- Headline: `给评测用的可复现文本噪声。`
- Proof line: `同一输入、同一种子、同一输出。`
- Framing: `不是 LLM 改写，而是可控扰动。`
- Hero CLI label: `CLI 用法`
- Hero CLI command: `npx noisemake "这是一段测试文本"`
- Hero primary action: `复制 CLI 命令`
- Hero secondary action: `试试 Playground`
- Playground label: `Playground`

Avoid copy that sounds like detector evasion.

## Controls

Default values:

- `input`: prefill with a realistic sample that matches the current UI language.
- `frequency`: `5`
- `seed`: `42`
- `types`: `["typo", "repeat", "spacing", "punct", "swap"]`
- `languages`: `["zh", "en"]`

Control behavior:

- Output changes only after the user clicks Run.
- Editing input or controls after a successful run marks the output as stale.
- Copy output is disabled until a successful run has produced output.

Validation:

- `frequency` must be a positive integer.
- At least one type must be selected.
- At least one language must be selected.
- Inline validation errors live next to the relevant field or group.
- Run is disabled while validation errors exist.

Helper copy:

- `frequency`: `Higher means less noise.`
- `seed`: `Same input + same seed = same output.`
- `typo`: `IME-style Chinese substitutions and keyboard-like English typos.`
- `repeat`: `Light word or phrase repetition.`
- `spacing`: `Whitespace glitches across words, punctuation, and mixed Chinese-English boundaries.`
- `punct`: `Normalize full-width Chinese punctuation into ASCII marks.`
- `swap`: `Swap two adjacent words without crossing punctuation.`
- `zh`: `Apply Chinese strategies.`
- `en`: `Apply English strategies.`

## State Machine

States:

| State | Trigger | UI |
|-------|---------|----|
| `idle` | Initial load | Output placeholder. Copy disabled. |
| `dirty` | User edits input or settings after output exists | Previous output remains, stale status says `Settings changed, run again`. |
| `invalid` | Invalid frequency, empty types, or empty languages | Inline error, Run disabled. |
| `running` | User clicks Run | Run disabled, label `Running...`. |
| `success` | `noisemake()` returns changed output | Output visible, changed spans highlighted if available. Copy enabled. |
| `no-change` | Output equals input | Show unchanged output and explain: `No eligible mutation was selected for this seed and frequency. Try a lower frequency or a different seed.` |
| `copy-success` | Copy succeeds | Short toast: `Copied output.` |
| `copy-error` | Copy fails | Short toast: `Could not copy. Select the output text manually.` |

## noisemake Integration

Call the root package:

```ts
import { noisemake } from "noisemake";

const output = noisemake(inputText, {
  frequency,
  seed,
  types,
  languages,
});
```

Do not add a server-side API. Run the package in the web app.

If the current package only returns a string and not mutation spans:

- MVP highlight option: compute a simple text diff between input and output and highlight changed output segments.
- Better future option: add span/report support only in a later planned core API change. Do not change the core perturbation algorithm for this web page.
- Do not modify the core perturbation algorithm just to support web highlighting.

## Styling Tasks

Start from `web/src/styles/global.css`.

Required token changes:

- Add `--font-display` and `--font-body`.
- Stop applying mono to all `html`; use body font globally.
- Keep `JetBrains Mono Variable` for seed, frequency, CLI snippets, and compact metadata.
- Add `--changed-bg` and `--changed-border` to `:root` and `.dark`.
- Tune primary/accent toward warm yellow from `docs/web/design-system.md`.
- Avoid purple/indigo accents and dark-blue dashboard surfaces.
- Keep default radius at `8px` or below for normal controls; outer workbench may be `10px`.

Recommended font dependencies:

- `@fontsource/space-grotesk` or equivalent variable package.
- `@fontsource/ibm-plex-sans`.
- `@fontsource/noto-sans-sc`.

If adding all three is too heavy, prioritize `IBM Plex Sans` + `Noto Sans SC`, and use existing JetBrains Mono for code-like values.

## Responsive Behavior

Breakpoints:

- Desktop, `>= 1024px`: two-column hero, then input, controls, output in three playground columns.
- Tablet, `768px - 1023px`: hero stacks copy above CLI if needed; playground uses input/output side by side if space allows, controls as a full-width row or compact rail.
- Mobile, `< 768px`: single column from header through output.

Mobile order:

1. Header controls.
2. Hero copy.
3. CLI usage panel.
4. Playground label and example buttons.
5. Input.
6. Controls.
7. Run.
8. Output.

Output must appear immediately after Run. Do not hide output behind tabs, drawers, accordions, or scroll traps.

## Accessibility

- Use one `main` landmark.
- All controls need visible labels.
- Language switch and theme switch must be keyboard reachable.
- Minimum mobile touch target: `44px`.
- Validation errors must be associated with the relevant input/group.
- Output region should use a polite live region after Run completes.
- Changed spans must not rely on color alone; combine warm highlight with underline, border, or marker.
- Focus rings must be visible in light and dark mode.
- Respect `prefers-reduced-motion`.

## Not In Scope

- Auth.
- Saved history.
- File upload.
- Batch processing.
- Server-side API for perturbation.
- Database or KV storage.
- Analytics.
- Actual Cloudflare deployment.
- CLI behavior changes.
- Core perturbation algorithm changes.
- Exporting mutation reports from the package in this pass.

## QA Checklist

- `/` redirects based on `Accept-Language`.
- `/zh` renders Chinese page.
- `/en` renders English page.
- Manual language switch persists and navigates correctly.
- Theme switch supports light, dark, and system, and persists explicit choice.
- Same input + same seed + same options returns same output after repeated runs.
- Hero shows exactly one flagless CLI command, localized by route:
  `/en` uses `npx noisemake "This parser stays stable"` and `/zh` uses `npx noisemake "这是一段测试文本"`.
- Hero primary action copies the hero CLI command; secondary action moves to the
  `Playground` section.
- Playground appears directly below the hero and is not presented as a decorative embedded preview.
- Editing after run shows stale status.
- Invalid `frequency` disables Run and shows inline error.
- Empty type selection disables Run and shows inline error.
- Empty language selection disables Run and shows inline error.
- No-change output is explained.
- Copy success and failure states work.
- Desktop, tablet, and mobile layouts match this spec.
- Keyboard-only path can reach input, controls, Run, output, copy, language, and theme.
- Dark mode contrast is acceptable.
- No purple/indigo gradient or generic SaaS card grid.

## Design QA Gate

After implementation, run a design QA pass before shipping. Check specifically:

- The page still feels like a Hugging Face-inspired open research playground, not
  an enterprise dashboard.
- The larger hero earns its size with CLI usage, not decorative hero art or a
  generic feature grid.
- At desktop size, the first viewport shows enough of the playground below the
  hero that users know it is immediately usable.
- Noise face appears as a tiny SVG mark near the wordmark and does not become a
  large mascot.
- Mobile order is header controls, hero copy, CLI usage, input, controls, Run, output.
- Dark mode preserves contrast and does not become a dark blue/purple dashboard.
- Changed spans are visible and do not rely on color alone.
- shadcn components support the experience without turning the page into a card
  grid or component gallery.
