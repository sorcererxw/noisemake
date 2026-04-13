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
- Deterministic output with `seed`.
- Noise density with `frequency`.
- Language filters: `zh`, `en`.
- Noise type filters: `typo`, `repeat`.

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

Use a workbench-first layout. The playground is the page's primary visual anchor,
not a demo embedded under a landing page.

First-screen hierarchy:

1. Product identity and language/theme controls.
2. One-line proof copy that explains deterministic text noise.
3. The live workbench: input, deterministic controls, and output.
4. A short CLI/library parity hint after the workbench.

The hero must be a slim top band, not a tall hero section. It should contain only
a tiny friendly mark, the `noisemake` name, one positioning line, one proof
sentence, and page-level controls such as language and theme. The playground
must be visible immediately on desktop without requiring scroll.

Suggested top-level layout:

```text
+--------------------------------------------------------------+
| noisemake      deterministic text noise for evals   zh/en theme |
| Same input, same seed, same output. Not an LLM rewrite.       |
+--------------------------------------------------------------+
| Paste polished text    | Set deterministic    | Reproducible  |
|                        | noise                | noisy output  |
|                        | - frequency          |               |
|                        | - seed               |               |
|                        | - typo/repeat        |               |
|                        | - zh/en              |               |
|                        | - run/copy           |               |
+--------------------------------------------------------------+
| Short usage hint: CLI/library parity                         |
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
- Parity hint: "Same engine as the CLI and npm package."

Desktop layout:

- Keep input and output as the dominant panes.
- Keep the control rail narrower than the text panes.
- Put `frequency`, `seed`, type filters, language filters, Run, and Copy in the
  control rail.
- Keep the seed and frequency controls close to Run so the reproducibility model
  is visible at the moment of action.

Mobile layout:

- Order the workbench as input, compact controls, Run, output.
- Keep output immediately after Run so users do not hunt for the result.
- Keep the top band to the product name, one positioning line, and compact
  language/theme controls.

## User-Facing Controls

The playground should include:

- Input textarea.
- Output textarea.
- Frequency input.
- Seed input.
- Noise type checkboxes: `typo`, `repeat`.
- Language checkboxes: `zh`, `en`.
- Run button.
- Copy output button.
- Example text buttons for mixed, Chinese, and English input.
- Clear error messages for invalid settings.

Interaction model:

- Output changes only when the user clicks Run.
- Editing input or controls after a run marks the output as stale until Run is
  clicked again.
- Example buttons replace the input text and mark the output as stale; they do
  not auto-run.
- Copy output is disabled until a successful run has produced output.

Default controls:

- `frequency`: numeric input, default `200`, positive integer only.
- `seed`: text input, default `42` so first-time users immediately see
  reproducible behavior.
- Noise types: `typo` and `repeat` both checked by default; at least one must
  remain checked.
- Languages: `zh` and `en` both checked by default; at least one must remain
  checked.

Control helper copy:

- `frequency`: "Higher means less noise. 200 = about 1 change per 200 eligible
  tokens."
- `seed`: "Same input + same seed = same output."
- `typo`: "IME-style Chinese substitutions and keyboard-like English typos."
- `repeat`: "Light word or phrase repetition."
- `zh`: "Apply Chinese strategies."
- `en`: "Apply English strategies."

Interaction states:

| Feature | State | What the user sees |
|---------|-------|--------------------|
| Input | Empty | Placeholder text plus example buttons: mixed, Chinese, English. Run is disabled until input has non-empty text. |
| Input | Edited after run | Output keeps the previous result but shows a small "Settings changed, run again" status. |
| Controls | Invalid frequency | Inline error next to frequency: "Use a positive whole number." Run is disabled and focus moves to the field on submit. |
| Controls | No type selected | Inline error in the type group: "Choose at least one noise type." |
| Controls | No language selected | Inline error in the language group: "Choose at least one language." |
| Run | Ready | Primary button label: "Run noisemake". |
| Run | Running | Button label: "Running...", disabled until the current run finishes. |
| Output | Before first run | Quiet placeholder: "Run noisemake to create a reproducible noisy variant." |
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
| 1 | Lands on `/zh` or `/en` | "I know what this is." | Slim top band says deterministic text noise for evals and rejects LLM rewriting. |
| 2 | Scans the workbench | "I can use this immediately." | Three labels make the flow scannable: paste text, set deterministic noise, get reproducible output. |
| 3 | Clicks an example or pastes text | "This is a real tool, not a mockup." | Input accepts text directly; example buttons use realistic mixed/Chinese/English samples. |
| 4 | Reviews `frequency` and `seed` | "The controls map to reproducibility." | Helper copy explains that higher frequency means less noise and same seed means same output. |
| 5 | Clicks Run | "A deliberate operation happened." | Run shows a short running state; output changes only after Run. |
| 6 | Reads output | "I can inspect what changed." | Changed spans are highlighted inline; no-change cases explain why nothing changed. |
| 7 | Copies output | "This is usable in my workflow." | Copy button confirms success with a short toast. |
| 8 | Tweaks settings | "I know the previous output is stale." | Output remains visible but shows "Settings changed, run again." |

First 5 seconds:

- The page must communicate deterministic research/tooling, not detector evasion.
- The workbench must be visible and usable immediately.
- The first visible CTA should be Run, not "Get started" or "Learn more".

First 5 minutes:

- The user should learn the reproducibility model by using the controls.
- The no-change result must feel expected, not broken.
- The CLI/package parity hint should make the web page feel like the same engine,
  not a separate toy.

Long-term relationship:

- The page should become predictable in the good way: stable controls, repeatable
  output, no hidden server state, no saved history, no analytics, no marketing
  interruption.
- Trust comes from deterministic feedback, explicit invalid states, and copy that
  avoids evasion language.

## Design System Alignment

Use the design system in `DESIGN.md` as the source of truth for fonts, colors,
spacing, radius, component behavior, and motion. The web app should start from
the shadcn token structure already generated in `web/src/styles/global.css`, then
tune those tokens to match `DESIGN.md`.

The chosen direction is Hugging Face-inspired open research playground: friendly,
community-native, demo-first, and easy to try, while still precise enough for a
deterministic eval tool. It should not feel like an enterprise dashboard or a
SaaS landing page.

Brand mark:

- Include one tiny friendly `noise face` near the wordmark.
- Shape: small rounded square, two offset dot eyes, slightly jagged mouth.
- Do not use emoji as decoration.
- Do not add a large mascot, illustration, or hero character.
- The mark supports the community playground feel; the workbench remains the
  visual anchor.

## Visual Direction

Classifier: hybrid, with a compact marketing top band and a primary app UI.

AI slop hard rules:

- Do not use a generic feature grid.
- Do not use a tall centered hero.
- Do not use purple, violet, indigo, or blue-to-purple gradients.
- Do not use decorative blobs, floating circles, wavy dividers, or icon circles.
- Do not wrap input, controls, and output in decorative cards.
- Do not rely on shadows for hierarchy.
- Do not use "Get started", "Unlock", "All-in-one", or other generic SaaS copy.

Visual anchor:

- The workbench is the visual anchor.
- Input and output panes carry the page weight.
- The control rail is narrower and denser than the text panes, but should still
  feel approachable and demo-like.
- Changed output spans should be the most distinctive visual treatment on the
  page, using the warm highlight tokens from `DESIGN.md`.

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
| Desktop, 1024px and up | Three-column workbench: input, narrower controls, output. The workbench should fit in the first viewport when content is moderate. |
| Tablet, 768px to 1023px | Two-row workbench: input and output side by side when space allows, controls as a full-width row between them or as a compact rail. |
| Mobile, below 768px | Single column: top band, examples, input, controls, Run, output, parity hint. Output must appear immediately after Run. |

Mobile rules:

- Keep the top band compact: product name, one-line positioning, language switch,
  and theme switch.
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

English positioning:

- "Deterministic text noise for evals."
- "Same input, same seed, same output."
- "Not an LLM rewrite. Controlled perturbation."

Chinese positioning:

- "给评测用的可复现文本噪声。"
- "同一输入、同一种子、同一输出。"
- "不是 LLM 改写，而是可控扰动。"

Avoid copy that sounds like detector evasion. The product can say it makes text
less mechanically polished, but the main framing should stay research/eval/tooling.

## Design Review Questions

Ask the design reviewer to focus on:

1. Does the page immediately communicate that this is a deterministic research/tooling
   primitive, not an AI-humanizer gimmick?
2. Is the hero small enough that the playground remains the primary experience?
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
- Server-side API for perturbation.
- Database or KV storage.
- Analytics.
- Actual Cloudflare deployment.
- Changes to the CLI.
- Changes to the core `noisemake()` algorithm.
