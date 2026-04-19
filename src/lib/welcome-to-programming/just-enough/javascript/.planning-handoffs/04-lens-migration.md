# Work Stream 4: Lens Migration

## Prerequisites

Before starting, read these files in full (do not skim):

- **AGENTS.md** (repo root):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/AGENTS.md`
- **DEV.md** (repo root):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/DEV.md`
- **Master plan**:
  `./00-master-plan.md` (in this directory)
- **Orchestrator contracts** (Work Stream 3 output -- the LensModule
  interface each lens must implement):
  Read the `study-lenses/types.ts` file once Work Stream 3 has defined it.
  Until then, the contract signatures in this document are authoritative.
- **Orchestrator DOCS.md** (Work Stream 3 output -- how the orchestrator
  renders lenses):
  Read once available.
- **Notional machine** (for understanding what NM components each lens
  exercises):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/notional-machine.md`
- **Analysis types** (Work Stream 2 output -- `AnalysisReport` that
  `recommend()` receives):
  Read once available.

**Prior art locations** (read the specific source files for each lens you
migrate -- listed in the Prior Art section below).

## Context

### What this work stream does

This work stream implements individual lenses against the `LensModule`
contract defined by Work Stream 3. Each lens is a self-contained exercise
renderer that plugs into the orchestrator.

This work is **parallelizable** -- once the orchestrator proves the contract
with trial lenses (editor + highlight, done in Work Stream 3), multiple
lenses can be built independently by separate agents.

### Why it matters

Lenses ARE the study experience. Each lens embodies a specific pedagogical
intervention grounded in Computing Education Research. The orchestrator is
the infrastructure; lenses are the content. Without lenses, the system
renders only a code editor.

### The LensModule contract

Every lens must implement this interface (defined in Work Stream 3's
`study-lenses/types.ts`):

```text
LensModule = {
  name: string
  lens: (code: string, config?: LensConfig) => Component
  config: (overrides?: Partial<LensConfig>) => LensConfig
  recommend: (analysis: AnalysisReport) => Recommendation[]
}
```

- `name` -- registry key (kebab-case, e.g., `"blanks"`, `"trace-table"`)
- `lens()` -- receives code (possibly transformed by pipeline), returns a
  React component. The orchestrator handles mounting/unmounting.
- `config()` -- factory that returns default config, optionally merged with
  overrides. The lens renders its own config panel.
- `recommend()` -- receives an AnalysisReport (from Work Stream 2), returns
  zero or more Recommendations. This is how lenses self-describe their
  relevance for a given snippet.

### The Recommendation type

Each lens's `recommend()` returns `Recommendation[]`:

```text
Recommendation = {
  lens: string                    // registry key
  config: LensConfig
  relevance: number               // 0-1 score
  blockModelCell: { level, scope, nmComponents? }
  transforms?: string[]           // optional pipeline prefix
  label: string
}
```

A single lens can suggest multiple versions of itself at different Block
Model cells with different configs. For example, the blanks lens might
return:

```text
[
  { lens: "blanks", config: { difficulty: 1 }, relevance: 0.9,
    blockModelCell: { level: "surface", scope: "atoms" },
    label: "Fill in keywords" },
  { lens: "blanks", config: { difficulty: 3 }, relevance: 0.6,
    blockModelCell: { level: "surface", scope: "blocks" },
    label: "Fill in identifiers" },
]
```

### Three-tier lens classification

Each lens falls into one of three tiers. This determines when the lens
can be recommended:

**Tier 1: Text-only static** -- Works on raw text, no parse needed.
Always available, even with syntax errors.

| Lens | What it does | Tier reason |
|---|---|---|
| parsons | Line shuffling (drag-and-drop reorder) | Only needs line text |
| highlight | Read-only annotated code view | Renders text as-is |
| copy-type | Write-from-memory exercise | Only needs raw text |

**Tier 2: AST-dependent static** -- Needs valid parse, no execution.

| Lens | What it does | Tier reason |
|---|---|---|
| blanks | Fill-in-the-blank (token removal) | Needs AST to identify tokens |
| variables | Scope analysis visualization | Needs AST for scope analysis |
| ask | Question generation | Needs AST for feature detection |

**Tier 3: Dynamic** -- Needs valid parse AND execution.

| Lens | What it does | Tier reason |
|---|---|---|
| trace-table (steps) | Manual trace: execution steps | Needs tracer execution |
| trace-table (values) | Manual trace: variable values | Needs tracer execution |
| trace-table (operators) | Manual trace: operator results | Needs tracer execution |
| run | Execute and observe | Needs runtime execution |

In `recommend()`, gate on the analysis report's parse status:

- Tier 1: always return recommendations (ignore parse status)
- Tier 2: return empty array if `analysis.parseStatus !== 'valid'`
- Tier 3: return empty array if `analysis.parseStatus !== 'valid'`

### Lens file structure

Each lens lives in its own directory under `study-lenses/lenses/`:

```text
study-lenses/lenses/
  blanks/
    lens.ts              -- pure TS lens function
    config.ts            -- config factory
    recommend.ts         -- relevance function
    wrapper.tsx          -- React wrapper (thin, renders exercise UI)
    types.ts             -- lens-specific types
    README.md            -- what this lens does
    DOCS.md              -- architectural sketch (if non-obvious)
    tests/
      lens.test.ts
      config.test.ts
      recommend.test.ts
