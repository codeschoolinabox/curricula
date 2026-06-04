# Fixture: `single-level/`

Used by `resolve-cascade.test.ts` Increment A.2 ("One — single `lenses.json` at
`contentRoot`"). Sets one top-level field (`defaults.js = "study"`, the
canonical site-root configuration for JavaScript); the test asserts that field
is applied while all other fields fall back to `DEFAULTS`.

Array-concat semantics (for `exerciseSetPrefixes` and
`embedSiblings.ignorePrefixes`) are tested in later increments where multi-level
cascade actually exercises the concat behavior.
