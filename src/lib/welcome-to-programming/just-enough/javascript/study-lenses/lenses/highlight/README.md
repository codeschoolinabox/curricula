# lenses/highlight

The `highlight` lens module — a read-only syntax-view counterpart to
the editable [`editor`](../editor/) lens. The eventual real
implementation is a Shiki/Prism-driven syntax highlighter; today this
directory ships a stub.

> **Status — Stub.** Renders the snippet inside
> `<pre data-lens="highlight-stub"><code>...</code></pre>` (read-only,
> no syntax highlighting). The real highlighter lands in Increment 15+.
> The stub exists so the orchestrator's lens-picker has a second
> option to switch between (alongside `editor`) and the cache-hit
> reattach contract can be exercised end-to-end.

## Why a stub now

Increment 9 wires the lens-picker dropdown above the orchestrator
host. The dropdown needs ≥ 2 lens options; the cache-hit reattach
sandbox checkpoint needs ≥ 2 lenses to switch between. Without a
second registered lens, the lens-picker would have nothing to switch
to. Adding a real syntax highlighter at the same time as the
lens-picker would overload the increment; the stub is the smallest
substitute that satisfies the contract.

The stub is visually distinct from the editor stub (read-only
`<pre><code>` vs editable `<textarea>`) so a sandbox observer can
tell which lens is currently mounted.

## Replacement contract

The real highlight lens MUST keep:

- Same file path: [`./highlight.ts`](./highlight.ts).
- Same default export: a frozen `LensModule`.
- Same `name` field: `'highlight'`.
- Same backwards-compatible `lens(code, cfg)` signature; may switch
  the return type from `LensMount` to `Promise<LensMount>` (Shiki
  lazily loads themes; Prism is sync).

The orchestrator does not need to change when the swap happens. The
stub-vs-real difference is observable only through the `data-lens`
attribute (today `"highlight-stub"`; the real lens picks its own
value, e.g. `"highlight-shiki"`).

## Files

| File                                     | Purpose                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| [`highlight.ts`](./highlight.ts)         | The `LensModule` default export. ~30 lines.                              |
| `tests/highlight.test.ts`                | vitest jsdom unit tests for the stub.                                    |
| [`./DOCS.md`](./DOCS.md)                 | Architectural sketch — replacement contract, data flow, why-decisions.   |

## Public API

The module's default export is the frozen `LensModule`. Consumers
(today, only [`../../orchestrator/default-registry.ts`](../../orchestrator/default-registry.ts))
import it directly and pass it to `registry.register(...)`:

```typescript
import highlight from './highlight.js';
registry.register(highlight);
```

`highlight.lens(code)` mounts a fresh DOM element per call. The
orchestrator caches the returned `LensMount` keyed by
`(lens-name, config-hash)`, so subsequent same-config switch-back
operations reattach the cached element instead of re-mounting.

`highlight.recommend()` returns an empty array in the stub. The real
highlight lens will populate this once the analysis pipeline lands
per
[`../../../.planning-handoffs/02-analysis-and-recommender.md`](../../../.planning-handoffs/02-analysis-and-recommender.md).

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md`.
Module-specific rules:

- The default export is a frozen `LensModule` record (`freezeInPlace`
  on the literal). The `LensMount` returned by `lens(code)` is also
  frozen.
- The replacement (Increment 15+) is required to keep the same file
  path, the same default-export shape, and the `name: 'highlight'`
  identity so the orchestrator does not need to change.

## Navigation

- **Parent:** [`../README.md`](../README.md) — lenses index
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md)
- **Sibling stub:** [`../editor/`](../editor/) — editable counterpart
- **Types:** [`../../types.ts`](../../types.ts) (`LensModule`,
  `LensMount`, `LensConfig`)
- **Orchestrator wiring:** [`../../orchestrator/default-registry.ts`](../../orchestrator/default-registry.ts)
- **Replacement plan:** Increments 15–18 in
  [`../../../.planning-handoffs/04-lens-migration.md`](../../../.planning-handoffs/04-lens-migration.md)
