# phases-panel

The five-phase study panel — the mechanical render of the study layer. Pure
presentation: an ordered list of phases arrives as a prop, sections render in
exactly that order, and learner intent routes back up. The panel derives
nothing.

The region [README](../README.md) owns what the panel means in the study
environment; this document owns the panel's own contract.

## The order arrives, it is never minted

The panel receives its phase list as a prop and renders the sections in the
given order. It never sorts, never inserts, never knows the canonical five — the
lifecycle order has exactly one truth, and it is not here. Handing the panel a
differently ordered list renders a differently ordered panel; that is the
caller's contract to honor, and the guard against a second phase-order truth
living in presentation code.

## What a section shows

- **An accessible phase** shows its display label and its lens names, each an
  affordance that raises an open-lens intent — the intent carries the phase and
  lens names; mounting the opened lens is the top component's work, not the
  panel's.
- **A barred phase** renders barred, with its cause — the phase stays present
  and visibly named, and the cause is shown in place of a lens list. The cause
  arrives as display copy, formatted upstream from the embodiment's structured
  cause; the panel formats nothing.
- **A zero-lens phase** renders present-but-empty: a phase is a place to stand
  even when nothing currently fits it. Absence of lenses is not absence of the
  phase.

## Selectors are data attributes

Every section and affordance carries a data attribute; tests and consumers
anchor on attributes and values, never on label text. Display labels are
learner-facing copy — free to improve without breaking anything.

## What the panel does not own

Fit and accessibility (embody derives both, upstream of the prop); the phase
order (embody's runtime constant, threaded through the top component); display
labels' values (passed in with each entry); mounting an opened lens and masking
it (the top component's); any knowledge of levels, verdicts, or postures.

## Navigation

- Region root: [`../README.md`](../README.md) — the host surface and the
  region's mechanics.
- [`DOCS.md`](./DOCS.md) — this surface's architectural sketch.
- [`types.ts`](./types.ts) — the ordered-entry and intent contracts.
- Siblings: [`../editor/`](../editor/README.md) is the single writer the study
  layer re-derives from; [`../lib/honoring/`](../lib/honoring/README.md) decides
  how a focus request mounts.
