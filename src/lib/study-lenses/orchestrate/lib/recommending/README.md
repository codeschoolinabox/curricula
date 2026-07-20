# recommending

Recommendation ranking — and only ranking. Fitting lenses propose next study
steps; this library orders the collected proposals for rendering: relevance
descending, ties stable.

The region [README](../../README.md) owns where recommendations render (through
the enforcement mask); this document owns the ordering contract.

## Ranking only

One pure function: collected proposals in, a ranked list out.

- **Relevance descending** — proposals order by their `relevance` (the lens
  contract's shared 0–1 scale), highest first.
- **Stable ties** — equal relevance keeps the collected order; ranking never
  reorders what it cannot distinguish.
- **Frozen output** — the ranked list leaves the function immutable.
- **The scale is trusted** — ranking never re-validates `relevance`; an
  out-of-range value is the proposing lens's contract bug, not ranking's to
  repair.

Nothing else is owned here: producing proposals is each lens's `recommend`;
collecting them across the fitting lenses is the derive composition's walk;
rendering the ranked list — through the mask — is the top component's render.
This library never inspects an embodiment, a level, or a posture.

## Navigation

- Library index: [`../README.md`](../README.md); region root:
  [`../../README.md`](../../README.md).
- [`DOCS.md`](./DOCS.md) — this library's architectural sketch.
- [`types.ts`](./types.ts) — the ranked-proposals contract.
- Siblings: [`../composing/`](../composing/README.md) joins the roster whose
  fitting lenses propose; [`../honoring/`](../honoring/README.md) decides how a
  focus request mounts.
