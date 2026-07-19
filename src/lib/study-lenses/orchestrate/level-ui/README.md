# level-ui

The level selector and the strict toggle — pure presentation of the level
surfaces. The selector is permanent whenever levels are registered: it is the
discovery and self-assessment channel. Both controls are surface class 2: never
masked, because each can itself restore conformance.

The region [README](../README.md) owns what fit marks and assessments mean; the
package [README](../../README.md) owns the none-state and strict/warn. This
document owns the rendered contract.

## What renders

- **The closed face** shows the selected level's state: the selected level's
  label and its current mark — or the none-state display string when no level is
  selected.
- **The open list** shows one entry per registered level, in the given order,
  each with its display label and its fit mark — plus the none-state entry, a
  label and not a level. Hovering a level entry surfaces its documentation — the
  level's reference docs, collapsed upstream to the one hover string;
  notional-machine prose is level-aware lens territory.
- **The strict toggle** shows and flips the enforcement posture.

Whether the list is open or closed is component-local ephemeral UI state — not a
session choice; it neither reaches the top component nor survives the component.

Every option arrives computed: keys, labels, marks, and docs come in as props;
selection and posture changes go up as intent callbacks. The component derives
nothing, sorts nothing, and holds no session state — the top component owns
every session choice.

## Selectors are data attributes

Every control and entry carries a data attribute; tests and consumers anchor on
attributes and values, never on label text. Marks render as data-attribute
values (the four `FitMark` strings), so a mark's visual treatment can change
freely without breaking anything.

## What this surface does not own

Deriving marks (the marking library's); verdicts and validation (the validating
library's); the mask (the masking library's — this surface is never under it);
session choices (the top component's); the editor gutter (the editor's, fed by
the shared validate); level content and docs prose (each level's own).

## Navigation

- Region root: [`../README.md`](../README.md) — the host surface and the
  region's mechanics.
- [`DOCS.md`](./DOCS.md) — this surface's architectural sketch.
- [`types.ts`](./types.ts) — the option and intent contracts.
- Siblings: [`../lib/marking/`](../lib/marking/README.md) computes the marks
  this surface renders; [`../phases-panel/`](../phases-panel/README.md) is the
  study layer beside it.