```

The pure TS files (`lens.ts`, `config.ts`, `recommend.ts`) are testable
without React. The wrapper (`wrapper.tsx`) is a thin React shell.

### Trial lenses (done in Work Stream 3)

Work Stream 3 builds two trial lenses to prove the contracts:

1. **`editor`** -- Refactored from the V2 `study-lens-client.tsx`. CodeMirror
   6 editor. The default lens. Reads/writes orchestrator state. Has Run
   and Format buttons (not Reset -- that's the orchestrator's toolbar).

2. **`highlight`** -- Read-only syntax-highlighted code view. Uses
   Prism/CodeBlock. The first NEW lens built against the contract.

You do NOT need to build these. They exist when you start.

### Lenses to migrate from prior art

These lenses have prior implementations in the codebase. Each entry lists
the prior art location, what to extract, and the tier classification.

**blanks** (Tier 2: AST-dependent static)
- Prior art: `0-study-lenses-committee/zz--oldd-clauding-and-context-dump/0--study-lenses--it-begins/src/` (old React app, look for blanks lens component)
- Also: `0-study-lenses-committee/zz--study-lenses-package--2025-try/study-lenses-wc-kit/` (WC kit version)
- What: fill-in-the-blank exercise. Removes tokens from code (configurable: keywords, identifiers, operators, literals). Learner types missing tokens. Difficulty levels map to which token types are blanked.
- Config: `{ difficulty: number, tokenTypes: string[] }`
- Block Model mapping: text surface level, atoms-to-blocks scope
- `recommend()`: gate on parse status (Tier 2). Higher relevance for shorter snippets. Different configs at different difficulty levels = multiple recommendations.

**parsons** (Tier 1: Text-only static)
- Prior art: same old React app (look for parsons lens component)
- What: drag-and-drop line reordering. Shuffles code lines, learner puts them back in order. Works best with 8-15 lines.
- Config: `{ includeDistractors: boolean }`
- Block Model mapping: text surface level, relations scope (line ordering implies understanding of sequence)
- `recommend()`: always available (Tier 1). Relevance peaks at 8-15 lines, drops for very short or very long snippets.

**trace-table** (Tier 3: Dynamic) -- Multiple variants
- Prior art: `0---the-big-idea/00--evancole-be/0--snippetry/dump/00-claude-refactoring/0--study-lenses--it-begins/sandbox/src/utils` (trace table web components: values/steps/operators, Shadow DOM)
- Also: existing JEJ tracer in `lib/evaluating/`
- What: split view: code display + manual trace table + [check] button. Learner fills the table as a prediction exercise. Clicks [check], the lens runs the JeJ tracer on the snippet and validates guesses.
- Three variants (different configs of the same lens):
  - **steps**: which lines execute in which order
  - **values**: what values variables hold after each step
  - **operators**: what each operator produces
- Config: `{ variant: 'steps' | 'values' | 'operators', columns: string[] }`
- Block Model mapping: execution level; steps=blocks scope, values=atoms scope, operators=atoms scope
- `recommend()`: gate on parse status (Tier 3). Steps variant: relevant when code has sequential execution. Values variant: relevant when code has multiple variable assignments. Operators variant: relevant when code has complex expressions. Each variant is a separate recommendation.

**copy-type** (Tier 1: Text-only static)
- Prior art: old React app (writeme component)
- What: code is shown, then hidden. Learner types it from memory. Compares against original.
- Config: `{ displayTime: number }`
- Block Model mapping: text surface level, macro scope (must understand whole snippet)
- `recommend()`: always available (Tier 1). Higher relevance for shorter snippets (memorizable).

**ask** (Tier 2: AST-dependent static)
- Prior art: `0--study-lenses--it-begins/dist/static/ask/component/` (5-level cognitive model x language features)
- What: generates comprehension questions based on code features. 5 cognitive levels (code -> how it works -> connections -> goals -> UX). Configurable by language features (variables, data, operators, control flow).
- Config: `{ cognitiveLevel: number, features: string[] }`
- Block Model mapping: function/purpose level, variable scope
- `recommend()`: gate on parse status (Tier 2). Relevance depends on which NM components are present (more components = more questions possible = higher relevance at higher cognitive levels).

**variables** (Tier 2: AST-dependent static)
- Prior art: old React app (variables/scope lens)
- What: scope analysis visualization. Shows which variables are declared in which scope, scope chain lookup paths.
- Config: `{ showScopeChain: boolean }`
- Block Model mapping: execution level, relations scope
- `recommend()`: gate on parse status (Tier 2). Relevant when code has multiple scopes (if/else blocks, loops). Low relevance for single-scope code.

### Prior art base paths

These are the base directories to search for prior implementations:

```text
0-study-lenses-committee/zz--oldd-clauding-and-context-dump/0--study-lenses--it-begins/src/
  -> Old React app with 24+ lens implementations

