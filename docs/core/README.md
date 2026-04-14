# Core Docs

This section is the source of truth for package-level intent and structural
decisions.

Read this when your task touches the core engine, CLI behavior, package exports,
tests, or data boundaries.

## Read Order

1. [README.md](../../README.md) for the public surface
2. [repo-map.md](repo-map.md) for the short code-layout overview
3. [plan.md](plan.md) for package shape, invariants, and product decisions
4. [history.md](history.md) for superseded assumptions and rollout context
5. [AGENTS.md](../../AGENTS.md) for repo operating rules while editing

## What Belongs Here

- Core package scope and non-goals
- Repo structure and ownership boundaries
- Public API and CLI behavior
- Runtime boundaries between core code and app code
- Determinism promises and package-level constraints

Web-specific design and UI decisions do not belong here. Those live under
[docs/web](../web).
