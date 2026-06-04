# Fixture: `many-mixed-depths/`

Used by `discover-siblings.test.ts` B.6 ("Many — multiple .js files at mixed
depths → sorted alphabetically, subpath disambiguation"). Three files: top-level
`a.js`, nested `exercises/a.js` (same basename!), nested `exercises/b.js`.
Resolved labels: `a`, `exercises/a`, `exercises/b`.

Exercises both the sort requirement (alphabetical by label) and the
same-basename disambiguation via subpath.
