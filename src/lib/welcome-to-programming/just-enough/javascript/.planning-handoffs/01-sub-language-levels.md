# Work Stream 1: Sub-Language Level Progression

## Prerequisites

Before starting, read these files in full (do not skim):

- **AGENTS.md** (repo root):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/AGENTS.md`
- **DEV.md** (repo root):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/DEV.md`
- **Master plan**:
  `./00-master-plan.md` (in this directory)
- **Notional machine** (the source of truth for NM components):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/notional-machine.md`
- **JEJ reference** (the complete language scope):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/reference.md`
- **Tracer docs** (how NM components map to tracer config/events):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/tracer.md`
- **JEJ README** (module overview):
  `/Users/master/Documents/0-teach-code/0-tbd-met-alums/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/README.md`

## Context

### What this work stream does

This work stream defines the **JEJ sub-language level progression** -- the
third dimension of the Block Model space used by the recommendation system.

The Block Model of Program Comprehension (Schulte 2008) describes understanding
across two dimensions:

1. **Level**: text surface, program execution, function/purpose
2. **Scope**: atoms, blocks, relations, macro

This work stream adds the third dimension:

3. **NM components**: which notional machine components appear in a snippet

Sub-language levels are ordered groups of NM components. Each level adds
language features to the ones below. A snippet's sub-language level is
determined by which NM components it uses -- the snippet analysis module
(Work Stream 2) detects this automatically.

### Why it matters

The sub-language level enables the spiral curriculum. The same lens (e.g.,
blanks) can appear at multiple levels with different configs. At level 1,
blanks might blank out keywords; at level 3, it blanks operators. This IS
the spiral -- revisiting the same comprehension activity with increasing
feature scope.

### How it fits in the architecture

The sub-language levels are:

- **Consumed by** the snippet analysis module (Work Stream 2), which detects
  which NM components a code snippet uses and maps that to a level
- **Consumed by** each lens's `recommend()` function, which uses the level to
  decide what configs to suggest
- **Consumed by** the recommender (Work Stream 2), which organizes
  recommendations into a 3D Block Model grid (level x scope x NM components)

The output of this work stream is **documentation and types only** -- no
runtime code. It defines the level progression as a data structure that
the analysis and recommender modules consume.

### What the NM components are

From `notional-machine.md`, the JEJ notional machine has these components:

**Visual-syntax level** (what the code looks like):
- **Expressions** -- syntax that produces values (operators, literals,
  identifiers, calls, templates, property access, assignment)
- **Statements** -- syntax that controls flow (declarations, if/else, while,
  for, for-of, break, continue)

**Behind-the-scenes level** (what the VM does):
- **Values** -- primitive data (string, number, bigint, boolean, null,
  undefined)
- **Bindings** -- named memory slots (declare, initialize, available, access,
  update lifecycle)
- **Scopes** -- containers for bindings forming a chain (script, block, global)
- **Coercion** -- implicit type transformations
- **Resolve** -- the moment an expression produces a value (bridges visual
  and behind-the-scenes)

**Cross-cutting**:
- **Errors** -- abnormal termination (ReferenceError, TypeError, RangeError)

**External channels**:
- **I/O Channels** -- Developer Console (console.*) and User Interface
  (alert/confirm/prompt)

### Example level progression (to be refined during DDD)

This is a starting point, grounded in NM component groups. DDD Phase 0 will
establish the actual progression:

- **Level 1**: Values (primitives) + Bindings (declare, initialize) +
  Expressions (literals, identifiers) + Resolve (literal, variable)
- **Level 2**: Expressions (operators) + Coercion + Resolve (operator)
- **Level 3**: Statements (if/else) + Scopes (block scope) +
  Expressions (comparison, logical)
- **Level 4**: Statements (loops: while, for, for-of) + Bindings (update
  lifecycle) + Statements (break, continue)
- **Level 5**: I/O Channels (console, prompt/alert/confirm) +
  Expressions (function calls) + Resolve (call)
- **Level 6**: Property access (String/Number methods) + Prototype chain
  lookup + Global environment (Math, Date, etc.)

Each level is additive -- level N includes all components from levels 1
through N-1.

### How levels connect to the tracer config

The JEJ tracer has semantic layers and gating config that correspond to NM
components. Read `tracer.md` carefully for:

- The 5 semantic layers (values, bindings, expressions, statements, scopes)
- How tracer config gates control which events fire
- How the gate names map to NM component names

The sub-language levels should align with tracer config profiles -- a level N
tracer config enables exactly the gates needed for NM components at that level.
This is how trace-table lenses know which columns to show.

### What the output artifact should be

The deliverable is:

1. **Documentation** in `/just-enough/javascript/` describing the level
   progression with rationale for each level's component grouping
2. **A TypeScript type** (`SubLanguageLevel` or similar) in a `types.ts` that
   the analysis and recommender modules import
3. **A data structure** mapping each level to its NM component set, consumable
   by the analysis module's feature detection

### What's decided

- Levels are based on NM components, NOT syntax features. "Level 2 has
  operators" means level 2 introduces the Expressions (operators) component
  and the Coercion component, not "level 2 has the `+` token."
- Levels are additive (cumulative) -- each level includes all prior levels
- A snippet's level is determined by the highest-level NM component it uses
- The level progression integrates with the existing tracer semantic layer
  model

### What's still open

- Exact number of levels (the example above shows 6, but DDD may refine)
- Whether some NM components should be split across multiple levels (e.g.,
  should `for` loops and `while` loops be the same level?)
- How to handle snippets that span multiple levels (e.g., a snippet using
  both level 2 and level 5 features but not level 3-4)
- Whether the global environment (Math, Date, etc.) is one level or split
  by register

## Dependencies

### This stream depends on

- Nothing -- this is the first stream that can start independently

### Other streams that depend on this

- **Work Stream 2 (Analysis + Recommender)**: needs the level definitions to
  detect snippet levels and organize recommendations into the 3D grid
- **Work Stream 4 (Lens Migration)**: needs the levels to implement each
  lens's `recommend()` function with level-aware config suggestions

## Non-negotiable constraints

From the master plan:

1. **Levels are NM-component-based, not syntax-based.** The components from
   `notional-machine.md` are the vocabulary. Do not invent a parallel
   taxonomy based on syntax tokens.
2. **Levels are additive.** Level N always includes levels 1 through N-1.
3. **Align with tracer semantic layers.** The existing tracer has a 5-layer
   model. Sub-language levels should map cleanly onto tracer config profiles.
4. **Pure documentation + types.** This stream produces no runtime code --
   only documentation, types, and a data structure consumed by downstream
   modules.
5. **Use the ubiquitous language from notional-machine.md.** Terms like
   "binding", "scope", "resolve", "coercion" have precise definitions there.
   Do not introduce synonyms.

## Phase 0 checklist (from AGENTS.md)

Complete every step in order. Do not skip any step. Do not start Phase 1
until all 7 steps are done.

- [ ] **0.1 Establish ubiquitous language** -- Identify the domain vocabulary
  for this module. Key terms to define precisely:
  - Sub-language level (what it is, what it is not)
  - NM component (how it maps to notional-machine.md components)
  - Level progression (additive, cumulative)
  - Component group (how components cluster into levels)
  - Snippet level (how a snippet's level is determined)
  - Level profile (the set of tracer config gates for a level)
  Watch for synonyms: "level" vs "tier" vs "stage" -- pick one and use it
  everywhere. Watch for homonyms: "level" in Block Model (text/execution/
  function) vs "level" in sub-language levels -- different concepts, must be
  disambiguated.

- [ ] **0.2 Update README.md** -- Write/update a README for the sub-language
  levels documentation. Using the ubiquitous language from step 0.1, describe:
  what this module does, where it fits, what it owns, what lies outside its
  boundary. The README is the domain model in prose.

- [ ] **0.3 AR-1 design challenge** -- Spawn a separate reviewer agent to
  challenge the README spec. Focus areas from AGENTS.md AR-1:
  - Does the language align with `notional-machine.md`? Any collisions?
  - Are context boundaries correct -- is this doing too much or too little?
  - Are there simpler alternatives?
  - What edge cases are missing? (multi-level snippets, empty snippets)
  - What decisions will be hard to change later?
  Provide the reviewer: README updates, notional-machine.md, tracer.md.
  Address PAUSE/CONSIDER verdicts before proceeding.

- [ ] **0.4 Update types.ts** -- Define the TypeScript types that express
  the domain model. Translate the ubiquitous language directly into type
  names. Expected types (refine during DDD):
  - `SubLanguageLevel` -- the level identifier
  - `NmComponentGroup` -- which NM components belong to a level
  - `LevelProgression` -- the ordered sequence of levels
  - `LevelProfile` -- tracer config gate mapping for a level

- [ ] **0.5 Write DOCS.md architectural sketch** -- Record the structural
  target in DOCS.md. This is the document the Refactor step is held against.
  Describe:
  - Execution phases (how a snippet's level is determined)
  - Structural constraints (levels must be additive, align with tracer)
  - Out of scope (the analysis module does the detection, not this module)
  Format: named execution phases, structural constraints, out-of-scope.
  No function names, no variable names, no pseudocode.

- [ ] **0.6 AR-2 sketch challenge** -- Spawn a separate reviewer agent to
  challenge the DOCS.md architectural sketch. Focus areas from AGENTS.md AR-2:
  - Is the sketch at the right abstraction level?
  - Are execution phases the right granularity?
  - Are structural constraints complete?
  - Does it use the ubiquitous language from step 0.1?
  Provide the reviewer: DOCS.md sketch, README.md, types.ts.
  Address PAUSE/CONSIDER verdicts before proceeding.

- [ ] **0.7 Review & resolve** -- Can you read types.ts, README.md, and
  DOCS.md together and fully predict what the implementation will do and
  what shape it will take? If not, resolve ambiguities now.

  Commit Phase 0 artifacts:
  `docs: establish sub-language level domain model and architectural sketch`

## Phase 1 increment plan

Since this is primarily a documentation + types stream, the increments
produce the level progression data structure:

- [ ] **Increment 1**: Define level 1 (simplest NM component group: values +
  basic bindings + literals). Write the type, write a test that the level
  includes exactly those components, implement the data structure entry.
- [ ] **Increment 2**: Define level 2 (adds operators + coercion). Test that
  level 2 includes level 1 components plus the new ones (additivity).
- [ ] **Increment 3**: Define levels 3-N (remaining levels). Each tested for
  additivity and component membership.
- [ ] **Increment 4**: Define the level detection function signature and type
  (input: set of NM components present, output: sub-language level). This is
  the contract the analysis module will implement.
- [ ] **Increment 5**: Map each level to a tracer config profile (which gates
  are enabled at each level). Test that level N profile is a superset of
  level N-1 profile.

For each increment, follow the full TDD cycle from AGENTS.md:

1. JSDoc/TSDoc for the behavioral contract
2. Stub function with stub body
3. Placeholder types (tighten later)
4. Lint checkpoint: `npm run lint <new-file>`
5. Unit test (ZOMBIES order). Ask: could this pass with a hardcoded value?
6. **AR-3**: Spawn reviewer to challenge test strategy (triangulation check)
7. Lint checkpoint: `npm run lint <test-file>`
8. Implement (minimal code, Red to Green. Fake It is valid for first test)
9. Lint checkpoint: `npm run lint <impl-file>`
10. Refactor (check against DOCS.md sketch: named phases? separated concerns?
    no Fake It values surviving past triangulation?)
11. Lint checkpoint (final, should be clean)
12. Update types (finalize from actual implementation)
13. Self-review (simplest? only what requested? junior-maintainable?)
14. **AR-4**: Spawn reviewer to audit implementation (structural quality,
    Fake It residue)
15. Quality checks: `npm test && npm run lint && npm run type-check`
16. Verify docs match implementation
17. Atomic commit: `add: [behavior this increment implements]`

## Phase 2 checklist

- [ ] Run full quality checks: `npm test && npm run lint && npm run type-check`
- [ ] **AR-5 pre-merge review**: Spawn a separate reviewer agent to review
  the full changeset. Provide: full diff (`git diff`), modified files list,
  this handoff document as the original task description, DOCS.md for
  modified modules. Focus areas from AGENTS.md AR-5:
  - Cross-file consistency (naming, patterns, conventions)
  - Documentation sync (README, DOCS.md, types, JSDoc, tests all agree)
  - Missing test scenarios
  - Convention compliance (DEV.md conventions)
  - Architecture fit
  - Scope creep
- [ ] Address PAUSE/CONSIDER items from AR-5
- [ ] Commit prompt: `docs: establish sub-language level progression`

## Verification

### How to test end-to-end

1. **Types compile**: `npm run type-check` passes with no errors in the new
   types.ts
2. **Tests pass**: `npm test` -- all level progression tests green
3. **Additivity invariant**: every test verifies that level N is a superset
   of level N-1
4. **Tracer alignment**: level profiles map to valid tracer config gate names
   (cross-reference with tracer.md)
5. **Documentation review**: read README.md, DOCS.md, and types.ts together
   -- a developer unfamiliar with the codebase can understand what a
   sub-language level is, how levels are ordered, and how to determine a
   snippet's level

### What success looks like

A fresh agent working on Work Stream 2 (analysis + recommender) can import
the level types and data structure, and use them to:

- Detect which level a snippet belongs to (given a set of NM components)
- Map a level to a tracer config profile
- Iterate over levels in order for the recommendation grid's third dimension
