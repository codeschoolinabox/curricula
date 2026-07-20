# `lenses/lib/` — shared lens helpers

Cross-lens helpers that belong to no single lens. Code here is imported by two
or more lenses and must stay lens-agnostic.

## What belongs here

- **Cross-lens.** Used by more than one lens. A helper used by exactly one lens
  lives in that lens's own `lib/` instead.
- **React-free.** Plain TypeScript / CodeMirror extensions — no JSX, no React
  hooks. Lens-specific React wiring stays in each lens's `index.tsx`.
- **Leaf-level.** Shared leaf libraries are ordinary imports for any lens (per
  the region purity rule in [`../README.md`](../README.md)); nothing here may
  import from embody, the orchestrator, or any lens.

## Notes

- A helper's unit test lives beside it here (`*.test.ts`), not under a consuming
  lens's `tests/`, so the test follows the code it covers.

## Current contents

- `js-keywords.ts` — bare JavaScript keyword strings, completed as plain text
  (spelling help, never structure).
- `snippet-free-autocomplete.ts` — a CodeMirror autocomplete extension offering
  JS keywords + already-typed in-buffer identifiers only (NO `for`/`if`/
  `function` snippet templates, no completion of un-typed identifiers). Used by
  recall lenses (e.g. `writeme`). Tested in `snippet-free-autocomplete.test.ts`.
