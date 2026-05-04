# Web Plan

This file is the current plan for the `web/` package.

It sits above the design system, design brief, and implementation spec. Read it
first when your task touches routes, interaction scope, package boundaries, or
how the playground should relate to the core `noisemake` package.

## Purpose

The `web/` package exists to make `noisemake` explorable in the browser without
changing what the core package is.

It is a deterministic text-noise playground for:

- researchers,
- eval builders,
- agent workflows,
- developers who want to try the engine before using the CLI or npm package.

## Product Promise

The web app must reinforce the same promise as the core package:

```text
same input + same seed + same options = same output
```

The browser UI is a different surface, not a different engine.

## What The Web Package Must Do

- Expose a usable playground, not a marketing-only landing page.
- Let users edit input, set deterministic options, run the transform, and copy
  the output.
- Use the root package through `noisemake: "workspace:*"`.
- Support localized routes at `/zh` and `/en`.
- Support theme switching and manual language switching.
- Make CLI and npm package parity obvious in the UI.
- Serve production metadata and social-card images for `https://noisemake.xyz`.
- Provide a small `/v1/transform` JSON endpoint that delegates to the root
  package.

## What The Web Package Must Not Do

- It must not reimplement the perturbation algorithm.
- It must not let `/v1/transform` become a separate algorithm implementation.
- It must not push UI concerns back into root `src/`.
- It must not turn into a generic SaaS landing page.
- It must not change core package behavior just to make highlighting easier.

## Package Boundary

The repo has two product-facing implementation boundaries:

- `docs/core/*` and root `src/*` for the package and CLI
- `docs/web/*` and `web/*` for the browser app

The web package may depend on the core package. The core package must not depend
on the web package.

## Current Scope

In scope for the web package:

- localized routes
- deterministic control surface
- output diff/highlight behavior on the UI side
- thin JSON transform endpoint
- Open Graph and X-compatible PNG social cards
- design system and interaction polish
- browser-local preferences such as theme and language choice

Out of scope for now:

- browser-side history or saved sessions
- auth, accounts, or cloud state
- analytics-led growth pages
- feature comparison grids or marketing funnels
- core report/span API changes made only for UI convenience

## Reading Order

1. [plan.md](plan.md) for web-package scope and boundaries
2. [design-system.md](design-system.md) for visual language and rules
3. [design-brief.md](design-brief.md) for product and interaction behavior
4. [implementation-spec.md](implementation-spec.md) for engineering handoff
5. [../../web/README.md](../../web/README.md) for package-local commands

## Relationship To Other Docs

- `docs/core/plan.md` is the source of truth for the root package contract.
- `docs/web/plan.md` is the source of truth for the web package contract.
- `design-system.md` defines how the app should look.
- `design-brief.md` defines what experience the app should create.
- `implementation-spec.md` defines how to build it.