0-study-lenses-committee/zz--study-lenses-package--2025-try/study-lenses-wc-kit/
  -> WC kit with LensObject pattern and pipeline

0---the-big-idea/00--evancole-be/0--snippetry/dump/00-claude-refactoring/0--study-lenses--it-begins/sandbox/src/utils/
  -> Trace table web components, loop guards, execution sandbox

0-study-lenses-committee/zz--oldd-clauding-and-context-dump/Explorotron/
  -> 11 lenses mapped to PRIMM stages, recommendation engine

0--study-lenses--it-begins/dist/static/ask/component/
  -> Ask component with 5-level cognitive model
```

All paths are relative to:
`/Users/master/Documents/0-teach-code/0-tbd-met-alums/`

### What's decided

- Lenses are pure exercise renderers (no toolbar, no state management,
  no piping -- all infrastructure handled by orchestrator)
- Each lens colocates pure TS logic with its React wrapper
- Lenses are self-describing via `recommend()`
- The three-tier classification gates recommendations on parse status
- Multiple variants of the same lens (e.g., trace-table) are different
  configs, not different lenses

### What's still open

- Exact config shapes for each lens (defined during each lens's DDD)
- Trace table UX details (split view proportions, [check] button flow,
  comparison display)
- Whether composed lenses (e.g., pseudocode-parsons = translate + parsons)
  are separate LensModule implementations or handled by the recommender's
  pipeline composition
- Which lens to build FIRST after the trial lenses (suggested: blanks,
  as it exercises the full Tier 2 path)

## Dependencies

### This stream depends on

- **Work Stream 3 (Orchestrator + Contracts)**: MUST be complete (at least
  through the trial lenses proving the contract) before this stream starts
  Phase 1. The `LensModule` type, registry, and orchestrator must be
  working end-to-end.
- **Work Stream 2 (Analysis + Recommender)**: needs the `AnalysisReport`
  type to implement each lens's `recommend()` function. Can stub with a
  mock AnalysisReport during development, but the type must be defined.
- **Work Stream 1 (Sub-Language Levels)**: needs the level types for
  `recommend()` to specify `blockModelCell` coordinates.

### Other streams that depend on this

- None -- this is the terminal stream. Once lenses are implemented, the
  system is functional end-to-end.

## Non-negotiable constraints

From the master plan:

1. **Implement the LensModule contract exactly.** Every lens must export
   `{ name, lens, config, recommend }` matching the types from Work
   Stream 3.
2. **Pure TS logic + thin React wrapper.** `lens.ts`, `config.ts`,
   `recommend.ts` are testable without React. `wrapper.tsx` is a thin
   shell.
3. **Three-tier classification enforced.** `recommend()` must gate on
   parse status according to the lens's tier. No exceptions.
4. **Lenses don't do infrastructure.** No toolbar rendering, no state
   management, no pipeline execution, no lens switching. All of that is
   the orchestrator's job.
5. **Self-describing via `recommend()`.** The recommender has no hardcoded
   knowledge of individual lenses. Each lens declares its own relevance.
6. **Deep freeze all return values** from pure TS functions.
7. **No barrel files.** Import directly from source files.
8. **One concept per file.** `lens.ts`, `config.ts`, `recommend.ts` are
   separate files, not combined.
9. **Per-instance isolation.** Multiple instances of the same lens on one
   page are independent.
10. **Web-standard syntax only.** Programs are valid code reusable outside
    the lens system. Lenses never change how the language works.

## Phase 0 checklist (from AGENTS.md)

Each lens needs its own Phase 0 DDD cycle. Start with the first lens you
build (suggested: blanks). Complete every step before Phase 1.

- [ ] **0.1 Establish ubiquitous language** -- For each lens, define:
  - The lens name (kebab-case, matches registry key)
  - What the exercise does (in domain terms, not implementation)
  - Which tier it belongs to and why
  - Which Block Model cells it occupies
  - Key config options and what they mean

- [ ] **0.2 Update README.md** -- for the lens directory. What the lens
  does, how learners interact with it, what pedagogical intervention it
  embodies, what it does NOT do (infrastructure).

- [ ] **0.3 AR-1 design challenge** -- Focus areas:
  - Does this lens's `recommend()` correctly self-describe its relevance?
  - Is the config shape right? Too many options? Too few?
  - Does the tier classification make sense for this lens?
  - Is the Block Model mapping correct?
  Provide: README, the LensModule contract (from Work Stream 3 types.ts),
  the AnalysisReport type (from Work Stream 2).

- [ ] **0.4 Update types.ts** -- lens-specific types (config shape,
  internal state, etc.).

- [ ] **0.5 Write DOCS.md architectural sketch** -- if the lens has
  non-obvious architecture (e.g., trace-table's split view + [check]
  button + tracer integration). Simple lenses may not need DOCS.md.

- [ ] **0.6 AR-2 sketch challenge** -- if DOCS.md was written.

- [ ] **0.7 Review & resolve**

  Commit: `docs: establish [lens-name] domain model and architectural sketch`

## Phase 1 increment plan

### Per-lens increment template

Each lens follows this increment sequence (adapt specifics per lens):

- [ ] **Increment 1**: `config.ts` -- config factory with defaults. Test:
  default config shape, override merging. ZOMBIES: no overrides, one
  override, invalid override.
- [ ] **Increment 2**: `recommend.ts` -- relevance function. Test: returns
  empty for wrong tier (e.g., Tier 2 lens with invalid parse status),
  returns recommendations for matching snippets, returns multiple configs
  for different complexity levels. ZOMBIES: empty analysis, minimal
  analysis, rich analysis.
- [ ] **Increment 3**: `lens.ts` -- pure TS lens logic. For blanks: token
  removal from AST. For parsons: line shuffling. For trace-table: table
  schema generation. Test the logic without React.
- [ ] **Increment 4**: `wrapper.tsx` -- React wrapper. Mount the lens in
  the orchestrator. Verify rendering.

  **Sandbox checkpoint**: Start dev server, navigate to a code block,
  switch to this lens via lens-switcher, exercise the interaction.

- [ ] **Increment 5**: Integration -- register in the registry, verify
  it appears in lens-switcher and free-explore, verify caching works
  (switch away and back, state preserved).

For each increment, follow the full TDD cycle from AGENTS.md:

1. JSDoc/TSDoc for the behavioral contract
2. Stub function with stub body
3. Placeholder types (tighten later)
4. Lint checkpoint: `npm run lint <new-file>`
5. Unit test (ZOMBIES order)
6. **AR-3**: Spawn reviewer to challenge test strategy
7. Lint checkpoint: `npm run lint <test-file>`
8. Implement (Fake It valid for first test)
9. Lint checkpoint: `npm run lint <impl-file>`
10. Refactor (check against DOCS.md sketch)
11. Lint checkpoint (final)
12. Update types
13. Self-review
14. **AR-4**: Spawn reviewer to audit implementation
15. Quality checks: `npm test && npm run lint && npm run type-check`
16. Verify docs match implementation
17. Atomic commit: `add: [behavior this increment implements]`

### Suggested lens build order

1. **blanks** -- exercises the full Tier 2 path (AST-dependent).
   Validates that `recommend()` correctly gates on parse status.
2. **parsons** -- exercises Tier 1 (text-only). Simplest lens to
   implement. Validates that Tier 1 lenses work with invalid parse.
3. **trace-table** -- exercises Tier 3 (dynamic) and multi-variant
   recommendations. Most complex lens. Validates tracer integration.
4. **copy-type** -- simple Tier 1 exercise.
5. **ask** -- complex Tier 2 exercise with the cognitive model.
6. **variables** -- Tier 2 with scope analysis.

Each lens is independent. Multiple agents can work on different lenses
in parallel after the first one proves the pattern.

## Phase 2 checklist

Run per-lens and also as a batch after all lenses are done:

- [ ] Run full quality checks: `npm test && npm run lint && npm run type-check`
- [ ] **AR-5 pre-merge review**: Spawn reviewer for the full changeset.
  Provide: full diff, modified files, this handoff document, DOCS.md files.
  Focus areas from AGENTS.md AR-5:
  - Cross-lens consistency (do all lenses follow the same patterns?)
  - Contract compliance (does every lens implement LensModule exactly?)
  - Tier classification correctness (does `recommend()` gate correctly?)
  - Documentation sync
  - Convention compliance
  - No infrastructure leakage (lenses doing orchestrator's job)
- [ ] Address PAUSE/CONSIDER items from AR-5
- [ ] Commit prompt

## Verification

### How to test end-to-end (per lens)

1. **Unit tests**: `npm test` -- all lens tests green (config, recommend,
   lens logic)
2. **Type checking**: `npm run type-check` -- no errors
3. **Lint**: `npm run lint` -- clean
4. **Dev server smoke test** (Sandbox checkpoint):
   - Start `npm run start`
   - Navigate to a code block
   - Switch to this lens via lens-switcher
   - Exercise the interaction specific to this lens:
     - blanks: verify tokens are blanked, fill in answers, check feedback
     - parsons: verify lines are shuffled, drag to reorder, check order
     - trace-table: verify table renders, fill in predictions, click check
     - copy-type: verify code shows, hides, type from memory, compare
   - Switch to another lens and back: verify state preserved (caching)
   - Try with a syntax-error snippet: verify Tier 2/3 lenses are not
     available in recommender, Tier 1 lenses still work
5. **Recommender test**: Open the recommender panel. Verify this lens
   appears at the correct Block Model cells with appropriate configs.

### What success looks like

A learner visiting a code block sees the editor (default). They click the
lens-switcher and see all registered lenses. They select blanks and get a
fill-in-the-blank exercise configured for that snippet's complexity. They
switch to trace-table and get a prediction exercise. They open the
recommender and see suggestions organized by comprehension level and scope.
Each exercise works independently, state is preserved via caching, and
the experience matches the pedagogical intent.
