# AI Agent Context

This file provides specific context for AI assistants working with this
repository (spiralearn / `@codeschoolinabox/spiralearn`).

- [Non-Negotiable Invariants](#non-negotiable-invariants)
- [Session Start Protocol](#session-start-protocol)
- [Project Overview](#project-overview)
- [Key Technical Context](#key-technical-context)
  - [Architecture](#architecture)
  - [Critical Conventions](#critical-conventions) (→ DEV.md)
  - [Readability Patterns](#readability-patterns) (→
    DEV-READABILITY-PATTERNS.md)
  - [Documentation Convention](#documentation-convention) (→ DEV.md)
  - [Type System](#type-system)
  - [Testing Approach](#testing-approach) (→ DEV.md)
  - [Linting Approach](#linting-approach) (→ DEV.md)
  - [Incremental TDD Workflow](#incremental-tdd-workflow)
  - [Context Compaction Protocol](#context-compaction-protocol)
  - [Safety Guardrails](#safety-guardrails)
  - [When Working on This Codebase](#when-working-on-this-codebase)
- [Orchestrated delegation](#orchestrated-delegation)
- [LLM Collaboration Conventions](#llm-collaboration-conventions)
- [Adversarial Review Protocol](#adversarial-review-protocol) (→ DEV.md for full
  protocol)
  - [Sub-model dispatch for AR subagents](#sub-model-dispatch-for-ar-subagents)
- [Work routing and ceremony](#work-routing-and-ceremony)
- [Vibetoading and Frogramming — house terms](#vibetoading-and-frogramming--house-terms)
- [References](#references)

---

## Non-Negotiable Invariants

These apply unconditionally, regardless of task size, time pressure, or user
encouragement. They cannot be overridden by momentum.

1. **Read before editing** — never modify a file you haven't read in this
   session.
2. **Phase 0 before Phase 1** — work through Phase 0 in order: **0.1 README**
   (with the ubiquitous-language glossary inside it) → **0.2 the twin**, or the
   `## Epistemology` block that discharges it → **AR-1**, which challenges the
   README and the twin together → **0.3 types.ts + the DOCS.md sketch + the
   tests**, written for real and committed skipped → **AR-2** → review, resolve,
   commit → **human gate**. Three artifact-named steps, not seven numbered ones
   ([DEV.md § Phase 0](./DEV.md#phase-0-documentation-specification-before-any-code)).
   Agents routinely skip this under time pressure. Do not skip it. **What binds
   unconditionally is the artifact order**; the chain above draws the gates at
   `ceremony: full`, and which of AR-1 and AR-2 actually fire is set by the
   declared level — each `### AR-N` section's **Skip:** line carries that caveat
   ([DEV.md § ceremony](./DEV.md#ceremony)). Reading a missing AR as license to
   reorder or drop an artifact inverts this invariant.
3. **Plan before implementing** — enter plan mode for anything beyond a trivial
   fix. Exception: user explicitly says "skip plan mode."
4. **One increment at a time** — complete Red → Green → Refactor → Lint before
   starting the next behavior.
5. **Atomic commits with clear messages** — commit autonomously after each
   passing TDD cycle and after completing Phase 0 artifacts. Each commit
   captures one behavior or milestone; never batch multiple increments. Message
   format lives in [§ Git checkpoints](#git-checkpoints). No per-commit approval
   prompt — announce each commit as it lands (SHA + message) so the human can
   audit and revert; new commits only, so every checkpoint is droppable. Pushing
   remains human-gated; the Phase-0 → Phase-1 human review gate is unchanged.
   Under orchestrated fan-out
   ([§ Orchestrated delegation](#orchestrated-delegation)) each worker's commits
   are still announced individually for audit (full SHA + message); the
   orchestrator only orders the ledger per-subtree — presentation, not
   aggregation — and the safe revert unit is the subtree.
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
11. **Validate every handoff with a context-free agent** — before handing off at
    any increment-cluster or phase boundary (and before any deliberate
    cold-start), spawn a fresh subagent with NO session context, give it the
    RESUMPTION POINT plus the launch/handoff prompt, and have it report whether
    it could orient and execute the next step and exactly where it would
    stumble. Apply its must-fix findings before the handoff is final. The author
    holds all the context the next agent lacks and is therefore structurally
    blind to their own gaps — this is the same bias-correction the ARs apply to
    code. **This step is routinely skipped — writing the handoff feels like
    finishing, so the validation never runs. Do not skip it.** Only the human
    waives it. (Full protocol:
    [§ Cold-start handoffs](#cold-start-handoffs-prefer-over-riding-compaction).)
12. **Every repo-state claim carries its source** — a statement about what a
    file says, what a command outputs, what was ruled, or what a subagent found
    is never made bare. It carries `[measured: <command run this session>]`,
    `[read: <file> § <heading> — "<quoted words>"]`, or
    `[relayed: <who said it>]`. **This fires regardless of felt certainty** — it
    exists for the confident repetition of something read once, relayed, or
    remembered from a superseded state, the case the **No confident guessing**
    invariant does not reach. If you cannot produce the tag's evidence in one
    command, you do not have the claim. Full rule, including why a memory file
    is never `read` evidence:
    [DEV.md § Sourced claims](./DEV.md#sourced-claims).

> If these feel like friction, that friction is working as intended.

---

## Session Start Protocol

Before writing any code, complete this checklist in order. Do not open an
editor, create a file, or write a single line of code until every step is done.

- [ ] **Read this file** (AGENTS.md) — if you haven't in this session, read it
      now
- [ ] **Read the module README.md** — understand what this module does and where
      it fits in this repository
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

See [README.md](./README.md) for what this repository contains and how it is
organized.

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

Full guide with worked before/after examples:
[DEV-READABILITY-PATTERNS.md](./DEV-READABILITY-PATTERNS.md)
([DEV.md § 12. Readability Patterns](./DEV.md#12-readability-patterns) now just
points here). Headline patterns: guard-first/happy-path-last, named intermediate
values, ternary for value selection only, within-file helpers for readability
(single-use OK), WHY comments for non-obvious JS semantics, numbered step
comments for multi-phase functions, blank lines as paragraph breaks.

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

**Migration is transport, not authorship.** Moving, splitting, or restructuring
documentation transports content verbatim by default; every omission, merge, or
reword is enumerated with its justification in a **loss ledger** (commit body or
plan). Silent loss is a defect of the same severity as a failing test. Cite
content by stable alias or concept plus a discovery command, never by volatile
source-tree path. Full rule:
[DEV.md § Documentation migration discipline](./DEV.md#documentation-migration-discipline).

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

See [DEV.md § Linting Conventions](./DEV.md#linting-conventions) for full
details. Summary:

- **Lint pipeline**: `npm run lint` = ESLint (code + `.mdx`) + markdownlint-cli2
  (`.md`) + ls-lint (file names) + cspell (spelling); plus Prettier (formatting)
  and TypeScript (types)
- Most functional/import/style conventions auto-enforced via ESLint
- Pre-commit hooks run Prettier (formatting only) on staged files; linters run
  via per-file checkpoints and `npm run validate`, never the hook
- Manual review for: default `= {}` params, verb-first naming, file granularity,
  comment quality
- `npm run validate` checks every tool at once — it is the aspirational full
  gate while repo-wide lint carries known burndown debt; per-file checkpoints
  are the per-commit gate (see
  [DEV.md § Development Workflow](./DEV.md#development-workflow))

### Incremental TDD Workflow

All development uses TDD with atomic increments. See
[DEV.md § Incremental Development Workflow](./DEV.md#incremental-development-workflow)
for the full process.

**Summary:**

- **Phase 0** _(do not skip)_ — **three steps, not seven**: **0.1 README spec**
  (domain model in prose, bounded context) **with the ubiquitous-language
  glossary inside it** — the glossary is not a separate step → **0.2 the twin**,
  or the `## Epistemology` block that discharges it at `twin-doc: none` → **AR-1
  design challenge**, which challenges the README **and the twin** together →
  **0.3 types.ts** (domain model in TypeScript) **+ architectural sketch in
  DOCS.md** including the **Mermaid `## Data flow` diagram** (structural target
  for the Refactor step; abstraction level matches this directory's position in
  the tree) **+ the tests, written for real and committed skipped** → **AR-2
  sketch challenge** → commit Phase 0 artifacts
  (`docs: establish [module] domain model and architectural sketch`). Phase 1
  un-skips one test at a time in ZOMBIES order; AR-3 fires on each un-skip.
- **Phase 1**: For each increment: JSDoc → stub → test (ZOMBIES order) → AR-3 →
  implement (Fake It is valid for the first test; second test must triangulate
  it away) → lint → refactor (structural quality against DOCS.md sketch) → AR-4
  → quality checks → commit (atomic: one behavior per commit; message:
  `add: [behavior this increment implements]`)
- **Phase 2**: Full quality checks → AR-5 pre-merge review → commit (autonomous,
  announced) → push prompt

Each passing TDD cycle = one atomic commit. Do not batch behaviors.

**Default execution after Phase 0:** a session fans out across the type-defined
dependency DAG by default
([§ Orchestrated delegation](#orchestrated-delegation)); the human may override
to synchronous.

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

For user-observable increments, a 🔍 Sandbox checkpoint fires between the Phase
1 quality-checks step and the commit: the user exercises the feature at a
running dev server. Cosmetic redirects roll into the next increment;
**behavioral defects block the commit**. Checkpoints are gate points, not
optional — only the human skips, and the only legitimate skip is an increment
with no user-visible surface, declared explicitly ("no sandbox checkpoint: pure
utility"). Full cycle diagram, redirect policy, and content-quality rules:
[DEV.md § Sandbox Checkpoints](./DEV.md#sandbox-checkpoints--user-observable-features).

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
- **Repo-state claims in the plan carry their evidence** —
  `[measured:]`/`[read:]`/`[relayed:]`, per
  [DEV.md § Sourced claims](./DEV.md#sourced-claims). A plan is one of the four
  auditable surfaces, and the human's approval gate is where a stale fact does
  the most damage.
- Before writing any code, explain in plain language what you're about to do and
  why

**Plans must explicitly list every workflow step** — the full Phase 0 /
per-increment / Phase 2 sequence summarized in
[§ Incremental TDD Workflow](#incremental-tdd-workflow) above, with every AR
trigger point and commit step written out. Plans that omit these steps are
incomplete. "See AGENTS.md for the workflow" is not a valid substitute — write
the steps out.

**During TDD cycles:**

- Run lint checkpoints on specific modified files, not the whole codebase:
  `npx eslint <file>` for code and `.mdx`,
  `npx markdownlint-cli2 --no-globs "<file>"` for `.md` (the compound
  `npm run lint` does not forward file arguments, and markdownlint-cli2 treats a
  bare file argument as a glob unless `--no-globs` is passed)
- Write tests in ZOMBIES order (Zero → One → Many...) to force triangulation.
  After the first test, ask: _could this be passed by returning a hardcoded
  value?_ If yes, the second test must make that impossible before you
  implement.
- **Patch-or-reroll check (step 7b)**: after the first green, before lint
  checkpoint 3. If green came from expected roughness (Fake It, unrefined but
  correctly-shaped code), proceed normally. If it came from guessing,
  backtracking, or touching more than the stub implied, discard the
  implementation and re-implement fresh naming the specific confusion — the test
  is untouched and still valid, nothing is committed yet to lose, and patching a
  wrongly-shaped attempt typically costs more than a clean second try.
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
- **Two-tier autonomy** (mechanical, not judgment): intra-file refactors are
  autonomous; inter-file changes require user check-in if ANY trigger fires
  (file added to or removed from the flow; I/O shape change; phase annotation
  change; helper extracted to a new domain-related file — domain-agnostic
  utilities are exempt). Full trigger definitions:
  [DEV.md § Incremental Development Workflow](./DEV.md#incremental-development-workflow),
  step 9.
- At step 12 (self-review): run through the LLM Anti-Pattern Checklist. Reality
  check: did I run it? Did I trigger the exact behavior I changed? Would I bet
  $100 this works? Flag what you're least confident about for the user to
  review.
- At step 13: show actual output from quality checks — don't just claim "tests
  pass"

#### Git checkpoints

(Commits are autonomous and announced; pushing is prompted:)

- After Phase 0 completes: commit
  `docs: establish [module] domain model and architectural sketch`, announce the
  SHA, and stop at the Phase-0 → Phase-1 human review gate (unchanged).
- After each passing TDD cycle: commit
  `add: [behavior this increment implements]` and announce the SHA.
- After the last increment: "Sprint complete — ready to push to main" — the push
  itself stays with the human
  ([§ Git: Additive Actions Only](#git-additive-actions-only)).

Commit message format: imperative voice, one line, describes the behavior or
artifact — not the mechanical change. Prefixes: `add:` (new behavior), `docs:`
(documentation/types/README), `fix:` (correcting broken behavior), `refactor:`
(structural changes with no behavior change).

**Commit bodies carry sourced claims.** A body that states a repo fact — a
count, what a command returned, what a file says, what was ruled — tags it
`[measured:]`/`[read:]`/`[relayed:]` with its evidence
([DEV.md § Sourced claims](./DEV.md#sourced-claims)). The body is the one
durable record of what was actually verified, and it is immutable once written
since amend is forbidden. AR-4 and AR-5 audit this.

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
  `git branch --list`, `git ls-files`, `git remote -v`, `git rev-parse`,
  `git grep`
- Additive: `git add <specific-files>`, `git commit -m "…" -- <your paths>` (new
  commits only; the pathspec is required — see below), `git fetch`
  (remote-read-only), `git stash push` (reversible)
- Branch creation: `git branch <new-name>`, `git checkout -b <new-name>` — only
  when the user has explicitly instructed a branch in the current conversation
  (the default workflow is commit-to-main)
- Bypassing pre-commit hooks on commit: `git commit --no-verify` (permitted —
  deliberate workflow for repos carrying pre-existing hook/lint debt)

> **This worktree is shared, and the commit form is enforced by a hook.** A
> commit with no explicit pathspec after `--` is DENIED at `PreToolUse`, because
> an unscoped commit takes whatever is staged — including a peer's files. The
> canonical rules — the stage-and-commit sequence, the `index.lock` retry, and
> the foreign-debt baselines your quality gates are measured against — live in
> [DEV.md § Shared-worktree git mechanics](./DEV.md#shared-worktree-git-mechanics).
> Read them before your first commit; they bind every agent and tool here.

**Forbidden** (destructive, rewriting, or publishing):

- History rewriting: `git commit --amend`, `git rebase` (any form),
  `git reset --hard`, `git reset` (soft/mixed OK only with explicit user
  instruction for a specific file unstage)
- Undoing/replaying history: `git revert`, `git cherry-pick` — additive in
  mechanism, but the agent does not unilaterally undo or replay history; prompt
  the human
- Publishing: `git push` (any form, including `--force`, `--force-with-lease`,
  `--tags`, `--delete`)
- Destroying work: `git checkout -- <file>` / `git restore <file>` (discards
  unstaged changes), `git clean -f`, `git stash drop`, `git stash clear`,
  `git branch -D`, `git branch -d`, `git tag -d`, `git fetch --prune` (deletes
  local remote-tracking refs)
- Merging: `git merge` (any form) — branch topology is the human's decision
- Skipping signing: `--no-gpg-sign` (unless the user explicitly requests)

**Rule of thumb**: if undoing the command would require a force-push or a reflog
rescue from the human, it's destructive — ask first. If it only adds new commits
that can be dropped by the human later without losing unrelated work, it's
additive — Claude may run it.

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
3. **Commit (autonomous, announced)** — atomic checkpoint before compaction
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
  understanding without the transcript. (Contents checklist:
  [§ Proactive persistence for long-running work](#proactive-persistence-for-long-running-work).)
- **Status lives in the plan, not the docs.** The code-vs-contract gap belongs
  in the RESUMPTION POINT, never as a migration status-note in end-state
  README/DOCS/types (per
  [DEV.md § What goes in docs vs. plans vs. handoffs](./DEV.md#what-goes-in-docs-vs-plans-vs-handoffs)).
  Keep end-state docs a clean present-tense contract; let the plan carry the
  gap, so a cold-started agent trusts the docs.
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
  changes). See [§ Incremental TDD Workflow](#incremental-tdd-workflow) step 9
  for the full two-tier autonomy rule.

**Resolution default**: if the brake fires before this increment is committed,
default to _proposing_ discard-and-retry over patch-in-place — name the specific
issue and re-attempt once the human confirms. Nothing is lost by discarding
since nothing is committed. This sets the default proposal, not an exception to
human sign-off — the human can still choose to patch instead. If the brake fires
after a commit already exists, discarding means reverting committed history,
which stays a human-gated git action
([§ Git: Additive Actions Only](#git-additive-actions-only)) — never a
unilateral agent choice.

#### Intellectual Honesty

When Claude doesn't know something — say so explicitly, then suggest how to find
out. Never guess confidently. When stuck, say "I'm stuck" — asking for help is
better than shipping broken code.

The complement, for when Claude is _not_ hedging: a claim that feels certain
still carries its source. Confident repetition of something read once, relayed,
or remembered from a superseded state is the failure this section does not
catch, because nothing about it feels like guessing — see
[§ Non-Negotiable Invariants](#non-negotiable-invariants), invariant 12.

#### Defensive Development

Never edit a file without reading it first in the current session. Before
changing existing code, understand why it exists. When something breaks, revert
to the last known working state and try a different approach.

#### Always Works™ Reality Check

"Should work" ≠ "does work." Pattern matching isn't enough. Untested code is a
guess, not a solution. Before reporting any task as complete, all six must
answer YES:

- Did I run/build the code?
- Did I trigger the exact feature I changed?
- Did I see the expected result with my own observation (including GUI / dev
  server output)?
- Did I check for error messages?
- **Does every claim in this report carry its evidence — or am I repeating
  something I read once, was told, or remember from a superseded state?**
  ([§ Non-Negotiable Invariants](#non-negotiable-invariants), invariant 12.
  Always Works™ verifies code; this question verifies claims.)
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

| Anti-Pattern                | Rule                                                                                                     | Example Fix                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Over-engineering**        | New file needs 2+ call sites; in-file extraction is free; trivial wrappers that name nothing get inlined | `const x = getX(o)` → `const x = o.x`                        |
| **Class addiction**         | Linter blocks, but check first                                                                           | `class X` → `function createX()`                             |
| **Future-proofing**         | User didn't ask? Don't add it                                                                            | `options = {}` with unused fields → direct impl              |
| **Defensive coding**        | Validate at boundaries only                                                                              | Remove internal re-validation                                |
| **Verbose docs**            | Name + types explain? Skip JSDoc                                                                         | Only document WHY or non-obvious contracts                   |
| **Fake It without Make It** | Hardcoded values expire after the first test                                                             | Write second test to make hardcoding impossible              |
| **Status hedging in docs**  | Status / phase / hedging belongs in plan, handoff, or commit message, not docs                           | `## Status — pre-impl...` → handoff or `.planning-handoffs/` |

##### Pre-Proposal Checklist

Before proposing code, answer YES to ALL:

- [ ] **Simplest solution?** Not most "elegant" or "extensible"
- [ ] **Only what requested?** No future-proofing, no "nice-to-haves"
- [ ] **Helpers placed by the extraction rule?** In-file freely for readability;
      new file only at 2+ call sites
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

## Orchestrated delegation

Development defaults to **delegation fan-out** — not a single linear stream (and
distinct from the broad _read_ fan-out of Explore subagents). It is the
[§ Cold-start handoffs](#cold-start-handoffs-prefer-over-riding-compaction)
discipline rotated **temporal → spatial**: instead of one agent handing off to a
future agent across time, an **orchestrator** session hands off to fresh
**worker** subagents across the dependency graph. The temporal cold-start is
human-timed; this spatial rotation is automatic, because the graph is
**type-defined**.

**Default, not opt-in.** After Phase 0, absent explicit human prompting, a
session fans out. This is trustworthy by default because dispatch is
_mechanical_ — read from the type-defined DAG the human locked at the Phase-0 →
Phase-1 gate, not from the agent's judgment about what is independent. The human
may override to synchronous at any time.

- **The guard.** A type edge ⇒ **serialize that pair** (mechanical and certain).
  Everything else runs **parallel by default** — serializing work the DAG allows
  in parallel wastes the human's wall-clock and saves no tokens (human ruling
  2026-07-29). Before launching, the orchestrator sweeps the candidates for
  non-type couplings: among them **environment colocation** (node vs. browser /
  `Worker` + `SharedArrayBuffer`), **shared frozen-singleton / registration
  order**, and **semantic-protocol** contracts — examples, not an exhaustive
  checklist. A cleared sweep launches parallel; a coupling that cannot be
  cleared serializes that pair only, never the wave.
- **Enrichment over reliance.** A real ordering dependency the types cannot see
  is a `types.ts` _modeling gap_. Recurring hidden dependencies are a signal to
  enrich the contract until the type graph **is** the full DAG — not to lean
  harder on the guard.

**A worker is a fresh subagent.** It owns one **complete triangulated unit** — a
function (or tight pair) plus its full ZOMBIES increment cluster — and runs the
full per-increment cycle itself (ZOMBIES → `ar-3` → implement → lint → refactor
against the DOCS sketch → `ar-4`), committing green. Full ceremony, not a
lightweight mode.

> **Ceremony is uniform _within a declared level_, and the level is not yours to
> set.** You never classify an increment "mechanical" to skip or thin its
> reviews, and you never lower the level to avoid one. **The human sets it, per
> increment or per campaign.** Which ARs fire at each level, and the default,
> are stated once in
> [DEV.md § Work routing and ceremony](./DEV.md#work-routing-and-ceremony). **No
> level removes AR-5.** If you find yourself reasoning about why this particular
> case needs less review, that reasoning is the signal it needs more. Never
> split a worker mid-triangulation: the clean commit boundary is the clean
> delegation boundary (the same rule as cold-start's "never hand off between a
> red test and its green"). Order the DAG bottom-up — leaf → engine → API, per
> [§ Dependency-order coverage](./DEV.md#dependency-order-coverage) — and
> parallelize only across subtrees already committed-and-covered that pass the
> guard.

**A worker is also a mini cold-start**, so its launch prompt is a cold-start
launch prompt: `DEV.md`'s conventions, the module README/DOCS/types, its cluster
contract, and an explicit instruction to read its own governance file per the
repo-root `CLAUDE.md` router before starting — a deliberate backstop:
router-text reach into a spawned worker's context has been observed both present
(measured 2026-07-29) and absent (2026-07-28), so the launch prompt names the
step rather than assuming it happens automatically. The orchestrator's
decomposition and launch prompts are themselves a handoff their author is blind
to — so the mandatory context-free validation pass checks the **decomposition
before each fan-out wave** (the right grain; not a per-worker regress).

**The orchestrator holds the coherence spine** and nothing else: `types.ts`, the
DOCS `## Data flow` diagram, the plan/DAG/gate ledger, and the **seam reads** at
DAG joins — **never** per-worker implementation churn. **Lean ≠ blind:** it
reads the committed contracts where subtrees join to catch seam-slop (two
individually-correct functions integrating wrong);
[Always Works™](#always-works-reality-check) at the seam cannot be delegated. It
**serializes its own spine edits** — only one `types.ts` reconciliation in
flight at a time (invariant 4, re-applied to the orchestrator's own work).

**Workers report DONE | BLOCKED | FLAG — no fourth channel:**

- **DONE** — verified and committed; Always Works™ satisfied. No confidence
  caveats: "green but couldn't verify X" is _not_ DONE — it is BLOCKED, or X is
  out of scope and already on the DAG. (Coverage a node test structurally can't
  reach → _move the test_, not ship a caveat.)
- **BLOCKED** — can't finish this increment; report up, the orchestrator pivots.
- **FLAG** — either (a) an inter-file contract boundary it can't cross alone
  (the [two-tier "inter-file → check in" rule](#claude-specific-workflow-notes)
  — triggers at [DEV.md step 9](./DEV.md#phase-1-tdd-implementation) —
  delegated: the orchestrator is first responder and may resolve within the
  spine it owns, but `types.ts`/DOCS changes still need human approval), or (b)
  a _suspected_ cross-subtree coupling it can't confirm from inside its context,
  which the orchestrator then checks at the seam. FLAG-(b) is how the guard's
  blind spot reports from below.

Knowledge routes to durable homes, never to a status channel: design rationale →
WHY-comments, contract limits → JSDoc, cross-file carry-forward → the
orchestrator's plan as a FLAG, status/confidence → nowhere
([§ What goes in docs vs. plans vs. handoffs](./DEV.md#what-goes-in-docs-vs-plans-vs-handoffs)).

**All gates are unchanged** — 🔍 sandbox checkpoints, commit prompts, AR PAUSE
resolutions, and the Phase-0 → Phase-1 human gate stay with the orchestrator and
the human; fan-out removes no gate. The point is not throughput — it is a
**permanently lean and coherent orchestrator**, holding only the spine and never
the churn, so the work stays trackable and drift-resistant across a long body of
development.

**Registered instruments** (discoverable by name; each contract lives in its own
file): the `tdd-worker` subagent (`.claude/agents/tdd-worker.md`) is the worker
contract above, launched by `subagent_type` — until orchestrators launch it by
name, its contract covers nothing; the `harness-probe` subagent measures the
live subagent harness at harness/model upgrades; the `fanout` skill builds
worker briefs around measured baselines (`scripts/repo-facts.mjs` output pasted,
never retyped); the `handoff` skill builds and context-free-validates resumption
points, ending in the human's last-mile instructions; the `btw` skill answers
side-questions in a subagent so research never floods the orchestrator's
context.

**Governance surface (invariant):** `CLAUDE.md`, `.claude/agents/*.md`,
`.claude/skills/**`, `.claude/hooks/**`, `.claude/settings.json`, `DEV.md`, and
`AGENTS*.md` are governance surface — agents never edit them without explicit
human instruction in the current conversation. If a review is in flight,
reviewers read the working copy, not the baseline.

## LLM Collaboration Conventions

### Code Organization for LLM Generation

The conventions in DEV.md are designed to help LLMs generate correct code on the
first attempt:

- **Complete TypeScript types** prevent guessing field names/types
- **Predictable `kebab-case` filenames** enable discovery without searching
- **"Why" comments** signal intent that syntax can't convey
- **Self-documenting error messages** include context for debugging
- **Structural consistency** (imports → main → hoisted helpers; function files
  open with an inline `export default function`) enables prediction

### Communication Discipline

The full communication-style rules (forbidden hyperbolic phrases, required
certainty quantification with examples, self-correction phrases for hyperbolic
mode, and the communication hierarchy) live in `~/.claude/CLAUDE.md` under the
`ENFORCEMENT MECHANISM` section. Honor those rules — they apply unconditionally
across all projects. Single source of truth.

Project-specific reinforcements that always apply when working in this codebase:

- Lead with problems and risks, not optimism — drift is the most expensive thing
  this codebase has historically suffered
- **Repo-state claims carry `[measured:]` / `[read:]` / `[relayed:]` with their
  evidence**, in chat as in writing. Certainty quantification says how sure you
  are; the tag says what you are sure _from_ — and the failures this repo has
  actually shipped were confident, not uncertain. Full rule and the audit
  command: [DEV.md § Sourced claims](./DEV.md#sourced-claims).

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
  commit, (g) tagged evidence for every repo-state claim the RESUMPTION POINT
  asserts ([DEV.md § Sourced claims](./DEV.md#sourced-claims)) — a handoff is
  where a stale number travels furthest, because the next agent has no way to
  tell measurement from memory.
- **What NOT to persist:** running diffs, file contents (those are recoverable
  via Read), or step-by-step tool transcripts.
- **When compaction strikes mid-task:** the human can ask the freshly-compacted
  agent to read the plan file's RESUMPTION POINT block to recover state. If the
  agent did its job well, the handoff cost is zero or near-zero.
- **Prefer a deliberate cold-start to riding repeated compactions.** At a clean
  increment-cluster / phase boundary, a fresh start from the durable artifacts
  beats a long auto-compacted context — you choose what survives. See
  [§ Cold-start handoffs](#cold-start-handoffs-prefer-over-riding-compaction)
  for when and at what grain.

## Adversarial Review Protocol

The full protocol — agent prompt structure, verdict definitions, resolution
rules, and the focus areas for AR-1 through AR-5 — lives in
[DEV.md § Adversarial Review Protocol](./DEV.md#adversarial-review-protocol).
**You do not need to read each AR-N's focus-area bullet list yourself** — the
registered `ar-1` through `ar-5` subagents fetch those directly from `DEV.md`
when they run. You still own each AR-N's **Trigger** and **Provide to agent**
lines — both live in `DEV.md`, one opening and one closing each `### AR-N`
section (e.g. [DEV.md § AR-1](./DEV.md#ar-1-design-challenge)) — read just those
two lines per gate, not the focus-area bullets sandwiched between them.

Quick reference: ARs use a separate read-only agent that returns one of three
verdicts:

- **PROCEED**: continue immediately
- **CONSIDER**: document your response to each concern, then continue
- **PAUSE**: present to human, wait for decision

**Pass file paths and the baseline SHA, never pasted contents.** Record
`git rev-parse HEAD` at plan approval; AR-5 reviews `baseline..HEAD` and runs
`git diff` itself. Reviewers have Read and Bash — `git grep` covers search; let
them pull their own inputs.

ARs are mandatory. Only the human can skip; the implementing agent never skips
on its own. Skip-resistance rule: when you catch yourself reasoning about why
this particular case doesn't need an AR, that reasoning is the signal it does.

### Sub-model dispatch for AR subagents

Model selection lives in the registered `ar-N` agents' frontmatter — do not pass
a `model` parameter when spawning ARs; it would silently override the configured
roster. The canonical roster table, the tier reasoning, and the inherit caveat
live in [DEV.md § Sub-model dispatch](./DEV.md#sub-model-dispatch).

## Work routing and ceremony

Two questions govern every piece of work here — **what kind of work is this**,
and **how heavily is it reviewed** — and they are answered in one place:
[DEV.md § Work routing and ceremony](./DEV.md#work-routing-and-ceremony). It is
not restated here.

What you need before reading it:

- The default is **software work · `twin-doc: none` · `ceremony: medium` ·
  `prospective`**. Unnamed paths are software work. The default is a declared
  position, not a lapse — and the declaration is what makes it one.
- **You state three of the four answers; you never state `ceremony`.** The kind
  of work is derived from the path, mechanically. `ceremony` is the human's.
- Record the answers in the **commit body**. A plan file is not a record.

```text
work: software · twin-doc: none · ceremony: full (AR-3 n/a) · prospective
```

## Vibetoading and Frogramming — house terms

Two house terms appear throughout this org's documentation (defined inline below
— the inline definitions are the contract):

- **Frogramming** (🔬) — development grounded in the notional machine. The
  practitioner predicts what the machine will do, evaluates output against that
  prediction, and applies craft practices intentionally to mitigate specific
  risks their NM-awareness makes visible.
- **Vibetoading** (🎨) — development grounded in user-visible behavior. The
  notional machine underneath is a black box; iteration is on outcomes (does the
  button work? does the test pass?).

These are terms the **curriculum teaches**. They are **not** governance labels,
and reaching for one as a routing label is the error this section exists to
catch. What kind of work a unit is, and how heavily it is reviewed, are answered
by [DEV.md § Work routing and ceremony](./DEV.md#work-routing-and-ceremony) —
which deliberately uses neither word. Frogramming and Vibetoading name a
practitioner's **stance**, defined by which twin they hold; no file path, no
declared value, and no ceremony level asserts that anyone holds a twin.

They are a spectrum, not a binary, and **neither is the default governance
mode** (human ruling 2026-08-04). The default is stated in one place — the
default cell in § Work routing and ceremony. Deliberate vibetoading is supported
but explicit: the human declares it; it never arises from the agent skipping
ceremony on its own assessment.

## References

- See DEV.md for architecture and code conventions
- See `src/` directory READMEs for module-specific context
- API contracts live as JSDoc/TSDoc in source; no generated-docs pipeline is
  currently wired
