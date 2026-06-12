# phases-panel

The orchestrator's affordance container: an **NM-lifecycle instrument** that
lays the shown stations out left → right — **source · realm · parse · creation ·
evaluation** — each station a column with its own lens dropdown. The panel
**doubles as a lifecycle-status display**: per-station status shows how far the
machine got and where it tripped, teaching the lifecycle before any lens is
picked. It replaced the single toolbar picker; the picker semantics (select a
registered lens → enter lens mode) and the edit-return affordance carry over
unchanged.

The canonical design lives at [`../README.md` § The phases panel](../README.md)
— that section is the contract; this README is the module-local orientation.

## What lives here

```text
phases-panel/
  README.md   (this)
  DOCS.md     architectural sketch + Mermaid
  index.tsx   <PhasesPanel> — presentation only
  tests/      vitest jsdom tests
```

## The component

`<PhasesPanel>` is **presentation only**: it renders what it is handed and
routes selection up. The three pure derivations that feed it — station roster
(static), station availability (per-edit), station status (per-edit) — run in
the orchestrator ([`../index.tsx`](../index.tsx)); this module makes no
derivation calls, imports no registry, and dispatches no bus events.

Props (full contract in [`./index.tsx`](./index.tsx) JSDoc):

| Prop                | What it carries                                                                   |
| ------------------- | --------------------------------------------------------------------------------- |
| `stations`          | the SHOWN stations, canonical order (availability output; hidden = absent)        |
| `roster`            | per-station lens names (roster output; empty roster ⇒ disabled sentinel dropdown) |
| `statusMap`         | per-station statuses (status output; display only — never disables a dropdown)    |
| `activeLens`        | lens-mode active lens; every station rostering it shows it as its dropdown value  |
| `onLensSelect`      | non-sentinel dropdown selection, routed to the orchestrator (`source: 'panel'`)   |
| `editButtonVisible` | lens mode only — renders the edit-return button                                   |
| `onEditReturn`      | edit-return click, routed to the orchestrator                                     |

## Selectors (the stable test/sandbox surface)

- `data-orchestrator-phases-panel` — the panel root (`<nav>`).
- `data-orchestrator-station="<Station>"` — each station column.
- `data-orchestrator-station-status="<StationStatus>"` — the column's status
  value.
- `data-orchestrator-station-status-label` — the visible status label (tests
  anchor on the attributes above, never on label text).
- `data-orchestrator-edit-button` — the edit-return button (carried over from
  the retired toolbar, selector unchanged).

## Durable rules

- **Disabling is roster-driven only.** A dropdown is disabled iff its station's
  roster is empty — never by status. Lens availability is never gated: a
  `barred` or `pending` station with a staffed roster keeps an interactive
  dropdown.
- **The sentinel is non-selectable.** Each dropdown's first option
  (`— select a lens —`) is disabled + hidden; selecting it can never fire
  `onLensSelect`.
- **A panel-excluded active lens** (prop-mounted, in no roster — e.g.
  `debug-props`) leaves every dropdown on the sentinel.
- **A multi-station active lens shows in every station that rosters it** (each
  station derives its value independently; no cross-station coupling).

## Navigation

- **Parent**: [`../README.md`](../README.md) — § The phases panel (the locked
  contract), § Data attributes.
- **Sketch**: [`./DOCS.md`](./DOCS.md).
- **The derivations**:
  [`../derive-station-roster.ts`](../derive-station-roster.ts),
  [`../derive-station-availability.ts`](../derive-station-availability.ts),
  [`../derive-station-status.ts`](../derive-station-status.ts).
- **Station type**: [`../../lenses/types.ts`](../../lenses/types.ts) (`Station`
  — the triple-role contract).
