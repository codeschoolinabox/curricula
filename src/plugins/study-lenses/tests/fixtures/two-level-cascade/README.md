# Fixture: `two-level-cascade/`

Used by `resolve-cascade.test.ts` Increment A.3 ("Many — two-level
cascade"). Two `lenses.json` files:

- Root (`./lenses.json`): sets `defaults.js = "study"` and
  `lenses.study = { ask: false, debug: true }`.
- Chapter (`./chapter/lenses.json`): overrides `defaults.js = "highlight"`
  and extends `lenses.study = { debug: false }`.

A.3 resolves with `absDir = chapter/`, `contentRoot = <this dir>`. The
assertion verifies:

- `defaults.js === "highlight"` (shallow: child replaces parent)
- `lenses.study === { ask: false, debug: false }` (deep merge: `ask`
  inherited from root, `debug` overridden by chapter)

Exercises the A.2 implementation's one known gap (shallow-merge of
`lenses.*`) and forces its triangulation.
