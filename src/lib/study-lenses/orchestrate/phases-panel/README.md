# phases-panel

The five-phase study panel — the mechanical render of the study layer as a
horizontal lifecycle strip. Pure presentation: an ordered list of phases arrives
as a prop, one labeled lens `<select>` renders per phase in exactly that order,
and learner intent routes back up. The panel derives nothing.

The region [README](../README.md) owns what the panel means in the study
environment; this document owns the panel's own contract.

## The order arrives, it is never minted

The panel receives its phase list as a prop and renders the sections in the
given order. It never sorts, never inserts, never knows the canonical five — the
lifecycle order has exactly one truth, and it is not here. Handing the panel a
differently ordered list renders a differently ordered panel; that is the
caller's contract to honor, and the guard against a second phase-order truth
living in presentation code.

## What a phase shows

Each phase is a labeled `<select>` in one horizontal strip — the lifecycle reads
left to right in the given order.

- **An accessible phase** shows its display label and a select of its lens
  names, headed by a none entry. Choosing a lens raises the open-lens intent —
  the intent carries the phase and lens names; mounting the opened lens is the
  top component's work, not the panel's. Choosing the none entry while that
  phase's lens is open raises the close intent — a select can always return to
  rest. The select's value tracks the given open lens, so the strip itself
  signals what is open and where — a lens attached to several phases shows open
  in each of its selects, an accurate projection of the one open choice, and
  closing from any of them closes it everywhere.
- **A barred phase** renders barred: its select is disabled and shows the cause
  as its only entry (also carried as the native tooltip) — the phase stays
  present and visibly named, and the cause is readable where the lenses would
  be. The cause arrives as display copy, formatted upstream from the
  embodiment's structured cause; the panel formats nothing.
- **A zero-lens phase** renders present-but-empty: a disabled select holding
  only the none entry. Absence of lenses is not absence of the phase.

The panel renders no heading elements — the labels are inline text beside their
selects, so the instrument's document outline is untouched by the strip.

## Selectors are data attributes

Every phase entry and option carries a data attribute; tests and consumers
anchor on attributes and values, never on label text. Display labels are
learner-facing copy — free to improve without breaking anything.
`data-phases-panel` on the strip; `data-phase="<name>"` per entry;
`data-phase-select` on each select; `data-phase-barred` on a barred entry;
`data-phase-cause` on a barred select; `data-phase-lens="<name>"` per lens
option.

## What the panel does not own

Fit and accessibility (embody derives both, upstream of the prop); the phase
order (embody's runtime constant, threaded through the top component); display
labels' values (passed in with each entry); mounting an opened lens, closing it,
and masking it (the top component commits; the strip only asks); any knowledge
of levels, verdicts, or postures.

## Navigation

- Region root: [`../README.md`](../README.md) — the host surface and the
  region's mechanics.
- [`DOCS.md`](./DOCS.md) — this surface's architectural sketch.
- [`types.ts`](./types.ts) — the ordered-entry and intent contracts.
- Siblings: [`../editor/`](../editor/README.md) is the single writer the study
  layer re-derives from; [`../lib/honoring/`](../lib/honoring/README.md) decides
  how a focus request mounts.
