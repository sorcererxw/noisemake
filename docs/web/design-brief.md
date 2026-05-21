# Web Design Brief

## Goal

Build the `noisemake` web page as a small, credible playground for deterministic
text perturbation.

The page should make the product clear quickly:

- Paste polished text.
- Choose deterministic noise settings.
- Get a reproducible noisy variant using the same engine as the CLI/package.

This is not a marketing-only landing page. The primary screen should be usable.

## Product Context

`noisemake` is a TypeScript npm package and CLI that injects controlled,
reproducible imperfections into text. It supports:

- Chinese IME-style typo substitutions.
- English keyboard typo simulation.
- Light repetition.
- Adjacent word swaps.
- Deterministic output with `seed`.
- Noise density with `frequency`.
- Language filters: `zh`, `en`.
- Noise type filters: `typo`, `repeat`, `spacing`, `punct`, `swap`.

The first users are researchers and agent workflows that need reproducible noisy
text fixtures, not vague LLM rewriting.

## Technical Constraints

- Use Astro for the web app.
- Use Tailwind CSS for styling.
- Use shadcn/ui components.
- Initialize shadcn with:

```bash
pnpm dlx shadcn@latest init --preset bd1gALiK --template astro
```

- Use official CLI generation for base setup instead of hand-writing framework
  boilerplate.
- Deploy target is Cloudflare Workers.
- Use pnpm workspace mode:

```yaml
packages:
  - "."
  - "web"
```

- Do not add web scripts to the root `package.json`.
- `web/package.json` should own web commands and dependencies.
- The web app should depend on the root package through:

```json
{
  "dependencies": {
    "noisemake": "workspace:*"
  }
}
```

- Do not change the CLI behavior.
- Do not change the core perturbation algorithm.

## Routing and i18n

Routes:

- `/` should server-side redirect based on `Accept-Language`.
- `/zh` renders the Chinese page.
- `/en` renders the English page.

Language switching:

- The page should provide a visible manual language switch.
- Manual language choice should be stored in `localStorage`.
- Browser language detection is still handled server-side at `/`.

## Dark Mode

Support dark mode using the standard shadcn + Tailwind CSS approach:

- Class-based dark mode.
- shadcn CSS variable tokens.
- Light / dark / system mode switching.
- Store explicit user theme choice in `localStorage`.

## Suggested Page Shape

Use a CLI-led tool layout. The hero must sell the tool by showing real usage,
not by behaving like a generic SaaS landing page. The `Playground` section stays
directly below the hero.

First-screen hierarchy:

1. Product identity, language switch, and theme switch.
2. A larger hero with the deterministic positioning line and proof sentence.
3. Actual CLI usage, shown as the hero's primary visual anchor.
4. The top edge of the `Playground` section, so the user can see that the page is
   still usable immediately.

The hero should feel generous: more vertical room, stronger typography, and a
clear CLI code surface. It should not use a stock illustration, decorative blob,
or feature-card grid. The hero earns its size by teaching:

```bash
npx -y noisemake "This parser stays stable"
```

Keep the hero CLI example to one minimal command without `noisemake` options.
Localize the sample text by route: English on `/en`, Chinese on `/zh`. Detailed
options belong in GitHub docs and `noisemake --help`, not in the hero.

The playground can sit just below the fold on small screens, but desktop should
show at least its section label or top border in the first viewport. This keeps
the product from becoming a marketing page with a buried demo.

Hero actions:

- Primary: `Copy command`. This copies the CLI example and confirms
  with the same toast style used by output copy.
- Secondary: `Try Playground`. This scrolls or jumps to the `Playground` section.
- Do not use generic CTA language such as `Get started`.

Suggested top-level layout:

```text
+--------------------------------------------------------------+
| product logo noisemake                        zh/en theme    |
+--------------------------------------------------------------+
| HERO                                                         |
| Make text less polished                  +----------------+  |
| Inject small mistakes so text feels      | $ npx          |  |
| more hand-written.                       |   noisemake    |  |
| Same engine as CLI and package.          |   "..."        |  |
|                                          +----------------+  |
+--------------------------------------------------------------+
| Playground                                                   |
| Paste polished text    | Set deterministic    | Reproducible  |
|                        | noise                | noisy output  |
|                        | - frequency          |               |
|                        | - seed               |               |
|                        | - typo/repeat/spacing/punct |               |
|                        | - zh/en              |               |
|                        | - run/copy           |               |
+--------------------------------------------------------------+
```

