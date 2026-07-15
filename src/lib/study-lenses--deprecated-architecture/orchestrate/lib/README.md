# orchestrate/lib

Analysis helpers consumed by the orchestrator and the home base. Each module is
a pure-TS function that takes an [`embodiment`](../../embody/types.ts)
(`Snippet`) plus per-call context and returns a result. No React, no DOM, no
module-level state.

## What lives here

Each subdir keeps its own `README.md` + `DOCS.md`; cross-link from this index.

| Subdir                | Purpose                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `recommender/`        | Applicability filter + Ranking engine. Consumes `embodiment` directly (analysis is internal helpers, not a separate hand-off type); produces ranked `Recommendation` arrays organized into a `RecommendationGrid`. |
| `socratizing/`        | Socratic micro-decision analysis. Returns questions about the snippet.                                                                                                                                             |
| `editing/`            | CodeMirror integration helpers — `createEditor()` factory, callback API.                                                                                                                                           |
| `error-interpreting/` | Learner-friendly error message translation.                                                                                                                                                                        |

## Locked input shape

Every public function in this directory takes `embodiment: Snippet` as its first
parameter (or the only parameter, depending on the function). This is the
central architectural decision documented in
[`../../DOCS.md` § Pedagogical grounding](../../DOCS.md): **every analysis lib
reads from the embodiment** the orchestrator already built, never re-derives.
One `embody(code)` per snippet, many consumers.

## Conventions

Inherits all conventions from [`../README.md`](../README.md) and the top-level
`AGENTS.md`. Library-specific rules:

- **Pure TS, no React, no DOM, no module-level state.** Each lib is a
  pure-function transform on `embodiment` (and per-call context). Testable in
  vitest **without** `jsdom`.
- **`embodiment` parameter name** wherever a function takes a Snippet instance.
- **Dependency rules** per [`../../DOCS.md` § Dependency rules](../../DOCS.md):
  - `orchestrate/lib/*` may import from sibling `orchestrate/lib/*`, `embody/`,
    `@-utils`. Never from `lenses/`.
  - `lenses/<lens>/*` may import from `orchestrate/lib/*` (for shared analysis
    utilities).

## Navigation

- **Parent**: [`../README.md`](../README.md) — `orchestrate/` peer overview.
- **Embodiment contract**: [`../../embody/types.ts`](../../embody/types.ts).
- **Recommender plan**: [`../../ROADMAP.md`](../../ROADMAP.md) § P5b — the
  contract is canonical in
  [`../../DOCS.md` § Recommender](../../DOCS.md#recommender--applicability-filter--ranking-engine).
