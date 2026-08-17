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

Class 1, editor-based: never masked while mounted — and structurally absent
during any excursion, when the ways back to it are class 2. Class 2, the
meta-level **nodes** that must survive every posture, earned one of **four**
ways (human ruling 2026-08-17): **acting on the boundary** — the selector, the
strict toggle, the snippet-type toggle and the edit-return button, which
respectively change which boundary applies, whether it bites, whether the code
sits inside it, and how the learner reaches the surface where it is fixed;
**explaining the boundary** — the guide, because a posture may not withdraw its
own explanation of itself; **carrying the region's voice** — the announcer; and
**naming the pane's occupant** — the nameplate. None of the four is ever masked.
The class enumerates **nodes** rather than controls because the split is
exhaustive and **two of the four routes are taken by nodes that are not
controls** — the announcer and the nameplate — and either falling to class 3
would be the one class it cannot carry: `inert` would remove the announcer from
the accessibility tree entirely, which is worse than not announcing (human
ruling 2026-08-15), and it would take the pane's name with the pane. Both
therefore render outside both maskable containers, which only the composition
root can guarantee. Class 3, everything else — the study panel and its lenses,
and the generator view together with the button that opens it: covered under
strict while the code is out of level — the covered surfaces go inert and a
NON-inert overlay is laid over them, never the reverse: the overlay carries the
blocked sentence, and marking it inert would remove that sentence from the
accessibility tree. A covered surface keeps its state beneath it. The class of a
surface is a static fact of what the surface IS — nothing derives it at runtime,
and it does not follow from which container the surface renders in: the Generate
code button sits outside every maskable container and still carries class 3 at
its own element.

## Navigation

- Library index: [`../README.md`](../README.md); region root:
  [`../../README.md`](../../README.md).
- [`DOCS.md`](./DOCS.md) — this library's architectural sketch.
- [`types.ts`](./types.ts) — the mask-state and surface-class contracts.
- Siblings: [`../marking/`](../marking/README.md) computes the assessment this
  library projects; [`../validating/`](../validating/README.md) owns the
  verdicts beneath it.