Use a single workbench surface with internal panel dividers. Do not wrap input,
controls, and output in three separate decorative cards. shadcn components should
provide form controls and feedback, not define the whole page as a component
gallery.

Workbench section labels:

- Input panel: "Paste polished text"
- Control rail: "Set deterministic noise"
- Output panel: "Reproducible noisy output"
- Playground section label: "Playground"
- Parity hint in hero: "Same engine as the CLI and npm package."

Desktop layout:

- Hero: two-column composition, copy on the left and CLI usage panel on the
  right. Keep the CLI panel compact enough that the hero does not become a fake
  dashboard.
- The hero can use a larger type scale than the current top band, but keep the
  copy short: brand, headline, proof, framing, CLI parity, and one anchor link to
  the playground if needed.
- The CLI panel should show exactly one minimal command with no flags. Do not
  include `--seed`, `--frequency`, `--types`, or `--languages` in the hero.
- The hero action group should place `Copy command` first and `Try Playground`
  second.
- Keep input and output as the dominant panes.
- Keep the control rail narrower than the text panes.
- Put `frequency`, `seed`, type filters, language filters, Run, and Copy in the
  control rail.
- Keep the seed and frequency controls close to Run so the reproducibility model
  is visible at the moment of action.

Mobile layout:

- Order the hero as product controls, headline/proof, CLI usage, then playground.
- Order the workbench as input, compact controls, Run, output.
- Keep output immediately after Run so users do not hunt for the result.
- Keep the CLI usage readable without horizontal page scroll; allow code lines to
  wrap or scroll inside the code surface only.

## User-Facing Controls

The playground should include:

- Input textarea.
- Output textarea.
- Frequency input.
- Seed input.
- Noise type checkboxes: `typo`, `repeat`, `spacing`, `punct`, `swap`.
- Language checkboxes: `zh`, `en`.
- Run button.
- Copy output button.
- Clear error messages for invalid settings.

Interaction model:

- Output changes only when the user clicks Run.
- Editing input or controls after a run marks the output as stale until Run is
  clicked again.
- Copy output is disabled until a successful run has produced output.

Default controls:

- `frequency`: numeric input, default `5`, positive integer only.
- `input`: prefilled with a language-matched sample for the current UI route.
- `seed`: text input, default `42` so first-time users immediately see
  reproducible behavior.
- Noise types: `typo`, `repeat`, `spacing`, `punct`, and `swap` all checked by default; at least one must
  remain checked.
- Languages: `zh` and `en` both checked by default; at least one must remain
  checked.

Control helper copy:

- `frequency`: "Higher means less noise."
- `seed`: "Fixed seed keeps output stable for the same input."
- `typo`: "IME-style Chinese substitutions and keyboard-like English typos."
- `repeat`: "Light word or phrase repetition."
- `spacing`: "Whitespace glitches across words, punctuation, and mixed Chinese-English boundaries."
- `punct`: "Normalize full-width Chinese punctuation into ASCII marks."
- `swap`: "Swap two adjacent words without crossing punctuation."
- `zh`: "Apply Chinese strategies."
- `en`: "Apply English strategies."

Interaction states:

| Feature | State | What the user sees |
|---------|-------|--------------------|
| Input | Empty | Placeholder text appears. Run is disabled until input has non-empty text. |
| Input | Edited after run | Output keeps the previous result but shows a small "Settings changed, run again" status. |
| Controls | Invalid frequency | Inline error next to frequency: "Use a positive whole number." Run is disabled and focus moves to the field on submit. |
| Controls | No type selected | Inline error in the type group: "Choose at least one noise type." |
| Controls | No language selected | Inline error in the language group: "Choose at least one language." |
| Run | Ready | Primary button label: "Run noisemake". |
| Run | Running | Button label: "Running...", disabled until the current run finishes. |
| Output | Before first run | Quiet placeholder: "Output appears after you run noisemake." |
| Output | Success | Output text appears in the output pane with changed spans visually highlighted. |
| Output | No changes | Output pane keeps the input text and shows: "No eligible mutation was selected for this seed and frequency. Try a lower frequency or a different seed." |
| Output | Stale | Previous output remains visible with a muted stale status until the next successful run. |
| Copy | Disabled | Disabled until successful output exists. |
| Copy | Success | Short toast: "Copied output." |
| Copy | Failure | Short error toast: "Could not copy. Select the output text manually." |

