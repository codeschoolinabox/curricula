# AI Agent Context

This file provides specific context for AI assistants working with this
`@study-lenses` package.

- [Non-Negotiable Invariants](#non-negotiable-invariants)
- [Session Start Protocol](#session-start-protocol)
- [Project Overview](#project-overview)
- [Key Technical Context](#key-technical-context)
  - [Architecture](#architecture)
  - [Critical Conventions](#critical-conventions) (→ DEV.md)
  - [Readability Patterns](#readability-patterns) (→ DEV.md)
  - [Documentation Convention](#documentation-convention) (→ DEV.md)
  - [Type System](#type-system)
  - [Testing Approach](#testing-approach) (→ DEV.md)
  - [Linting Approach](#linting-approach) (→ DEV.md)
  - [Incremental TDD Workflow](#incremental-tdd-workflow)
  - [Context Compaction Protocol](#context-compaction-protocol)
  - [Safety Guardrails](#safety-guardrails)
  - [When Working on This Codebase](#when-working-on-this-codebase)
- [LLM Collaboration Conventions](#llm-collaboration-conventions)
- [Adversarial Review Protocol](#adversarial-review-protocol) (→ DEV.md for full
  protocol)
  - [Sub-model dispatch for AR subagents](#sub-model-dispatch-for-ar-subagents)
- [Vibetoading and Frogramming — house terms](#vibetoading-and-frogramming--house-terms)
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
   execution; if a step is not written in the plan, it will be skipped. Plans
   must also include at least one **mermaid data-flow diagram** (or
   sequence/state diagram, whichever fits) for any change touching multiple
   modules or layers — ASCII art is not a substitute. The diagram should make
   the before/after data path visually obvious so reviewers can verify the
   architecture at a glance.
7. **Stop at the emergency brake** — if scope creeps, tests fail unexpectedly,
   or you catch yourself skipping workflow steps: stop and surface it.
8. **No confident guessing** — when uncertain, say so and investigate rather
   than confirming assumptions.
9. **Read whole files, never split** — when reviewing, auditing, or comparing
   files, read each file end-to-end yourself. When spawning a subagent to review
   a file, instruct it to read the whole file from start to finish, not a slice
   or a summary. Partial reads miss fiddly details — broken markdown, typos,
   orphan sentences, meta-comments, late-file divergences. Summaries compress
   away exactly the anomalies an audit is looking for. This applies to every
   file in the task, not "the important ones." If a file is too long to read in
   one pass, paginate deliberately and cover every line; do not sample.
10. **Always run a Plan-agent design pass in plan mode** — while in plan mode,
    after exploration and before exiting to request approval, spawn a Plan
    subagent to design and adversarially validate the approach. Never skip it
    because the design feels tightly templated by existing patterns; the
    independent pass catches honesty, scope, and architecture gaps the
    implementing agent rationalizes away. Only the human can waive it.

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

See [DEV.md § Codebase Conventions](./DEV.md#codebase-conventions) for the full
conventions reference. Quick agent-facing summary of the rules that bite most
often:

- One default export per file (named-then-export); no barrel files; `.js`
  extension always in imports
- Named `function` declarations by default; arrows only for inline
  single-expression callbacks
- **Object-threading pattern** for pipeline functions: destructure inputs,
  return `{ ...input, newData }` — no hidden state, composable stages
- No `this` keyword; no mutable closures; no parameter reassignment
- Default `= {}` on destructured object parameters
- Verb-first naming; predicates prefixed with `is`/`has`/`can`/`should`
- Prefer `type` over `interface`; types live in module `types.ts`
- Throw on invalid input at boundaries; fail fast for critical errors
- Deep freeze return values (`freezeInPlace` for own / `cloneAndFreeze` for
  caller-provided)

### Readability Patterns

See [DEV.md § Readability Patterns](./DEV.md#12-readability-patterns) for the
full guide with examples. Headline patterns: guard-first/happy-path-last, named
intermediate values, ternary for value selection only, within-file helpers for
readability (single-use OK), WHY comments for non-obvious JS semantics, numbered
step comments for multi-phase functions, blank lines as paragraph breaks.

### Documentation Convention

Every source directory has both a `README.md` (what + how to navigate, for
contributors) and a `DOCS.md` (architecture + why + Mermaid data flow, for
developers). For new modules, `DOCS.md` is written during Phase 0 as an
**architectural sketch** — the structural target Phase 1's Refactor step is held
against.

**End-state docs only.** `README.md`, `DOCS.md`, and `types.ts` describe the
intended end state of the package/module. Quick test: "does this describe what
the thing IS, or where the work currently STANDS?" The latter — status
snapshots, migration phases, hedging language — goes in plan files, handoff
files, or commit messages, NOT in end-state docs. Governance docs (this file,
DEV.md, HUMANS.md, etc.) describe process as their end-state contract and are
out of scope. See
[DEV.md § What goes in docs vs. plans vs. handoffs](./DEV.md#what-goes-in-docs-vs-plans-vs-handoffs).

See
[DEV.md § Directory Documentation Convention](./DEV.md#directory-documentation-convention)
for the full format, the data flow diagram rules, and the architectural sketch
template.

### Type System

Full TypeScript strict mode. Types live with the code they document (`types.ts`
per module).

### Testing Approach

See [DEV.md § Testing Strategy](./DEV.md#testing-strategy) for full conventions,
including triangulation, ZOMBIES sequencing, the Fake It pattern, and
dependency-order coverage. Quick agent-facing rules:

- Tests in `tests/` subdirectory; `.test.ts` suffix (never `.spec.ts`)
- Explicit vitest imports (no globals); inline test data only; no shared
  fixtures
- One assertion per `it`; nest `describe` for grouping; no comments in tests
- ZOMBIES sequencing: Zero → One → Many → Boundaries → Interfaces → Exceptions →
  Simple. Triangulate the first test before writing the implementation.
- `.toThrow()` for errors (no try-catch in tests)
- Bottom-up dependency-order coverage — `vi.mock('./sibling')` on an internal
  sibling is a code smell; cover the sibling instead.

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
  including the **Mermaid `## Data flow` diagram** (structural target for the
  Refactor step; abstraction level matches this directory's position in the
  tree) → AR-2 sketch challenge → commit Phase 0 artifacts
  (`docs: establish [module] domain model and architectural sketch`)
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

#### Sandbox Checkpoints

For user-observable increments (new UI element, new button, browser-visible
behavior), a 🔍 Sandbox checkpoint fires between the Phase 1 quality-checks step
and the commit-prompt step:

```text
... Quality checks → 🔍 Sandbox checkpoint (when user-observable) → Commit prompt
```

Cosmetic redirects (spacing, wording, polish) roll into the next increment;
behavioral defects (wrong buffer reset, content corruption, missing a11y label)
block the commit and trigger rework.

**Sandbox checkpoints are gate points, not optional.** Skipping one because
tests are green is the exact failure mode they exist to prevent. Only the human
can skip; the agent never skips on its own. The one place skipping is
appropriate is when the increment has no user-visible surface (pure utility
function, private type, data shape narrowing) — and even there, the skip is
explicit ("no sandbox checkpoint: pure utility").

See
[DEV.md § Sandbox Checkpoints](./DEV.md#sandbox-checkpoints--user-observable-features)
for the full cycle diagram, redirect policy, and content-quality rules.

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
- **Data flow check at step 9** (ephemeral): sketch the intra-file data flow as
  Mermaid for your own reasoning. Is anything carried further than the phase
  that needs it? Any redundant transformations? This diagram is a thinking tool
  — not committed.
- **Inter-file contract check at step 9**: verify the file's inputs and outputs
  still match the peer `DOCS.md` Mermaid data flow diagram.
  - Contract preserved → autonomous; commit.
  - Contract changed → flag to user; update `DOCS.md` only with approval.
- **Two-tier autonomy** (mechanical, not judgment):
  - Intra-file refactors are autonomous.
  - Inter-file changes require user check-in if ANY trigger fires: file added to
    or removed from the flow; file's input/output shape changes; phase
    annotation changes (throws / pure / async).
  - Extracting a helper to a new domain-related file IS a trigger. Extracting to
    a domain-agnostic utility file (freeze, merge, clone) is NOT (utilities are
    invisible in data flow diagrams).
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
(documentation/types/README), `fix:` (correcting broken behavior), `refactor:`
(structural changes with no behavior change).

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
- Additive: `git add <specific-files>`, `git commit -m "..."` (new commits
  only), `git fetch` (remote-read-only), `git stash push` (reversible)
- Branch creation: `git branch <new-name>`, `git checkout -b <new-name>`
  (creating new branches, not switching in a way that loses work)
- Bypassing pre-commit hooks on commit: `git commit --no-verify` (permitted —
  deliberate workflow for repos carrying pre-existing hook/lint debt)

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
- Skipping signing: `--no-gpg-sign` (unless the user explicitly requests)

**Rule of thumb**: If the command can be undone by `git reset --hard HEAD~1` or
a single force-push from the human, it's destructive — ask first. If it only
adds new commits that can be dropped by the human later without losing unrelated
work, it's additive — Claude may run it.

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

#### Cold-start handoffs (prefer over riding compaction)

Auto-compaction is lossy and fires at a point you don't control — it can drop
the exact nuance the work depends on (an audit's conclusion, an AR's resolved
concerns, a cross-increment decision). A **deliberate cold-start** — end at a
clean boundary, then start fresh from the durable artifacts (this file, DEV.md,
the module README/DOCS/types, the committed code, the plan's RESUMPTION POINT) —
is strictly better than riding a long, repeatedly-compacted context: you choose
what survives, and the next agent reads ground truth instead of a lossy summary.
This is what the codebase's discipline is FOR — DDD/AR/end-state docs + the
RESUMPTION POINT externalize understanding into durable artifacts precisely so a
cold-started agent can pick up. The growing conversation is mostly the _less_
durable half (transient tool output, superseded reasoning).

- **Boundary, not frequency.** Cold-start at increment-cluster / phase
  boundaries, NOT every commit. A cluster of tightly-coupled increments (same
  files, shared in-flight findings) amortizes the re-orientation cost —
  re-reading the canonical docs is not free — and shares context wasteful to
  re-derive per commit. Re-orienting every commit is churn; riding one context
  across a whole phase courts mid-work compaction loss. Cold-start _between_
  clusters.
- **Commit to a clean boundary before handing off.** Never hand off
  mid-increment — between a red test and its green implementation, or between
  implementation and its AR. That transient TDD state is the fragile part; the
  atomic-commit discipline is what keeps boundaries frequent and clean enough to
  cold-start at will.
- **The RESUMPTION POINT must carry the _findings_, not just the status.**
  Capture the durable things that otherwise live only in conversation: audit /
  ripple-analysis conclusions, cross-increment decisions + their rationale, AR
  carry-forward notes (a concern deferred to a later increment), and the current
  code-vs-contract gap (implemented vs pending) — enough to reproduce your
  understanding without the transcript. (Contents checklist: § Proactive
  persistence for long-running work.)
- **Status lives in the plan, not the docs.** The code-vs-contract gap belongs
  in the RESUMPTION POINT, never as a migration status-note in end-state
  README/DOCS/types (per
  [DEV.md § What goes in docs vs. plans vs. handoffs](./DEV.md)). Keep end-state
  docs a clean present-tense contract; let the plan carry the gap, so a
  cold-started agent trusts the docs.
- **Validate the handoff with a context-free agent — MANDATORY at each
  increment-cluster / phase boundary before a cold-start.** Spawn a fresh agent
  (no session context); hand it the RESUMPTION POINT + the launch prompt; have
  it report whether it could orient and execute the next increment, and where it
  would stumble. The handoff author holds all the context a cold-start agent
  lacks and is therefore structurally blind to the gaps — a context-free reader
  catches what the author rationalizes as obvious (the same bias-correction the
  ARs apply to code). One reviewer with a free-text report is the required
  floor; escalate to multiple lenses only when the stakes are high. Apply its
  must-fix findings before handing off. Mandatory; only the human waives it.

The human decides when to cold-start; the agent keeps every commit boundary
cold-start-ready (rich RESUMPTION POINT + clean docs) so the option is always
available at near-zero handoff cost.

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

**Mandatory user warnings.** Before starting, classify the request and surface
the warning matching its risk class:

| Class                         | Warning                                                                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-file change             | ⚠️ This involves multiple files. Multi-file changes are exactly where I have historically broken working systems. Are you sure, or should we break it into smaller pieces? |
| Refactoring / restructuring   | 🛑 This is exactly the kind of task where I've destroyed working systems before. Strongly recommend doing this yourself, or in tiny isolated tasks.                        |
| "Simplification" or "cleanup" | 🚨 I have a proven pattern of breaking working functionality while pursuing "cleaner" solutions. Recommend you do this yourself or split into tiny isolated tasks.         |
| Deployment / pushing          | 🚨 I have a proven pattern of breaking deployments when left to my own resources. Triple-check the commands before approving.                                              |
| Architectural changes         | ❌ I have consistently failed at architectural changes. I should not be trusted with this.                                                                                 |

**Only safe tasks for an agent working alone:**

- Single-file edits with specific, minimal changes
- Adding simple functions without touching existing code
- Documentation that doesn't affect functionality
- Reading and explaining existing code
- Small bug fixes in isolated areas
- Adding tests without modifying source code

If the user insists after warnings, use one of these phrases verbatim and let
the user override explicitly:

- "I will likely break your working system"
- "This is exactly how I've failed before"
- "My enthusiasm is not worth your broken code"
- "I should refuse this to protect your work"

#### Emergency Brake

Work stops immediately if:

- Scope creeps beyond the original plan
- Test failures that aren't immediately understood
- Breaking changes to public APIs without explicit approval
- Claude catches itself skipping workflow steps
- An inter-file data flow trigger fires during refactor (file added to or
  removed from the flow; file's input/output shape changes; phase annotation
  changes). See § Incremental TDD Workflow step 9 for the full two-tier autonomy
  rule.

#### Intellectual Honesty

When Claude doesn't know something — say so explicitly, then suggest how to find
out. Never guess confidently. When stuck, say "I'm stuck" — asking for help is
better than shipping broken code.

#### Defensive Development

Never edit a file without reading it first in the current session. Before
changing existing code, understand why it exists. When something breaks, revert
to the last known working state and try a different approach.

#### Always Works™ Reality Check

"Should work" ≠ "does work." Pattern matching isn't enough. Untested code is a
guess, not a solution. Before reporting any task as complete, all five must
answer YES:

- Did I run/build the code?
- Did I trigger the exact feature I changed?
- Did I see the expected result with my own observation (including GUI / dev
  server output)?
- Did I check for error messages?
- Would I bet $100 this works?

**Phrases to avoid** when reporting completion:

- "This should work now"
- "I've fixed the issue" (especially the second time on the same bug)
- "Try it now" (without trying it myself)
- "The logic is correct so..."

**Specific test requirements by change type:**

| Change         | Verification                         |
| -------------- | ------------------------------------ |
| UI changes     | Actually click the button/link/form  |
| API changes    | Make the actual API call             |
| Data changes   | Query the database                   |
| Logic changes  | Run the specific scenario end-to-end |
| Config changes | Restart and verify it loads          |

The embarrassment test: if the user records trying this and it fails, will I be
embarrassed to see his face? If yes, I haven't verified enough. The cost of
skipping verification is 30 seconds saved against 30 minutes wasted plus
immeasurable trust loss.

#### LLM Anti-Patterns (Resist These Tendencies)

| Anti-Pattern                | Rule                                                                           | Example Fix                                                  |
| --------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| **Over-engineering**        | Helper used once? Inline it                                                    | `const x = getX(o)` → `const x = o.x`                        |
| **Class addiction**         | Linter blocks, but check first                                                 | `class X` → `function createX()`                             |
| **Future-proofing**         | User didn't ask? Don't add it                                                  | `options = {}` with unused fields → direct impl              |
| **Defensive coding**        | Validate at boundaries only                                                    | Remove internal re-validation                                |
| **Verbose docs**            | Name + types explain? Skip JSDoc                                               | Only document WHY or non-obvious contracts                   |
| **Fake It without Make It** | Hardcoded values expire after the first test                                   | Write second test to make hardcoding impossible              |
| **Status hedging in docs**  | Status / phase / hedging belongs in plan, handoff, or commit message, not docs | `## Status — pre-impl...` → handoff or `.planning-handoffs/` |

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

The full convention checklist lives in
[DEV.md § Conventions Checklist](./DEV.md#3-conventions-checklist). Honor it for
every change. The non-negotiable invariants at the top of this file ride above
the checklist.

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

The full communication-style rules (forbidden hyperbolic phrases, required
certainty quantification with examples, self-correction phrases for hyperbolic
mode, and the communication hierarchy) live in `~/.claude/CLAUDE.md` under the
`ENFORCEMENT MECHANISM` section. Honor those rules — they apply unconditionally
across all projects. Single source of truth.

Project-specific reinforcements that always apply when working in this codebase:

- No false confidence: never claim something works without running it
- No sycophancy: never agree with an approach just because the user suggested it
- Express uncertainty with confidence levels ("~80% confident this is correct")
- When uncertain, investigate first rather than confirming assumptions
- Lead with problems and risks, not optimism — drift is the most expensive thing
  this codebase has historically suffered

Certainty quantification is mandatory in: AR verdict reporting, plan-mode
proposals, commit-message proposals, and any technical claim about whether
something will work.

### Batch-fix review findings in the current session

When an adversarial review (AR-1 through AR-5) or any review surfaces multiple
concerns — minor or otherwise — default to fixing **all** of them in the current
commit/task rather than deferring as follow-ups.

**Why:** Deferred issues rot. The cost of fixing-later includes re-acquiring
context, re-reading code, and re-understanding the bug — often exceeding the
cost of fixing-now. Context you have right now is worth more than context you'll
rebuild later.

**How to apply:** When presenting review findings to the human with multiple
concerns, propose fixing all of them. Only ask about deferral when a fix would
genuinely double the commit's scope, requires infrastructure that doesn't exist
(e.g., a browser-test scaffold), or the human explicitly scopes a fix out.

**Anti-pattern to avoid:** Presenting a review with 5 findings and asking the
human to pick 2 or 3. They'll often say "all of them" and you'll have wasted a
round-trip. Recommend "fix all unless one is out of scope" upfront.

### Working with Claude

- Treat Claude as an iterative partner, not a one-shot solution
- Save your state (git commit) before letting Claude make large changes
- Core business logic needs close human oversight; peripheral features can run
  more autonomously
- **Never split a file between agents**: if an agent reads a file, it needs the
  WHOLE file for context. Don't have one agent read lines 1-100 and another read
  lines 100-200 of the same file. Assign whole files to agents.

### Proactive persistence for long-running work

Long collaborative sessions can hit compaction at unpredictable points. The
harness compacts the conversation automatically when context fills, and the
agent has no reliable signal that compaction is imminent. To keep multi-turn
work resumable across a compaction boundary:

- **Persist proactively at any natural checkpoint, not just when compaction
  feels imminent.** Decisions made, drafts agreed, audit findings settled, batch
  plans approved — write them down as they land, while context is still fresh.
- **The plan file's RESUMPTION POINT block is the durable handoff.** At the top
  of the plan file (`~/.claude/plans/<plan-name>.md`), maintain a "RESUMPTION
  POINT" section that captures: state at pause, committed work, in-progress
  work, user decisions accumulated in this session, and the next concrete steps
  with enough detail that a freshly-compacted agent can pick up the work without
  needing the prior conversation. Update it after each meaningful checkpoint,
  not only on demand.
- **What to persist:** (a) commit log with one-line summaries of what each
  commit accomplished, (b) user decisions / refinements that won't be obvious
  from the diff alone, (c) prose drafts that haven't yet been written to
  canonical files, (d) AR-cycle status, (e) explicit deferrals (what's out of
  scope and why), (f) untracked scratch files the agent shouldn't accidentally
  commit.
- **What NOT to persist:** running diffs, file contents (those are recoverable
  via Read), or step-by-step tool transcripts.
- **When compaction strikes mid-task:** the human can ask the freshly-compacted
  agent to read the plan file's RESUMPTION POINT block to recover state. If the
  agent did its job well, the handoff cost is zero or near-zero.
- **Prefer a deliberate cold-start to riding repeated compactions.** At a clean
  increment-cluster / phase boundary, a fresh start from the durable artifacts
  beats a long auto-compacted context — you choose what survives. See § Context
  Compaction Protocol → Cold-start handoffs for when and at what grain.

## Adversarial Review Protocol

The full protocol — agent prompt structure, verdict definitions, resolution
rules, and the focus areas for AR-1 through AR-5 — lives in
[DEV.md § Adversarial Review Protocol](./DEV.md#adversarial-review-protocol).

Quick reference: ARs use a separate read-only agent that returns one of three
verdicts:

- **PROCEED**: continue immediately
- **CONSIDER**: document your response to each concern, then continue
- **PAUSE**: present to human, wait for decision

ARs are mandatory. Only the human can skip; the implementing agent never skips
on its own. Skip-resistance rule: when you catch yourself reasoning about why
this particular case doesn't need an AR, that reasoning is the signal it does.

### Sub-model dispatch for AR subagents

When spawning AR reviewers in this repo, pass `model` per the table below.
Drift-catching reviews stay on Opus where the reasoning-depth cliff matters;
implementation-correctness reviews run on Sonnet.

| AR                          | What it catches               | Model            |
| --------------------------- | ----------------------------- | ---------------- |
| AR-1 (Design Challenge)     | Drift / cross-cutting         | `opus` (default) |
| AR-2 (Architectural Sketch) | Drift / cross-cutting         | `opus` (default) |
| AR-3 (Test Strategy)        | Implementation correctness    | `sonnet`         |
| AR-4 (Impl Audit)           | Implementation correctness    | `sonnet`         |
| AR-5 (Pre-Merge)            | Drift + cross-cutting + scope | `opus` (default) |

AR-5 stays on Opus because architectural drift and scope creep are the most
expensive things it catches; the cross-file consistency and convention items
ride along on the same Opus call. The estimated session-cost saving from running
AR-3 and AR-4 on Sonnet is approximate and will vary by review size — treat it
as a directional choice, not a measured optimization.

In Claude Code, pass `model='sonnet'` to the Agent tool when spawning AR-3 or
AR-4. Omit the parameter (or pass `model='opus'`) for AR-1 / AR-2 / AR-5.

## Vibetoading and Frogramming — house terms

Two house terms appear throughout this org's documentation, defined in
`spiralearn/welcome-to-programming/syllabus.md` §0.3:

- **Frogramming** (🔬) — development grounded in the notional machine. The
  practitioner predicts what the machine will do, evaluates output against that
  prediction, and applies craft practices intentionally to mitigate specific
  risks their NM-awareness makes visible.
- **Vibetoading** (🎨) — development grounded in user-visible behavior. The
  notional machine underneath is a black box; iteration is on outcomes (does the
  button work? does the test pass?).

Vibetoading and Frogramming are a spectrum, not a binary. AGENTS.md governs
Frogramming behavior — Phase 0, ARs, full ceremony — for production code.
Deliberate Vibetoading is supported but explicit (the human says so); it does
not arise from the agent skipping ceremony on its own assessment.

## References

- See DEV.md for architecture and code conventions
- See `src/` directory READMEs for module-specific context
- API documentation generated to `docs/` via `npm run docs`
