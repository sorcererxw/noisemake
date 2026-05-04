# Design System - noisemake

## Product Context

- **What this is:** A deterministic text-noise playground for the `noisemake` npm package and CLI.
- **Who it is for:** Researchers, eval builders, and agent workflows that need reproducible noisy text fixtures.
- **Project type:** Open research playground, not a marketing site and not an enterprise dashboard.
- **Core promise:** Same input, same seed, same output.

## Aesthetic Direction

- **Direction:** Hugging Face-inspired open research playground.
- **Mood:** Friendly, experimental, community-native, and easy to try. It should feel like a useful Space someone can run immediately, not a polished SaaS funnel.
- **Decoration level:** Light and functional. Warm badges, active chips, example buttons, a tiny friendly mark, and changed-text highlights are welcome. Decorative blobs, feature grids, and hero art are not.
- **Reference points:** [Hugging Face Spaces](https://huggingface.co/spaces), [Gradio demos on Hugging Face](https://www.gradio.app/4.44.1/guides/Gradio-and-ONNX-on-Hugging-Face).

The target is "open playground with taste," not a Hugging Face clone. Keep the friendliness, demo-first layout, and community feel. Add tighter typography, clearer states, and stronger reproducibility cues than a quick demo usually has.

## Brand Mark

- Use a tiny friendly `noise face` near the localized wordmark: `noisemake` in English, `造声` in Chinese.
- The mark should be simple enough to work at 16-24px.
- It may suggest perturbation, fuzz, or a slightly imperfect text signal.
- Do not use emoji as the mark.
- Do not add a large mascot, illustration, or hero character.
- The mark is an accent, not the visual anchor. The workbench remains the anchor.

Chosen direction:

- **Noise face:** a tiny rounded square with two offset dot eyes and a slightly jagged mouth. This was chosen over the glitch glyph and seed badge because it best carries the Hugging Face-inspired open playground feel.

## Typography

- **Display:** Space Grotesk, for the product name and CLI-led hero headline.
- **Body:** IBM Plex Sans, with Noto Sans SC fallback for Chinese UI and content.
- **UI labels:** IBM Plex Sans Medium, concise and readable.
- **Data / seed / frequency / code-like values:** JetBrains Mono Variable, already installed in `web/src/styles/global.css`.
- **Output text:** Use the body stack by default so mixed Chinese and English samples read naturally. Use mono only for seed, CLI snippets, and compact metadata.
- **Loading strategy:** Prefer `@fontsource-variable` packages or a self-hosted font pipeline. Do not use default stacks as the final design.

Suggested stack:

```css
--font-display: "Space Grotesk", "Noto Sans SC", sans-serif;
--font-body: "IBM Plex Sans", "Noto Sans SC", sans-serif;
--font-mono: "JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace;
```

## Color

- **Approach:** Warm open-source playground. Light mode first, dark mode supported but not dominant.
- **Primary accent:** `#f9c74f`, warm yellow. Use for Run, active chips, focus details, and changed text highlights.
- **Accent foreground:** `#2b2111`, dark warm brown-black only for text placed directly on yellow.
- **Secondary accent:** `#4f7cff`, restrained blue for links and CLI/package parity, not for page backgrounds.
- **Success:** `#2f9e44`.
- **Warning:** `#f08c00`.
- **Error:** `#d9480f`.
- **Changed text background:** light `#fff3bf`, dark `#5c4614`.
- **Changed text border:** light `#ffd43b`, dark `#d6a319`.

Keep the existing shadcn OKLCH token structure in `web/src/styles/global.css`, but tune it toward this palette. The current zinc base is acceptable. The current dark `--sidebar-primary` blue-purple should not become a main page accent.

Light mode target:

```css
--background: oklch(0.985 0.012 95);
--foreground: oklch(0.18 0.015 80);
--card: oklch(1 0 0);
--muted: oklch(0.955 0.018 95);
--muted-foreground: oklch(0.46 0.02 80);
--border: oklch(0.88 0.025 90);
--primary: oklch(0.84 0.15 82);
--primary-foreground: oklch(0.18 0.04 70);
--accent: oklch(0.94 0.08 86);
--accent-foreground: oklch(0.22 0.035 70);
--destructive: oklch(0.58 0.2 35);
--changed-bg: oklch(0.94 0.11 88);
--changed-border: oklch(0.82 0.16 84);
```

Dark mode target:

```css
--background: oklch(0.17 0.018 80);
--foreground: oklch(0.94 0.012 95);
--card: oklch(0.22 0.018 80);
--muted: oklch(0.27 0.018 80);
--muted-foreground: oklch(0.72 0.018 92);
--border: oklch(0.36 0.018 82);
--primary: oklch(0.78 0.14 82);
--primary-foreground: oklch(0.16 0.025 70);
--accent: oklch(0.31 0.06 82);
--accent-foreground: oklch(0.94 0.012 95);
--destructive: oklch(0.66 0.18 35);
--changed-bg: oklch(0.36 0.07 82);
--changed-border: oklch(0.68 0.13 82);
```

## Spacing

- **Base unit:** 4px.
- **Density:** Comfortable demo density. Friendlier than an instrument panel, tighter than a marketing page.
- **Scale:** 2xs 2px, xs 4px, sm 8px, md 12px, lg 16px, xl 24px, 2xl 32px, 3xl 48px, 4xl 64px.
- **Workbench gap:** 16px desktop, 12px mobile.
- **Panel padding:** 16px desktop, 12px mobile.
- **Top band padding:** 24px desktop, 16px mobile.

## Layout

- **Approach:** Tool-first page with a larger CLI-led hero and the playground directly below it.
- **First viewport:** Product identity, deterministic proof, CLI usage, and the top edge of the playground. The page may ask for a short scroll before the full playground, but it must not feel like the playground is buried under marketing.
- **Hero structure:** Brand and page controls in a compact nav row, then a generous hero band with the headline/proof on one side and a real CLI usage panel on the other. The CLI panel is the hero's visual anchor; do not replace it with decorative art.
- **Playground position:** The workbench lives in a section named `Playground` below the hero. It stays a real usable tool, not an embedded preview.
- **Desktop playground grid:** Input pane, compact controls, output pane. Text panes dominate; control rail is narrower.
- **Mobile order:** Header controls, hero copy, CLI usage, input, controls, Run, output.
- **Max width:** 1180px for the workbench, centered with 24px page padding.
- **Main surface:** One friendly playground surface with internal separation. Do not turn input, controls, and output into three unrelated decorative cards.
- **Border radius:** Default 8px, small 6px, large 10px only for the outer workbench. No pill-shaped everything.

## Components

- **Hero CLI panel:** Use a compact terminal-like code surface that shows actual commands, such as `npx noisemake "..." --seed 42 --frequency 200`, and a short reproducibility note. This surface earns its frame because it teaches usage.
- **Buttons:** Run is the primary warm-yellow action. Copy is secondary.
- **Checkboxes:** Prefer shadcn checkbox or toggle-like chips for `typo`, `repeat`, `spacing`, `punct`, `swap`, `zh`, and `en`. Active state uses the yellow accent, not blue or purple.
- **Textareas:** Large, calm, and resizable only if it does not break the workbench. Use clear labels above each pane.
- **Output highlights:** Changed spans should use `--changed-bg` and `--changed-border`. This is the page's main visual event.
- **Toasts:** Use for copy success/failure only. Do not use toasts for validation that should live next to the field.
- **Cards:** Only use cards for repeated items or dialogs. The workbench itself may have a single surface, but the page must not become a grid of cards.

## Motion

- **Approach:** Friendly functional motion.
- **Durations:** 120ms for micro state changes, 180ms for highlight entry, 250ms for toast entry.
- **Easing:** `cubic-bezier(0.2, 0, 0, 1)` for state entry; standard ease-out for exit.
- **Allowed motions:** Hero CLI copy hover/focus state, changed span highlight after Run, Copy toast, invalid field focus/error pulse.
- **Not allowed:** Ambient animation, parallax, animated blobs, carousels, decorative hero motion.

## Copy

- Keep the research/eval framing.
- English hero headline: "Make text less polished".
- English hero proof line: "Inject small mistakes so text feels more hand-written".
- Chinese hero headline: "让文本别那么工整".
- Chinese hero proof line: "给文本注入一些小错误，让它更像手工写出来的".
- Chinese product name: "造声".
- Use "playground", "seed", "frequency", and "same engine as the CLI/package" language.
- Avoid detector-evasion wording. "Less mechanically polished" is acceptable only when the surrounding copy makes the research/eval use case clear.

## Accessibility

- Minimum touch target: 44px for interactive controls on mobile.
- Focus rings must be visible in light and dark mode.
- Validation errors must be tied to fields with accessible descriptions.
- Changed spans must not rely on color alone; use subtle underline, border, or marker styling.
- Language switch and theme switch must be keyboard reachable.

## Implementation Notes

- Read this file before visual implementation.
- Start from the shadcn token structure already generated in `web/src/styles/global.css`.
- Replace the current all-mono global default with the body stack. Keep JetBrains Mono for values and code-like UI.
- Add `--changed-bg` and `--changed-border` tokens to `:root` and `.dark`.
- Keep radius at or below 10px for normal UI.
- Do not use purple/indigo gradients or dark-blue dashboard surfaces.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-13 | Use Hugging Face-inspired open research playground direction | User prefers the friendly community demo feel over a colder instrument panel. |
| 2026-04-13 | Keep workbench-first layout (superseded) | Original direction was to make the product usable immediately; the current direction keeps that intent by placing the playground directly below the larger CLI hero. |
| 2026-04-13 | Shift to a larger CLI-led hero with the playground below | User wants the hero to carry more structure, teach CLI usage, and demote the then-current editor into a `Playground` section without becoming a generic landing page. |
| 2026-04-13 | Use warm yellow as the primary accent | Matches the open playground direction while avoiding purple SaaS defaults. |
| 2026-04-13 | Keep JetBrains Mono for deterministic values only | The existing shadcn setup already imports it, but all-mono hurts mixed Chinese/English reading. |
| 2026-04-13 | Allow one tiny friendly mark near the wordmark | Captures Hugging Face-style warmth without turning the page into a toy. |
| 2026-04-13 | Use "给评测用的可复现文本噪声。" as the Chinese anchor | User accepted the more natural Chinese phrasing over the stiffer draft. |
| 2026-04-13 | Choose the noise face mark | User preferred it over the glitch glyph and seed badge variants after previewing all three. |
| 2026-04-13 | Remove Mixed/Chinese/English playground presets | The input now defaults to a language-matched sample from the current UI locale instead of offering preset example chips. |
| 2026-05-04 | Align social cards with current hero copy and use PNG images | X does not render SVG `twitter:image`; Open Graph titles now keep the brand plus hero headline. |
