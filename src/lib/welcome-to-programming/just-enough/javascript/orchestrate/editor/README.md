# orchestrate/editor

The orchestrator's **home base** — the always-mounted React surface where the
learner edits the snippet string. Per the locked single-writer state model in
[`../README.md`](../README.md) § Conventions, this is the **only** surface in
the package that mutates snippet state. Lenses are read-only views over a frozen
embodiment; the recommender is read-only; the toolbar picker selects but does
not write.

The home base lives at [`./index.tsx`](./index.tsx) as a single React function
component. It is **not** a `LensModule` and is **not** registered in the lens
registry — per
[`../DOCS.md` § Why the editor is a peer subdir, not a lens](../DOCS.md), the
editor's home-base role is structurally distinct from the read-only lens role
and the type system enforces that distinction.

## What lives here

```text
editor/
  README.md       (this — orientation + navigation)
  DOCS.md         architectural sketch + data flow
  index.tsx       React home-base component (default export)
  tests/          vitest jsdom tests for the component
    index.test.tsx
```

The pre-refactor `editor.ts` LensModule stub and its dedicated `tests/`
directory were deleted as part of F1.C; the React component at `index.tsx`
replaces them. F2 re-introduces `tests/index.test.tsx` for editor-internal
behavior (write propagation, callback wiring). Orchestrator-level coverage
that crosses the editor ↔ `<StudyLenses>` boundary lives at
[`../tests/study-lenses.test.tsx`](../tests/study-lenses.test.tsx).

## Public API

The peer's default export is the React component at
[`./index.tsx`](./index.tsx). Its only consumer is the orchestrator at
[`../index.tsx`](../index.tsx).

```tsx
import EditorComponent from './editor/index.js';

// Display-only mount.
<EditorComponent snippet="let x = 5;" />;

// With edit propagation — the orchestrator passes its setSnippet wrapper.
<EditorComponent
  snippet="let x = 5;"
  onSnippetChange={(next) => setSnippet(next)}
/>;
```

The component renders a `<textarea data-orchestrator-host>` whose `value` is
bound to the `snippet` prop. The textarea is **writable**; an `onChange`
handler fires the optional `onSnippetChange(next)` callback with the new
textarea value. The orchestrator threads its `useState` setter through that
callback, so the editor is the single writer of snippet state in the
package. The editor never receives `embodiment` — that is a lens-mode concept
and is passed to `<LensModule.Component>`, not to this editor.

## Why a single React component

The previous draft of these docs framed the editor as a "thin React adapter
wrapping a `LensModule` stub". AR-1 rejected that framing — the legacy
`editor.ts` does not satisfy the post-refactor `LensModule` contract, and the
new architecture explicitly states the editor is **not a registered lens** (per
[`../DOCS.md`](../DOCS.md) § Why the editor is a peer subdir, not a lens). A
single React component avoids two distinct mistakes:

- It does not pretend the legacy stub is load-bearing API.
- It does not introduce an adapter layer that would dissolve in Inc 15+ anyway
  when CodeMirror lands.

The replacement (Inc 15+) is a CodeMirror-backed React component at the same
file path, with the same default export, that consumes the same
`{ snippet, onSnippetChange? }` prop surface. The orchestrator's call site does
not change.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md`.
Module-specific rules:

- **Single-writer state.** The editor is the single writer of snippet source.
  The textarea's `onChange` handler fires `onSnippetChange(next)`; the
  orchestrator threads its `useState` setter into that callback. No lens
  dispatches snippet edits. (Inc 15+'s CodeMirror replacement debounces the
  same dispatch.)
- **One file owns the React surface.** `index.tsx` is the React home base. No
  second adapter layer; no DOM-level helper module in the load-bearing path.
- **Default export.** The component is the default export of `index.tsx`, frozen
  via `freezeInPlace` if applicable.
- **Prop surface is `{ snippet, onSnippetChange? }`.** No `embodiment` prop on
  the editor — per [`../DOCS.md`](../DOCS.md) § Lifecycle modes, editor mode has
  no embodiment built. The editor is never handed an embodiment because lens
  mode hands control off to a `<LensModule.Component>`, not to this editor.
  `onSnippetChange` is optional so the component can also be mounted purely as
  a display surface in tests / fixtures that don't need write propagation.
- **Sync mount.** Today's mount is sync. If Inc 15+'s CodeMirror needs async
  setup (e.g. dynamic language-module loading), that lives inside the component
  (`useEffect` + `React.lazy` + `<Suspense>`), not in the prop contract.

## Navigation

- **Parent:** [`../README.md`](../README.md) — orchestrator peer.
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
- **Public prop surface (`StudyLensesProps`) + state shape
  (`OrchestratorState`):** [`../types.ts`](../types.ts).
- **Lens contract (for contrast — what the editor is NOT):**
  [`../../lenses/types.ts`](../../lenses/types.ts).
- **Embodiment contract:** [`../../embody/types.ts`](../../embody/types.ts) (the
  editor does not consume `Snippet`; lenses do).
- **Replacement plan:** Increments 15+ in
  [`../../.planning-handoffs/04-lens-migration.md`](../../.planning-handoffs/04-lens-migration.md).
- **Increment phases (F1 / F2 / F3):**
  [`../../.planning-handoffs/03-orchestrator-and-contracts.md`](../../.planning-handoffs/03-orchestrator-and-contracts.md)
  § Foundation tier.
