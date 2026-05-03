# orchestrate

The package's React-aware peer. Wires [`embody/`](../embody/) (the
operational NM data layer), [`lenses/`](../lenses/) (the read-only
views), and the home-base [`editor/`](./editor/) into one
consumer-mountable surface, and ships the package's public API:
`<StudyLenses>`.

> **🚧 PRE-REFACTOR SENTINEL** — this directory holds target docs
> only. Source code arrives during REFACTOR-HANDOFF Step 8 (editor
> extraction), Step 9 (analysis-libs move), and Step 10 (the
> `<StudyLenses>` component itself). After source lands, this
> banner is removed.
>
> **Prior art**: [`../study-lenses--reference-to-migrate/orchestrator/README.md`](../study-lenses--reference-to-migrate/orchestrator/README.md)
> documents the pre-refactor `<StudyLenses>` component. The
> structural patterns there (lifecycle phases, effect topology,
> Switch flow Mermaid, async caveat, `vi.hoisted` test pattern)
> carry forward here. The contract details (LensModule shape,
> `(name, configHash)` cache, framework-agnostic `LensMount`)
> reshape per the locked decisions in
> [`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles).
> Data-attribute names also update — see § Data attributes below
> for the new selector set; the pre-refactor
> `data-orchestrator="study-lenses"` is replaced by
> `data-orchestrator-host`.

## What lives here

```text
orchestrate/
  README.md                  (this — orientation + navigation)
  DOCS.md                    architectural sketch + Mermaid (peer + StudyLenses)
  types.ts                   <StudyLenses> prop contract + state shape + INTERNAL EventBus events

  index.tsx                  the <StudyLenses> component (planned, F1)
  toolbar.tsx                lens-picker dropdown (planned, L1)
  recommendations-panel.tsx  recommendations panel UI (planned, L5)
  tests/                     vitest jsdom tests (planned, per-increment)

  editor/                    default home base — only writer of snippet state
    README.md, DOCS.md       (planned: index.tsx, tests/)

  lib/                       analysis helpers — all (embodiment) → result
    README.md                (index — links to per-lib READMEs/DOCS)
    recommender/             WS2 (02-analysis-and-recommender.md) owns
    socratizing/             Socratic micro-decision analysis
    completing/              autocomplete (editor concern)
    editing/                 editor integration helpers (CodeMirror wrapper)
    error-interpreting/      learner-friendly error messages
    jej-documentation/       JEJ docs for editor tooltips
    analysis/                snippet analysis report (WS2)
```

The peer follows a **primary-export-at-top-level** convention:
`<StudyLenses>` and its co-bundled UI files (toolbar, panel) sit
at the peer's top level alongside the subdirs `editor/` and
`lib/`. This mirrors [`../embody/`](../embody/)'s convention —
the peer's primary export sits at the peer's top level
(`embody()` at `embody/index.ts`; `<StudyLenses>` at
`orchestrate/index.tsx`). Subdirs are separable concerns the
peer also owns; the orchestrator's primary export sits above
them at the peer root.

The two subdirs map to separable concerns:

- **`editor/`** — the always-present home base where learners type
  snippets. Per the locked single-writer state model, this is the
  ONLY surface that mutates snippet state.
- **`lib/`** — pure-TS analysis utilities every consumer can call
  with an `embodiment` as input. The recommender lives here (WS2
  owns it); the editor consumes the others (completing, editing,
  error-interpreting, jej-documentation, socratizing).

Everything else (the `<StudyLenses>` component, mode state, lens
dispatch, picker UI, panel UI, internal EventBus) lives at the
peer's top level — these are inseparable from the orchestrator
because they ARE the orchestrator.

## Public API: `<StudyLenses>`

```tsx
<StudyLenses snippet="let x = 5; console.log(x + 1);" />
<StudyLenses snippet={X} lens="trace" />
<StudyLenses snippet={X} lens="parsons" config={{ difficulty: 'easy' }} />
```

Three props (per the locked decision in
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)):

| Prop      | Type                | Required | Purpose                                                                                |
| --------- | ------------------- | -------- | -------------------------------------------------------------------------------------- |
| `snippet` | `string`            | yes      | The code string. The orchestrator builds the embodiment internally — caller does NOT pre-build. |
| `lens`    | `string`            | no       | Default-selected lens name (Q-III seam). Learner can switch via picker.                |
| `config`  | `LensConfig`        | no       | Per-lens config bundle the educator pre-fills, applied to the lens named in `lens`.    |

The `lens` and `config` props flow from per-fence info-string
(`js:trace`) and per-directory `lenses.json` cascade — the Docusaurus
plugin at `src/plugins/study-lenses/` parses both and emits the
resolved values onto the JSX node.

**`config` scope when the learner switches lenses**: `config` applies
only to the lens named in `lens` (the default-selected one). If the
learner picks a different lens via the picker, that lens uses its
own defaults from its `LensModule.config()` factory and any
`lenses.json` cascade entry keyed by its name — NOT the `config` prop
intended for the default lens. (Pinned during F1 Phase 0 if a
multi-lens config-cascade emerges; sketched here.)

The full type declarations live in [`./types.ts`](./types.ts).

## Pyramid placement

`orchestrate/` ships **the orchestrator side of Layers I-III** of
the Explorotron pyramid (per
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)):

| Layer                              | What `orchestrate/` provides                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Layer I (Lenses & defaults)        | Toolbar lens-picker (`toolbar.tsx`) + the `lens` prop seam (Q-I/Q-III bridge)                  |
| Layer II (Path generation)         | Recommendations panel UI (`recommendations-panel.tsx`) consuming `lib/recommender/` rankings   |
| Layer III (Manual recommendations) | `lens` + `config` prop seam pre-filled by per-fence info-string and `lenses.json` cascade      |
| Layer IV (Manual study paths)      | **DEFERRED** at snippet scope (per [`../.planning-handoffs/03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md) § Layer IV) |

