# Fixture: `boundary-gap/`

Used by `resolve-cascade.test.ts` Increment A.4 ("Boundary — root AND target but
not intermediate"). Two `lenses.json` files with an empty directory between
them:

- Root (`./lenses.json`): `defaults.js = "study"`
- Missing at intermediate `./chapter/` — this gap is the point of the test.
- Target (`./chapter/page/lenses.json`): `defaults.py = "study"`

A.4 resolves with `absDir = chapter/page/`, `contentRoot = <this dir>`. The walk
must tolerate the missing intermediate `lenses.json` without crashing, and the
result must fold both present files together:
`defaults = { js: "study", py: "study" }`.

Each file uses a different language key so the assertion distinguishes "both
files were read" from "only one file was read and the rest came from DEFAULTS."
