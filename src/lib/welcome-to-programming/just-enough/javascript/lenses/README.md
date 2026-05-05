# lenses

Lens-module implementations for the `<StudyLenses>` orchestrator.
Each subdirectory is one lens — a stateful "mini web app" plugin that
takes a frozen [`embodiment`](../embody/types.ts) (`Snippet`) plus an
optional [`LensConfig`](./types.ts) and renders a learning exercise.

> **🚧 MIGRATION IN PROGRESS** — this directory holds the target
> contract docs (this README, `DOCS.md`, `types.ts`) plus the
> first migrated lens [`./highlight/`](./highlight/) (commit
> `5d6fc54`, banner-flagged STALE pending React-component-shape
> rewrite). The remaining per-lens implementations migrate in via
> WS4 (REFACTOR-HANDOFF.md Step 11). The pre-refactor
> `study-lenses/` source tree was deleted in commit `5d6fc54`;
> the editor was promoted to [`../orchestrate/editor/`](../orchestrate/editor/)
> as the orchestrator home base, and the remaining lenses sit
> outside this repo until WS4 brings them in. This banner is
> removed once WS4 lands.

## What lives here

```text
lenses/
  README.md              (this — orientation + navigation)
  DOCS.md                architectural sketch + Mermaid data flow
  types.ts               LensModule contract + LensProps + LensConfig
  parsons/               drag-and-drop ordering exercise
  blanks/                fill-in-the-blank exercise
  trace-table/           predict-then-compare execution trace
  highlight/             read-only annotated code view
  …
```

The editor is **not a lens** — it lives at
[`../orchestrate/editor/`](../orchestrate/editor/) as the
orchestrator's home base, the only writer of snippet state.

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
   validation, scoring. Imports from `orchestrate/lib/*` (analysis
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
  recommend: (embodiment: Snippet) => ReadonlyArray<Recommendation>;
}>;

type LensProps = Readonly<{
  embodiment: Snippet;
  config?: LensConfig;
}>;
```

`applicableTo` is the cheap O(1) gate; `recommend` is the richer
relevance computation that runs only on already-applicable lenses.
Both take the frozen `Snippet` directly — analysis is internal to
`orchestrate/lib/recommender/`, not a separate hand-off type.

See [`./types.ts`](./types.ts) for the full doc-comments and
adaptation notes (this contract reshapes the pre-refactor
`study-lenses/types.ts:99-120` LensModule).

## Three-tier classification

Each lens belongs to one of three tiers based on what it needs from
the embodiment. The tier determines what `applicableTo` returns.

| Tier | What it needs                          | `applicableTo` returns                |
| ---- | -------------------------------------- | ------------------------------------- |
| 1    | Text only — no parse needed            | always `true`                         |
| 2    | Valid AST (no execution)               | `embodiment.status.parsed`            |
| 3    | Valid parse AND evaluable script-scope | `embodiment.status.created`           |

Tier 1 lenses (parsons line-shuffling, copy-type, highlight) work
even on syntactically-broken snippets. Tier 2 lenses (blanks,
variables/scope, ask) need a valid AST. Tier 3 lenses (trace-table,
run) need the snippet to be evaluable — i.e. the script-scope
creation phase passed (per
[`../embody/types.ts`](../embody/types.ts) §Status booleans).

The `status` chain is monotonic by construction: `created` implies
`parsed` implies `tokenized`. Lens-author logic only checks the
field it cares about; the chain handles itself.

See
[`../.planning-handoffs/04-lens-migration.md`](../.planning-handoffs/04-lens-migration.md)
for per-lens tier assignments and the full migration roadmap.

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the
top-level `AGENTS.md`. Subdirectory-specific rules:

- **Lens purity**. Lens modules MUST NOT import **runtime values**
  from `embody/` (top) or `orchestrate/` (top). Receive `embodiment`
  via props. **Type-only imports** from `embody/types.ts` (e.g.
  `import type { Snippet } from '../../embody/types.js'`) are OK
  per the REFACTOR-HANDOFF.md § Quick reference final-import-paths
  table. May also import (runtime + type) from `orchestrate/lib/*`
  and `@-utils`. (Per [`../DOCS.md` § Dependency rules](../DOCS.md).)
- **Disposable practice**. Lens-internal UI state (parsons shuffle,
  blanks fills) is per-mount only. When the snippet changes, React
  unmounts the lens; in-progress UI state is gone. Never reach for
  `localStorage`, refs across mounts, or other persistence
  mechanisms. The LMS owns cross-edit state — this is per
  [`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)
  implication 5.
- **Single-writer state**. Lenses are read-only views; they CANNOT
  mutate the snippet. Editing happens only in [`orchestrate/editor/`](../orchestrate/editor/).
- **No consumer-side sentinel branching on `embody` mock outputs.**
  During Phase A, `embody(code)` is a mock dispatched by sentinel
  comments (e.g. `/* MOCK_OK */`, `/* MOCK_PARSE_FAIL */` — see
  [`../embody/index.ts`](../embody/index.ts) JSDoc and
  [`../embody/README.md` § Phase A — mock embody](../embody/README.md)).
  Lens code must never inspect the input string for sentinels;
  branch only on the **shape** of the returned `Snippet` (e.g.
  `embodiment.parsed === false`, `embodiment.validation.isJeJ`).
  Sentinels are an internal mock dispatch mechanism and disappear
  in Phase B.
- **Transforms are a lens-internal concern, not a peer concept.**
  Round-2 deleted the pre-refactor `transforms/` peer module. There
  is no shared "transform pipeline" between lenses + the
  orchestrator; each lens decides what visual / pre-eval
  transformations to apply to the snippet it received (formatting
  toolbar buttons, the `loopGuard` rewrite a tracing lens applies
  before evaluation, the `parsons` lens's line shuffler — all live
  inside the lens that uses them). The `<StudyLenses>` plugin must
  NOT emit a `transforms` attribute (see
  [`../../../../plugins/study-lenses/README.md` § Plugin alignment](../../../../plugins/study-lenses/README.md)).
- **`Validation` derivation rules.** The `validation` fields
  `isDeterministic` and `doesPause` are **derived** from the raw
  analyses, not raw fields a lens can override:
  `isDeterministic = !any(nonDeterminism)` and
  `doesPause = hasIo.user.total > 0`. Pinned in
  [`../embody/types.ts`](../embody/types.ts) JSDoc; lens authors
  reading these fields treat them as read-only summaries.
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
  [`../orchestrate/README.md`](../orchestrate/README.md).
- **Recommender that ranks these lenses**:
  [`../orchestrate/lib/README.md`](../orchestrate/lib/README.md) →
  [`02-analysis-and-recommender.md`](../.planning-handoffs/02-analysis-and-recommender.md).
- **Migration plan**:
  [`../REFACTOR-HANDOFF.md`](../REFACTOR-HANDOFF.md) Steps 8 + 11
  + 14.
- **Per-lens migration sessions**:
  [`04-lens-migration.md`](../.planning-handoffs/04-lens-migration.md).
