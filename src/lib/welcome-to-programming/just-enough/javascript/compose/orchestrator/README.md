# orchestrator

The `<StudyLenses>` React component. Wires
[`embody/`](../../embody/) (the operational NM data layer),
[`lenses/`](../../lenses/) (the read-only views), and
[`compose/editor/`](../editor/) (the home base) into one consumer-
mountable surface. This is the package's public API.

> **🚧 PRE-REFACTOR SENTINEL** — this directory does not exist on
> disk before REFACTOR-HANDOFF executes. The target docs are
> committed ahead so the refactor agent's Step 14 ("Update peer
> READMEs and DOCS") is a verify-and-merge rather than a write-
> from-scratch. Source code arrives during REFACTOR-HANDOFF Step 10
> (orchestrator extraction from `study-lenses/orchestrator/`). After
> source lands, this banner is removed.
>
> **Prior art**: [`../../study-lenses/orchestrator/README.md`](../../study-lenses/orchestrator/README.md)
> documents the pre-refactor `<StudyLenses>` component. The
> structural patterns there (lifecycle phases, effect topology,
> Switch flow Mermaid, async caveat, vi.hoisted test pattern)
> carry forward here. The contract details (LensModule shape,
> `(name, configHash)` cache, framework-agnostic `LensMount`)
> reshape per the locked decisions in
> [`../../README.md` § Pedagogical first principles](../../README.md#pedagogical-first-principles).
> Data-attribute names also update — see § Data attributes below
> for the new selector set; the pre-refactor `data-orchestrator
> ="study-lenses"` is replaced by `data-orchestrator-host`.

## What lives here

| File                                       | Purpose                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| [`./README.md`](./README.md)               | This file — orientation + navigation.                                                    |
| [`./DOCS.md`](./DOCS.md)                   | Architectural sketch — lifecycle phases, effect topology, Mermaid data flow.             |
| [`./types.ts`](./types.ts)                 | The `<StudyLenses>` prop contract + internal state shape + INTERNAL EventBus event types. |
| `index.tsx`                                | The `<StudyLenses>` component (planned, F1).                                             |
| `toolbar.tsx`                              | Lens-picker dropdown (planned, L1; adapted from `study-lenses/orchestrator/toolbar.tsx`). |
| `recommendations-panel.tsx`                | Recommendations panel UI (planned, L5; consumes WS2 recommender output).                 |
| `tests/`                                   | vitest jsdom tests (planned, per-increment).                                             |

## Public API: `<StudyLenses>`

```tsx
<StudyLenses snippet="let x = 5; console.log(x + 1);" />
<StudyLenses snippet={X} lens="trace" />
<StudyLenses snippet={X} lens="parsons" config={{ difficulty: 'easy' }} />
```

Three props (per the locked decision in
[`../../README.md`](../../README.md#pedagogical-first-principles)):

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

## The two selection surfaces

`<StudyLenses>` exposes two complementary lens-selection surfaces;
both feed the same lens-mount machinery (per
[`../../README.md` § Pedagogical first principles](../../README.md#pedagogical-first-principles)
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
   [`../../.planning-handoffs/03-orchestrator-and-contracts.md`](../../.planning-handoffs/03-orchestrator-and-contracts.md)
   § Layer IV.

The picker is the lifelong-learning autonomy guarantee: it's
NEVER hidden. The recommendations panel is additive — it offers the
guided path; the picker offers the independent escape hatch.

## Editor-vs-lens state machine

Per [F2](../../.planning-handoffs/03-orchestrator-and-contracts.md#f2--editor-vs-lens-state-machine):
the UI is in exactly one of two modes at a time.

- **Editor mode** — the home base ([`compose/editor/`](../editor/))
  is mounted. Learner types into the snippet. No active lens, no
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
[`../../study-lenses/orchestrator/README.md` § Data attributes](../../study-lenses/orchestrator/README.md)
with the recommendations-panel + host-rename additions:

| Attribute                                | Where                                | Used by                                                                            |
| ---------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------- |
| `data-orchestrator-root`                 | The wrapper `<div>` (toolbar + lens area) | Tests + sandbox locate the orchestrator instance.                              |
| `data-orchestrator-toolbar`              | The toolbar `<nav>`                  | Tests + sandbox locate the toolbar without depending on tag.                       |
| `data-orchestrator-lens-picker`          | The toolbar `<select>`               | Tests + sandbox locate the dropdown.                                               |
| `data-orchestrator-recommendations-panel` | The recommendations panel container | Tests + sandbox locate the panel.                                                  |
| `data-orchestrator-host`                 | The lens-area `<div>`                | Tests + sandbox locate where the active lens mounts.                               |

**Migration note (Step 10).** The pre-refactor
`data-orchestrator="study-lenses"` attribute is sketched as
DROPPED in favor of `data-orchestrator-host` (the old name
conflated the wrapper and the lens-area concerns). Pre-refactor
tests at `study-lenses/orchestrator/tests/*.test.tsx` use the old
selector and need to migrate to the new attribute set when
REFACTOR-HANDOFF Step 10 lands. F1 Phase 0 may revisit this drop
if the migration cost is judged too high; otherwise the rename
proceeds and tests update at the same commit.

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the
top-level `AGENTS.md`. Subdirectory-specific rules:

- React hooks live inside normal function components. No class
  components, no `this`. Multi-statement `useEffect` callbacks use
  named function expressions (lint pitfall #11 in
  [`../../.planning-handoffs/03-orchestrator-and-contracts.md`](../../.planning-handoffs/03-orchestrator-and-contracts.md)).
- React component tests use `.test.tsx` and the `jsdom`
  environment (configured at the file level via
  `@vitest-environment jsdom`).
- `vi.mock` factories that reference outer-scope variables wrap
  them in `vi.hoisted(() => ({ ... }))` (lint pitfall #12 — see the
  pre-refactor
  [`../../study-lenses/orchestrator/tests/study-lenses.async-cancel.test.tsx`](../../study-lenses/orchestrator/tests/study-lenses.async-cancel.test.tsx)
  for the canonical pattern).
- INTERNAL-only EventBus. Per F5: no outbound `subscribe` /
  `onEvent` prop on `<StudyLenses>` until a concrete LMS
  integration target exists. Internal events (e.g.
  `lens-switched` from picker → orchestrator) are in scope.

## Navigation

- **Parent**: [`../README.md`](../README.md) — `compose/` peer
  overview.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Type contract**: [`./types.ts`](./types.ts).
- **Editor home base**: [`../editor/README.md`](../editor/README.md).
- **Analysis libs**: [`../lib/README.md`](../lib/README.md).
- **Lens contract**: [`../../lenses/types.ts`](../../lenses/types.ts).
- **Embodiment contract**: [`../../embody/types.ts`](../../embody/types.ts).
- **Increment plan**: [`../../.planning-handoffs/03-orchestrator-and-contracts.md`](../../.planning-handoffs/03-orchestrator-and-contracts.md)
  (kickoff at
  [`-kickoff.md`](../../.planning-handoffs/03-orchestrator-and-contracts-kickoff.md)).
- **Pre-refactor prior art**:
  [`../../study-lenses/orchestrator/README.md`](../../study-lenses/orchestrator/README.md)
  + [`../../study-lenses/orchestrator/DOCS.md`](../../study-lenses/orchestrator/DOCS.md).
