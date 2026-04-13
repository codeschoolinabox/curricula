# AI Agent Context

This file provides specific context for AI assistants working with this
`@study-lenses` package.

- [Non-Negotiable Invariants](#non-negotiable-invariants)
- [Session Start Protocol](#session-start-protocol)
- [Project Overview](#project-overview)
- [Key Technical Context](#key-technical-context)
  - [Architecture](#architecture)
  - [Critical Conventions](#critical-conventions)
  - [Readability Patterns](#readability-patterns)
  - [Documentation Convention](#documentation-convention)
  - [Type System](#type-system)
  - [Testing Approach](#testing-approach)
  - [Linting Approach](#linting-approach)
  - [Incremental TDD Workflow](#incremental-tdd-workflow)
  - [Context Compaction Protocol](#context-compaction-protocol)
  - [Safety Guardrails](#safety-guardrails)
  - [When Working on This Codebase](#when-working-on-this-codebase)
- [LLM Collaboration Conventions](#llm-collaboration-conventions)
- [Adversarial Review Protocol](#adversarial-review-protocol)
- [References](#references)

---

## Non-Negotiable Invariants

These apply unconditionally, regardless of task size, time pressure, or user
encouragement. They cannot be overridden by momentum.

1. **Read before editing** — never modify a file you haven't read in this
   session.
2. **Phase 0 before Phase 1** — work through Phase 0 in order: establish
   ubiquitous language → update README → run AR-1 → define types.ts → write the
   architectural sketch in DOCS.md → run AR-2. All seven steps before any
   implementation. Agents routinely skip this under time pressure. Do not skip
   it.
3. **Plan before implementing** — enter plan mode for anything beyond a trivial
   fix. Exception: user explicitly says "skip plan mode."
4. **One increment at a time** — complete Red → Green → Refactor → Lint before
   starting the next behavior.
5. **Atomic commits with clear messages** — commit after each passing TDD cycle
   and after completing Phase 0 artifacts. Each commit captures one behavior or
   milestone; never batch multiple increments. Messages use imperative voice and
   describe the behavior added, not the mechanical change: `add: [behavior]`,
   `docs: [artifact]`, `fix: [what broke]`, `refactor: [structural change]`.
   Prompt the user before committing; never commit silently.
6. **Plans are execution checklists, not references** — every plan document must
   explicitly list every required workflow step: Phase 0 DDD steps, AR trigger
   points (AR-1 through AR-5), commit steps, and quality checks. "Follow
   AGENTS.md" is not a plan step. Agents do not re-read AGENTS.md during
   execution; if a step is not written in the plan, it will be skipped.
7. **Stop at the emergency brake** — if scope creeps, tests fail unexpectedly,
   or you catch yourself skipping workflow steps: stop and surface it.
8. **No confident guessing** — when uncertain, say so and investigate rather
   than confirming assumptions.

> If these feel like friction, that friction is working as intended.

---

## Session Start Protocol

Before writing any code, complete this checklist in order. Do not open an
editor, create a file, or write a single line of code until every step is done.

- [ ] **Read this file** (AGENTS.md) — if you haven't in this session, read it
      now
- [ ] **Read the module README.md** — understand what this module does and where
      it fits in the `@study-lenses` ecosystem
- [ ] **Read DOCS.md if it exists** — understand the architectural sketch and
      any recorded design decisions before writing anything
- [ ] **Read 1–2 existing similar files** — find existing functions that match
      the scope of your task; read them fully to absorb patterns before writing
- [ ] **Check the existing test files** — understand what is already tested and
      at what level; don't duplicate coverage
- [ ] **Restate the task in one sentence** — flag ambiguities before proceeding;
      better to ask now than to build the wrong thing
- [ ] **Enter plan mode** — unless this is a trivial fix or the user has said
      "skip plan mode"

---

## Project Overview

See [README.md](./README.md) for what this package does and where it fits in the
`@study-lenses` ecosystem.

> **⚠️ Plan Mode First:** Discuss changes with Claude in plan mode before
> implementation. Exceptions: trivial fixes, user says "skip plan mode", or pure
> research tasks. Plan mode prevents wasted effort from misunderstandings and
> catches issues before code exists.

## Key Technical Context

### Architecture

See [README.md § Architecture](./README.md#architecture) for an overview and
[DEV.md](./DEV.md) for internal conventions and module boundaries.

### Critical Conventions

#### 1. Export Conventions

- **One default export per file**: Named function/const, then `export default`
  at bottom
- **Exception — utility/predicate modules**: Files that export multiple
  orthogonal utility functions (e.g. `gating.ts`, `scope-stack.ts`) may use
  named exports. The rule "one default export" applies to single-concept
  modules (advice hooks, emit functions, pipelines). A utility module with
  5–15 orthogonal predicates or helpers is better served by named exports —
  a default-export wrapper object would force verbose `gating.isScopeGateOpen()`
  call sites with no benefit.
- **No barrel files**: Import directly from source files (no `index.ts`
  re-exports except `/src/index.ts`)
- **Always `.js` extension** in imports

```javascript
// ✅ CORRECT — single-concept module
function myFunction() { ... }
export default myFunction;

// ✅ CORRECT — utility/predicate module with multiple orthogonal exports
export function isScopeGateOpen(...) { ... }
export function isBindingGateOpen(...) { ... }

// ❌ WRONG — inline default
export default function() { ... }
// ❌ WRONG — named export on a single-concept module
export function myFunction() { ... }
// ❌ WRONG — barrel import
import { x } from './index.js';
```

#### Type Location

Types live in `<module>/types.ts` with the code they document.

| Location                | Purpose                               |
| ----------------------- | ------------------------------------- |
| `src/<module>/types.ts` | Types for that module                 |
| `src/index.ts`          | Re-exports public types for consumers |

#### 2. Object-Threading Pattern

All pipeline functions follow this pattern:

```javascript
function stage(input) {
	const { existingData } = input;
	const newData = process(existingData);
	return { ...input, newData };
}
```

#### 3. Pure Functional Approach

- No mutations
- No side effects in core functions
- Explicit state passing
- Deterministic behavior

#### 4. Function Conventions

- Use named `function` declarations by default
- Arrow functions ONLY as anonymous inline callbacks: single expression,
  implicit return, readable at a glance
- Arrows NEVER assigned to variables (`const fn = () => ...` is banned)
- Non-trivial callbacks: extract as named `function` declarations, pass by name
- Hoisting encouraged: define helper functions below where they're first called

#### 5. No `this` Keyword

Banned. Exception: low-level code interfacing with libraries that require it.

#### 6. No Mutable Closures

Closures over mutable variables (`let`, reassigned bindings) are banned.
Closures over immutable values (cached config in currying) are fine.

#### 7. Method Shorthand in Objects

Use `{ process() {} }` not `{ process: function process() {} }`.

#### 8. Default Empty Object for Destructured Parameters

All destructured object params get `= {}` default:

```javascript
function processConfig({ preset = 'detailed' } = {}) {}
```

#### 9. Naming

- Functions: verb-first (`extractId`, `createConfig`, `isActive`)
- Predicates: prefix with `is`/`has`/`can`/`should`
- Callbacks: describe the transform (`extractId` not `mapUser`)

#### 10. Imports

- Always include `.js` extension
- Group: externals → internals → type imports (separated by blank lines)

#### 11. Types

- Prefer `type` over `interface`
- Types live in `types.ts` files per module

#### 12. Comments

- JSDoc for public functions (TypeDoc generates `docs/` from these)
- TSDoc `@remarks` for consumer-facing "why" context that belongs in generated
  docs
- Inline comments explain WHY, not WHAT
- `DOCS.md` per directory for architecture/decisions/why — for contributors, not
  consumers (see Documentation Convention below)

#### 13. File Structure

- One concept per file, named after its default export
- `kebab-case` for all files and directories
- Unit tests in `tests/` subdirectory at the same level as source files
- Every source directory has a `README.md`

#### 14. Prefer `const`

Use `let` only when reassignment is genuinely needed (loop counters,
accumulators).

#### 15. Deep Freeze Return Values

Objects and arrays returned from functions MUST be deep frozen. This codebase is
consumed by LLMs that cannot be trusted not to mutate returned data.

Use the freeze utilities from this package's shared utilities:

```typescript
import { freezeInPlace, cloneAndFreeze } from '../utils/freeze.js';
// ^^^ Adjust import path to match this package's utility location.
//     If you cannot locate these utilities, stop and ask — do not
//     inline a custom implementation.
```

| Operation        | When to use                                         | Behavior                      |
| ---------------- | --------------------------------------------------- | ----------------------------- |
| `freezeInPlace`  | Objects we just built (fresh results, new wrappers) | Freezes in place, same ref    |
| `cloneAndFreeze` | Objects we don't own (caller-provided, external)    | Clones first, returns new ref |

**When to freeze**: function return values, config objects, constants, shared
defaults.

**Exception**: Performance-critical hot paths where profiling proves freeze
overhead is unacceptable. Must be documented with a
`// perf: skip freeze — [reason]` comment.

> See DEV.md § Codebase Conventions for full rationale and examples.

### Readability Patterns

These patterns shape how code reads, not just what it does. See DEV.md § 12 for
full examples.

**Guard-first, happy-path-last** — early returns for edge/error cases at the
top; the happy path sits uncluttered at the bottom. Works with the linter: deep
nesting is a complexity violation.

**Name intermediate values** — when a sub-expression has a clear identity,
capture it in a `const`. Name the thing, then use the name.

```typescript
const tracerModule = tracers[tracer];  // ✅ — named, then checked
if (!tracerModule) throw ...;
```

**Ternary: transparent value selection only** — both branches produce the same
kind of thing; the variable name captures the identity regardless of which path
executes. When branches do structurally different things, use `if-else`.

**Within-file helpers for readability; separate file for reuse** — extract a
file-private helper when it makes the main function read like a story (single
use is fine). Extract to a separate file only when the logic is used in 2+
places.

**WHY comments for non-obvious JS semantics** — when code relies on language
mechanics that aren't universally known, add a comment explaining WHY this
approach is required.

```typescript
// typeof null === 'object' in JS — must explicitly exclude null
if (thing === null) return false;
```

**Numbered step comments for multi-phase functions** — when a function has
distinct phases, number them. Makes long functions skimmable without reading
every line.

```typescript
// 1. Validate input (sync)
// 2. Prepare config (sync)
// 3. Execute (async)
```

**Blank lines as paragraph breaks** — separate distinct phases of logic. One
blank line ends one thought and starts the next. Group related statements; don't
break every line.

### Documentation Convention

| Content                                             | Where                      | Audience     |
| --------------------------------------------------- | -------------------------- | ------------ |
| API reference (signatures, params, returns, throws) | JSDoc/TSDoc → `docs/`      | Consumers    |
| Consumer-facing "why" context                       | TSDoc `@remarks` → `docs/` | Consumers    |
| What this module does, how to navigate it           | `README.md` per directory  | Contributors |
| Architecture, design decisions, why this approach   | `DOCS.md` per directory    | Developers   |
| Non-obvious implementation detail                   | Inline `//` comment        | Code readers |

**Rules:**

- Every directory has a `README.md`
- Directories with non-obvious architecture or key design decisions also have a
  `DOCS.md`
- `DOCS.md` captures the "why" — tradeoffs, alternatives considered,
  constraints. Keep it short. It is NOT an API reference — JSDoc handles that.
  Hand-maintained: fix it or delete it if it goes stale.
- For **new modules**, DOCS.md is written in Phase 0 step 0.5 as an
  **architectural sketch** — the structural target the Refactor step is held
  against. See DEV.md § Directory Documentation Convention for the required
  format and example.
- Public functions have JSDoc/TSDoc in source; TypeDoc generates `docs/`
  (gitignored, CI-only)
- `@remarks` for consumer-facing "why" context (appears alongside signatures in
  TypeDoc output)

### Type System

Full TypeScript strict mode. Types live with the code they document (`types.ts`
per module).

### Testing Approach

See DEV.md § Testing Strategy for full conventions, including triangulation,
ZOMBIES sequencing, and the Fake It pattern. Summary:

- Explicit vitest imports: `import { describe, it, expect } from 'vitest'` (no
  globals)
- Unit tests in `tests/` subdirectory (never alongside source files)
- File suffix: `.test.ts` (never `.spec.ts`)
- One assertion per `it`; nest `describe` blocks for grouping
- **Test sequencing: ZOMBIES** — Zero/null/empty → One → Many → Boundaries →
  Interfaces → Exceptions → Simple scenarios. This order naturally produces
  **triangulation**: each test constrains the implementation from a new angle,
  making hardcoded values impossible to sustain past the first increment.
- Direct description naming with implicit arrows for compactness
- Inline test data only — no shared fixtures
- `.toThrow()` for errors — no try-catch patterns
- No comments — test names are documentation

### Linting Approach

See DEV.md § Linting Conventions for full details. Summary:

- **Three-tool pipeline**: ESLint (logic/patterns) + Prettier (formatting) +
  TypeScript (types)
- Most functional/import/style conventions auto-enforced via ESLint
- Pre-commit hooks run `lint:fix` and `format` on staged files
- Manual review for: default `= {}` params, verb-first naming, file granularity,
  comment quality
- Run `npm run validate` to check all three tools at once

### Incremental TDD Workflow

All development uses TDD with atomic increments. See DEV.md § Incremental
Development Workflow for the full process.

**Summary:**

- **Phase 0** _(do not skip)_: Establish ubiquitous language (domain glossary) →
  README spec (domain model in prose, bounded context) → AR-1 design challenge →
  types.ts (domain model in TypeScript) → architectural sketch in DOCS.md
  (structural target for the Refactor step) → AR-2 sketch challenge → commit
  Phase 0 artifacts (`docs: establish [module] domain model and architectural
  sketch`)
- **Phase 1**: For each increment: JSDoc → stub → test (ZOMBIES order) → AR-3 →
  implement (Fake It is valid for the first test; second test must triangulate
  it away) → lint → refactor (structural quality against DOCS.md sketch) → AR-4
  → quality checks → commit (atomic: one behavior per commit; message:
  `add: [behavior this increment implements]`)
- **Phase 2**: Full quality checks → AR-5 pre-merge review → commit prompt

Each passing TDD cycle = one atomic commit. Do not batch behaviors.

> **On DDD**: The ubiquitous language established in Phase 0 is not optional
> ceremony. Names chosen here propagate into every function signature, test
> description, error message, and JSDoc comment written in Phase 1. A wrong name
> costs one find-and-replace now; it costs a misread codebase forever. Types are
> the domain model expressed as TypeScript — readable by someone who understands
> the domain but not the implementation.
>
> **On TDD and structure**: Tests verify _behavioral correctness_ — the function
> does what it's specified to do. The Refactor step addresses _structural
> quality_ — the implementation reflects the named phases and constraints in the
> DOCS.md architectural sketch. Green tests are necessary but not sufficient.

#### Claude-Specific Workflow Notes

**Plan constraints:**

- Plans MUST NOT include already-implemented functions — code is developed
  incrementally
- Plans start with a brief context line referencing completed work, then list
  ONLY unimplemented work
- **Plans describe BEHAVIOR, not implementation** — never include full function
  bodies or working code in plans. TypeScript **type declarations** ARE helpful
  and encouraged — they pin the contract at the boundary and are the domain
  model expressed in code. Pseudocode is also OK when describing a proposed
  strategy. The bright line: anything that looks like executable code (function
  bodies, statement sequences, expression graphs, actual algorithm steps)
  belongs in the source file, not the plan. TDD discovers the implementation;
  the DOCS.md architectural sketch constrains the structure. Plans live between
  these two: they name what each increment should do and what types enter and
  exit, not how the body is written.
- Before starting work, verify understanding with the user: what will be built,
  what constraints apply, what success looks like
- Before writing any code, explain in plain language what you're about to do and
  why

**Plans must explicitly list every workflow step, including:**

- Phase 0: ubiquitous language → README spec → AR-1 → types.ts → architectural
  sketch in DOCS.md → AR-2 → commit Phase 0 artifacts
- For each increment: JSDoc → stub → failing test → AR-3 → implement → lint →
  refactor (check against DOCS.md sketch) → AR-4 → quality checks → commit
- Phase 2: full quality checks → AR-5 → commit / push prompt

Plans that omit these steps are incomplete. "See AGENTS.md for the workflow" is
not a valid substitute — write the steps out.

**During TDD cycles:**

- Run lint checkpoints on specific modified files, not the whole codebase:
  `npm run lint <file>`
- Write tests in ZOMBIES order (Zero → One → Many...) to force triangulation.
  After the first test, ask: _could this be passed by returning a hardcoded
  value?_ If yes, the second test must make that impossible before you
  implement.
- At step 9 (refactor): check the implementation against the DOCS.md
  architectural sketch. Green tests mean behavioral correctness is achieved.
  Structural quality is addressed here — named phases, separated concerns, no
  Fake It values surviving past their triangulation point.
- At step 12 (self-review): run through the LLM Anti-Pattern Checklist. Reality
  check: did I run it? Did I trigger the exact behavior I changed? Would I bet
  $100 this works? Flag what you're least confident about for the user to
  review.
- At step 13: show actual output from quality checks — don't just claim "tests
  pass"

**Git prompts** (Claude prompts, user executes):

- After Phase 0 completes: "Phase 0 complete — ready for atomic commit:
  `docs: establish [module] domain model and architectural sketch`"
- After each passing TDD cycle: "Ready for atomic commit:
  `add: [behavior this increment implements]`"
- After the last increment: "Sprint complete — ready to push to main"

Commit message format: imperative voice, one line, describes the behavior or
artifact — not the mechanical change. Prefixes: `add:` (new behavior), `docs:`
(documentation/types/README), `fix:` (correcting broken behavior),
`refactor:` (structural changes with no behavior change).

**Default workflow: commit directly to main.** Frequent atomic commits on main
provide rollback points without branching overhead. Feature branches are the
human's discretion — agents do NOT create branches unless explicitly instructed
to do so in the current conversation.

**Interrupt and redirect** if the user tries to skip planning, documentation,
tests, or quality checks — even if they insist.

#### Git: Additive Actions Only

Claude MAY run git commands that are **additive, non-destructive, and
reversible**. Claude MUST NOT run any git command that mutates existing history,
rewrites branches, publishes to remotes, or destroys work.

**Allowed** (read-only + additive, reversible):

- Read-only: `git status`, `git diff`, `git log`, `git show`, `git blame`,
  `git branch --list`, `git ls-files`, `git remote -v`
- Additive: `git add <specific-files>`, `git commit -m "..."` (new commits only),
  `git fetch` (remote-read-only), `git stash push` (reversible)
- Branch creation: `git branch <new-name>`, `git checkout -b <new-name>`
  (creating new branches, not switching in a way that loses work)

**Forbidden** (destructive, rewriting, or publishing):

- History mutation: `git commit --amend`, `git rebase` (any form),
  `git reset --hard`, `git reset` (soft/mixed OK only with explicit user
  instruction for a specific file unstage), `git revert`, `git cherry-pick`
- Publishing: `git push` (any form, including `--force`, `--force-with-lease`,
  `--delete`)
- Remote mutation: `git push`, `git push --tags`, `git fetch --prune`
- Destroying work: `git checkout -- <file>` / `git restore <file>` (discards
  unstaged changes), `git clean -f`, `git stash drop`, `git stash clear`,
  `git branch -D`, `git branch -d`, `git tag -d`
- Merging: `git merge` (any form — merges rewrite history in the sense of
  creating merge commits that are hard to undo without force-push)
- Skipping hooks or signing: `--no-verify`, `--no-gpg-sign` (unless the user
  explicitly requests)

**Rule of thumb**: If the command can be undone by `git reset --hard HEAD~1` or
a single force-push from the human, it's destructive — ask first. If it only
adds new commits that can be dropped by the human later without losing
unrelated work, it's additive — Claude may run it.

**Instead for forbidden actions:** Claude prompts the human. Format:

> "Ready to [action] — would you like me to run `git [command]`, or would you
> prefer to do it yourself?"

For allowed actions: Claude describes what it's about to do in plain language
before running the command, so the user can catch misunderstandings before the
commit lands.

### Context Compaction Protocol

Long sessions hit context limits, triggering automatic summarization.

#### Trigger Mechanisms

**Proactive (Claude's judgment):**

- ~80% through estimated context window
- Long multi-file implementation sessions
- After 10+ incremental commits without break

**User-initiated:**

- User says `/checkpoint`, "context check", or similar

#### Compaction Preparation Checklist

When context is approaching capacity, Claude MUST:

1. **Update plan file** — capture current state, what's done, what's left
2. **Update docs** — ensure AGENTS.md/DEV.md/README.md/DOCS.md reflect current
   reality
3. **Prompt user to commit** — atomic checkpoint before compaction
4. **Summarize active context** — write session summary to plan file:
   - Current branch and recent commits
   - Files being modified
   - Open questions or blockers
   - Next immediate task
5. **Alert the user** with this format:

```text
⚠️ Context approaching capacity.

I've documented the current state:
- Plan file: [path]
- Branch: [current branch]
- Last commit: [summary]
- Next task: [what's next]

Ready for session handoff or continuation after compaction.
```

#### Post-Compaction Recovery

After context resets:

1. Re-read AGENTS.md, DEV.md, and relevant README.md/DOCS.md files
2. Read plan file to restore session context
3. Verify understanding with user before resuming

### Safety Guardrails

Claude must actively protect the codebase — especially from its own worst
tendencies.

#### Risk Assessment

Before starting any task involving multiple files, refactoring, cleanup, or
architectural changes, Claude must warn the user and push toward incremental
breakdown. These patterns are especially dangerous and must never be repeated:

- "Simplification" refactors that break working functionality
- Architectural rewrites that replace working systems with broken ones
- File deletion sprees that remove working code
- Over-abstraction that makes simple things complex
- Enthusiastic agreement to large changes without risk assessment

#### Emergency Brake

Work stops immediately if:

- Scope creeps beyond the original plan
- Test failures that aren't immediately understood
- Breaking changes to public APIs without explicit approval
- Claude catches itself skipping workflow steps

#### Intellectual Honesty

When Claude doesn't know something — say so explicitly, then suggest how to find
out. Never guess confidently. When stuck, say "I'm stuck" — asking for help is
better than shipping broken code.

#### Defensive Development

Never edit a file without reading it first in the current session. Before
changing existing code, understand why it exists. When something breaks, revert
to the last known working state and try a different approach.

#### LLM Anti-Patterns (Resist These Tendencies)

| Anti-Pattern                | Rule                                         | Example Fix                                     |
| --------------------------- | -------------------------------------------- | ----------------------------------------------- |
| **Over-engineering**        | Helper used once? Inline it                  | `const x = getX(o)` → `const x = o.x`           |
| **Class addiction**         | Linter blocks, but check first               | `class X` → `function createX()`                |
| **Future-proofing**         | User didn't ask? Don't add it                | `options = {}` with unused fields → direct impl |
| **Defensive coding**        | Validate at boundaries only                  | Remove internal re-validation                   |
| **Verbose docs**            | Name + types explain? Skip JSDoc             | Only document WHY or non-obvious contracts      |
| **Fake It without Make It** | Hardcoded values expire after the first test | Write second test to make hardcoding impossible |

##### Pre-Proposal Checklist

Before proposing code, answer YES to ALL:

- [ ] **Simplest solution?** Not most "elegant" or "extensible"
- [ ] **Only what requested?** No future-proofing, no "nice-to-haves"
- [ ] **Helpers used >1x?** If used once, inline it
- [ ] **Validate at boundaries only?** No re-validating internal calls
- [ ] **Junior-maintainable?** Understandable without explanation
- [ ] **Structural quality?** Does the implementation reflect the DOCS.md
      architectural sketch — named phases, separated concerns, no Fake It values
      surviving past the first increment?

### When Working on This Codebase

1. **Follow the Incremental TDD Workflow above** for all development work —
   Phase 0 (DDD + architectural sketch in DOCS.md) before Phase 1, no exceptions
2. Follow export conventions strictly (named-then-export, no barrels)
3. Import directly from source files (no barrel imports), always with `.js`
   extension
4. Maintain object-threading pattern where applicable
5. Keep functions pure and deterministic
6. Use named `function` declarations (arrows only for inline callbacks)
7. No `this` keyword, no mutable closures
8. Default empty object `= {}` on all destructured parameters
9. Verb-first naming; predicates prefixed with `is`/`has`/`can`/`should`
10. Prefer `type` over `interface`; types in `types.ts` files
11. Add TypeScript types for all public APIs
12. JSDoc/TSDoc for public functions; `@remarks` for consumer-facing "why";
    inline comments for implementation "why"
13. `DOCS.md` per directory for architecture/decisions — written prospectively
    in Phase 0 for new modules, updated whenever structural decisions change
14. Throw on invalid input; fail fast for critical errors
15. Place tests in `tests/` subdirectory, `.test.ts` suffix; write in ZOMBIES
    order to ensure triangulation
16. Ensure `README.md` exists and is current in every directory you modify
17. Deep freeze all returned objects/arrays (`freezeInPlace` for freshly built,
    `cloneAndFreeze` for caller-provided)

## LLM Collaboration Conventions

### Code Organization for LLM Generation

The conventions in DEV.md are designed to help LLMs generate correct code on the
first attempt:

- **Complete TypeScript types** prevent guessing field names/types
- **Predictable `kebab-case` filenames** enable discovery without searching
- **"Why" comments** signal intent that syntax can't convey
- **Self-documenting error messages** include context for debugging
- **Structural consistency** (imports → helpers → main → export) enables
  prediction

### Communication Discipline

- No false confidence: never claim something works without running it
- No sycophancy: never agree with an approach just because the user suggested it
- Express uncertainty with confidence levels ("~80% confident this is correct")
- When uncertain, investigate first rather than confirming assumptions
- Lead with problems and risks, not optimism

### Working with Claude

- Treat Claude as an iterative partner, not a one-shot solution
- Save your state (git commit) before letting Claude make large changes
- Core business logic needs close human oversight; peripheral features can run
  more autonomously
- **Never split a file between agents**: if an agent reads a file, it needs the
  WHOLE file for context. Don't have one agent read lines 1-100 and another
  read lines 100-200 of the same file. Assign whole files to agents.

## Adversarial Review Protocol

Adversarial reviews use a separate agent instance acting as devil's advocate.
The reviewer agent has READ-ONLY access and produces a structured report with
concerns, counter-proposals, and a verdict (PROCEED / CONSIDER / PAUSE).

Only the **human** can skip an adversarial review. The implementing agent must
never skip its own review — that defeats the purpose.

> **Skip resistance rule**: If you find yourself reasoning about why _this
> particular case_ doesn't need an AR, that reasoning is the signal it does. The
> urge to skip is highest when the review would be most valuable. The only valid
> skip is an explicit opt-out from the human in the current conversation.

### How to Run an Adversarial Review

Spawn a separate agent instance with read-only access to the codebase. The
implementing agent or human initiates the review by providing:

1. The review type (AR-1 through AR-5) and its focus areas
2. The relevant files or diff to review
3. Context about what was built/proposed and why

The reviewer agent produces a structured report. The implementing agent or human
then responds to each concern before proceeding.

Tool-specific examples:

- **Claude Code**: use the Agent tool with subagent_type="general-purpose"
- **Cursor/Copilot**: use chat with the adversarial prompt pasted in
- **CLI tools**: spawn a second agent session with the review prompt

### Agent Prompt Structure

Every adversarial review prompt follows this structure:

1. **Role**: "You are an adversarial reviewer — a senior engineer whose job is
   to find problems, challenge assumptions, and propose better alternatives."
2. **Context**: What was built/proposed and why
3. **Focus areas**: Specific to each review type (see below)
4. **Constraints**: Read-only, must produce structured output
5. **Output format**: Concerns list (numbered, with severity),
   counter-proposals, verdict

### Verdict Definitions

- **PROCEED**: No significant issues found. Note minor observations if any.
- **CONSIDER**: Issues found that are worth thinking about but don't block
  progress. List specific concerns with suggested alternatives.
- **PAUSE**: Significant issues found that should be resolved before continuing.
  List blocking concerns with rationale for why they block.

### Resolution Rules

- Human always has final authority
- PROCEED: continue immediately
- CONSIDER: document your response to each concern, then continue
- PAUSE: present concerns to human, wait for decision before continuing
- Never skip a PAUSE verdict — it exists to protect the codebase

### AR-1: Design Challenge

**Trigger:** During Phase 0, after README spec (step 0.2), before types.ts locks
the contract (step 0.4). **Skip:** Only when the human explicitly opts out.

**Focus areas:**

- Does the ubiquitous language in the README align with the rest of the
  codebase? Any naming collisions, synonyms, or redefinitions?
- Are bounded context boundaries correct — is this module doing too much or too
  little?
- Does the README design suggest a clean separation of concerns, or will it
  produce tangled implementation phases? (This is what the architectural sketch
  will need to reflect — catch the problem here, before types lock it in.)
- Are there simpler alternatives that achieve the same goal?
- What edge cases are missing from the spec?
- What decisions will be hard to change later?
- Does this follow existing patterns in the codebase, or introduce new ones
  unnecessarily?
- Are the types over- or under-specified?

**Provide to agent:** README updates, any design notes, existing codebase
patterns

### AR-2: Architectural Sketch Challenge

**Trigger:** After the architectural sketch is written in DOCS.md (Phase 0 step
0.6), before the final review and implementation begin (step 0.7). **Skip:**
Only when the human explicitly opts out.

**Focus areas:**

- Is the sketch at the right level of abstraction — does it constrain structure
  without prescribing implementation? (No function names, variable names, or
  pseudocode should appear.)
- Are the named execution phases the right granularity? Are any phases too
  coarse (should be split) or too fine (should be merged)?
- Does each phase have a single, distinct responsibility? Are there hidden
  dependencies between phases that should be made explicit?
- Are the structural constraints complete? Are there failure modes, async
  boundaries, or edge cases not captured?
- Is the "out of scope" section correct and complete? Does it explicitly name
  things callers are responsible for?
- Does the sketch use the ubiquitous language from step 0.1, or has new
  terminology crept in?
- Is the sketch consistent with the types defined in step 0.4? Do domain terms
  in the sketch map cleanly to types?

**Provide to agent:** DOCS.md architectural sketch, README.md, types.ts

### AR-3: Test Strategy Challenge

**Trigger:** After first failing test is written for an increment. **Skip:**
Only when the human explicitly opts out.

**Focus areas:**

- **Triangulation check**: Can this first test be passed by returning a
  hardcoded value? If yes, name the second test that makes hardcoding
  impossible. A test suite that doesn't triangulate produces implementations
  with Fake It values that survive beyond the first increment.
- **ZOMBIES coverage**: Does the test sequence move from Zero/null/empty → One →
  Many → Boundaries? If the first test is a complex happy-path case, the
  ordering is wrong — start simpler.
- Are we testing behavior or implementation details?
- What edge cases are missing?
- Are we over-testing (brittle tests that break on refactor)?
- Is the test naming clear and descriptive?
- Does the test ordering follow convention (feature → happy → edge → error)?

**Provide to agent:** The test file, the stub/types being tested, related
existing tests

### AR-4: Implementation Audit

**Trigger:** After self-review (step 12) for an increment. **Skip:** Only when
the human explicitly opts out.

**Focus areas:**

- **Structural quality**: Does the implementation reflect the DOCS.md
  architectural sketch? Are the named execution phases present and distinct? Are
  concerns properly separated, or have phases been collapsed into an
  undifferentiated block to pass tests?
- **Fake It residue**: Are there hardcoded or special-cased values that should
  have been triangulated away? If the implementation returns a fixed value for
  any non-trivial input, triangulation was incomplete.
- Is this the simplest solution? Could it be done in fewer lines?
- Are there existing utilities being ignored (check src/utils/)?
- Does it follow the codebase's functional conventions (no this, no mutable
  closures)?
- Are there subtle bugs (off-by-one, null handling, async footguns)?
- Is error handling appropriate (validate at boundaries only)?
- Would a junior developer understand this without explanation?

**Provide to agent:** The implementation file, its test file, types, the DOCS.md
architectural sketch, any utilities used

### AR-5: Pre-Merge Review

**Trigger:** After all increments complete, before commit prompt. **Skip:** Only
when the human explicitly opts out.

**Focus areas:**

- Cross-file consistency: do naming, patterns, and conventions align?
- Documentation sync: do README, DOCS.md, types, JSDoc, and tests all agree?
- Missing test scenarios: are there untested code paths?
- Convention compliance: does the full changeset follow DEV.md conventions?
- Architecture: does this fit cleanly into the existing layer stack? Does the
  final implementation match the DOCS.md architectural sketch, or did
  implementation drift from the Phase 0 design?
- Scope: did we add anything beyond what was requested?

**Provide to agent:** Full diff (git diff), modified files list, the original
task description, DOCS.md for modified modules

## References

- See DEV.md for architecture and code conventions
- See `src/` directory READMEs for module-specific context
- API documentation generated to `docs/` via `npm run docs`