## User Journey

The page should feel like an open research playground: friendly enough to try
immediately, precise enough to trust for deterministic eval fixtures, and not a
vague AI-humanizer.

Storyboard:

| Step | User does | User should feel | UI support |
|------|-----------|------------------|------------|
| 1 | Lands on `/zh` or `/en` | "I know what this is, and I can use it from my terminal." | Larger hero states deterministic text noise and shows one real CLI command. |
| 2 | Scans the CLI panel | "This is not a vague AI rewriter." | The command is short enough to understand immediately; deeper options are left to GitHub docs and CLI help. |
| 3 | Scrolls or jumps to Playground | "I can try the same engine here." | Playground section appears immediately after the hero, not behind feature copy. |
| 4 | Reviews or edits the default text | "This is a real tool, not a mockup." | Input starts with a realistic sample that matches the current interface language and accepts pasted text directly. |
| 5 | Reviews `frequency` and `seed` | "The controls map to reproducibility." | Helper copy explains that higher frequency means less noise and fixed seed keeps output stable. |
| 6 | Clicks Run | "A deliberate operation happened." | Run shows a short running state; output changes only after Run. |
| 7 | Reads output | "I can inspect what changed." | Changed spans are highlighted inline; no-change cases explain why nothing changed. |
| 8 | Copies output | "This is usable in my workflow." | Copy button confirms success with a short toast. |
| 9 | Tweaks settings | "I know the previous output is stale." | Output remains visible but shows "Settings changed, run again." |

First 5 seconds:

- The page must communicate deterministic research/tooling, not detector evasion.
- The hero must show one real minimal CLI command before any abstract product claims.
- The playground section label or top edge must be visible on desktop so the demo
  feels close, not buried.
- The first visible action should be terminal/tooling-oriented, such as copying the
  CLI command or jumping to `Playground`, not "Get started" or "Learn more".

First 5 minutes:

- The user should learn the reproducibility model by using the controls.
- The no-change result must feel expected, not broken.
- The CLI/package parity cue should make the web page feel like the same engine,
  not a separate toy.

Long-term relationship:

- The page should become predictable in the good way: stable controls, repeatable
  output, no hidden server state, no saved history, no analytics, no marketing
  interruption.
- Trust comes from deterministic feedback, explicit invalid states, and copy that
  avoids evasion language.

## Design System Alignment

Use the design system in `docs/web/design-system.md` as the source of truth for
fonts, colors, spacing, radius, component behavior, and motion. The web app
should start from the shadcn token structure already generated in
`web/src/styles/global.css`, then tune those tokens to match
`docs/web/design-system.md`.

The chosen direction is Hugging Face-inspired open research playground: friendly,
community-native, demo-first, and easy to try, while still precise enough for a
deterministic eval tool. It should not feel like an enterprise dashboard or a
SaaS landing page.

Brand mark:

- Include the product logo near the localized wordmark: `noisemake` in English, `造声` in Chinese.
- Shape: small rounded square, two offset dot eyes, slightly jagged mouth.
- Do not use emoji as decoration.
- Do not add a large mascot, illustration, or hero character.
- The mark supports the community playground feel; the CLI hero and playground
  remain the visual anchors.

## Visual Direction

Classifier: hybrid, with a CLI-led hero and a primary app playground.

AI slop hard rules:

- Do not use a generic feature grid.
- Do not use a tall centered hero.
- Do not use purple, violet, indigo, or blue-to-purple gradients.
- Do not use decorative blobs, floating circles, wavy dividers, or icon circles.
- Do not wrap input, controls, and output in decorative cards.
- Do not rely on shadows for hierarchy.
- Do not use "Get started", "Unlock", "All-in-one", or other generic SaaS copy.

Visual anchor:

- The hero CLI usage panel is the first visual anchor.
- The playground is the second visual anchor and must appear directly below the
  hero.
