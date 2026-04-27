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
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/AGENTS.md`
- **DEV.md** (repo root):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/DEV.md`
- **Master plan**: `./00-master-plan.md` (in this directory)
- **Syntax tracer** (canonical source of the NM-components enum — the
  3rd Block Model dimension):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/trace/syntax/`
  — read `PLAN.md` (Resolutions), `README.md` (categories table),
  `types.ts` (`StepCategory` enum), `DOCS.md` (step-closing rules).
- **Notional machine** (conceptual spec; operational implementation
  is the syntax tracer above):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/notional-machine.md`
- **Semantic tracer docs** (semantic layers, gate config — the
  syntax tracer's input):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/tracer.md`
- **Existing recommender directory** (currently just an empty README):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/recommender/`
- **Existing socratizing module** (prior art for snippet analysis -- this module
  may later consume the shared analysis):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/socratizing/`
- **Existing validating module** (AST parsing for JEJ):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/validating/`
- **Lenses DOCS.md** (current lens architecture):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lenses/DOCS.md`
- **NM components** (Work Stream 1 output, `01-NM-components.md`):
  the 3rd Block Model dimension. The canonical enum
  (`StepCategory`) lives in the syntax tracer; WS1 wires it into
  `study-lenses/types.ts`. Read `01-NM-components.md` for
  the contract.

## Context

### What this work stream does

This work stream builds two pure TS modules that work together:

1. **`lib/analysis/`** -- Snippet analysis utility. Takes JEJ code as input,
   returns a structured `AnalysisReport`. Pure TS, no React, no DOM.

2. **`lib/recommender/`** -- Recommendation engine. Takes an `AnalysisReport`
   plus a list of registered lenses, returns a `RecommendationGrid` organized by
   the 3D Block Model dimensions. Pure TS, no React, no DOM.

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
lib/analysis/ --> AnalysisReport
     |                  |
     |                  v
     |          lib/recommender/ + registered lenses
     |                  |
     |                  v
     |          RecommendationGrid (3D: level x scope x NM components)
     |                  |
     |                  v
     |          orchestrator renders recommendation UI
     |
     +---> (future) socratizing could consume AnalysisReport
```

The analysis runs **lazily** -- only when the learner opens the recommendation
panel, not on every keystroke. JEJ-only (simplified parsing, no general JS
analysis needed).

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

The snippet analysis extracts features. Each lens's `recommend()` function
consumes them to decide what to suggest. The analysis produces:

1. **Parse status** -- Valid AST? Syntax errors? Which errors? Gates the
   three-tier classification above.

2. **Code length** -- Lines, characters, statements. Shorter snippets support
   higher blanks difficulty; parsons works best around 8-15 lines; trace tables
   become unwieldy past ~20 lines.

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

4. **Complexity signals** -- Nesting depth, variable count, branch count. Drives
   both WHICH lenses and WHAT CONFIG within each lens.

5. **JEJ NM semantic layers present** -- Which of the 5 tracer semantic layers
   (values, bindings, expressions, statements, scopes) appear in the snippet.

6. **Author overrides** -- `lenses.json` or `@study-lens` directives can
   constrain which lenses the recommender offers. The free-exploration panel is
   always available regardless of constraints.

### The Recommendation type

Each lens's `recommend()` function returns `Recommendation[]`. A single lens can
suggest multiple versions of itself at different Block Model cells with
different configs:

```text
Recommendation = {
  lens: string                    // registry key (orchestrator resolves)
  config: LensConfig
  relevance: number               // 0-1 score
  blockModelCell: { level, scope, nmComponents? }
  transforms?: string[]           // optional pipeline prefix
  label: string
}
```

- `lens` is a string (not a component reference) -- keeps `recommend()` in pure
  TS. The orchestrator resolves names to components via the registry.
- `transforms` enables pipeline recommendations (e.g.,
  `{ transforms: ['translate'], lens: 'parsons' }` = pseudocode parsons).
- A single lens can suggest multiple versions of itself (e.g., blanks at
  difficulty 1 for keywords, blanks at difficulty 3 for identifiers).

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
Socratic prompts. A future refactor could make it consume the shared
`AnalysisReport` from `lib/analysis/` instead. Same pattern:
`AnalysisReport -> Socratic prompts` mirrors
`AnalysisReport -> lens recommendations`. Keep this in mind during design: the
`AnalysisReport` should be general enough that socratizing could consume it, but
do NOT design for that use case now -- just don't block it.

### What's decided

- Analysis is lazy (runs only when recommender panel opens)
- Analysis is JEJ-only (simplified parsing)
- Recommender is pure utility (no UI, no React, no DOM)
- Three-tier lens classification (text-only, AST-dependent, dynamic)
- `recommend()` lives on each lens (self-describing), not centralized
- Recommender can build pipeline recommendations (`transforms + lens`)
- 3D Block Model space organizes recommendations

### What's still open

- Exact `AnalysisReport` shape (to be defined during DDD)
- Exact `RecommendationGrid` shape (to be defined during DDD)
- Relevance score semantics (within-lens only? or cross-lens comparable?)
- How to handle author overrides in the recommender (filter vs. reweight)
- Whether the analysis should parse the AST itself or reuse the existing
  validating module's parse

## Dependencies

### This stream depends on

- **Work Stream 1 (`01-NM-components.md`)**: supplies the 3rd Block
  Model dimension (the `StepCategory` enum from the syntax tracer).
  WS1 is small — it wires `StepCategory` into `study-lenses/types.ts`
  and confirms the 10-category list. WS1 is ready now (the syntax
  tracer's Phase 0 has stabilized the outer categories); WS2 can
  start Phase 0 (DDD) immediately and consume the enum during
  Phase 1 implementation.

### Other streams that depend on this

- **Work Stream 3 (Orchestrator)**: the orchestrator calls the recommender
  lazily when the recommendation panel opens. The orchestrator needs the
  `RecommendationGrid` type to render the spiral/grid UI.
- **Work Stream 4 (Lens Migration)**: each lens implements `recommend()` which
  takes `AnalysisReport` as input. Lens authors need the `AnalysisReport` type.

## Non-negotiable constraints

From the master plan:

1. **Pure TS, no React, no DOM.** Both modules are in `lib/`. They are consumed
   by the orchestrator (React) but must be testable without React.
2. **Lazy analysis.** Analysis runs only when the recommendation panel opens,
   NOT on every edit.
3. **Three-tier lens classification.** Parse status gates which lenses can be
   recommended. Text-only lenses are always available. AST-dependent and dynamic
   lenses require valid parse.
4. **Self-describing lenses.** Each lens's `recommend()` function declares its
   own relevance. The recommender does NOT have hardcoded knowledge of
   individual lenses -- it collects from registered lenses.
5. **Pipeline recommendations.** The recommender can compose transform+lens
   pipelines (e.g., `translate` transform + `parsons` lens = pseudocode
   parsons). `recommend()` returns `transforms?: string[]` to enable this.
6. **No implementation in plans.** Plans describe BEHAVIOR and INTENT.
   TypeScript type declarations are OK. Function bodies are not.
7. **Deep freeze all return values.** Both `AnalysisReport` and
   `RecommendationGrid` must be frozen before returning.

## Phase 0 checklist (from AGENTS.md)

Two modules need Phase 0, done together or sequentially. Complete every step in
order. Do not skip any step. Do not start Phase 1 until all 7 steps are done for
BOTH modules.

### Phase 0 for `lib/analysis/`

- [ ] **0.1 Establish ubiquitous language** -- Key terms to define precisely:
  - AnalysisReport (the output artifact)
  - Parse status (valid, invalid, which errors)
  - NM component detection (how components are identified in code)
  - Complexity signals (nesting depth, variable count, branch count)
  - Code metrics (lines, characters, statements)
  - Semantic layers (mapping to tracer's 5-layer model) Watch for: "feature"
    (overloaded term -- NM component? syntax feature? language feature?). Pick
    precise terms and stick with them.

- [ ] **0.2 Update README.md** -- for `lib/analysis/`. What the module does,
      where it fits, what it owns, what it does NOT own (recommending is the
      recommender's job, not analysis's).

- [ ] **0.3 AR-1 design challenge** -- Focus areas:
  - Is AnalysisReport too broad or too narrow?
  - Does the analysis duplicate work in `lib/validating/`? Should it reuse?
  - Are the NM component names aligned with `notional-machine.md`? Provide:
    README, notional-machine.md, existing validating module.

- [ ] **0.4 Update types.ts** -- Define `AnalysisReport` and related types.

- [ ] **0.5 Write DOCS.md architectural sketch** -- Execution phases for
      analysis (parse, detect components, measure complexity, assemble report).

- [ ] **0.6 AR-2 sketch challenge** -- Is the sketch at the right abstraction?
      Are phases the right granularity?

- [ ] **0.7 Review & resolve** -- Can you predict the implementation shape?

  Commit:
  `docs: establish analysis module domain model and architectural sketch`

### Phase 0 for `lib/recommender/`

- [ ] **0.1 Establish ubiquitous language** -- Key terms:
  - RecommendationGrid (the output artifact, 3D structure)
  - Recommendation (individual lens suggestion with config)
  - Relevance score (0-1, meaning and comparability)
  - Block Model cell (level x scope intersection)
  - Pipeline recommendation (transform[] + lens composition)
  - Author override (constraint on available recommendations)

- [ ] **0.2 Update README.md** -- for `lib/recommender/`.

- [ ] **0.3 AR-1 design challenge** -- Focus areas:
  - Is the recommender doing too much? (it should NOT own lens knowledge)
  - Is the 3D grid the right structure? Could a flat list suffice?
  - How do pipeline recommendations compose without combinatorial explosion?

- [ ] **0.4 Update types.ts** -- Define `RecommendationGrid`, `Recommendation`,
      related types.

- [ ] **0.5 Write DOCS.md architectural sketch** -- Execution phases (collect
      from lenses, organize into grid, apply overrides).

- [ ] **0.6 AR-2 sketch challenge**

- [ ] **0.7 Review & resolve**

  Commit: `docs: establish recommender domain model and architectural sketch`

## Phase 1 increment plan

### Analysis module increments

- [ ] **Increment 1**: Parse status detection. Input: JEJ code string. Output:
      parse status (valid/invalid + error details). ZOMBIES: empty string, valid
      one-liner, syntax error.
- [ ] **Increment 2**: Code metrics. Input: code string. Output: line count,
      character count, statement count. ZOMBIES: empty, one line, multi-line.
- [ ] **Increment 3**: NM-component detection -- `expression` +
      `resolve` categories via static AST mapping. Input: parsed AST.
      Output: presence flags. ZOMBIES: empty program, single literal,
      binary op.
- [ ] **Increment 4**: NM-component detection -- `initialization` +
      `for-init` + `write`. Variable declarations and reassignments.
- [ ] **Increment 5**: NM-component detection -- `statement` +
      `scope` + `control-flow`. Block boundaries and flow constructs.
- [ ] **Increment 6**: NM-component detection -- `emit` + `error`.
      I/O calls (prompt/alert/confirm/console.*) and error-prone
      constructs.
- [ ] **Increment 7**: Complexity signals. Nesting depth, variable
      count, branch count.
- [ ] **Increment 8**: `AnalysisReport.nmComponents` assembly -- union
      the per-category presence flags into a single unordered set
      matching the canonical `StepCategory` enum. No ordinal level is
      derived.
- [ ] **Increment 9**: Full `AnalysisReport` assembly. Combine all signals into
      the typed report. Integration test with a realistic JEJ snippet.

### Recommender module increments

- [ ] **Increment 10**: Collect recommendations from a single lens. Input:
      AnalysisReport + one lens with `recommend()`. Output: that lens's
      recommendations. ZOMBIES: lens returns empty array, one recommendation,
      multiple.
- [ ] **Increment 11**: Collect from multiple lenses. Verify deduplication and
      that all lenses are queried.
- [ ] **Increment 12**: Organize into Block Model grid. Place each
      recommendation at its `blockModelCell` coordinates. ZOMBIES: empty grid,
      one cell, multiple cells.
- [ ] **Increment 13**: Pipeline recommendations. Verify that recommendations
      with `transforms` are preserved and resolved correctly.
- [ ] **Increment 14**: Author overrides. Filter/constrain recommendations based
      on override config.
- [ ] **Increment 15**: Full `RecommendationGrid` assembly. Integration test
      with multiple lenses and a realistic analysis report.

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

1. **Unit tests**: `npm test` -- all analysis and recommender tests green
2. **Type checking**: `npm run type-check` -- no errors
3. **Lint**: `npm run lint` -- clean
4. **Integration test scenario**: Create a test with a realistic JEJ snippet
   (e.g., `let x = 5; let y = x + 1; if (y > 3) { console.log(y); }`), run it
   through analysis to get an AnalysisReport, then through the recommender with
   mock lenses that have `recommend()` functions, and verify the
   RecommendationGrid has recommendations in the expected Block Model cells
5. **Parse error scenario**: Run analysis on invalid code, verify only Tier 1
   (text-only) lenses get non-zero relevance from mock lenses
6. **Documentation review**: read both READMEs, both DOCS.md files, and both
   types.ts files -- a developer can understand the full pipeline from code to
   recommendation grid

### What success looks like

A fresh agent working on Work Stream 3 (orchestrator) can import the
recommender, call it with an AnalysisReport and registered lenses, and receive a
RecommendationGrid to render. A fresh agent working on Work Stream 4 (lens
migration) can import AnalysisReport and implement `recommend()` on each lens
against the typed contract.
