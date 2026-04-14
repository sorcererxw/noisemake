# noisemake web

This package is the Astro-based playground for `noisemake`.

It is intentionally a separate app boundary under [`/web`](.) while reusing the
root package through `noisemake: "workspace:*"`.

## Read First

Before changing UI or routing behavior, read:

1. [../docs/web/README.md](../docs/web/README.md)
2. [../docs/web/plan.md](../docs/web/plan.md)
3. [../docs/web/design-system.md](../docs/web/design-system.md)
4. [../docs/web/design-brief.md](../docs/web/design-brief.md)
5. [../docs/web/implementation-spec.md](../docs/web/implementation-spec.md)

## Commands

Run these from the repo root:

```bash
pnpm --dir web run dev
pnpm --dir web run build
pnpm --dir web run preview
pnpm --dir web run generate-types
```

## Package Shape

```text
web/
  public/        static assets
  src/pages/     route entrypoints
  src/components UI and workbench pieces
  src/lib/       web-only helpers
  src/styles/    global tokens and styling
```

The canonical live domain is `https://noisemake.xyz`.
