# lenses

Lens-module implementations for the `<StudyLenses>` orchestrator.
Each subdirectory is one lens — a stateful "mini web app" plugin that
takes a frozen [`embodiment`](../embody/types.ts) (`Snippet`) plus an
optional [`LensConfig`](./types.ts) and renders a learning exercise.

> **🚧 PRE-REFACTOR SENTINEL** — this directory pre-exists with target
> docs only. The pre-refactor source for lenses lives at
> [`../study-lenses/lenses/`](../study-lenses/lenses/). REFACTOR-HANDOFF
> Step 11 (rename `study-lenses/` → `lenses/`) MUST merge content INTO
> this directory rather than `mv`-ing the whole tree (target dir
> already exists). After the merge, this banner is removed.

## What lives here

```text
lenses/
  README.md              (this — orientation + navigation)
  DOCS.md                architectural sketch + Mermaid data flow
  types.ts               LensModule contract + LensProps + LensConfig
  parsons/               (planned, post-refactor)
  blanks/
  trace-table/
  highlight/
  …
```

After REFACTOR-HANDOFF Steps 8 + 11 land:

- **Editor moves out**. The pre-refactor editor lens at
  `study-lenses/lenses/editor/` migrates to `compose/editor/` (Step 8)
  — it's the home base, not a lens.
- **Other lenses move in**. The pre-refactor `study-lenses/lenses/`
  subdirs (highlight, plus future parsons/blanks/etc.) merge into
  this directory's subdirs.

## Pyramid placement

`lenses/` ships **Layer I (Lenses & defaults)** of the
Explorotron pyramid (per
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)).
Each lens is a pedagogical intervention — parsons (line ordering),
blanks (fill-in), trace-table (predict-then-compare), etc. — that the
orchestrator's picker (Q-I) and recommendations panel (Q-II/Q-III) can
surface for any embodiment. Lenses themselves are scope-agnostic;
they don't know about quadrants or pedagogical context, just about
turning an embodiment into an exercise.

## How to add a lens

Each lens is a **two-layer module** at `lenses/<name>/`:

1. **Pure-TS core** (e.g. `core.ts`) — display derivation,
   validation, scoring. Imports from `compose/lib/*` (analysis
   utilities), `@-utils` (freeze, etc.), and the lens's own local
   files. Testable in vitest **without** `jsdom`.
2. **Light React wrapper** (e.g. `index.tsx`) — exports the
   `Component` field of the lens's `LensModule`. Takes
   [`LensProps`](./types.ts) (`embodiment` + optional `config`) as
   props, instantiates the core, renders UI. Testable with `jsdom`
   + `@testing-library/react`.

The split keeps the core's tests fast (no DOM stub) and makes the
React boundary explicit.

A lens's directory layout (template):

```text
lenses/<name>/
  README.md                  what this lens is + navigation
  DOCS.md                    why-this-lens + Mermaid + decisions
  index.tsx                  default export — LensModule with React Component
  core.ts                    pure-TS core (display derivation, validation)
  types.ts                   per-lens types (config, internal state)
  tests/
    core.test.ts             vitest, no jsdom
    component.test.tsx       vitest + jsdom + @testing-library/react
```

## LensModule signature

Every lens's default export satisfies the `LensModule` type at
[`./types.ts`](./types.ts):

```ts
type LensModule = Readonly<{
  name: string;                                    // registry identity
  Component: ComponentType<LensProps>;             // React wrapper around the TS core
  config: (overrides?: Partial<LensConfig>) => LensConfig;
  applicableTo: (embodiment: Snippet) => boolean;  // recommender's applicability filter
  recommend: (analysis: AnalysisReport) => ReadonlyArray<Recommendation>;
}>;

type LensProps = Readonly<{
  embodiment: Snippet;
  config?: LensConfig;
}>;
```

See [`./types.ts`](./types.ts) for the full doc-comments and
adaptation notes (this contract reshapes the pre-refactor
`study-lenses/types.ts:99-120` LensModule).

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the
top-level `AGENTS.md`. Subdirectory-specific rules:

- **Lens purity**. Lens modules MUST NOT import **runtime values**
  from `embody/` (top) or `compose/` (top). Receive `embodiment`
  via props. **Type-only imports** from `embody/types.ts` (e.g.
  `import type { Snippet } from '../../embody/types.js'`) are OK
  per the REFACTOR-HANDOFF.md § Quick reference final-import-paths
  table. May also import (runtime + type) from `compose/lib/*`
  and `@-utils`. (Per [`../DOCS.md` § Dependency rules](../DOCS.md).)
- **Disposable practice**. Lens-internal UI state (parsons shuffle,
  blanks fills) is per-mount only. When the snippet changes, React
  unmounts the lens; in-progress UI state is gone. Never reach for
  `localStorage`, refs across mounts, or other persistence
  mechanisms. The LMS owns cross-edit state — this is per
  [`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)
  implication 5.
- **Single-writer state**. Lenses are read-only views; they CANNOT
  mutate the snippet. Editing happens only in [`compose/editor/`](../compose/editor/).
- **`embodiment` parameter name** wherever a function takes a
  Snippet instance.
- One default export per file (named function/const, then
  `export default`). `.js` extensions in imports.
- Tests in `tests/` subdirectory. `.test.ts` for pure-TS core;
  `.test.tsx` for React component tests.

## Navigation

- **Parent**: [`../README.md`](../README.md) — the package overview +
  Pedagogical first principles (quadrant + pyramid frame).
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Embodiment contract**: [`../embody/types.ts`](../embody/types.ts)
  — the `Snippet` type lenses receive via props.
- **Orchestrator that mounts these lenses**:
  [`../compose/orchestrator/README.md`](../compose/orchestrator/README.md).
- **Recommender that ranks these lenses**:
  [`../compose/lib/README.md`](../compose/lib/README.md) →
  [`02-analysis-and-recommender.md`](../.planning-handoffs/02-analysis-and-recommender.md).
- **Migration plan**:
  [`../REFACTOR-HANDOFF.md`](../REFACTOR-HANDOFF.md) Steps 8 + 11
  + 14.
- **Per-lens migration sessions**:
  [`04-lens-migration.md`](../.planning-handoffs/04-lens-migration.md).
