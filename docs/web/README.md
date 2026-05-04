# Web Docs

The web playground is a separate app boundary under [`web/`](../../web), but it
uses the root `noisemake` package through `workspace:*`.

The live site is [`https://noisemake.xyz`](https://noisemake.xyz). Production
verification may inspect it read-only.

Read these in order:

1. [plan.md](plan.md) for web-package scope and boundaries
2. [design-system.md](design-system.md) for visual language and UI rules
3. [design-brief.md](design-brief.md) for product intent and interaction behavior
4. [implementation-spec.md](implementation-spec.md) for current routes, metadata,
   API, and verification details
5. [../../web/README.md](../../web/README.md) for package-local commands and file layout

Use this set only for web work. Core package work should start from
[docs/core/plan.md](../core/plan.md) instead.