The pyramid base (Progress modelling) and top (Monitored learning)
are explicitly NOT owned by `orchestrate/` — those belong to the
embedding LMS per `../DOCS.md` § "What we explicitly do NOT own".

## The two selection surfaces

`<StudyLenses>` exposes two complementary lens-selection surfaces;
both feed the same lens-mount machinery (per
[`../README.md` § Pedagogical first principles](../README.md#pedagogical-first-principles)
implication 1):

1. **Toolbar lens-picker dropdown** (Q-I learner-driven exploration
   + Q-III educator-supplied default). Always visible; learner can
   switch to ANY registered lens at any time. Default-selected
   option comes from the `lens` prop.
2. **Recommendations panel** (Q-II auto-generated paths; Q-III
   educator-curated ranking overrides extend it via WS3 increments
   L7/L8). Opens via toolbar button. Renders the WS2 recommender's
   filtered + ranked grid (3D Block Model). Q-IV (per-snippet manual
   study paths / sequences) is DEFERRED entirely per
   [`../.planning-handoffs/03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md)
   § Layer IV.

The picker is the lifelong-learning autonomy guarantee: it's
NEVER hidden. The recommendations panel is additive — it offers the
guided path; the picker offers the independent escape hatch.

## Editor-vs-lens state machine

Per [F2](../.planning-handoffs/03-orchestrator-and-contracts.md#f2--editor-vs-lens-state-machine):
the UI is in exactly one of two modes at a time.

- **Editor mode** — the home base ([`./editor/`](./editor/)) is
  mounted. Learner types into the snippet. No active lens, no
  embodiment. Picker is visible; selecting a lens exits editor mode.
- **Lens mode** — a lens is active with a frozen embodiment + lens
  config bundle as props. Snippet is read-only; the learner
  cannot type. Switching lenses reuses the current embodiment.
  Switching back to the editor disposes the lens.

Returning editor → lens later builds a NEW embodiment (per the lazy
embodiment principle). Lens-internal UI state never carries across
mode switches — the disposability principle.

## Data attributes the DOM exposes

**Sketched** — F1 Phase 0 locks the final names. The set below
extends the pre-refactor surface from
[`../study-lenses--reference-to-migrate/orchestrator/README.md` § Data attributes](../study-lenses--reference-to-migrate/orchestrator/README.md)
with the recommendations-panel + host-rename additions:

| Attribute                                | Where                                | Used by                                                                            |
| ---------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| `data-orchestrator-root`                 | The wrapper `<div>` (toolbar + lens area) | Tests + sandbox locate the orchestrator instance.                              |
| `data-orchestrator-toolbar`              | The toolbar `<nav>`                  | Tests + sandbox locate the toolbar without depending on tag.                       |
| `data-orchestrator-lens-picker`          | The toolbar `<select>`               | Tests + sandbox locate the dropdown.                                               |
| `data-orchestrator-recommendations-panel` | The recommendations panel container | Tests + sandbox locate the panel.                                                  |
| `data-orchestrator-host`                 | The lens-area `<div>`                | Tests + sandbox locate where the active lens mounts.                               |

**Directory → type/attribute asymmetry.** The directory is named
`orchestrate/` (verb) to mirror `embody/`'s convention of
verb-named peers exporting their primary surface at the peer's
top level. The internal type names (`OrchestratorState`) and DOM
attributes (`data-orchestrator-*`) use the noun form because
that's how prose talks about it ("the orchestrator", "the
orchestrator state"). `embody/` doesn't expose a corresponding
noun-form because its primary surface is itself a verb
(`embody()`); `orchestrate/`'s primary surface is a noun-form
component (`<StudyLenses>`), so the noun form creeps in for
internals. The asymmetry is honest, not a mistake.

**Migration note (Step 10).** The pre-refactor
`data-orchestrator="study-lenses"` attribute is sketched as
DROPPED in favor of `data-orchestrator-host` (the old name
conflated the wrapper and the lens-area concerns). Pre-refactor
tests at `study-lenses--reference-to-migrate/orchestrator/tests/*.test.tsx`
use the old selector and need to migrate to the new attribute set
when REFACTOR-HANDOFF Step 10 lands. F1 Phase 0 may revisit this
drop if the migration cost is judged too high; otherwise the
rename proceeds and tests update at the same commit.

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the
top-level `AGENTS.md`. Peer-specific rules:

- **Single-writer state**. Only [`./editor/`](./editor/) mutates
  snippet source. The orchestrator routes the edit-callback
  through; lenses are read-only views.
- **Internal-only EventBus**. Per
  [`../.planning-handoffs/03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md)
  F5: the orchestrator's bus is for intra-component coordination.
  No outbound `subscribe` prop on `<StudyLenses>` until a concrete
  LMS integration target exists. Internal events (e.g.
  `lens-switched` from picker → orchestrator) are in scope.
- **Lazy embodiment**. Per F3: build embodiment only when needed
  (lens-open, evaluation trigger), never on every keystroke.
- **Disposable practice**. Per F2 + F4: lens-internal state is
  per-mount; snippet change unmounts the active lens; nothing
  carries across the edit.
- **Dependency rules** (per [`../DOCS.md` § Dependency rules](../DOCS.md)):
  - `orchestrate/` may import from `orchestrate/lib/*`, `embody/`,
    `lenses/`, `@-utils`.
  - `orchestrate/lib/*` may import from sibling `orchestrate/lib/*`,
    `embody/`, `@-utils`. Never from `lenses/`.
  - Lenses receive `embodiment` via props from the orchestrator;
    they never import from `orchestrate/` (top) or `embody/` (top).
- **React conventions** (component code):
  - React hooks live inside normal function components. No class
    components, no `this`. Multi-statement `useEffect` callbacks
    use named function expressions (lint pitfall #11 in
    [`../.planning-handoffs/03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md)).
  - React component tests use `.test.tsx` and the `jsdom`
    environment (configured at the file level via
    `@vitest-environment jsdom`).
  - `vi.mock` factories that reference outer-scope variables wrap
    them in `vi.hoisted(() => ({ ... }))` (lint pitfall #12 — see
    the pre-refactor
    [`../study-lenses--reference-to-migrate/orchestrator/tests/study-lenses.async-cancel.test.tsx`](../study-lenses--reference-to-migrate/orchestrator/tests/study-lenses.async-cancel.test.tsx)
    for the canonical pattern).

## Navigation

- **Parent**: [`../README.md`](../README.md) — package overview +
  Pedagogical first principles.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Subdirs**:
  - [`./editor/README.md`](./editor/README.md) — the home base.
  - [`./lib/README.md`](./lib/README.md) — analysis libs index.
- **Embodiment contract**: [`../embody/types.ts`](../embody/types.ts).
- **Lens contract**: [`../lenses/types.ts`](../lenses/types.ts).
- **Increment plan**:
  [`../.planning-handoffs/03-orchestrator-and-contracts.md`](../.planning-handoffs/03-orchestrator-and-contracts.md)
  (kickoff at sibling
  [`-kickoff.md`](../.planning-handoffs/03-orchestrator-and-contracts-kickoff.md)).
- **Migration plan**: [`../REFACTOR-HANDOFF.md`](../REFACTOR-HANDOFF.md).
- **Pre-refactor prior art**:
  [`../study-lenses--reference-to-migrate/orchestrator/README.md`](../study-lenses--reference-to-migrate/orchestrator/README.md)
  + [`../study-lenses--reference-to-migrate/orchestrator/DOCS.md`](../study-lenses--reference-to-migrate/orchestrator/DOCS.md).
