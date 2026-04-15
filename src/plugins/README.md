# `src/plugins/`

This directory hosts site-level build-time plugins for the Docusaurus site. Each
plugin lives in its own subdirectory, treated architecturally as a bounded
package (own `README.md`, `DOCS.md`, tests) even though it is not a physical npm
package.

## Current plugins

- [`study-lenses/`](./study-lenses/README.md) — transforms JS/lang-tagged fenced
  code blocks into `<CodeLens>` React components and auto-embeds sibling `.js`
  exercise files co-located with curriculum `index.md` pages.

## Conventions

Plugins in this directory follow the project-wide conventions documented in
[AGENTS.md](../../AGENTS.md) and [DEV.md](../../DEV.md): Phase 0 (DDD +
architectural sketch) before Phase 1 (TDD), adversarial reviews at each
transition, atomic commits, deep-frozen return values, named function
declarations, `types.ts` per module.

## Links

- Up: [site root README](../../README.md), [AGENTS.md](../../AGENTS.md),
  [DEV.md](../../DEV.md)
- Down: each plugin's own `README.md`