- Input and output panes carry the playground's weight.
- The control rail is narrower and denser than the text panes, but should still
  feel approachable and demo-like.
- Changed output spans should be the most distinctive visual treatment inside
  the playground, using the warm highlight tokens from
  `docs/web/design-system.md`.

Surface and hierarchy:

- Use one full-width workbench surface with panel dividers.
- Use borders, spacing, type scale, and alignment for hierarchy.
- Shadows should be subtle and functional, not the primary way panels separate.
- Cards are allowed only when the card itself is an interaction. This page's main
  workbench should not be a card grid.

Motion:

- Use exactly three purposeful motions:
  1. Changed output spans briefly highlight after Run.
  2. Copy output shows a short toast.
  3. Invalid submit focuses the first invalid field and uses a brief error state.
- Do not use ambient looping animation, carousels, parallax, animated blobs, or
  decorative entrance choreography.

## Responsive and Accessibility

Viewport behavior:

| Viewport | Layout |
|----------|--------|
| Desktop, 1024px and up | Two-column hero with CLI panel, then three-column playground: input, narrower controls, output. The playground label or top edge should remain visible in the first viewport. |
| Tablet, 768px to 1023px | Hero stacks copy above CLI if needed, then two-row playground: input and output side by side when space allows, controls as a full-width row or compact rail. |
| Mobile, below 768px | Single column: header controls, hero copy, CLI usage, input, controls, Run, output. Output must appear immediately after Run. |

Mobile rules:

- Keep the header compact: product name, language switch, and theme switch.
- Keep the hero concise enough that CLI usage and the first playground controls
  are reachable without a long scroll.
- Keep CLI code readable at 320px width.
- Keep example buttons near the input textarea.
- Keep `frequency`, `seed`, and Run in the same visual group.
- Do not hide output behind a tab, drawer, accordion, or scroll trap.
- Use at least 44px touch targets for buttons, checkbox chips, language switch,
  and theme switch.

Keyboard and screen reader rules:

- The page must have one `main` landmark.
- Input, controls, output, language switch, and theme switch must have visible
  labels.
- Run should be reachable after input and controls in tab order.
- Validation errors must be announced and tied to the relevant field or group.
- When Run succeeds, do not steal focus from the user's current control unless
  the user triggered Run from the keyboard and the result region needs an
  announcement.
- The output region should expose a polite status update after Run completes.
- Changed spans must not rely on color alone; combine warm highlight with a
  subtle underline, left marker, or border treatment.
- Dark mode must meet contrast requirements for text, controls, focus rings,
  changed spans, and error messages.

## Copy Direction

English hero and social positioning:

- Hero headline: "Make text less polished"
- Hero proof line: "Inject small mistakes so text feels more hand-written"
- Open Graph title: "noisemake - Make text less polished"

Chinese hero and social positioning:

- Chinese product name: "造声".
- Hero headline: "让文本别那么工整"
- Hero proof line: "给文本注入一些小错误，让它更像手工写出来的"
- Open Graph title: "造声 - 让文本别那么工整"

Avoid copy that sounds like detector evasion. The product can say it makes text
less mechanically polished, but the main framing should stay research/eval/tooling.

## Design Review Questions

Ask the design reviewer to focus on:

1. Does the page immediately communicate that this is a deterministic research/tooling
   primitive, not an AI-humanizer gimmick?
2. Does the larger hero earn its space by teaching CLI usage instead of adding
   marketing decoration?
3. Does the playground layout work on desktop and mobile without feeling like an
   embedded preview?
4. Are the controls understandable for non-expert users while still preserving the
   exact CLI concepts: `frequency`, `seed`, `types`, `languages`?
5. Does the `/zh` copy feel natural, not translated-by-machine?
6. Does dark mode preserve enough contrast and not turn into a generic purple/dark
   dashboard?
7. Are shadcn components used in a way that feels like a focused tool, not a component
   gallery?
8. What should be removed, not added?

## Not In Scope

- Auth.
- Saved history.
- File upload.
- Batch processing.
- Expanding `/v1/transform` beyond a thin package wrapper.
- Database or KV storage.
- Analytics.
- Changes to the CLI.
- Changes to the core `noisemake()` algorithm.
