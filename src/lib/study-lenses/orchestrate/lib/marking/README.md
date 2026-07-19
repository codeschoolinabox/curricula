# marking

The classification library — the one place a level's verdict becomes the
four-valued per-level classification. Computed once per settle and per level;
two surfaces project it: the selector renders every level's mark, the mask
crosses the selected level's mark with the strict posture.

The region [README](../../README.md) owns what a fit mark means and pins the
level-verdict / fit-mark / lens-fit near-homonyms; this document owns the
derivation.

## One classification, two projections

For each registered level, the classification derives from three inputs: the
level's verdict, the level's admitted snippet types, and the current snippet
type. The parse status is not a fourth input — an undetermined verdict IS the
parse status, so the carve-out reads off the verdict itself. Its four values,
with what each carries:

- **undetermined** — the verdict is undetermined (the code does not parse). This
  carve-out wins regardless of type admission: a typo never reads as a level
  violation.
- **fits** — parsed, type admitted, no violations.
- **not-applicable-for-type** — parsed, but the level does not admit the current
  snippet type; carries the admitted types (the type-admission cause renders
  from them).
- **does-not-fit** — parsed, type admitted, violations present; carries the
  violations (the mask names the first).

Each assessment travels with its cause so no downstream surface re-derives
anything: the selector reads the mark; the mask reads the selected level's mark
and its cause. Type admission is checked here, once — the selector's
not-applicable mark and the mask's type-admission cause are one check's two
projections.

## Navigation

- Library index: [`../README.md`](../README.md); region root:
  [`../../README.md`](../../README.md).
- [`DOCS.md`](./DOCS.md) — this library's architectural sketch.
- [`types.ts`](./types.ts) — the assessment contracts.
- Siblings: [`../validating/`](../validating/README.md) produces the verdicts
  this library classifies; [`../masking/`](../masking/README.md) projects the
  selected level's assessment under strict.
