# orchestrate/editor

The orchestrator's **home base** — the always-mounted React surface
where the learner edits the snippet string. Per the locked
single-writer state model in [`../README.md`](../README.md) §
Conventions, this is the **only** surface in the package that
mutates snippet state. Lenses are read-only views over a frozen
embodiment; the recommender is read-only; the toolbar picker
selects but does not write.

The home base lives at [`./index.tsx`](./index.tsx) as a single
React function component. It is **not** a `LensModule` and is
**not** registered in the lens registry — per
[`../DOCS.md` § Why the editor is a peer subdir, not a lens](../DOCS.md),
the editor's home-base role is structurally distinct from the
read-only lens role and the type system enforces that distinction.

## What lives here

```text
editor/
  README.md       (this — orientation + navigation)
  DOCS.md         architectural sketch + data flow
  index.tsx       React home-base component (default export)
  editor.ts       legacy DOM-mount stub (slated for removal; see below)
  tests/          vitest jsdom unit tests
```

[`./editor.ts`](./editor.ts) is **legacy scaffolding** from the
pre-refactor architecture, where the editor was registered as a
`LensModule` named `'editor'`. It does not satisfy the post-refactor
`LensModule` contract (which requires `Component` + `applicableTo`
per [`../../lenses/types.ts`](../../lenses/types.ts) lines 186-192)
and is being replaced wholesale by the React component at
`index.tsx`. Don't import it from new code.

## Public API

The peer's default export is the React component at
[`./index.tsx`](./index.tsx). Its only consumer is the orchestrator
at [`../index.tsx`](../index.tsx).

```tsx
import EditorComponent from './editor/index.js';

// F1 prop surface — snippet only.
<EditorComponent snippet="let x = 5;" />
```

The component renders a `<textarea data-orchestrator-host>` whose
`value` is bound to the `snippet` prop. F1 ships with **no edit
propagation** — the textarea is editable so learners can visibly
type, but those keystrokes do not yet reach the orchestrator's
snippet state. F2 adds the `onSnippetChange?` prop that wires the
single-writer dispatch through; F3 may grow further props in
lens-mode-adjacent code paths but the editor itself never
receives `embodiment` (the editor is editor-mode-only — when the
orchestrator transitions to lens mode, it hands off to a
`<LensModule.Component>`, not to this editor).

## Why a single React component

The previous draft of these docs framed the editor as a "thin
React adapter wrapping a `LensModule` stub". AR-1 rejected that
framing — the legacy `editor.ts` does not satisfy the
post-refactor `LensModule` contract, and the new architecture
explicitly states the editor is **not a registered lens** (per
[`../DOCS.md`](../DOCS.md) § Why the editor is a peer subdir, not
a lens). A single React component avoids two distinct mistakes:

- It does not pretend the legacy stub is load-bearing API.
- It does not introduce an adapter layer that would dissolve in
  Inc 15+ anyway when CodeMirror lands.

The replacement (Inc 15+) is a CodeMirror-backed React component
at the same file path, with the same default export, that consumes
the same `snippet` (+ F2's `onSnippetChange?`) prop surface. The
orchestrator's call site does not change.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md`.
Module-specific rules:

- **Single-writer state.** Edit propagation (F2's
  `onSnippetChange?`, eventually CodeMirror's debounced dispatch)
  flows out of this component. No lens dispatches snippet edits.
- **One file owns the React surface.** `index.tsx` is the React
  home base. No second adapter layer; no DOM-level helper module
  in the load-bearing path.
- **Default export.** The component is the default export of
  `index.tsx`, frozen via `freezeInPlace` if applicable.
- **F1 prop surface is `{ snippet }` only.** No `embodiment`
  prop on the editor — per [`../DOCS.md`](../DOCS.md) § Lifecycle
  modes, editor mode has no embodiment built. F2 adds
  `onSnippetChange?`; the editor is never handed an embodiment
  because lens mode hands control off to a `<LensModule.Component>`,
  not to this editor.
- **Sync mount.** F1 ships sync. If Inc 15+'s CodeMirror needs
  async setup (e.g. dynamic language-module loading), that lives
  inside the component (`useEffect` + `React.lazy` + `<Suspense>`),
  not in the prop contract.

## Navigation

- **Parent:** [`../README.md`](../README.md) — orchestrator peer.
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
- **Public prop surface (`StudyLensesProps`) + state shape
  (`OrchestratorState`):** [`../types.ts`](../types.ts).
- **Lens contract (for contrast — what the editor is NOT):**
  [`../../lenses/types.ts`](../../lenses/types.ts).
- **Embodiment contract:** [`../../embody/types.ts`](../../embody/types.ts)
  (the editor does not consume `Snippet`; lenses do).
- **Replacement plan:** Increments 15+ in
  [`../../.planning-handoffs/04-lens-migration.md`](../../.planning-handoffs/04-lens-migration.md).
- **Increment phases (F1 / F2 / F3):**
  [`../../.planning-handoffs/03-orchestrator-and-contracts.md`](../../.planning-handoffs/03-orchestrator-and-contracts.md)
  § Foundation tier.
