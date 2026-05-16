# Work Stream 4: Lens Migration

## Prerequisites

Before starting, read these files in full (do not skim):

- **AGENTS.md** (repo root):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/AGENTS.md`
- **DEV.md** (repo root):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/DEV.md`
- **Master plan**: `./00-master-plan.md` (in this directory)
- **Orchestrator contracts** (Work Stream 3 output -- the LensModule interface
  each lens must implement): Read `lenses/types.ts` (canonical post-F1; live on
  `main`).
- **Orchestrator DOCS.md** (Work Stream 3 output -- how the orchestrator renders
  lenses): Read [`../orchestrate/DOCS.md`](../orchestrate/DOCS.md) — the
  authoritative consumer-side contract.
- **Notional machine** (for understanding what NM components each lens
  exercises):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/just-enough/javascript/notional-machine.md`
- **Embodiment type** (canonical input to `recommend()` — the frozen `Snippet`
  produced by `embody()`):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/just-enough/javascript/embody/types.ts`

**Prior art locations** (read the specific source files for each lens you
migrate -- listed in the Prior Art section below).

## Context

### What this work stream does

This work stream implements individual lenses against the `LensModule` contract
defined by Work Stream 3. Each lens is a self-contained exercise renderer that
plugs into the orchestrator.

This work is **parallelizable** -- with the orchestrator's `<StudyLenses>`
**three-prop API** stable on `main` (F1: commits `bd98648`–`abe70bb`,
2026-05-06..07; B: commits `8cec361`–`838ba35`, 2026-05-07..11, including the
mid-flight reshape `df6a0e7`), lenses can be built independently against the
`LensModule` contract by separate agents. Note: `editor` is **not a lens** in
the post-refactor architecture — it lives at `orchestrate/editor/` as the
orchestrator's home base (single React component per F1.C / AR-1 CP-1; see
[`../orchestrate/editor/README.md`](../orchestrate/editor/README.md) and
[`../lenses/README.md`](../lenses/README.md)). The editor's CodeMirror 6
implementation is migrated by WS3, not by this work stream.

### Why it matters

Lenses ARE the study experience. Each lens embodies a specific pedagogical
intervention grounded in Computing Education Research. The orchestrator is the
infrastructure; lenses are the content. Without lenses, the system renders only
a code editor.

### The LensModule contract

Every lens's default export satisfies this interface. **The canonical contract
lives in [`../lenses/types.ts`](../lenses/types.ts)**; this section is a working
sketch — when the two disagree, the canonical type wins.

```ts
type LensModule = Readonly<{
	name: string;
	Component: ComponentType<LensProps>; // React component reference
	config: (overrides?: Partial<LensConfig>) => LensConfig;
	applicableTo: (embodiment: Snippet) => boolean; // cheap O(1) gate
	recommend: (embodiment: Snippet) => ReadonlyArray<Recommendation>;
}>;

type LensProps = Readonly<{
	embodiment: Snippet;
	config?: LensConfig;
}>;
```

- `name` — registry key (kebab-case, e.g., `"blanks"`, `"trace-table"`).
- `Component` — React component reference. Receives `LensProps` (`embodiment` +
  optional `config`) via props. The orchestrator handles mounting/unmounting;
  React reconciles. Two-layer shape: pure TS core (`core.ts`) + light React
  wrapper (`index.tsx`).
- `config()` — factory returning default config, optionally merged with
  overrides. The lens renders its own config panel.
- `applicableTo(embodiment)` — fast pure boolean. Returns true if this lens can
  do anything useful with this embodiment. The recommender's
  applicability-filter pass calls this BEFORE the more expensive `recommend()`.
  See § Three-tier classification below for the standard status-boolean gates.
