# editor

The default home base — the always-present surface the learner edits
their snippet on. The ONLY writer of snippet state in the
`<StudyLenses>` orchestrator. Wraps the existing CodeMirror-backed
editor factory at [`../lib/editing/`](../lib/editing/) (post-refactor;
currently at `../../lib/editing/`) into a React home-base component.

> **🚧 PRE-REFACTOR SENTINEL** — this directory does not exist on
> disk before REFACTOR-HANDOFF executes. The CodeMirror integration
> at [`../../lib/editing/`](../../lib/editing/) is the prior-art
> source; that module moves to `orchestrate/lib/editing/` during
> REFACTOR-HANDOFF Step 9 (analysis-libs move), and a new home-base
> wrapper at `orchestrate/editor/` arrives during Step 8 (editor
> extraction from `study-lenses/`).
>
> **Prior art**:
> - [`../../lib/editing/README.md`](../../lib/editing/README.md) +
>   [`../../lib/editing/DOCS.md`](../../lib/editing/DOCS.md) — the
>   `createEditor(code, options)` factory (CodeMirror 6 wrapper, lint
>   gutters, hover tooltips, autocomplete via callback injection).
> - [`../../study-lenses/lenses/editor/`](../../study-lenses/lenses/editor/)
>   — the pre-refactor "editor lens" stub (post-refactor: NOT a
>   lens; the home base lives here instead). The stub is replaced
>   during the refactor.

## What lives here

| File                         | Purpose                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| [`./README.md`](./README.md) | This file — orientation + navigation.                                                           |
| [`./DOCS.md`](./DOCS.md)     | Architectural sketch — edit-callback contract, mode transitions, lifecycle in editor mode.       |
| `index.tsx`                  | The home-base React component (planned, F1). Wraps `orchestrate/lib/editing/createEditor`.          |
| `tests/`                     | vitest jsdom + `@testing-library/react` tests (planned, per-increment).                          |

## What this component does

`orchestrate/editor/` is the React component the orchestrator mounts when
the UI is in editor mode (per
[`../orchestrator/README.md` § Editor-vs-lens state machine](../orchestrator/README.md)).
Its responsibilities:

1. **Render the CodeMirror editor** for the current snippet string,
   using `orchestrate/lib/editing/createEditor()` for the underlying
   editor instance.
2. **Forward edits to the orchestrator** via an `onSnippetChange`
   prop — the only mutation surface for snippet state in the
   `<StudyLenses>` component.
3. **Wire pedagogical callbacks** the editor consumes (linters,
   doc lookup, completions) by routing them through to
   `orchestrate/lib/editing/`'s callback API.
4. **Tear down cleanly** when the orchestrator switches to lens
   mode — React's natural unmount calls the editor's `destroy()`
   via a `useEffect` cleanup.

What this component does NOT do:

- Build embodiments (lazy embodiment is the orchestrator's job; the
  editor reads/writes the snippet string only).
- Mount lenses (the orchestrator does that when the learner opens
  one).
- Persist edits across page reloads (LMS responsibility — see
  [`../../README.md` § Pedagogical first principles](../../README.md#pedagogical-first-principles)
  scope-boundary).

## Public API

```tsx
<Editor snippet={current} onSnippetChange={(next) => …} />
```

Props (planned; F1 Phase 0 locks the exact shape):

| Prop              | Type                       | Required | Purpose                                                                              |
| ----------------- | -------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `snippet`         | `string`                   | yes      | The current snippet string (controlled by the orchestrator).                         |
| `onSnippetChange` | `(next: string) => void`   | yes      | Called on every edit. The orchestrator's `setState` lives inside this callback.      |

The exact prop names + signatures lock during F1's Phase 0 — F1 is
where `<StudyLenses snippet>` end-to-end smoke first mounts the
editor as the home base, so the prop contract pins there. F2 builds
the editor-vs-lens mode machinery AROUND the editor; it does not
reshape the editor's own prop surface. This README will be updated
to remove the "planned" hedge once F1 lands.

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the
top-level `AGENTS.md`. Subdirectory-specific rules:

- **Single writer**. Only this component (and its
  `onSnippetChange` callback) mutates snippet state. Lenses are
  read-only views (per
  [`../../README.md` § Pedagogical first principles](../../README.md#pedagogical-first-principles)).
- **CodeMirror integration via `orchestrate/lib/editing/`**. Don't
  import CodeMirror directly here — go through the
  `createEditor()` factory + callback API documented at
  [`../lib/editing/README.md`](../lib/editing/README.md)
  (post-refactor) or [`../../lib/editing/README.md`](../../lib/editing/README.md)
  (pre-refactor).
- **Async setup**. `createEditor()` is async (dynamic language
  loading). Use `useEffect` + state-machine OR `React.lazy` +
  `<Suspense>` to handle the async mount; never block render.
- React tests use `.test.tsx` + `jsdom`.

## Navigation

- **Parent**: [`../README.md`](../README.md) — `orchestrate/` peer
  overview.
- **Architectural sketch**: [`./DOCS.md`](./DOCS.md).
- **Editor factory it wraps**: [`../lib/editing/README.md`](../lib/editing/README.md)
  (post-refactor) or
  [`../../lib/editing/README.md`](../../lib/editing/README.md)
  (pre-refactor).
- **Orchestrator that mounts it**: [`../orchestrator/README.md`](../orchestrator/README.md).
- **Increment plan**: [`../../.planning-handoffs/03-orchestrator-and-contracts.md`](../../.planning-handoffs/03-orchestrator-and-contracts.md)
  F1 + F2.
