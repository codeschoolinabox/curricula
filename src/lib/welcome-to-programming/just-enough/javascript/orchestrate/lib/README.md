# orchestrate/lib

Analysis helpers consumed by the orchestrator and the home base.
Each module is a pure-TS function that takes an
[`embodiment`](../../embody/types.ts) (`Snippet`) plus per-call
context and returns a result. No React, no DOM, no module-level
state.

> **🚧 PRE-REFACTOR SENTINEL** — this directory does not exist on
> disk before REFACTOR-HANDOFF executes. The constituent libs all
> live at [`../../lib/`](../../lib/) today; REFACTOR-HANDOFF Step 9
> moves them here unchanged in shape, with Step 7 changing their
> signatures to take `embodiment` as input. After **Steps 7 and 9
> both** land (signature change + relocation), this banner is
> removed. If only one of the two has run, the libs are in an
> intermediate state — old path with new signatures, or new path
> with old signatures — and the banner stays.

## What lives here (post-refactor)

Each subdir keeps its existing `README.md` + `DOCS.md` (where
present); cross-link from this index. Per-lib README/DOCS authoring
is OUT OF SCOPE for this commit — those were authored as part of
each lib's own DDD work and ride the move during REFACTOR-HANDOFF
Step 9.

| Subdir                                                        | Purpose                                                                                       | Pre-refactor location                                            | Owning handoff                                                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `recommender/`                                                | Applicability filter + Ranking engine. Consumes `embodiment` directly (analysis is internal helpers, not a separate hand-off type); produces ranked `Recommendation` arrays organized into a `RecommendationGrid`. | [`../../lib/recommender/`](../../lib/recommender/)               | [`02-analysis-and-recommender.md`](../../.planning-handoffs/02-analysis-and-recommender.md) (WS2 owns) |
| `socratizing/`                                                | Socratic micro-decision analysis. Returns questions about the snippet.                        | [`../../lib/socratizing/`](../../lib/socratizing/)               | (own session)                                                           |
| `editing/`                                                    | CodeMirror integration helpers — `createEditor()` factory, callback API.                      | [`../../lib/editing/`](../../lib/editing/)                       | (own session)                                                           |
| `completing/`                                                 | Autocomplete (editor concern).                                                                | [`../../lib/completing/`](../../lib/completing/)                 | (own session)                                                           |
| `error-interpreting/`                                         | Learner-friendly error message translation.                                                   | [`../../lib/error-interpreting/`](../../lib/error-interpreting/) | (own session)                                                           |
| `jej-documentation/`                                          | JEJ docs for editor tooltips.                                                                 | [`../../lib/jej-documentation/`](../../lib/jej-documentation/)   | (own session)                                                           |

## Pre-refactor README/DOCS state

Some pre-refactor libs have full READMEs/DOCS; others are
placeholders awaiting their own DDD session:

- `lib/recommender/` — empty README, no DOCS. WS2 (planned in
  [`02-analysis-and-recommender.md`](../../.planning-handoffs/02-analysis-and-recommender.md))
  authors the full DDD during its session.
- `lib/socratizing/` — README + DOCS exist; ride the move
  unchanged.
- `lib/editing/` — README + DOCS exist; ride the move unchanged.
  See [`../../lib/editing/README.md`](../../lib/editing/README.md).
- `lib/completing/` — empty directory; future session.
- `lib/error-interpreting/` — README + DOCS exist; ride the move
  unchanged.
- `lib/jej-documentation/` — empty directory; future session.

## Locked input shape

After REFACTOR-HANDOFF Step 7 lands, every public function in this
directory takes `embodiment: Snippet` as its first parameter (or
the only parameter, depending on the function). The pre-refactor
signatures (which take `code: string` and re-parse internally) are
replaced.

This is the central architectural decision documented in
[`../../DOCS.md` § Pedagogical grounding](../../DOCS.md):
**every analysis lib reads from the embodiment** the orchestrator
already built, never re-derives. One `embody(code)` per snippet,
many consumers.

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the
top-level `AGENTS.md`. Library-specific rules:

- **Pure TS, no React, no DOM, no module-level state.** Each lib
  is a pure-function transform on `embodiment` (and per-call
  context). Testable in vitest **without** `jsdom`.
- **`embodiment` parameter name** wherever a function takes a
  Snippet instance.
- **Dependency rules** per [`../../DOCS.md` § Dependency rules](../../DOCS.md):
  - `orchestrate/lib/*` may import from sibling `orchestrate/lib/*`,
    `embody/`, `@-utils`. Never from `lenses/`.
  - `lenses/<lens>/*` may import from `orchestrate/lib/*` (for shared
    analysis utilities).

## Navigation

- **Parent**: [`../README.md`](../README.md) — `orchestrate/` peer
  overview.
- **Embodiment contract**: [`../../embody/types.ts`](../../embody/types.ts).
- **Recommender plan**: [`../../.planning-handoffs/02-analysis-and-recommender.md`](../../.planning-handoffs/02-analysis-and-recommender.md)
  — WS2 owns this whole engine.
- **Migration plan**: [`../../REFACTOR-HANDOFF.md`](../../REFACTOR-HANDOFF.md)
  Steps 7 (signature changes) + 9 (move).