- `recommend(embodiment)` — receives the **frozen `embodiment`** (a `Snippet`
  instance from `embody()`). Returns zero or more Recommendations.
  Self-describes the lens's snippet-fit relevance. Runs only on
  already-applicable lenses (the recommender filters via `applicableTo` first).
  Snippet-fit only — no learner state (the embedding LMS handles ZPD via snippet
  choice). See
  [`../DOCS.md` § Recommender = Applicability filter + Ranking engine](../DOCS.md#recommender--applicability-filter--ranking-engine).

### The Recommendation type

Each lens's `recommend()` returns `Recommendation[]`. The canonical type lives
in [`../lenses/types.ts`](../lenses/types.ts):

```text
Recommendation = {
  lens: string                    // registry key
  config: LensConfig
  relevance: number               // 0-1 score
  blockModelCell: { level, scope, nmComponents? }
  label: string
}
```

The previous design had a `transforms?: string[]` "pipeline prefix" field; it
was dropped along with the transforms tier. Lenses that want text transforms
(e.g., pseudocode→JS for parsons) handle it internally.

A single lens can suggest multiple versions of itself at different Block Model
cells with different configs. For example, the blanks lens might return:

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

Each lens falls into one of three tiers. This determines when the lens can be
recommended:

**Tier 1: Text-only static** -- Works on raw text, no parse needed. Always
available, even with syntax errors.

| Lens      | What it does                           | Tier reason          |
| --------- | -------------------------------------- | -------------------- |
| parsons   | Line shuffling (drag-and-drop reorder) | Only needs line text |
| highlight | Read-only annotated code view          | Renders text as-is   |
| copy-type | Write-from-memory exercise             | Only needs raw text  |

**Tier 2: AST-dependent static** -- Needs valid parse, no execution.

| Lens      | What it does                      | Tier reason                     |
| --------- | --------------------------------- | ------------------------------- |
| blanks    | Fill-in-the-blank (token removal) | Needs AST to identify tokens    |
| variables | Scope analysis visualization      | Needs AST for scope analysis    |
| ask       | Question generation               | Needs AST for feature detection |

**Tier 3: Dynamic** -- Needs valid parse AND execution.

| Lens                    | What it does                   | Tier reason             |
| ----------------------- | ------------------------------ | ----------------------- |
| trace-table (steps)     | Manual trace: execution steps  | Needs tracer execution  |
| trace-table (values)    | Manual trace: variable values  | Needs tracer execution  |
| trace-table (operators) | Manual trace: operator results | Needs tracer execution  |
| run                     | Execute and observe            | Needs runtime execution |

**Gating happens in `applicableTo`**, not in `recommend`. The recommender
filters via `applicableTo` first, then calls `recommend` only on applicable
lenses. The status-boolean rules per tier (see
[`../embody/types.ts`](../embody/types.ts) for the canonical `Status` shape):

- **Tier 1**: `applicableTo(_) => true` — always applicable.
- **Tier 2**: `applicableTo(embodiment) => embodiment.status.parsed`.
- **Tier 3**: `applicableTo(embodiment) => embodiment.status.created`.

The status chain is monotonic by construction: `created` implies `parsed`
implies `tokenized`. Lens-author logic only checks the field it cares about. The
canonical home for this contract is
[`../lenses/README.md` § Three-tier classification](../lenses/README.md#three-tier-classification)
— this handoff documents the per-lens tier assignments; the contract itself
lives there.

### Lens file structure

Each lens lives in its own directory under `lenses/` (per
[`../lenses/README.md` § How to add a lens](../lenses/README.md#how-to-add-a-lens)):

```text
lenses/
  blanks/
    index.tsx            -- default export — LensModule with React Component
    core.ts              -- pure TS core (display derivation, validation)
    config.ts            -- config factory
    applicable.ts        -- applicableTo() (cheap status-boolean gate)
    recommend.ts         -- recommend() (relevance computation)
    types.ts             -- lens-specific types
    README.md            -- what this lens does
    DOCS.md              -- architectural sketch (if non-obvious)
    tests/
      core.test.ts
      config.test.ts
      applicable.test.ts
      recommend.test.ts
      component.test.tsx -- vitest + jsdom + @testing-library/react
```

The pure TS files (`core.ts`, `config.ts`, `applicable.ts`, `recommend.ts`) are
testable without React. The React wrapper (`index.tsx`) is a thin shell.

### Editor placement + highlight status

**The editor is not a lens.** Post-refactor it lives at `orchestrate/editor/` as
the orchestrator's home base — single React component, the only writer of
snippet state — per F1.C (commit `0d99212`). See
[`../orchestrate/editor/README.md`](../orchestrate/editor/README.md) and
[`../lenses/README.md`](../lenses/README.md). The CodeMirror 6 implementation is
migrated by WS3 (Inc 15+ per `../orchestrate/editor/DOCS.md` § Future
direction); this work stream does not touch it.

**The `highlight` lens exists as docs-only end-state.** Per the C cleanup commit
(`abe70bb`), the legacy LensModule stub at `lenses/highlight/highlight.ts` was
deleted along with its tests; the rewritten `lenses/highlight/{README,DOCS}.md`
describe the post-refactor end-state (LensModule with `Component` +
`applicableTo` + `recommend` against the `LensProps` contract). Source landing —
the actual React component + pure-TS core — is WS4's first concrete migration
and is on this work stream's backlog. You DO need to build it; the docs already
specify the target shape.

### Lens design patterns

Patterns that recur across multiple lenses. Apply them as you migrate.

**Multi-variant lens (one lens, multiple Block-model cells).**

A single lens can suggest multiple versions of itself at different Block Model
cells with different configs. The recommender doesn't know lens internals — each
lens is self-describing via its `recommend()` function, which can return
multiple recommendations keyed to different configs.

The trace-table lens is the canonical example. Three variants of the same lens,
each zeroing in on a different NM aspect:

- **Steps table** — which lines execute in which order. Present when the snippet
  has sequential execution.
- **Values table** — what values variables hold after each step. Present when
  the snippet has multiple variable assignments.
- **Operators table** — what each operator produces. Present when the snippet
  has complex expressions.
- **(Future) Control-flow table** — present when the snippet has branches/loops.
- **(Future) Function-call table** — present when the snippet has function calls
  (out of scope for JEJ but on the radar for sibling language levels).

Each variant is a different config of the trace-table lens. The lens's
`recommend(embodiment)` function inspects the embodiment's features and returns
one Recommendation per applicable variant, each with a different config and a
different Block-model cell mapping.

The same pattern applies to other lenses:

- `blanks` may suggest variants for keywords vs. identifiers vs. operators
  (different `tokenTypes` configs).
- `highlight` may suggest variants for control-flow highlighting vs. scope-chain
  highlighting vs. coercion-points highlighting.
- A future `flowchart` lens may suggest pretty-print variants (sequential vs.
  branched vs. compact).

**Predict-then-compare flow.** Many lenses (especially trace-table) follow this
shape: learner fills a prediction → clicks [check] → the lens runs the JEJ
evaluator (via embodiment's `streams.evaluate.*`) → validates the prediction
against ground truth → renders feedback. Reusable across any lens that has a
verifiable answer.

**Tier-gated availability.** Lenses declare their tier (text-only,
AST-dependent, dynamic) — see § Three-tier lens classification above. The
recommender uses tier + embodiment status booleans to gate availability:
AST-dependent lenses return zero recommendations when `status.parsed` is false;
dynamic lenses return zero when `status.created` is false.

### Lenses to migrate from prior art

These lenses have prior implementations in the codebase. Each entry lists the
prior art location, what to extract, and the tier classification.

**blanks** (Tier 2: AST-dependent static)

- Prior art:
  `0-study-lenses-committee/zz--oldd-clauding-and-context-dump/0--study-lenses--it-begins/src/`
  (old React app, look for blanks lens component)
- Also:
  `0-study-lenses-committee/zz--study-lenses-package--2025-try/study-lenses-wc-kit/`
  (WC kit version)
- What: fill-in-the-blank exercise. Removes tokens from code (configurable:
  keywords, identifiers, operators, literals). Learner types missing tokens.
  Difficulty levels map to which token types are blanked.
- Config: `{ difficulty: number, tokenTypes: string[] }`
- Block Model mapping: text surface level, atoms-to-blocks scope
- `applicableTo`: `embodiment.status.parsed` (Tier 2). `recommend()`: higher
  relevance for shorter snippets. Different configs at different difficulty
  levels = multiple recommendations.

**parsons** (Tier 1: Text-only static)

- Prior art: same old React app (look for parsons lens component)
- What: drag-and-drop line reordering. Shuffles code lines, learner puts them
  back in order. Works best with 8-15 lines.
- Config: `{ includeDistractors: boolean }`
- Block Model mapping: text surface level, relations scope (line ordering
  implies understanding of sequence)
- `applicableTo`: always `true` (Tier 1). `recommend()`: relevance peaks at 8-15
  lines, drops for very short or very long snippets.

**trace-table** (Tier 3: Dynamic) -- Multiple variants

- Prior art:
  `0---the-big-idea/00--evancole-be/0--snippetry/dump/00-claude-refactoring/0--study-lenses--it-begins/sandbox/src/utils`
  (trace table web components: values/steps/operators, Shadow DOM)
- Also: existing JEJ tracer in `embody/lib/evaluating/`
- What: split view: code display + manual trace table + [check] button. Learner
  fills the table as a prediction exercise. Clicks [check], the lens runs the
  JeJ tracer on the snippet and validates guesses.
- Three variants (different configs of the same lens):
  - **steps**: which lines execute in which order
  - **values**: what values variables hold after each step
  - **operators**: what each operator produces
- Config: `{ variant: 'steps' | 'values' | 'operators', columns: string[] }`
- Block Model mapping: execution level; steps=blocks scope, values=atoms scope,
  operators=atoms scope
- `applicableTo`: `embodiment.status.created` (Tier 3 — needs evaluable
  script-scope). `recommend()`: steps variant relevant when code has sequential
  execution; values variant when multiple variable assignments; operators
  variant when complex expressions. Each variant is a separate recommendation.

**copy-type** (Tier 1: Text-only static)

- Prior art: old React app (writeme component)
- What: code is shown, then hidden. Learner types it from memory. Compares
  against original.
- Config: `{ displayTime: number }`
- Block Model mapping: text surface level, macro scope (must understand whole
  snippet)
- `applicableTo`: always `true` (Tier 1). `recommend()`: higher relevance for
  shorter snippets (memorizable).

**ask** (Tier 2: AST-dependent static)

- Prior art: `0--study-lenses--it-begins/dist/static/ask/component/` (5-level
  cognitive model x language features)
- What: generates comprehension questions based on code features. 5 cognitive
  levels (code -> how it works -> connections -> goals -> UX). Configurable by
  language features (variables, data, operators, control flow).
- Config: `{ cognitiveLevel: number, features: string[] }`
- Block Model mapping: function/purpose level, variable scope
- `applicableTo`: `embodiment.status.parsed` (Tier 2). `recommend()`: relevance
  depends on which NM components are present (more components = more questions
  possible = higher relevance at higher cognitive levels).

**variables** (Tier 2: AST-dependent static)

- Prior art: old React app (variables/scope lens)
- What: scope analysis visualization. Shows which variables are declared in
  which scope, scope chain lookup paths.
- Config: `{ showScopeChain: boolean }`
- Block Model mapping: execution level, relations scope
- `applicableTo`: `embodiment.status.parsed` (Tier 2). `recommend()`: relevant
  when code has multiple scopes (if/else blocks, loops). Low relevance for
  single-scope code.

### Prior art base paths

These are the base directories to search for prior implementations. All paths
are relative to `/Users/master/Documents/0-teach-code/0-spiralearn/`:

```text
0-study-lenses-committee/zz--oldd-clauding-and-context-dump/
  0--study-lenses--it-begins/src/
    -> Old React app with 24+ lens implementations.
    -> LensMenu dropdown, LensModal popup, StudyBar toolbar.
    -> URL-based config. CodeMirror 6. noPasteExtension.

0-study-lenses-committee/zz--oldd-clauding-and-context-dump/
  0--study-lenses--it-begins/sandbox/src/utils/
    -> Trace table web components (values/steps/operators, Shadow DOM).
    -> Loop guards (AST transform). Code execution sandbox.

0-study-lenses-committee/zz--oldd-clauding-and-context-dump/
  0--study-lenses--it-begins/dist/static/ask/component/
    -> Ask component: 5-level cognitive model
       (code → how it works → connections → goals → UX)
       × language features (variables, data, operators, control flow,
       functions). Configurable AST-based question generation.

0-study-lenses-committee/zz--oldd-clauding-and-context-dump/
  Explorotron/
    -> 11 lenses mapped to PRIMM stages.
    -> Study tours (.study-tour JSON).
    -> Recommendation engine (heuristic scoring).
    -> Argument picker, comment slots, pseudo lens.

0-study-lenses-committee/zz--study-lenses-package--2025-try/
  study-lenses-wc-kit/
    -> WC kit (2025): LensObject pattern { name, lens, config, register }.
    -> Pipeline: pipeLenses(). Registry: load().
```

Additional reference (in the live package):

```text
src/lib/just-enough/javascript/
  embody/lib/evaluating/.old-notes-for-reference-and-inspiration/
    -> tracer.md, tracer.architecture.md, tracer.walkthroughs.md,
       open-questions.md (relocated for historical reference)
```

### What's decided

- Lenses are pure exercise renderers (no toolbar, no state management, no piping
  -- all infrastructure handled by orchestrator)
- Each lens colocates pure TS logic with its React wrapper
- Lenses are self-describing via `recommend()`
- The three-tier classification gates recommendations on parse status
- Multiple variants of the same lens (e.g., trace-table) are different configs,
  not different lenses

### What's still open

- Exact config shapes for each lens (defined during each lens's DDD)
- Trace table UX details (split view proportions, [check] button flow,
  comparison display)
- Whether composed lenses (e.g., pseudocode-parsons = translate + parsons) are
  separate LensModule implementations or handled by the recommender's pipeline
  composition
- Which lens to build FIRST after the trial lenses (suggested: blanks, as it
  exercises the full Tier 2 path)

## Dependencies

### This stream depends on

- **Work Stream 3 (Orchestrator + Contracts)**: MUST be complete (at least
  through the trial lenses proving the contract) before this stream starts
  Phase 1. The `LensModule` type, registry, and orchestrator must be working
  end-to-end.
- **Work Stream 2 (Analysis + Recommender)**: each lens's
  `recommend(embodiment)` reads from the frozen `Snippet` directly
  (`embodiment.parse.ast`, `embodiment.status.*`). Analysis is an internal
  helper inside `orchestrate/lib/recommender/`, not a separate hand-off type —
  there is no `AnalysisReport` for lenses to consume. WS2's shape only matters
  for the recommender entry point, not for individual lens `recommend()`
  functions.
- **Work Stream 1 (`01-NM-components.md`)**: supplies the 3rd Block Model
  dimension — the syntax tracer's `StepCategory` enum at
  `embody/lib/evaluating/trace/syntax/types.ts`. A lens's `recommend()` uses
  category names (as strings) in its `blockModelCell.nmComponents` array. A lens
  may tag MULTIPLE categories per recommendation.

### Other streams that depend on this

- None -- this is the terminal stream. Once lenses are implemented, the system
  is functional end-to-end.

## Non-negotiable constraints

From the master plan + canonical contract at
[`../lenses/types.ts`](../lenses/types.ts):

1. **Implement the LensModule contract exactly.** Every lens must export
   `{ name, Component, config, applicableTo, recommend }` matching `LensModule`
   from `lenses/types.ts`. `Component` is a React component reference (not a
   function returning one).
2. **Pure TS core + thin React wrapper.** `core.ts`, `config.ts`,
   `applicable.ts`, `recommend.ts` are testable without React. `index.tsx` is a
   thin React shell.
3. **Three-tier classification enforced via `applicableTo`.**
   `applicableTo(embodiment)` gates on `embodiment.status.{parsed,created}` per
   the lens's tier (see § Three-tier classification above and
   [`../lenses/README.md`](../lenses/README.md)). No exceptions.
4. **Lenses don't do infrastructure.** No toolbar rendering, no state
   management, no pipeline execution, no lens switching. All of that is the
   orchestrator's job.
5. **Self-describing via `applicableTo` + `recommend`.** The recommender has no
   hardcoded knowledge of individual lenses. Each lens declares its own
   applicability (cheap O(1)) and relevance.
6. **Disposable practice.** Lens-internal UI state is per-mount only — when the
   snippet changes, React unmounts; in-progress UI state is gone. No
   `localStorage`, no cross-mount refs. Per
   [`../DOCS.md` § Lenses are stateful "mini web apps"](../DOCS.md).
7. **Deep freeze all return values** from pure TS functions.
8. **No barrel files.** Import directly from source files.
9. **One concept per file.** `core.ts`, `config.ts`, `applicable.ts`,
   `recommend.ts` are separate files, not combined.
10. **Per-instance isolation.** Multiple instances of the same lens on one page
    are independent.
11. **Web-standard syntax only.** Programs are valid code reusable outside the
    lens system. Lenses never change how the language works.

## Phase 0 checklist (from AGENTS.md)

Each lens needs its own Phase 0 DDD cycle. Start with the first lens you build
(suggested: blanks). Complete every step before Phase 1.

- [ ] **0.1 Establish ubiquitous language** -- For each lens, define:
  - The lens name (kebab-case, matches registry key)
  - What the exercise does (in domain terms, not implementation)
  - Which tier it belongs to and why
  - Which Block Model cells it occupies
  - Key config options and what they mean

- [ ] **0.2 Update README.md** -- for the lens directory. What the lens does,
      how learners interact with it, what pedagogical intervention it embodies,
      what it does NOT do (infrastructure).

- [ ] **0.3 AR-1 design challenge** -- Focus areas:
  - Does this lens's `applicableTo` correctly gate by status booleans for its
    tier?
  - Does this lens's `recommend()` correctly self-describe its relevance (only
    meaningful for already-applicable embodiments)?
  - Is the config shape right? Too many options? Too few?
  - Does the tier classification make sense for this lens?
  - Is the Block Model mapping correct? Provide: README, the LensModule contract
    (from `lenses/types.ts`), the `Snippet` type (from `embody/types.ts`).

- [ ] **0.4 Update types.ts** -- lens-specific types (config shape, internal
      state, etc.).

- [ ] **0.5 Write DOCS.md architectural sketch** -- if the lens has non-obvious
      architecture (e.g., trace-table's split view + [check] button + tracer
      integration). Simple lenses may not need DOCS.md.

- [ ] **0.6 AR-2 sketch challenge** -- if DOCS.md was written.

- [ ] **0.7 Review & resolve**

  Commit: `docs: establish [lens-name] domain model and architectural sketch`

## Phase 1 increment plan

### Per-lens increment template

Each lens follows this increment sequence (adapt specifics per lens):

- [ ] **Increment 1**: `config.ts` -- config factory with defaults. Test:
      default config shape, override merging. ZOMBIES: no overrides, one
      override, invalid override.
- [ ] **Increment 2**: `applicable.ts` -- `applicableTo(embodiment)` cheap O(1)
      gate. Test: Tier 1 always true; Tier 2 returns `embodiment.status.parsed`;
      Tier 3 returns `embodiment.status.created`. ZOMBIES: minimal embodiment
      (tokens-only), parsed embodiment (AST present), created embodiment
      (script-scope ready).
- [ ] **Increment 3**: `recommend.ts` -- relevance function (assumes the lens is
      already applicable). Test: returns recommendations for matching snippets,
      returns multiple configs for different complexity levels. ZOMBIES:
      minimal-applicable embodiment, rich embodiment with many features.
- [ ] **Increment 4**: `core.ts` -- pure TS lens logic. For blanks: token
      removal from AST. For parsons: line shuffling. For trace-table: table
      schema generation. Test the logic without React.
- [ ] **Increment 5**: `index.tsx` -- React wrapper exporting the lens's
      `Component` field. Mount the lens in the orchestrator. Verify rendering.

  **Sandbox checkpoint**: Start dev server, navigate to a code block, switch to
  this lens via lens-switcher, exercise the interaction.

- [ ] **Increment 6**: Integration -- register in the registry, verify it
      appears in lens-switcher and free-explore, verify the lens unmounts
      cleanly on snippet change and remounts fresh (per disposable-practice
      contract; in-progress UI state is intentionally NOT preserved across
      remounts).

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

0. **highlight** -- position 0 per the C cleanup decision (`abe70bb`): the
   legacy stub was deleted; docs-only end-state at
   `lenses/highlight/{README,DOCS}.md` already specifies the target shape (Tier
   1 LensModule with `Component` rendering colorized `<pre><code>`). WS4's first
   concrete migration is bringing source back against the `LensProps` contract.
1. **blanks** -- exercises the full Tier 2 path (AST-dependent). Validates that
   `applicableTo` correctly gates on `status.parsed`.
2. **parsons** -- exercises Tier 1 (text-only). Simplest lens to implement.
   Validates that Tier 1 lenses work with invalid parse.
3. **trace-table** -- exercises Tier 3 (dynamic) and multi-variant
   recommendations. Most complex lens. Validates tracer integration.
4. **copy-type** -- simple Tier 1 exercise.
5. **ask** -- complex Tier 2 exercise with the cognitive model.
6. **variables** -- Tier 2 with scope analysis.

Each lens is independent. Multiple agents can work on different lenses in
parallel after the first one proves the pattern.

## Phase 2 checklist

Run per-lens and also as a batch after all lenses are done:

- [ ] Run full quality checks: `npm test && npm run lint && npm run type-check`
- [ ] **AR-5 pre-merge review**: Spawn reviewer for the full changeset. Provide:
      full diff, modified files, this handoff document, DOCS.md files. Focus
      areas from AGENTS.md AR-5:
  - Cross-lens consistency (do all lenses follow the same patterns?)
  - Contract compliance (does every lens implement LensModule exactly?)
  - Tier classification correctness (does `applicableTo` gate correctly?)
  - Documentation sync
  - Convention compliance
  - No infrastructure leakage (lenses doing orchestrator's job)
  - Disposable practice (no cross-mount state preservation)
- [ ] Address PAUSE/CONSIDER items from AR-5
- [ ] Commit prompt

## Verification

### How to test end-to-end (per lens)

1. **Unit tests**: `npm test` -- all lens tests green (core, config, applicable,
   recommend)
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
   - Edit the snippet, then return to this lens: verify the lens remounts fresh
     (no preserved in-progress UI state — this is the disposable-practice
     contract, not a regression)
   - Try with a syntax-error snippet: verify Tier 2/3 lenses are not available
     in recommender (`applicableTo` returns false), Tier 1 lenses still work
5. **Recommender test**: Open the recommender panel. Verify this lens appears at
   the correct Block Model cells with appropriate configs.

### What success looks like

A learner visiting a code block sees the editor (default). They click the
lens-switcher and see all registered lenses. They select blanks and get a
fill-in-the-blank exercise configured for that snippet's complexity. They switch
to trace-table and get a prediction exercise. They open the recommender and see
suggestions organized by comprehension level and scope. Each exercise works
independently. When the learner edits the snippet, lenses remount fresh —
in-progress UI state is intentionally disposable, per the locked architecture.

## Streams primer for lens authors

Lenses that run code (predict-then-compare, run, trace-table) call into
`embodiment.streams.evaluate.*`. Quick reference (canonical at
[`../embody/types.ts`](../embody/types.ts)):

| Surface                                   | Returns                | When to use                                 |
| ----------------------------------------- | ---------------------- | ------------------------------------------- |
| `streams.evaluate.run(opts?)`             | `Promise<RunInstance>` | Just-want-the-final-result; no event stream |
| `streams.evaluate.intercept(opts?)`       | `EvaluateHandle`       | Async iteration over IO + final state       |
| `streams.evaluate.trace.syntax(opts?)`    | `EvaluateHandle`       | Step-by-step syntax-tracer events           |
| `streams.evaluate.trace.semantics(opts?)` | `EvaluateHandle`       | Finer-grained semantic events               |

`EvaluateOptions` (per `embody/types.ts:725-738`) carries:

- `seconds` — execution timeout
- `iterations` — loop-iteration cap (the JEJ loop guard)
- `io: IoMocks` — pinned mock responses for `prompt` / `confirm` / `alert` /
  `console.*`. Use these for predict-then-compare flows so every learner sees
  the same ground truth regardless of what the live IO would do.

`EvaluateHandle` is an async iterable plus `.result` (the final `RunInstance`).
Tier-filter whitelists at `embody/types.ts:672-680` document which event
categories each tier emits — useful when a lens only wants `emit` events (an
output-focused lens) or only `control-flow` events (a branching-focused lens).

The predict-then-compare flow:

1. Learner fills a prediction in the lens UI.
2. Learner clicks [check].
3. Lens calls `embodiment.streams.evaluate.run({ io: pinnedMocks })` (or
   `.trace.syntax()` for step-level prediction lenses).
4. Lens compares the result to the prediction.
5. Lens renders feedback.

The pinned `IoMocks` are the lens's responsibility — choose values that exercise
the pedagogical intent of the lens (e.g. trace-table values variant pins
`prompt` returns so the learner can predict the value deterministically).
