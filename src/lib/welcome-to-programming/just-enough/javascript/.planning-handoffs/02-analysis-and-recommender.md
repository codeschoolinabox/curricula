# Work Stream 2: Snippet Analysis + Recommendation System

> **Pivot resolved (see `01-NM-components.md`).** The 3rd Block Model
> dimension is no longer an ordinal sub-language level progression. It
> is the **unordered set of 10 NM components** sourced from the syntax
> tracer's `StepCategory` enum at
> `lib/evaluating/trace/syntax/types.ts`. Analysis detects categories
> via **static AST mapping** (no execution). Lens recommendations may
> tag MULTIPLE categories per `Recommendation`.

## Prerequisites

Before starting, read these files in full (do not skim):

- **AGENTS.md** (repo root):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/AGENTS.md`
- **DEV.md** (repo root):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/DEV.md`
- **Master plan**: `./00-master-plan.md` (in this directory)
- **Syntax tracer** (canonical source of the NM-components enum — the
  3rd Block Model dimension):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/trace/syntax/`
  — read `PLAN.md` (Resolutions), `README.md` (categories table),
  `types.ts` (`StepCategory` enum), `DOCS.md` (step-closing rules).
- **Notional machine** (conceptual spec; operational implementation
  is the syntax tracer above):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/notional-machine.md`
- **Semantic tracer docs** (current implementation — the syntax tracer's
  input; semantic layers, gate config):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/trace/semantics/`
  (README + DOCS). Historical references at
  `lib/evaluating/.old-notes-for-reference-and-inspiration/tracer.md`.
- **Existing recommender directory** (currently just an empty README):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/recommender/`
- **Existing socratizing module** (prior art for snippet analysis -- this module
  may later consume the shared analysis):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/socratizing/`
- **Existing validating module** (AST parsing for JEJ):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/validating/`
- **Lenses DOCS.md** (current lens architecture):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lenses/DOCS.md`
- **NM components** (Work Stream 1 output, `01-NM-components.md`):
  the 3rd Block Model dimension. The canonical enum
  (`StepCategory`) lives in the syntax tracer; WS1 wires it into
  `lenses/types.ts`. Read `01-NM-components.md` for
  the contract.

## Context

> **Path note.** This handoff references the recommender at
> `lib/recommender/` — a **current** source path (mostly empty
> scaffolding). The structural refactor in
> [`../REFACTOR-HANDOFF.md`](../REFACTOR-HANDOFF.md) will move it to
> `orchestrate/lib/recommender/`. Until that refactor lands, the
> current path is correct.

### What this work stream does

This work stream builds one pure TS module: `lib/recommender/`. The
recommender takes the frozen `embodiment` (a `Snippet` instance
produced by `embody()`) plus the registered lens roster, runs each
applicable lens's `recommend(embodiment)`, organizes the results into
a `RecommendationGrid` indexed by the 3D Block Model dimensions, and
returns it. Pure TS, no React, no DOM.

Internal analysis helpers (NM-component detection, complexity signals,
etc.) live alongside the recommender's entry-point inside
`lib/recommender/`. There is **no separate `lib/analysis/` module and no
`AnalysisReport` hand-off type**; analysis is the recommender's internal
plumbing. Lens authors receive the frozen `embodiment` directly via
`applicableTo(embodiment)` and `recommend(embodiment)` and read whatever
embodiment surfaces they need (`parse.ast`, `status.*`,
`static.features`).

The recommender does not re-parse code — it walks the already-frozen
`embodiment.parse.ast`. Source-string input is the orchestrator's
responsibility (it calls `embody(snippet)` before invoking the
recommender).

This is the implementation of Malaise & Signer (2023)'s Figure 3
architecture (applicability filter + ranking engine); see
[`../DOCS.md` § Recommender = Applicability filter + Ranking engine](../DOCS.md#recommender--applicability-filter--ranking-engine).

### Why it matters

The analysis + recommender is the intelligence behind the study lens system's
spiral learning experience. Instead of showing learners a flat list of all
lenses, the recommender suggests lenses configured for the specific snippet and
the learner's progression level. This is what makes each code snippet a "study
object" with multiple entry points at different comprehension depths.

### How it fits in the architecture

```text
JEJ code snippet
     |
     v
