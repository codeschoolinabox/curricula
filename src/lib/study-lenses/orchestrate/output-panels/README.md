# output-panels

The run's **output surface**: the two NM I/O channels render here as the
**output panels**, mounted in the orchestrator's **content row** to the right of
the active surface (not in the dock — the dock keeps only the run controls). The
**User Interface** panel (top) is the **user-audience** channel and is
**interactive**; the **Developer Console** panel (bottom) is the
**dev-audience** channel and is passive.

The canonical design lives at [`../README.md` § The output panels](../README.md)
— that section is the contract; this README is the module-local orientation.

> **Build status.** **Live:** the extraction; the two channels in the content
> row (`output`); the **interactive** User Interface panel (`pending` /
> `onAnswer` + the orchestrator's async io mocks); **appear-on-run** (mounted
> only while `runState !== 'idle'`); and per-panel **dismissal** (✕, with this
> panel modal — the ✕ suppressed — while a dialog is pending) — under the
> `-output-panels` / `-output-panel` / `-output-channel` /
> `-output-panel-dismiss` / `-pending-*` selectors. NOTE: the interactive path
> is unit-proven against a node-fake; the real worker is **not wired into
> `embody` yet** (its `intercept` is a stub), so `<StudyLenses>` does not reach
> a real dialog end-to-end until that engine wiring lands — so the visible
> layout + the interactive fidelity are confirmed at the Sandbox checkpoint, not
> in CI.

## What lives here

```text
output-panels/
  README.md   (this)
  DOCS.md     architectural sketch + Mermaid (prop-flow; presentation component)
  index.tsx   <OutputPanels> — presentation only
  tests/      vitest jsdom tests
```

## The component

`<OutputPanels>` is **presentation only**: it renders what it is handed and
routes intent up. The orchestrator ([`../index.tsx`](../index.tsx)) owns the run
lifecycle, the accumulated `channelOutput`, the **pending-interaction** slot
(displayable fields in state, the resolver in a ref), and the **dismissal**
state; this module imports no `embody`, dispatches no bus events, and holds no
orchestrator state — it never sees the `Snippet`. It is **mounted only while a
run has started** (`runState !== 'idle'`) — the appear-on-run gate is the
orchestrator's conditional render, so by default just the active surface shows.

Props (full contract in [`./index.tsx`](./index.tsx) JSDoc):

- `output` — the two channels' accumulated lines
  (`Readonly<Record<ChannelKind, readonly string[]>>`).
- `dismissed` — per-channel dismissal flags (`OutputPanelDismissal`); a
  dismissed channel's panel is not rendered.
- `pending` — the current pending interaction
  (`{ kind, message, defaultValue? }`) or `null` (nothing awaiting).
- `onAnswer` — the learner's answer to the pending interaction; resolves the
  awaited run and clears `pending`.
- `onDismiss` — dismiss one panel (`channel: ChannelKind`), routed to the
  orchestrator.

## Interactive User Interface panel

The User Interface panel is **truly two-way, and a faithful match for the native
dialogs** — same options, same return values, same blocking — so a learner who
later meets real browser dialogs or the debugger gets **no surprises**. When the
run calls `alert` / `confirm` / `prompt`, the orchestrator's **async `IoMocks`**
set `pending` and return the Promise the worker awaits (the worker pauses on
`Atomics.wait`; the run timer pauses too, so dialog time never counts against
the budget). This panel renders the dialog and routes the answer up, per-kind
exactly like the natives:

- `alert(message)` → message + **OK** → `onAnswer(undefined)` (native returns
  `void`).
- `confirm(message)` → message + **OK** / **Cancel** → `onAnswer(true | false)`.
- `prompt(message, default?)` → message + a text input (seeded with `default`) +
  **OK** / **Cancel** → `onAnswer(value | null)`.

