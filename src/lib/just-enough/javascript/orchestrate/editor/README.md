# orchestrate/editor

The orchestrator's **home base** — the always-mounted React surface where the
learner edits the snippet string. Per the locked single-writer state model in
[`../README.md`](../README.md) § Conventions, this is the **only** surface in
the package that mutates snippet state: lenses are read-only views over a frozen
embodiment, and every other affordance reads but never writes. The editor owns
the write; everything downstream observes.

The home base lives at [`./index.tsx`](./index.tsx) as a single React function
component that mounts a CodeMirror `EditorView` via `useEffect`, using the
[`../lib/editing/`](../lib/editing/) factory. It is **not** a `LensModule` and
is **not** registered in the lens registry — per
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

Editor-internal tests at [`./tests/index.test.tsx`](./tests/index.test.tsx)
cover mount, CodeMirror lifecycle, prop sync, and `onSnippetChange` wiring.
Orchestrator-level coverage that crosses the editor ↔ `<StudyLenses>` boundary
lives at [`../tests/study-lenses.test.tsx`](../tests/study-lenses.test.tsx).

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

The component renders a `<div data-orchestrator-host>` and mounts a CodeMirror
`EditorView` into it via `useEffect`. The `snippet` prop is the controlled
initial-value and the source of truth for external sync — when it changes
externally (e.g. lens → editor return), a sync effect writes `snippet` into the
editor's `.content` (guarded by an equality check to avoid own-write echo). A
CodeMirror update listener fires the optional `onSnippetChange(next)` callback
when the learner types. The orchestrator threads its `useState` setter through
that callback, so the editor is the single writer of snippet state in the
package. The editor never receives `embodiment` — that is a lens-mode concept
and is passed to `<LensModule.Component>`, not to this editor. It MAY receive an
optional **`interpretedDiagnostics`** prop — a `readonly LintDiagnostic[]` the
orchestrator derives from the live embodiment's `errors` (never the embodiment
itself); the editor adds them as one more diagnostic source alongside its own
structural `lintJej` markers (see § Conventions for the source-tagging,
supersede, and coherence rules).

## Why a single React component

The editor's role is structurally distinct from the read-only lens role — the
type system enforces that distinction (per [`../DOCS.md`](../DOCS.md) § Why the
editor is a peer subdir, not a lens). A single React component avoids two
distinct mistakes:

- It does not pretend a `LensModule` stub is load-bearing API for the home base.
- It does not introduce an adapter layer between React and CodeMirror; the React
  component handles three lifecycle concerns directly:
  - **Mount**: a `useEffect` calls `createEditor(snippet, { onChange })` and
    stores the resolved `EditorInstance` in a ref.
  - **Sync**: a second `useEffect` watches the `snippet` prop; when it changes
    externally and `snippet !== editor.content`, it writes
    `editor.content = snippet`. The equality guard prevents own-write echo from
    the orchestrator's setState round-trip.
  - **Destroy**: the mount effect's cleanup calls `editor.destroy()` (idempotent
    per the editing/ contract); a `cancelled` flag inside the effect closure
    gates a late-resolving `createEditor` promise so a unit-then-remounted
    component never holds a stale instance.

The component delegates the CodeMirror setup (extensions, language modules,
keybindings) to the [`../lib/editing/`](../lib/editing/) factory; the React
component owns only the lifecycle integration above.

## Conventions

Inherits all conventions from [`../README.md`](../README.md),
[`../../README.md`](../../README.md), and the top-level `AGENTS.md`.
Module-specific rules:

