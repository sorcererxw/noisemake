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

Use a small hero section, but do not let it dominate the product.

Suggested top-level layout:

```text
+--------------------------------------------------------------+
| Small hero: what noisemake does, why deterministic matters    |
+--------------------------------------------------------------+
| Input text             | Controls             | Output text   |
|                        | - frequency          |               |
|                        | - seed               |               |
|                        | - typo/repeat        |               |
|                        | - zh/en              |               |
|                        | - run/copy           |               |
+--------------------------------------------------------------+
| Short usage hint: CLI/library parity                         |
+--------------------------------------------------------------+
```

The hero can mention the CLI/library parity, but the page should not become a
generic SaaS landing page.

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

## Copy Direction

English positioning:

- "Deterministic text noise for evals."
- "Same input, same seed, same output."
- "Not an LLM rewrite. Controlled perturbation."

Chinese positioning:

- "用于评测的可复现文本噪声。"
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
