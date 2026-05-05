# lenses/editor

The `editor` lens module — the default landing lens for `js:editor`
fences and the orchestrator's fallback when an unknown lens name is
requested. The eventual real implementation is the CodeMirror-backed
code editor; today this directory ships a stub that stands in for it.

> **Status — Increment-8 stub.** Renders the snippet inside
> `<pre data-lens="editor-stub">` (read-only, no edit propagation).
> Increment 9 Pre-work C-1 upgrades the stub to a `<textarea>` so the
> learner can visibly type into it (still no `snippet-changed` dispatch
> — that arrives with the real lens). Increment 15+ replaces the stub
> with the CodeMirror-backed lens. The replacement keeps the same file
> path ([`./editor.ts`](./editor.ts)), the same default-export shape
> (`LensModule`), and the same `name: 'editor'` so the orchestrator
> does not need to change.

## Stub today, CodeMirror later

This module is a stub. The replacement contract, the rationale for
shipping a stub during the orchestrator's scaffolding phase, and the
"unknown-name fallback target" role enforced by
[`../../pipeline.ts`](../../pipeline.ts) live in
[`./DOCS.md`](./DOCS.md). The README only restates that callers
**must** keep `editor` registered, because the orchestrator's pipeline
validation rewrites unknown lens names to `'editor'`.

## Files

| File                             | Purpose                                                                  |
| -------------------------------- | ------------------------------------------------------------------------ |
| [`editor.ts`](./editor.ts)       | The `LensModule` default export. ~30 lines.                              |
| `tests/editor.test.ts`           | vitest jsdom unit tests for the stub.                                    |
| [`./DOCS.md`](./DOCS.md)         | Architectural sketch — replacement contract, data flow, why-decisions.   |

## Public API

The module's default export is the frozen `LensModule`. Consumers
(today, only [`../../orchestrator/default-registry.ts`](../../orchestrator/default-registry.ts))
import it directly and pass it to `registry.register(...)`:

```typescript
import editor from './editor.js';
registry.register(editor);
```

`editor.lens(code)` mounts a fresh DOM element per call. The
orchestrator caches the returned `LensMount` keyed by
`(lens-name, config-hash)`, so subsequent same-config switch-back
operations reattach the cached element instead of re-mounting.

`editor.recommend()` returns an empty array in the stub. The real
CodeMirror lens will populate this with Block-Model recommendations
when its Increment 15+ replacement lands and consumes the analysis
report from
[`../../../.planning-handoffs/02-analysis-and-recommender.md`](../../../.planning-handoffs/02-analysis-and-recommender.md).

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md`.
Module-specific rules:

- The default export is a frozen `LensModule` record (`freezeInPlace`
  on the literal). The `LensMount` returned by `lens(code)` is also
  frozen.
- The replacement (Increment 15+) is required to keep the same file
  path, the same default-export shape, and the `name: 'editor'`
  identity so the orchestrator does not need to change.

## Navigation

- **Parent:** [`../README.md`](../README.md) — lenses index
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md)
- **Types:** [`../../types.ts`](../../types.ts) (`LensModule`,
  `LensMount`, `LensConfig`)
- **Orchestrator wiring:** [`../../orchestrator/default-registry.ts`](../../orchestrator/default-registry.ts)
- **Replacement plan:** Increments 15–18 in
  [`../../../.planning-handoffs/04-lens-migration.md`](../../../.planning-handoffs/04-lens-migration.md)
