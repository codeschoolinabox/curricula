# lenses/highlight

The `highlight` lens — a read-only syntax-view of the snippet,
rendered as colorized `<pre><code>` over the frozen
[`embodiment`](../../embody/types.ts). One of the lens-module
implementations the orchestrator's picker enumerates and the
recommender ranks.

## Public API

The module's default export is a frozen `LensModule` per
[`../types.ts`](../types.ts) § LensModule:

```ts
import highlight from './index.js';

// orchestrator side (illustrative — registry shape is open-spec; see
// `../../orchestrate/DOCS.md` § Module ownership for the lock):
const roster = [highlight, /* parsons, blanks, … */];

// orchestrator mounts in lens mode:
<highlight.Component embodiment={frozenSnippet} config={resolved} />;
```

Fields:

- `name: 'highlight'` — registry identity.
- `Component: ComponentType<LensProps>` — React wrapper around the
  lens's pure-TS core. Renders read-only colorized
  `<pre data-lens="highlight"><code>…</code></pre>` from
  `embodiment.source.code`.
- `config(overrides?): LensConfig` — resolves the per-lens config
  (eventually: theme, language). Empty `{}` when no overrides are
  supplied; deep-frozen.
- `applicableTo(embodiment): boolean` — returns `true` for any
  snippet (highlight is a Tier 1 text-only lens per
  [`../README.md`](../README.md) § Three-tier classification).
- `recommend(embodiment): ReadonlyArray<Recommendation>` —
  Block-Model placement contributions; populated by the WS2
  analysis pipeline per
  [`../../.planning-handoffs/02-analysis-and-recommender.md`](../../.planning-handoffs/02-analysis-and-recommender.md).

## Why a separate lens (vs. living inside the editor)

The editor at [`../../orchestrate/editor/`](../../orchestrate/editor/)
is the orchestrator's home base — the **single writer** of snippet
state and the always-mounted React surface in editor mode. Highlight
is read-only, lens-mode-only, and has no mutation surface. Keeping
them as distinct modules keeps the single-writer invariant
structural: lenses receive `embodiment` via props and never reach
back into the snippet.

## Two-layer module

Per [`../README.md`](../README.md) § How to add a lens, the lens
lives across two files:

- **`core.ts`** — pure TypeScript. Tokenization / theme resolution
  / span-tree construction. Testable in vitest without `jsdom`.
- **`index.tsx`** — React wrapper. The `LensModule.Component`
  consumes `LensProps`, calls into the core, renders the
  colorized DOM.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md`.
Module-specific rules:

- **Read-only.** The `Component` never mutates `embodiment` or
  `config` (both are deep-frozen). It does not dispatch snippet
  edits — only the editor home base does.
- **Per-mount UI state.** Any lens-internal state (scroll
  position, hover highlight) lives in `useState` /
  `useReducer` inside the Component and is per-mount only.
  When the snippet changes the orchestrator unmounts the lens
  via React reconciliation; nothing carries across.
- **Default export is a frozen `LensModule` record**
  (`freezeInPlace` on the literal).

## Navigation

- **Parent:** [`../README.md`](../README.md) — lenses index +
  contract.
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
- **Lens contract:** [`../types.ts`](../types.ts).
- **Embodiment contract:** [`../../embody/types.ts`](../../embody/types.ts).
- **Lens-migration plan:**
  [`../../.planning-handoffs/04-lens-migration.md`](../../.planning-handoffs/04-lens-migration.md).
