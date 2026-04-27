# Work Stream 1: NM Components (3rd Block Model Dimension)

> This file **replaces** the prior `01-sub-language-levels.md`. The 3rd
> Block Model dimension is no longer an ordinal sub-language level
> progression (Level 1 → Level 2 → ...); it is the **unordered set of
> 10 NM components** sourced from the syntax tracer's `StepCategory`
> enum.

## Prerequisites

Before starting, read these files in full (do not skim):

- **AGENTS.md** (repo root):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/AGENTS.md`
- **DEV.md** (repo root):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/DEV.md`
- **Master plan**:
  `./00-master-plan.md` (in this directory)
- **Syntax tracer module** (the canonical source of the NM-components
  enum — replaces the prior "sub-language level progression" concept):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/trace/syntax/`
  - `PLAN.md` — load-bearing Resolutions (read for context)
  - `README.md` — glossary, step-category summary table
  - `types.ts` — the `StepCategory` enum definition
  - `DOCS.md` — step-closing rules and architectural sketch
- **Notional machine** (conceptual spec; operational implementation is
  the syntax tracer above):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/notional-machine.md`
- **Study-lenses types.ts** (consumer of the enum):
  `/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/study-lenses/types.ts`

## Context

### What this work stream does

Defines the **3rd dimension of the Block Model** used by the study-lens
recommender. The Block Model of Program Comprehension (Schulte 2008)
describes understanding across two dimensions:

1. **Level**: text surface, program execution, function/purpose.
2. **Scope**: atoms, blocks, relations, macro.

This work stream supplies the third dimension:

1. **NM components**: the set of syntax-tracer step categories present
   in a snippet. Unordered — a category set, not a progression.

**The NM components ARE the syntax tracer's step categories.** The
canonical enum lives at
`lib/evaluating/trace/syntax/types.ts::StepCategory`. WS1's job is to
ensure that enum is consumable by the recommender (WS2) and by
`study-lenses/types.ts` (WS3).

### Two concepts that must not be conflated

- **(1) The 10 unordered categories** are the 3rd Block Model dimension
  — a set of names, no intrinsic order.
- **(2) Any ordinal progression** a curriculum author or lens defines
  (e.g., "introduce expressions before control-flow") is a separate
  pedagogical choice, imposed on top of the unordered enum, not built
  into it.

The prior `01-sub-language-levels.md` conflated these. This file
separates them. A curriculum author may order categories however they
wish; the recommender does not enforce an ordering.

### Why it matters

The Block Model grid is how the recommender organizes lens suggestions
for a snippet. Each lens's `recommend()` returns
`Recommendation[]`, each with a `blockModelCell: { level, scope,
nmComponents? }`. The `nmComponents` field is a
`ReadonlyArray<string>` whose values are category names from
`StepCategory`.

A lens may tag MULTIPLE categories per recommendation. Example: a
trace-table lens applies when a snippet contains `write`, `emit`,
`control-flow`. The recommender groups recommendations into the
Block Model grid for the learner to browse.

### The 10 categories

From `StepCategory` in `lib/evaluating/trace/syntax/types.ts`:

- `expression` — value-producer nodes (literal, identifier, property,
  operator, call, template)
- `resolve` — data-flow edges between expression-producers and their
  consumers
- `statement` — structural frames (enter/exit of each statement)
- `scope` — scope create/leave at block boundaries
- `control-flow` — conditionals, loops, break, continue
- `initialization` — `let` / `const` declarations
- `for-init` — for-loop init bindings (per-iteration rebind)
- `write` — reassignments (side-effect of assignment expressions)
- `emit` — I/O output (prompt, alert, confirm, console.*)
- `error` — runtime errors (ReferenceError, TypeError, RangeError)

Finer kinds within each category (e.g., `expression:literal` vs
`expression:operator`) are TBD per the syntax tracer's Phase 0.1 open
items. The 10 outer categories are the Phase 1 target; finer kinds
can be layered in later without breaking the 3rd-dim contract.

### How it fits in the architecture

- **Consumed by** the snippet-analysis module (WS2), which detects
  which categories appear in a snippet via **static AST mapping** (no
  execution required).
