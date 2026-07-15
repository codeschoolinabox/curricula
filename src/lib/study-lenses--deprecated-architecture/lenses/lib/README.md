# `lenses/lib/` — shared lens helpers

Cross-lens helpers that belong to no single lens. Code here is imported by two
or more lenses (e.g. `blanks` and `writeme`) and must stay lens-agnostic.

## What belongs here

- **Cross-lens.** Used by more than one lens. A helper used by exactly one lens
  lives in that lens's own `lib/` instead.
- **React-free.** Plain TypeScript / CodeMirror extensions — no JSX, no React
  hooks. Lens-specific React wiring stays in each lens's `index.tsx`.
- **First-class, fully linted V2 source.** Unlike the per-lens `lib/**` dirs
  (eslint-ignored + tsconfig-excluded because they hold vendored legacy JS→TS
  converts), `lenses/lib/**` is deliberately NOT in those ignore sets. Anything
  added here is held to the full lint + type bar.

## Notes

- Because this dir is fully linted, the repo's `import/no-named-export` rule
  applies. A module that must export a tested constant alongside its default
  (e.g. `snippet-free-autocomplete.ts` exporting `JS_KEYWORDS` for its unit
  test) needs a targeted `// eslint-disable-next-line import/no-named-export`
  with a one-line reason.
- A helper's unit test lives beside it here (`*.test.ts`), not under a consuming
  lens's `tests/`, so the test follows the code it covers.

## Current contents

- `snippet-free-autocomplete.ts` — a CodeMirror autocomplete extension offering
  JS keywords + already-typed in-buffer identifiers only (NO `for`/`if`/
  `function` snippet templates, no completion of un-typed identifiers). Used by
  `writeme` and `blanks`. Tested in `snippet-free-autocomplete.test.ts`.
