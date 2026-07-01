# phases-panel

The orchestrator's affordance container: an **NM-lifecycle instrument** that
lays the shown stations out left → right — **source · realm · parse · creation ·
evaluation** — each station a column with its own lens dropdown. The left →
right layout is realized by the orchestrator's co-located `orchestrate.css` (a
flex row over the station columns), not by this presentation-only module. The
panel **doubles as a lifecycle-status display**: per-station status (how far the
machine got and where it tripped) is exposed on each column's
`data-orchestrator-station-status` attribute as a styleable state — there is no
visible status-text label (removed to keep the horizontal row compact). It
replaced the single toolbar picker; the picker semantics (select a registered
lens → enter lens mode) and the edit-return affordance carry over unchanged.

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
| `statusMap`         | per-station statuses (status output; barred disables; others are display-only)    |
| `activeLens`        | lens-mode active lens; every station rostering it shows it as its dropdown value  |
| `onLensSelect`      | non-sentinel dropdown selection, routed to the orchestrator (`source: 'panel'`)   |
| `editButtonVisible` | lens mode only — renders the edit-return button                                   |
| `onEditReturn`      | edit-return click, routed to the orchestrator                                     |

## Selectors (the stable test/sandbox surface)

- `data-orchestrator-phases-panel` — the panel root (`<nav>`).
- `data-orchestrator-station="<Station>"` — each station column.
- `data-orchestrator-station-status="<StationStatus>"` — the column's status
  value (a styleable state; tests anchor on this attribute, and no separate
  visible status-text label is rendered).
- `data-orchestrator-edit-button` — the edit-return button (carried over from
  the retired toolbar, selector unchanged).

## Durable rules

- **Disabling is roster-empty OR barred** (reverses the prior "roster-driven
  only; never status-gated" rule). A dropdown is disabled iff its station's
  roster is empty **OR** its status is `barred`
  (`disabled = roster[station].length === 0 || statusMap[station] === 'barred'`)
  — **error-downstream**: a `barred` station is one an upstream machine error
  left unreachable, so a lens there would render a stage that never ran (this is
  **not** `pending`, the stubbed-slice case, which stays interactive). `barred`
  arises only on `creation` / `evaluation`, so `source` / `parse` / `realm` stay
  interactive and source-station study tools remain available for any parseable
  JS. `ok` / `errored` / `constant` / `pending` never gate. Note the disable
  clause changes nothing observable today (only `source` is staffed, and it is
  never barred) — it is locked for when prediction lenses staff `creation` /
  `evaluation`; the greying applies now. Canonical rule:
  [`../README.md` § The phases panel](../README.md) (station-status model).
- **Status renders as a compact cue, not text.** Each column carries its status
  on `data-orchestrator-station-status` (a styleable state); the compact visual
  cue (colour / dot / border) lives in the orchestrator's `orchestrate.css`. No
  status-text label.
- **The sentinel is non-selectable.** Each dropdown's first option (`lenses`) is
  disabled + hidden; selecting it can never fire `onLensSelect`.
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