embody(snippet)  -->  frozen Snippet (the embodiment)
     |
     v
lib/recommender/  (with internal analysis helpers)
     |
     v
RecommendationGrid (3D: level x scope x NM components)
     |
     v
orchestrator renders recommendation UI
```

The recommender's internal analysis runs **lazily** — only when the
learner opens the recommendation panel, not on every keystroke. There is
no separate `AnalysisReport` hand-off type; analysis is an internal
helper inside `lib/recommender/`. Lenses receive the frozen `embodiment`
directly via `applicableTo(embodiment)` and `recommend(embodiment)`.

### The three-tier lens classification

Each lens falls into one of three tiers based on what it needs from the code:

**Tier 1: Text-only static** -- Works on raw text, no parse needed. Always
available, even with syntax errors.

- parsons (line shuffling)
- highlight (annotation)
- copy-type (writeme)

**Tier 2: AST-dependent static** -- Needs a valid parse but no execution. Syntax
errors -> relevance 0.

- blanks (token removal)
- variables (scope analysis)
- ask (question generation)

**Tier 3: Dynamic** -- Needs valid parse AND execution. Syntax errors ->
relevance 0.

- run
- trace (all table variants)
- debug
- predict-then-compare trace tables

This classification drives the analysis: if a snippet has syntax errors, only
Tier 1 lenses are recommended. The analysis must report parse status so each
lens's `recommend()` can gate on it.

### Recommender signals

The recommender's internal analysis reads from the frozen `embodiment`.
Each lens's `applicableTo(embodiment)` + `recommend(embodiment)` reads
the same surfaces. The signals available:

1. **Parse / eval status** -- `embodiment.status.{tokenized, parsed, created}`
   booleans (per `embody/types.ts`). Gates the three-tier classification
   above; `applicableTo` returns false when the relevant status is false.

2. **Code length** -- Lines, characters, statements. Shorter snippets support
   higher blanks difficulty; parsons works best around 8-15 lines; trace tables
   become unwieldy past ~20 lines. Available via the embodiment's parse output.

3. **NM components present** -- Which of the 10 syntax-tracer
   categories appear in the code, detected via static AST mapping
   (no execution). The canonical enum is `StepCategory` at
   `lib/evaluating/trace/syntax/types.ts`. Examples: snippet has only
   `expression` + `resolve` → simpler lenses; has `write` +
   `initialization` → trace tables high-value; has `scope` +
   `control-flow` → variables lens relevant; has `emit` → execution-
   focused lenses. NM components detected = the set of step
   categories present in the snippet; this set is UNORDERED (no
   ordinal level is derived from it).

4. **Embodiment features** -- `embodiment.static.features` (per
   `embody/types.ts:248-261`) is the canonical "what language features
   does this snippet use" surface. Boolean record covering JEJ
   constructs (variables, control-flow, IO calls, etc.). Drives both
   WHICH lenses are relevant and WHAT CONFIG within each lens.

5. **Author overrides** -- `lenses.json` cascade or `@study-lens`
   directives can constrain which lenses the recommender offers. The
   free-exploration panel (Q-I dropdown) is always available regardless
   of constraints.

### The Recommendation type

Each lens's `recommend()` function returns `Recommendation[]`. A single lens can
suggest multiple versions of itself at different Block Model cells with
different configs. The canonical type lives in
[`../lenses/types.ts`](../lenses/types.ts):

```text
Recommendation = {
  lens: string                    // registry key (orchestrator resolves)
  config: LensConfig
  relevance: number               // 0-1 score
  blockModelCell: { level, scope, nmComponents? }
  label: string
}
```

- `lens` is a string (not a component reference) -- keeps `recommend()` in pure
  TS. The orchestrator resolves names to components via the registry.
- A single lens can suggest multiple versions of itself (e.g., blanks at
  difficulty 1 for keywords, blanks at difficulty 3 for identifiers). See
  [`04-lens-migration.md` § Multi-variant lens](./04-lens-migration.md#lens-design-patterns).
- **No transforms tier** — the previous transforms-as-pipeline design was
  superseded; transforms are now a lens-internal concern (see
  [`03-orchestrator-and-contracts.md`](./03-orchestrator-and-contracts.md)).

### The RecommendationGrid

The recommender collects all `Recommendation[]` from all registered lenses and
organizes them into a 3D grid:

- Dimension 1: **Level** (text surface, program execution, function/purpose)
- Dimension 2: **Scope** (atoms, blocks, relations, macro)
- Dimension 3: **NM components** (the 10 syntax-tracer categories
  from `StepCategory`, unordered; see `01-NM-components.md`)

Not every cell needs filling -- only cells matching the code's features and
available lens suggestions are populated.

### The socratizing refactor connection

The existing `lib/socratizing/` module does its own snippet analysis to generate
Socratic prompts. A future refactor (per `DOCS.md` § backlog) makes it
consume the frozen `embodiment` directly — same single-source-of-truth
pattern as the recommender. Both consume the embodiment; neither
depends on a shared intermediate type. The recommender's internal
analysis helpers may become reusable utilities under
`orchestrate/lib/*` if a second consumer (socratizing) finds them
useful, but that's a future-refactor concern, not WS2's scope.

### What's decided

- Analysis is lazy (runs only when recommender panel opens)
- Analysis is JEJ-only (no general JS analysis)
- Recommender is pure utility (no UI, no React, no DOM)
- Three-tier lens classification (text-only, AST-dependent, dynamic),
  gated via `applicableTo(embodiment)` reading `status.{parsed,created}`
- `applicableTo` + `recommend` both live on each lens (self-describing,
  per `lenses/types.ts`). The recommender does NOT have hardcoded
  knowledge of individual lenses.
- Lenses receive the frozen `embodiment` directly; analysis is internal
  to `lib/recommender/`, not a separate hand-off type.
- 3D Block Model space organizes recommendations (level × scope × NM
  components per WS1 + DOCS.md § 3D Block Model space).
- **No transforms tier** — transforms are a lens-internal concern
  (per DOCS.md § Locked decisions; lenses are stateful mini web apps).

### What's still open

- Exact `RecommendationGrid` shape (to be defined during DDD)
- Relevance score semantics (within-lens only? or cross-lens comparable?)
- How to handle author overrides in the recommender (filter vs. reweight)
- Whether the recommender's internal analysis should parse the AST itself
  or reuse `embodiment.parse.ast` directly (most likely the latter — the
  embodiment's parse output is canonical and frozen)

## Dependencies

### This stream depends on

- **Work Stream 1 (`01-NM-components.md`)**: supplies the 3rd Block
  Model dimension (the `StepCategory` enum from the syntax tracer).
  WS1 is small — it wires `StepCategory` into `lenses/types.ts`
  and confirms the 10-category list. WS1 is ready now (the syntax
  tracer's Phase 0 has stabilized the outer categories); WS2 can
  start Phase 0 (DDD) immediately and consume the enum during
  Phase 1 implementation.

### Other streams that depend on this

- **Work Stream 3 (Orchestrator)**: the orchestrator calls the recommender
  lazily when the recommendation panel opens. The orchestrator needs the
  `RecommendationGrid` type to render the spiral/grid UI.
- **Work Stream 4 (Lens Migration)**: each lens implements
  `applicableTo(embodiment)` and `recommend(embodiment)` against the
  frozen `Snippet` type. Lens authors do NOT consume a separate
  `AnalysisReport` — they read the embodiment's surfaces directly
  (`status.*`, `parse.ast`, `static.features`). See
  [`../lenses/types.ts`](../lenses/types.ts) for the canonical contract.

## Non-negotiable constraints

From the master plan:

1. **Pure TS, no React, no DOM.** The recommender lives in `lib/`; it is
   consumed by the orchestrator (React) but must be testable without React.
2. **Lazy analysis.** The recommender's internal analysis runs only when
   the recommendation panel opens, NOT on every edit.
3. **Three-tier lens classification.** Lens-author-implemented
   `applicableTo(embodiment)` gates which lenses can be recommended via
   `embodiment.status.{parsed,created}`. Text-only lenses always return
   true. AST-dependent / dynamic lenses gate on the relevant status.
4. **Self-describing lenses.** Each lens's `applicableTo` +
   `recommend` declare its own applicability and relevance. The
   recommender does NOT have hardcoded knowledge of individual lenses —
   it collects from registered lenses.
5. **No implementation in plans.** Plans describe BEHAVIOR and INTENT.
   TypeScript type declarations are OK. Function bodies are not.
6. **Deep freeze all return values.** `RecommendationGrid` must be
   frozen before returning. The embodiment is already frozen by
   `embody()`.

## Phase 0 checklist (from AGENTS.md)

The recommender is one module (`lib/recommender/`). Internal analysis
helpers live alongside it. Complete every step in order. Do not skip any
step. Do not start Phase 1 until all 7 steps are done.

### Phase 0 for `lib/recommender/`

- [ ] **0.1 Establish ubiquitous language** -- Key terms to define
      precisely:
  - RecommendationGrid (the output artifact, 3D structure)
  - Recommendation (individual lens suggestion with config)
  - Relevance score (0-1, meaning and comparability)
  - Block Model cell (level x scope intersection plus the unordered
    NM-components dimension)
  - NM component detection (how components are identified from
    `embodiment.parse.ast`)
  - Complexity signals (nesting depth, variable count, branch count) —
    derived from the embodiment, internal to the recommender
  - Author override (constraint on available recommendations)
  Watch for: "feature" (overloaded term — NM component? syntax feature?
  language feature?). The canonical "language feature" surface is
  `embodiment.static.features`; reserve "NM component" for the 10
  `StepCategory` set.

- [ ] **0.2 Update README.md** -- for `lib/recommender/`. What the module
      does, where it fits, what it owns, what it does NOT own (lens-
      specific knowledge is the lens's job via `applicableTo` +
      `recommend`).

- [ ] **0.3 AR-1 design challenge** -- Focus areas:
  - Is the recommender doing too much? (it should NOT own lens knowledge)
  - Is the 3D grid the right structure? Could a flat list suffice?
  - Are the NM component names aligned with `notional-machine.md` and
    the `StepCategory` enum at `lib/evaluating/trace/syntax/types.ts`?
  - Provide: README, notional-machine.md, `lenses/types.ts`,
    `embody/types.ts`.

- [ ] **0.4 Update types.ts** -- Confirm `RecommendationGrid` shape;
      `Recommendation` and `BlockModelCell` are already in
      `lenses/types.ts` and migrate to `lib/recommender/types.ts` per
      that file's JSDoc.

- [ ] **0.5 Write DOCS.md architectural sketch** -- Execution phases:
      (1) collect applicable lenses via `applicableTo(embodiment)`,
      (2) call `recommend(embodiment)` on each applicable lens,
      (3) organize into 3D grid, (4) apply author overrides.

- [ ] **0.6 AR-2 sketch challenge** -- Is the sketch at the right
      abstraction? Are phases the right granularity?

- [ ] **0.7 Review & resolve** -- Can you predict the implementation shape?

  Commit: `docs: establish recommender domain model and architectural sketch`

## Phase 1 increment plan

The recommender consumes the frozen `embodiment` (a `Snippet`) and the
registered lens roster. Internal analysis helpers extract whatever
signals the recommender needs from `embodiment.parse.ast`,
`embodiment.status.*`, and `embodiment.static.features`.

### Internal-analysis-helpers increments

- [ ] **Increment 1**: NM-component detection -- `expression` +
      `resolve` categories via static AST mapping. Input:
      `embodiment.parse.ast`. Output: presence flags. ZOMBIES:
      empty program, single literal, binary op.
- [ ] **Increment 2**: NM-component detection -- `initialization` +
      `for-init` + `write`. Variable declarations and reassignments.
- [ ] **Increment 3**: NM-component detection -- `statement` +
      `scope` + `control-flow`. Block boundaries and flow constructs.
- [ ] **Increment 4**: NM-component detection -- `emit` + `error`.
      I/O calls (prompt/alert/confirm/console.*) and error-prone
      constructs.
- [ ] **Increment 5**: Complexity signals. Nesting depth, variable
      count, branch count.
- [ ] **Increment 6**: `nmComponents` assembly -- union the
      per-category presence flags into a single unordered set
      matching the canonical `StepCategory` enum. No ordinal level
      is derived.

### Recommender entry-point increments

- [ ] **Increment 7**: Filter applicable lenses. Input: `embodiment` +
      lens roster. Output: lenses where `applicableTo(embodiment) === true`.
      ZOMBIES: empty roster, one applicable, mixed applicable/inapplicable.
- [ ] **Increment 8**: Collect recommendations from a single applicable lens.
      Input: `embodiment` + one applicable lens. Output: that lens's
      `recommend(embodiment)` output. ZOMBIES: lens returns empty array,
      one recommendation, multiple.
- [ ] **Increment 9**: Collect from multiple applicable lenses. Verify
      deduplication and that all are queried.
- [ ] **Increment 10**: Organize into 3D Block Model grid. Place each
      recommendation at its `blockModelCell` coordinates (level × scope ×
      nmComponents). ZOMBIES: empty grid, one cell, multiple cells.
- [ ] **Increment 11**: Author overrides. Filter/constrain
      recommendations based on override config (lenses.json + per-fence
      `@study-lens` directives).
- [ ] **Increment 12**: Full `RecommendationGrid` assembly. Integration
      test with multiple lenses and a realistic embodiment.

For each increment, follow the full TDD cycle from AGENTS.md:

1. JSDoc/TSDoc for the behavioral contract
2. Stub function with stub body
3. Placeholder types (tighten later)
4. Lint checkpoint: `npm run lint <new-file>`
5. Unit test (ZOMBIES order). Ask: could this pass with a hardcoded value?
6. **AR-3**: Spawn reviewer to challenge test strategy (triangulation check)
7. Lint checkpoint: `npm run lint <test-file>`
8. Implement (minimal code, Red to Green. Fake It valid for first test)
9. Lint checkpoint: `npm run lint <impl-file>`
10. Refactor (check against DOCS.md sketch)
11. Lint checkpoint (final)
12. Update types
13. Self-review
14. **AR-4**: Spawn reviewer to audit implementation
15. Quality checks: `npm test && npm run lint && npm run type-check`
16. Verify docs match implementation
17. Atomic commit: `add: [behavior this increment implements]`

## Phase 2 checklist

- [ ] Run full quality checks: `npm test && npm run lint && npm run type-check`
- [ ] **AR-5 pre-merge review**: Spawn reviewer for the full changeset. Provide:
      full diff, modified files, this handoff document, DOCS.md files. Focus
      areas from AGENTS.md AR-5:
  - Cross-file consistency between analysis and recommender modules
  - Documentation sync (README, DOCS.md, types, JSDoc, tests all agree)
  - Missing test scenarios (edge cases: unparseable code, lens with no
    recommendations, grid with empty cells)
  - Convention compliance
  - Architecture fit (do these modules integrate cleanly with the orchestrator
    and lens contracts from Work Streams 3-4?)
  - Scope: did we add anything beyond what was requested?
- [ ] Address PAUSE/CONSIDER items from AR-5
- [ ] Commit prompt

## Verification

### How to test end-to-end

1. **Unit tests**: `npm test` -- all recommender tests green
2. **Type checking**: `npm run type-check` -- no errors
3. **Lint**: `npm run lint` -- clean
4. **Integration test scenario**: Create a test with a realistic JEJ snippet
   (e.g., `let x = 5; let y = x + 1; if (y > 3) { console.log(y); }`),
   build the embodiment via `embody()`, then call the recommender with
   the embodiment plus mock lenses that have `applicableTo` +
   `recommend` functions, and verify the `RecommendationGrid` has
   recommendations in the expected Block Model cells.
5. **Parse error scenario**: Run the recommender on a syntactically
   broken snippet (`status.parsed === false`); verify only Tier 1
   (text-only) lenses pass `applicableTo` and end up in the grid.
6. **Documentation review**: read README, DOCS.md, types.ts —
   a developer can understand the full pipeline from embodiment to
   recommendation grid without external context.

### What success looks like

A fresh agent working on Work Stream 3 (orchestrator) can import the
recommender, call it with an `embodiment` and registered lenses, and
receive a `RecommendationGrid` to render. A fresh agent working on
Work Stream 4 (lens migration) can import `Snippet` from
`embody/types.ts` and implement `applicableTo(embodiment)` +
`recommend(embodiment)` on each lens against the typed contract in
`lenses/types.ts`.