A pending dialog is **modal** — answered via its own OK / Cancel / input; it is
**not** dismissable (the per-panel ✕ is suppressed while `pending !== null`).
The escape from a question the learner won't answer is the **run-stop control
outside the panels** (the dock's Cancel → `intercept.cancel()`), which stops the
program mid-run AND resolves any pending IO Promise (the cancel-latency caveat —
a stuck await would otherwise deadlock the paused worker). `onAnswer` resolves
the awaited Promise and clears `pending`; the run resumes. **Lifecycle:** the
orchestrator clears `pending` + the resolver at the top of each Run and on
Cancel (after resolving); `onAnswer` is a no-op when nothing is pending.
**Single-pending invariant:** the engine serializes IO requests on the SAB, so
at most one interaction is pending at a time. The Developer Console panel is
**passive** — it only renders `console.*` lines (nothing returns to the worker).

## Selectors (the stable test/sandbox surface)

- `data-orchestrator-output-panels` — the surface root (`<section>`), present
  only while `runState !== 'idle'`. Stays even when both channels are dismissed.
- `data-orchestrator-output-panel="user-interface|developer-console"` — the
  per-channel **panel wrapper** (the dismissable unit: groups the channel's ✕ +
  log so the panel can be hidden and CSS can lay out the pair). Absent when that
  channel is dismissed. The two wrappers are siblings, User Interface first.
- `data-orchestrator-output-channel="user-interface|developer-console"` — the
  `role="log"` lines region inside each panel wrapper (value is a
  `ChannelKind`). **Renamed** from the retired `data-orchestrator-dock-channel`
  when the channels left the dock.
- `data-orchestrator-output-panel-dismiss="user-interface|developer-console"` —
  the per-panel ✕ control (the User Interface one is suppressed while a dialog
  is pending — modal).
- `data-orchestrator-pending-dialog` — the interactive dialog (rendered
  **after** the channel logs — never inside them — while `pending !== null`),
  with `data-orchestrator-pending-input` (the `prompt` text input, uncontrolled,
  seeded with `defaultValue`), `data-orchestrator-pending-confirm` (the **OK**
  control) and `data-orchestrator-pending-cancel` (the **Cancel** control,
  absent for `alert`). Tests anchor on attribute + value, never label text.

## Durable rules

- **Presentation only.** No `embody` import, no bus dispatch, no orchestrator
  state. The interactive answer routes up through `onAnswer`; the orchestrator
  owns the resolver and the run lifecycle.
- **Appear on run.** Mounted only when `runState !== 'idle'`
  (orchestrator-gated); each panel renders unless its channel is `dismissed`.
  Panels clear / reappear on the next Run. The panels-root `<section>` stays
  even when both channels are dismissed (the active surface fills the row via
  CSS, not DOM removal).
- **Only the User Interface panel collects input.** `prompt` / `confirm` return
  a value to the run; `alert` and `console.*` do not.
- **Real interactive runs need `crossOriginIsolated`** (SharedArrayBuffer). Unit
  tests node-fake the io path (fully proving the React pending/resolver/onAnswer
  wiring). End-to-end real-worker fidelity (a `*.browser.test.ts` harness + the
  Sandbox checkpoint) is **deferred** until `embody` wires the real engine — its
  `intercept` is a stub today, so the full `<StudyLenses>` interactive path has
  no real worker to exercise yet.

## Navigation

- **Parent**: [`../README.md`](../README.md) — § The output panels (the
  contract), § Data attributes.
- **Sketch**: [`./DOCS.md`](./DOCS.md).
- **Sibling — the dock** (run controls): [`../dock/`](../dock/).
- **IO contract**:
  [`../../embody/lib/evaluating/intercept/README.md`](../../embody/lib/evaluating/intercept/README.md)
  (§ IO execution model — async mocks, the SAB pause, the cancel-latency caveat)
  and [`../../embody/types.ts`](../../embody/types.ts) (`IoMocks`,
  `ChannelKind`).