- **Consumed by** each lens's `recommend()` function, which uses the
  detected categories to decide which Recommendations to return and
  what configs to suggest.
- **Consumed by** the recommender (WS2), which organizes
  recommendations into the 3D Block Model grid.
- **Does NOT drive** spiral ordering. The spiral is curriculum-author
  or lens-config-driven, not enum-driven. See
  `00-master-plan.md §Spiral`.

### Dependencies

- **Requires** the syntax tracer's Phase 0 to have stabilized
  `StepCategory` at the outer-category level (it has; see
  `lib/evaluating/trace/syntax/types.ts`).
- **Feeds** WS2 (analysis + recommender) and WS3
  (orchestrator + contracts). WS3's `BlockModelCell.nmComponents`
  field name is kept; only its JSDoc gets a pointer to this file and
  to the syntax tracer's enum.

### Non-goals

- Any ordinal progression through categories (that's a
  curriculum-author concern, not an enum concern).
- Category-detection algorithm in code (that's WS2's analysis module).
- UI rendering of recommendations (that's WS3/WS4).
- Finer kinds within a category (that's the syntax tracer's Phase 0.1).

## Scope of this work stream

WS1 is now **small**. Most of the substantive design is in the
syntax tracer. WS1's deliverables:

1. **Confirm the `StepCategory` enum at
   `lib/evaluating/trace/syntax/types.ts` is exported.**
2. **Ensure `study-lenses/types.ts` BlockModelCell.nmComponents
   JSDoc points at `StepCategory`** (minimal edit — no structural
   change; string-typed for flexibility while kind-level TBDs are
   open).
3. **Document** (here, and cross-referenced from `00-master-plan.md`)
   that the NM-components enum IS the syntax-tracer category enum —
   single source of truth.
4. **Flag** for WS2: analysis detection is static AST mapping; map
   from AST node types + structural context to the 10 outer
   categories; WS2 will formalize the mapping during its Phase 0.

There is **no Phase 0 DDD + Phase 1 TDD cycle** required for WS1 in
isolation. The substantive DDD cycle already ran in the syntax tracer.
WS1 just wires the enum into the study-lenses type system.

## Open questions

- **Finer kinds** — when the syntax tracer finalizes expression kinds
  (`literal`, `identifier`, `property`, `operator`, `call`,
  `template`), terminal-step kind enums, and the register-read
  decision (Q3b in syntax tracer PLAN.md), the 3rd dim may gain
  finer granularity. Decide then whether the recommender uses the
  flat outer categories only, the finer kinds, or both at different
  zoom levels.
- **Recommender cell uniqueness** — can two lenses both recommend at
  the SAME `{ level, scope, nmComponents }` cell? Probably yes
  (different lenses for the same cell). WS2 DDD decides.
- **Ordering for display** — the grid is unordered at the enum level,
  but the UI must render it in SOME order. The display ordering is a
  WS2 + WS3 concern, not this file.

## Writing conventions for agents completing WS1

- Keep WS1 artifacts **small**. Don't duplicate the syntax tracer's
  work.
- Don't restore any "Level 1 / Level 2 / ..." progression — the
  pivot was deliberate. If a lens or curriculum author needs ordering,
  they impose it themselves.
- When adding JSDoc to `study-lenses/types.ts`, link to
  `lib/evaluating/trace/syntax/types.ts` by relative path from the
  file being edited.
- Keep `nmComponents` as the field name (Resolution from the session
  that spawned this file; see `00-master-plan.md §Spiral` for the
  rationale of preserving the "NM components" terminology).

## Definition of done

- `StepCategory` is exported from the syntax tracer ✓ (already done).
- `study-lenses/types.ts::BlockModelCell.nmComponents` has a JSDoc
  comment pointing at `StepCategory`.
- `00-master-plan.md`'s §Step 2 and §3D Block Model space reflect the
  unordered-set framing.
- `02-analysis-and-recommender.md` references `StepCategory` as the
  3rd-dim source.
- A fresh agent assigned WS2 can read `00-master-plan.md` + this file
  - `02-analysis-and-recommender.md` + the syntax tracer's README and
  understand the 3rd-dim contract without asking clarifying
  questions.
