# evaluators/lib — Architecture & Decisions

## Why a region-internal lib exists

Sibling evaluators share machinery that is not kind-contract surface and not
package-wide either: it speaks the evaluators' own protocols (worker helpers,
instrumentation call text, halt classification) and would drift if copied per
evaluator. `evaluators/lib/` is the home for exactly that class — shared by more
than one evaluator, meaningless outside the region.

## Rules

- **Consumed region-only.** Nothing outside `evaluators/` imports from here; the
  region's public surface stays the kind contract and the evaluator objects.
- **The arrow points down.** Modules here may import the package's shared `lib/`
  leaves (values and types alike, re-exporting types through their own boundary
  rather than re-declaring); no module here imports an evaluator.
- **The engine stays mirrored.** The execution engine's shapes are never
  imported — declared locally, structurally assignable — the region rule,
  unchanged by living in `lib/`.

## Data flow

None — this directory is an index of rules, not a pipeline; each module's DOCS
carries its own diagram.

## Modules

- [`iteration-guard/`](./iteration-guard/DOCS.md) — the engine-backed
  evaluators' shared iteration-guard semantics; its DOCS carries the data flow
  and the marker/classification design decisions.
