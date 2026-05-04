# Web Implementation Spec

This file describes the current `web/` implementation. It is an operating
reference for future changes, not a pre-implementation checklist.

## Inputs

Read these first for web work:

- `docs/web/plan.md`
- `docs/web/design-system.md`
- `docs/web/design-brief.md`
- `web/README.md`
- `web/src/lib/i18n.ts`
- `web/src/components/PlaygroundApp.tsx`

The `web/` package is a normal pnpm workspace package owned by the root repo.
There is no nested `web/.git` boundary.

## Stack

- Astro with server output.
- Cloudflare Workers adapter.
- React island for the interactive playground.
- Tailwind CSS v4 and shadcn-style UI primitives.
- Root package consumed through `noisemake: "workspace:*"`.

Package-local commands live in `web/package.json`:

```bash
pnpm --dir web run dev
pnpm --dir web run build
pnpm --dir web run preview
pnpm --dir web run deploy
pnpm --dir web run generate-types
```

The canonical production domain is:

```text
https://noisemake.xyz
```

## Routes

- `/` redirects server-side to `/zh` or `/en` from `Accept-Language`.
- `/zh` renders the Chinese playground.
- `/en` renders the English playground.
- `/og/{lang}.svg` returns a dynamic SVG source for the social image design.
- `/og/{lang}.png` is the static PNG social-card image used by Open Graph and X.
- `/v1/transform` exposes a small JSON transform endpoint.

`/v1/transform` is intentionally thin: it validates JSON, calls the root
`noisemake()` package function, and returns the transformed text. It must not
become a separate algorithm implementation.

## Current Copy

Hero copy is defined in `UI_COPY`.

English:

- Brand: `noisemake`
- Headline: `Make text less polished`
- Proof line: `Inject small mistakes so text feels more hand-written`
- CLI command: `npx noisemake "This parser stays stable"`

Chinese:

- Brand: `造声`
- Headline: `让文本别那么工整`
- Proof line: `给文本注入一些小错误，让它更像手工写出来的`
- CLI command: `npx noisemake "这是一段测试文本"`

SEO page titles and descriptions may stay more search-oriented. Open Graph and
Twitter card titles must keep the brand plus the hero headline:

- English: `noisemake - Make text less polished`
- Chinese: `造声 - 让文本别那么工整`

Open Graph and Twitter descriptions should match the hero proof line.

## Social Cards

X does not support SVG for `twitter:image`, so public social meta tags must point
to PNG files:

- `web/public/og/en.png`
- `web/public/og/zh.png`

Both images are `1200x630` and should visually match the current hero headline
and proof line. The SVG source renderer lives in `web/src/lib/og-image.ts` and is
also served by `web/src/pages/og/[lang].svg.ts` for browser/debug use.

When hero or social copy changes, update these together:

- `UI_COPY`
- `SEO_COPY.ogTitle`
- `SEO_COPY.ogDescription`
- `web/public/og/en.png`
- `web/public/og/zh.png`

## Playground Behavior

The interactive app lives in `web/src/components/PlaygroundApp.tsx`.

Current controls:

- input textarea
- output pane with changed-span highlighting
- frequency numeric input, default `5`
- seed text input, default `42`
- random seed toggle
- noise type toggles: `typo`, `repeat`, `spacing`, `punct`, `swap`
- language toggles: `zh`, `en`
- Run button
- Copy output button

State behavior:

- Output changes only after Run.
- Editing input or controls after a successful run marks the output as stale.
- Invalid frequency, empty types, or empty languages disable Run and show inline
  errors.
- No-change output is shown with an explanation, not treated as a failure.
- Copy actions use short toast feedback.

Changed output highlighting is UI-side only. The core package currently returns a
string, so `web/src/lib/diff-output.ts` computes display segments without adding
a report API to the package.

## API Endpoint

`POST /v1/transform`

Request:

```json
{
  "text": "这个 parser 很 stable",
  "frequency": 200,
  "seed": "baseline",
  "types": ["typo", "repeat"],
  "languages": ["zh", "en"]
}
```

Response:

```json
{
  "output": "transformed text",
  "changed": true,
  "seed": "baseline"
}
```

Constraints:

- `Content-Type` must include `application/json`.
- `text` must be a string and is capped at 20,000 characters.
- `frequency`, `seed`, `types`, and `languages` are optional and passed through
  to the root package after shallow validation.
- CORS is open for `POST` and `OPTIONS`.
- Unsupported methods return `405`.

## Boundaries

- Do not reimplement perturbation strategies in `web/`.
- Do not change root package behavior to support UI-only highlighting.
- Do not move web UI code into root `src/`.
- Do not turn the page into a generic SaaS landing page.
- Keep localized routes, theme behavior, language switching, and social metadata
  in sync when changing copy.

## Verification

For most web changes:

```bash
pnpm --dir web run build
```

For routing, metadata, or social-card work, also verify locally with `curl` or a
browser:

```bash
pnpm --dir web run dev
curl -s http://localhost:4321/en | rg 'og:title|twitter:title|og:image|twitter:image'
curl -I http://localhost:4321/og/en.png
```

Use the live site read-only when debugging production behavior:

```text
https://noisemake.xyz
```
