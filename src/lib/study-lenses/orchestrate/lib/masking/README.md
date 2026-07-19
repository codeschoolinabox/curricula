# masking

The mask library: the selected level's assessment crossed with the strict
posture, over the three surface classes. Enforcement is **mask, not filter** —
it never edits fit or accessibility; it covers what fit produced.

The region [README](../../README.md) owns the enforcement story (surface
classes, the blocked state, warn versus strict); this document owns the
derivation.

## The derivation

Under **warn** — the default — nothing is ever masked. Under **strict**, the
mask derives from the selected level's assessment, computed by the marking
library and projected here untouched:

- **does-not-fit** → masked, naming the level and its first violation.
- **not-applicable-for-type** → masked, naming the level and the type-admission
  cause built from the admitted types.
- **undetermined** → NOT masked — the carve-out wins, inherited from the
  assessment itself: while the code does not parse, the mask names no violation
  and the parse phases' supports stay uncovered.
- **fits**, or no level selected (the none-state) → not masked.

The mask state carries the level's label and the blocked cause **structurally**
— the first violation, or the admitted types. The top component formats the
blocked sentence, exactly as it formats the barred-phase cause: learner-facing
prose has one author, and the structure stays available for richer overlays
without a contract change. The mask assumes the assessment honors its own
contract — a does-not-fit assessment carries at least one violation — and never
validates or repairs it (no re-derivation, in either direction).

## The three surface classes

Class 1, editor-based: always alive. Class 2, meta-level controls — the
selector, the strict toggle, the snippet-type toggle, the guide: never masked,
because each can itself restore conformance (and help is never withheld). Class
3, everything else — the study panel and its lenses: covered under strict while
the code is out of level, as an inert overlay; mounted lenses keep their state
beneath it. The class of a surface is a static fact of what the surface IS —
nothing derives it at runtime.

## Navigation

- Library index: [`../README.md`](../README.md); region root:
  [`../../README.md`](../../README.md).
- [`DOCS.md`](./DOCS.md) — this library's architectural sketch.
- [`types.ts`](./types.ts) — the mask-state and surface-class contracts.
- Siblings: [`../marking/`](../marking/README.md) computes the assessment this
  library projects; [`../validating/`](../validating/README.md) owns the
  verdicts beneath it.
