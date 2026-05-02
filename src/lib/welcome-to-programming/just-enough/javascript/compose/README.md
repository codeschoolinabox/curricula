# compose

The orchestrator + default editor + analysis libs that wire
[`embody/`](../embody/) and [`lenses/`](../lenses/) together for the
learner. `compose/` is the only React-aware peer of the three; it
exposes the package's public surface, [`<StudyLenses>`](./orchestrator/README.md),
and owns all state management.

> **🚧 PRE-REFACTOR SENTINEL** — this directory does not exist on
> disk before REFACTOR-HANDOFF executes. The target docs (this
> README, peer DOCS, and per-subdir READMEs/DOCS) are committed
> ahead of the refactor so the refactor agent inherits a complete
> Phase-0 spec at Step 14. Source code arrives during
> REFACTOR-HANDOFF Step 8 (editor extraction), Step 9 (analysis-libs
> move), and Step 10 (orchestrator extraction). After source lands,
> this banner is removed.

## What lives here

```text
compose/
  README.md              (this — orientation + navigation)
  DOCS.md                peer-level architectural sketch + Mermaid

  editor/                default home base (only writer of snippet state)
    README.md, DOCS.md

  orchestrator/          React seam — <StudyLenses> component
    README.md, DOCS.md, types.ts

  lib/                   analysis helpers — all (embodiment) → result
    README.md            (index — links to per-lib READMEs/DOCS)
    recommender/         WS2 (02-analysis-and-recommender.md) owns
    socratizing/         Socratic micro-decision analysis
    completing/          autocomplete (editor concern)
    editing/             editor integration helpers (CodeMirror wrapper)
    error-interpreting/  learner-friendly error messages
    jej-documentation/   JEJ docs for editor tooltips
```

The three subdirs map to the three concerns the orchestrator must
manage:

- **`editor/`** — the always-present home base where learners type
  snippets. Per the locked single-writer state model, this is the
  ONLY surface that mutates snippet state.
- **`orchestrator/`** — the `<StudyLenses>` React component. Wires
  embody, the editor, the picker, the recommendations panel, and the
  active lens together.
- **`lib/`** — pure-TS analysis utilities every consumer can call
  with an `embodiment` as input. The recommender lives here (WS2
  owns it); the editor consumes the others (completing, editing,
  error-interpreting, jej-documentation, socratizing).

## Pyramid placement

`compose/` ships **the orchestrator side of Layers I-III** of the
Explorotron pyramid (per
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)):

| Layer                      | What `compose/` provides                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| Layer I (Lenses & defaults)  | Toolbar lens-picker in `orchestrator/` + the `lens` prop seam (Q-I/Q-III bridge)               |
| Layer II (Path generation) | Recommendations panel UI in `orchestrator/` consuming `lib/recommender/` rankings              |
| Layer III (Manual recommendations) | `recommendedLens`-equivalent default + `lenses.json` cascade plumbing through to `orchestrator/` |
| Layer IV (Manual study paths) | **DEFERRED** at snippet scope (per [`03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md) § Layer IV) |

The pyramid base (Progress modelling) and top (Monitored learning)
are explicitly NOT owned by `compose/` — those belong to the
embedding LMS per `../DOCS.md` § "What we explicitly do NOT own".

## Public API

The package exports `<StudyLenses>` from
[`./orchestrator/`](./orchestrator/README.md). Curriculum authors
mount it via:

```tsx
<StudyLenses snippet="let x = 5; console.log(x + 1);" />
```

Optional educator overrides:

```tsx
<StudyLenses snippet={X} lens="trace" config={{ … }} />
```

Three props total — `snippet` (required string), `lens?` (default
selected lens name; learner can switch via picker), `config?`
(per-lens config bundle). Everything else (`embody`, lens plugins,
analysis libs) is internal implementation. See
[`./orchestrator/README.md`](./orchestrator/README.md) for the prop
contract and the picker / recommender surfaces.

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the
top-level `AGENTS.md`. Peer-specific rules:

- **Single-writer state**. Only [`./editor/`](./editor/) mutates
  snippet source. [`./orchestrator/`](./orchestrator/) routes the
  edit-callback through; lenses are read-only views.
- **Internal-only EventBus**. Per
  [`03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md)
  F5: the orchestrator's bus is for intra-component coordination.
  No outbound `subscribe` prop on `<StudyLenses>` until a concrete
  LMS integration target exists.
- **Lazy embodiment**. Per F3: build embodiment only when needed
  (lens-open, evaluation trigger), never on every keystroke.
- **Disposable practice**. Per F2 + F4: lens-internal state is
  per-mount; snippet change unmounts the active lens; nothing
  carries across the edit.
- **Dependency rules**. Per [`../DOCS.md` § Dependency rules](../DOCS.md):
  - `compose/` may import from `compose/lib/*`, `embody/`, `lenses/`,
    `@-utils`.
  - `compose/lib/*` may import from sibling `compose/lib/*`,
    `embody/`, `@-utils`. Never from `lenses/`.
  - Lenses receive `embodiment` via props from the orchestrator;
    they never import from `compose/` (top) or `embody/` (top).

## Navigation

- **Parent**: [`../README.md`](../README.md) — package overview +
  Pedagogical first principles.
- **Peer architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Subdirs**:
  - [`./orchestrator/README.md`](./orchestrator/README.md) — the
    `<StudyLenses>` component.
  - [`./editor/README.md`](./editor/README.md) — the home base.
  - [`./lib/README.md`](./lib/README.md) — analysis libs index.
- **Increment plan**:
  [`../.planning-handoffs/03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md)
  (kickoff at sibling
  [`-kickoff.md`](../.planning-handoffs/03-orchestrator-and-contracts-kickoff.md)).
- **Embodiment contract**: [`../embody/types.ts`](../embody/types.ts).
- **Lens contract**: [`../lenses/types.ts`](../lenses/types.ts).
- **Migration plan**: [`../REFACTOR-HANDOFF.md`](../REFACTOR-HANDOFF.md).
