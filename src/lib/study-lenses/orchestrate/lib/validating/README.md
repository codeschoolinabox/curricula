# validating

The validation library: one assembly of the parse facts per settle, and one
memoized validate per settle and per level. Everything here is a pure function
plus one memoization boundary; the top component calls them and holds the
results.

The region [README](../../README.md) owns what the level verdict means and the
[region glossary](../../README.md#glossary--region-terms) pins it against its
near-homonyms; this document owns the mechanics.

## One assembly per settle

The embodiment carries its parse derivations as tagged stages; a level's
validator consumes **values, never envelopes**. This library assembles the
`ParseFacts` a level consumes exactly once per settle, from the embodiment's
stage values — the token stream, the set-aside comments, the syntax tree. When
the tokens or ast stage failed, there is nothing to assemble: the assembly
yields the undetermined signal instead, and **no level is consulted** — the
undetermined verdict is the caller's own, never a level's answer.

## One memoized validate

Three surfaces project one truth — the selector's marks, the editor's gutter,
the enforcement mask — so validation runs **once per settle and per level**,
keyed by the settled snippet identity (source and type) and the level key.
Repeated reads within a settle return the same verdict without consulting the
level again. A verdict is `undetermined` while the code does not parse, else
`validated`, carrying the level's violations — possibly none.

A throwing `validate` is caught, reported loudly as a defect, and yields the
undetermined verdict for that level — the region's shared graceful-arm posture
for a throwing third-party callback, so one buggy injected level never takes
down the instrument. The report here is unconditional — not development-gated
like embody's wrapped applicability reports — because a validator defect
misleads every level surface at once.

## Navigation

- Library index: [`../README.md`](../README.md); region root:
  [`../../README.md`](../../README.md).
- [`DOCS.md`](./DOCS.md) — this library's architectural sketch.
- [`types.ts`](./types.ts) — the verdict and assembly contracts.
- Siblings: [`../marking/`](../marking/README.md) classifies each level from
  these verdicts; [`../masking/`](../masking/README.md) projects the selected
  level's classification under strict.