- **Single-writer state.** The editor is the single writer of snippet source.
  CodeMirror's update listener fires `onSnippetChange(next)`; the orchestrator
  threads its `useState` setter into that callback. No lens dispatches snippet
  edits. **Each keystroke must produce exactly one `onSnippetChange` invocation,
  synchronously inside the CodeMirror update transaction** — no debouncing, no
  batching **in the editor**. (The orchestrator debounces its own _embody
  reaction_ to those per-keystroke updates — see
  [`../README.md` § Live embodiment](../README.md); that debounce lives upstream
  in the orchestrator, never in this editor's `onSnippetChange` firing.)
- **One file owns the React surface.** `index.tsx` is the React home base. No
  second adapter layer; the CodeMirror integration lives entirely inside the
  component via `useEffect`, delegating setup to
  [`../lib/editing/`](../lib/editing/).
- **Default export.** The component is the default export of `index.tsx`.
- **Prop surface is `{ snippet, onSnippetChange?, interpretedDiagnostics? }`.**
  No `embodiment` prop on the editor — it is never handed an embodiment (lens
  mode hands control to a `<LensModule.Component>`, not to this editor). The
  optional **`interpretedDiagnostics`** prop is a `readonly LintDiagnostic[]`
  the orchestrator derives from the live embodiment's `errors` (NOT an
  embodiment); the editor renders them through its existing `linter()` /
  `lintGutter()` / `hoverTooltip()` machinery — one more diagnostic source
  alongside `lintJej` — and never inspects the embodiment that produced them.
  Rules:
  - **Cycle-1 message is plain prose.** Each diagnostic's `message` carries a
    concise interpretation (e.g. `interpretError`'s `whatWentWrong`); the editor
    renders that message as text, with no markdown rendering wired for
    interpreted diagnostics yet. Rich multi-section / markdown hover is
    **deferred**. (The editing layer _does_ have a rich-DOM hover path —
    `toCMDiagnostic` wires `renderMessage` → `buildTooltipDom` when a diagnostic
    carries a rich `entry` payload — but interpreted diagnostics do not populate
    `entry` in Cycle 1, so they render as plain text; see
    [`../lib/editing/`](../lib/editing/) for that path's contract.)
  - **Source-tagged rendering, not blanket dedup.** Diagnostics carry their
    source (syntax / JEJ-compliance / interpreted) so each can render with a
    distinct severity + gutter icon and coexist. The editor suppresses only the
    _same_ error shown both terse (raw `lintJej`) and interpreted — the
    interpreted message supersedes the raw one for that error.
  - **Coherence.** Interpreted diagnostics are at most one debounce-window stale
    relative to the live buffer; the live slot always reflects the buffer at the
    last settle (the staleness bound owned by
    [`../README.md` § Interpreted diagnostics](../README.md)). During the
    transient overshoot, this relies on the editing layer's assumption that
    out-of-range diagnostic positions are **clamped** to valid document ranges
    (clamped to the nearest valid line/column, never dropped or thrown) and
    re-locate on the next settle — `toCMDiagnostic` performs that clamp; see
    [`../lib/editing/`](../lib/editing/) for the editing layer's contract.

  `LintDiagnostic` is the editing layer's existing type
  ([`../lib/editing/types.ts`](../lib/editing/types.ts)); the prop is declared
  on this component's own prop type in [`./index.tsx`](./index.tsx).
  `onSnippetChange` is optional so the component can also be a display-only
  surface in tests / fixtures.

- **Async mount via `useEffect`.** CodeMirror's `createEditor` factory is async
  (dynamic language-module loading). The `useEffect` returns a cleanup that
  calls `editor.destroy()` for StrictMode-safe teardown; an in-flight mount
  whose promise resolves after unmount is gated by a `cancelled` flag inside the
  effect.
- **Prop-change-during-mount race.** If the `snippet` prop changes between the
  component's first render and the `createEditor` promise resolving, the
  in-flight mount uses the original `initialCode`; the post-mount sync effect
  writes the latest `snippet` prop value into `editor.content` once mount
  completes (one extra dispatch on initial mount, equality-guarded thereafter).
  This keeps the React component declarative without cancelling and restarting
  in-flight mounts.
- **Render-on-rejection policy.** If `createEditor` rejects (e.g. CM
  construction throws), the mount effect catches the rejection and stores it in
  a fallback state slot. The component then renders a minimal error notice — a
  `<div data-orchestrator-host data-orchestrator-error>` so the selector test
  surface stays consistent. The error message and the underlying cause are
  written to the console.

## Navigation

- **Parent:** [`../README.md`](../README.md) — orchestrator peer.
- **Architectural sketch:** [`./DOCS.md`](./DOCS.md).
- **Public prop surface (`StudyLensesProps`) + state shape (`OrchestratorState`,
  `LiveEmbodiment`):** [`../types.ts`](../types.ts).
- **Live-embodiment contract (the upstream slot the `interpretedDiagnostics`
  prop is derived from):** [`../README.md` § Live embodiment](../README.md).
- **Lens contract (for contrast — what the editor is NOT):**
  [`../../lenses/types.ts`](../../lenses/types.ts).
- **Embodiment contract:** [`../../embody/types.ts`](../../embody/types.ts) (the
  editor does not consume `Snippet`; lenses do).
- **CodeMirror factory:** [`../lib/editing/README.md`](../lib/editing/README.md)
  documents the `createEditor` factory's options + lifecycle contract.
