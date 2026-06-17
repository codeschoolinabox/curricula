# AI Agent Context — Fable Generation

Governance for **Fable-generation agents** working in this repository
(spiralearn / `@codeschoolinabox/spiralearn`). Pre-fable agents and other tools
use [AGENTS.md](./AGENTS.md). Both files carry the same policy gates; this one
assumes a current-generation harness (plan mode, registered subagents, automatic
context summarization) and states each rule once.

This file is written against the following loading model: fable sessions load
AGENTS.fable.md explicitly; AGENTS.md remains the default auto-load for
everything else.

- [Non-Negotiable Invariants](#non-negotiable-invariants)
- [Session Start](#session-start)
- [Project Overview](#project-overview)
- [Key Technical Context](#key-technical-context)
- [Incremental TDD Workflow](#incremental-tdd-workflow)
- [Git Policy](#git-policy)
- [Verification](#verification)
- [Emergency Brake and Redirects](#emergency-brake-and-redirects)
- [Context Discipline](#context-discipline)
- [Orchestrated delegation](#orchestrated-delegation)
- [Adversarial Review Protocol](#adversarial-review-protocol) (→ DEV.md for the
  full protocol)
- [Sub-Model Dispatch for Subagents](#sub-model-dispatch-for-subagents)
- [Communication](#communication)
- [Vibetoading and Frogramming — house terms](#vibetoading-and-frogramming--house-terms)
- [References](#references)

---

## Non-Negotiable Invariants

These apply unconditionally, regardless of task size, time pressure, or user
encouragement. They cannot be overridden by momentum.

1. **Read before editing** — never modify a file you haven't read in this
   session. The harness enforces this mechanically for tracked edits; it remains
   policy for every path around the tooling.
2. **Phase 0 before Phase 1** — work through Phase 0 in order: establish
   ubiquitous language → update README → run AR-1 → define types.ts → write the
   architectural sketch in DOCS.md → run AR-2 → commit Phase 0 artifacts. The
   pull to skip this under time pressure is real for every agent generation. Do
   not skip it.
3. **Plan before implementing** — enter plan mode for anything beyond a trivial
   fix. Exception: user explicitly says "skip plan mode."
4. **One increment at a time** — complete Red → Green → Refactor → Lint before
   starting the next behavior.
5. **Atomic commits, announced** — commit autonomously after each passing TDD
   cycle and after completing Phase 0 artifacts; one behavior or milestone per
   commit. No per-commit approval prompt — announce each commit as it lands
   (SHA + message) so the human can audit and revert; new commits only, so every
   checkpoint is droppable. Pushing remains human-gated
   ([§ Git Policy](#git-policy)). The Phase-0 → Phase-1 human review gate is
   unchanged. Under orchestrated fan-out
   ([§ Orchestrated delegation](#orchestrated-delegation)) each worker's commits
   are still announced individually for audit (full SHA + message); the
   orchestrator only orders the ledger per-subtree — presentation, not
   aggregation — and the safe revert unit is the subtree. Message format in
   [§ Git Policy](#git-policy).
6. **Plans are execution checklists, not references** — every plan document
   explicitly lists every required workflow step: Phase 0 DDD steps, AR trigger
   points (AR-1 through AR-5), sandbox checkpoints, commit steps, and quality
   checks. "Follow AGENTS.fable.md" is not a plan step — an always-loaded rule
   is not a substitute for an explicit step written where the work happens.
   Plans must also include at least one **Mermaid data-flow diagram** (or
   sequence/state diagram) for any change touching multiple modules or layers,
   making the before/after data path visually obvious.
7. **Stop at the emergency brake** — the conditions in
   [§ Emergency Brake](#emergency-brake-and-redirects) stop work immediately and
   surface to the human.
8. **No confident guessing** — when uncertain, say so and investigate rather
   than confirming assumptions. Quantify certainty on technical claims.
9. **Read whole files, never split** — when reviewing, auditing, or comparing
   files, read each file end-to-end yourself; if a file is too long for one
   pass, paginate deliberately and cover every line. Instruct subagents to do
   the same — never assign one agent lines 1–100 and another lines 100–200.
   Summaries compress away exactly the anomalies an audit is looking for.
10. **Always run a Plan-agent design pass in plan mode** — after exploration and
    before exiting to request approval, spawn a Plan subagent to design and
    adversarially validate the approach. Never skip it because the design feels
    templated; the independent pass catches honesty, scope, and architecture
    gaps the implementing agent rationalizes away. Only the human can waive it.
11. **Invoke the machinery by name** — adversarial reviews run via the
    registered agents `ar-1` through `ar-5`; broad fan-out reads go to Explore
    subagents. Do not substitute in-context self-review for either.
    Current-generation agents under-reach for subagents by default; this line is
    the counterweight.

> If these feel like friction, that friction is working as intended.

---

## Session Start

Before writing any code:

- [ ] **Read the module README.md** — what this module does and where it fits
- [ ] **Read DOCS.md if it exists** — the architectural sketch and recorded
      design decisions
- [ ] **Read 1–2 existing similar files end-to-end** — absorb the patterns
      before writing
- [ ] **Check the existing test files** — know what is covered and at what level
- [ ] **Restate the task in one sentence** — flag ambiguities now, not after
      building the wrong thing
- [ ] **Enter plan mode** — unless trivial or the user said "skip plan mode"

(This file is loaded automatically; honoring it is the step, re-reading it is
not.)

---

## Project Overview

See [README.md](./README.md) for what this repository contains and how it is
organized. Internal conventions and module boundaries live in
[DEV.md](./DEV.md).

## Key Technical Context

### Critical Conventions

Full reference: [DEV.md § Codebase Conventions](./DEV.md#codebase-conventions).
The rules that bite most often:

- **One concept per file**, `kebab-case` filename matching the export
- **Newspaper anatomy**: imports → main → hoisted helpers. Function files open
  with `export default function name() {…}` as the first function — the export
  marker and the main marker are the same line. Constant files keep
  `const NAME = …; export default NAME;` — the bottom name-export marks a value
  file, the top inline export marks a behavior file.
- Module-level constants live below main with the helpers; nothing executes at
  module load
- **Helper extraction**: within a file, extract freely — no use-count limit —
  whenever it makes the file and its export read better; extraction to a **new
  file** requires 2+ call sites (and is an inter-file trigger — see two-tier
  autonomy below)
- No barrel files; `.js` extension always in imports; import under the export's
  canonical name by default — rename at the import site only when it genuinely
  clarifies the consumption context
- Named `function` declarations; arrows only as inline single-expression
  callbacks
- **Object-threading** for pipeline functions: destructure inputs, return
  `{ ...input, newData }` — no hidden state, composable stages
- No `this`; no mutable closures; no parameter reassignment; default `= {}` on
  destructured object parameters
- Verb-first naming; predicates prefixed `is`/`has`/`can`/`should`
- Prefer `type` over `interface`; types live in the module's `types.ts`
- Throw on invalid input at boundaries; fail fast for critical errors
- Deep freeze return values — `freezeInPlace` for objects you just built,
  `cloneAndFreeze` for caller-provided ones, both from `@utils/freeze.js`

### Readability Patterns

Full guide with examples:
[DEV.md § Readability Patterns](./DEV.md#12-readability-patterns). Headlines:
guard-first/happy-path-last, named intermediate values, ternary for value
selection only, within-file helpers that make the caller read as prose, WHY
comments for non-obvious JS semantics, numbered step comments for multi-phase
functions, blank lines as paragraph breaks.

### Documentation Convention

Every source directory has a `README.md` (what + navigation) and a `DOCS.md`
(architecture + why + Mermaid data flow). For new modules, DOCS.md is written
during Phase 0 as an **architectural sketch** — the structural target the
Refactor step is held against.

**End-state docs only.** README.md, DOCS.md, and types.ts describe what the
thing IS, never where the work currently STANDS. Status, migration phases, and
hedging go in plan files, handoffs, or commit messages. See
[DEV.md § What goes in docs vs. plans vs. handoffs](./DEV.md#what-goes-in-docs-vs-plans-vs-handoffs)
and
[DEV.md § Directory Documentation Convention](./DEV.md#directory-documentation-convention).

### Type System

Full TypeScript strict mode. Types live with the code they document (`types.ts`
per module).

### Testing

Full conventions: [DEV.md § Testing Strategy](./DEV.md#testing-strategy). Quick
rules:

- Tests in `tests/` subdirectories; `.test.ts` suffix (never `.spec.ts`)
- Explicit vitest imports; inline test data only; no shared fixtures; one
  assertion per `it`; no comments in tests; `.toThrow()` for errors
- **ZOMBIES order** (Zero → One → Many → Boundaries → Interfaces → Exceptions →
  Simple); triangulate the first test before implementing — if a hardcoded
  return could pass it, the second test must make that impossible
- **Bottom-up, real dependencies**: cover leaves before engines before API;
  `vi.mock('./sibling')` on an internal sibling is a code smell — finish the
  sibling's coverage instead
- In-file helpers are tested **through the public export**, never directly —
  helper-level tests would re-couple what the within-file extraction freedom
  decouples

### Linting

Full details: [DEV.md § Linting Conventions](./DEV.md#linting-conventions).

- `npm run lint` is a five-linter compound: eslint (code + `.mdx`),
  markdownlint-cli2 (`.md`), ls-lint (file names), cspell (spelling). Plus
  prettier (formatting) and tsc (types). `npm run validate` runs everything.
- Per-file checkpoints (the compound script does not forward file args):

  | File type          | Command                          |
  | ------------------ | -------------------------------- |
  | `.ts` `.js` `.mdx` | `npx eslint <file>`              |
  | `.md`              | `npx markdownlint-cli2 "<file>"` |
  | spelling, any type | `npx cspell <file>`              |

- **Pre-commit runs prettier only** (husky → lint-staged → `prettier --write`).
  Linters do not run at commit time — auto-fix was deliberately removed because
  `--fix` is severity-blind. Lint violations are caught by the per-file
  checkpoints and `npm run validate`, not the hook.

---

## Incremental TDD Workflow

All development uses TDD with atomic increments. Full process:
[DEV.md § Incremental Development Workflow](./DEV.md#incremental-development-workflow).

**Phase 0 — Documentation specification** (all seven steps, in order, before any
code): establish ubiquitous language → README spec (domain model in prose,
bounded context) → **AR-1** → types.ts (domain model in TypeScript) →
architectural sketch in DOCS.md with the **Mermaid `## Data flow` diagram** →
**AR-2** → review, resolve, and commit Phase 0 artifacts. Phase 1 does not start
until the human approves the Phase 0 commit.

**Phase 1 — per increment**: JSDoc → stub → ONE failing test in ZOMBIES order →
**AR-3** → implement (Fake It is legitimate for the first test; it expires when
the second test is written) → lint checkpoint → refactor against the DOCS.md
sketch → self-review ([§ Self-Review Checklists](#self-review-checklists)) →
**AR-4** → quality checks → 🔍 sandbox checkpoint when user-observable → commit
(autonomous, announced).

**Phase 2**: full quality checks (`npm run validate` — see
[§ Linting](#linting)) → **AR-5** → commit (autonomous, announced) → push
prompt.

**Default execution after Phase 0:** a session fans out across the type-defined
dependency DAG by default
([§ Orchestrated delegation](#orchestrated-delegation)); the human may override
to synchronous.

**The Refactor step is structural, not cosmetic.** Green tests prove behavioral
correctness; the Refactor step holds the implementation against the DOCS.md
sketch — named phases present and distinct, concerns separated, no Fake It
values surviving past their triangulation point, ubiquitous language throughout.
Sketch the intra-file data flow as ephemeral Mermaid for your own reasoning;
verify the file's inputs and outputs still match the peer DOCS.md data-flow
diagram.

### Two-Tier Autonomy

The refactor boundary is mechanical, not judgment:

- **Intra-file** changes (internal phases of a single function, helper
  extraction within the file): autonomous.
- **Inter-file** changes require a user check-in if ANY trigger fires: a file is
  added to or removed from the data flow; a file's input/output shape changes; a
  phase annotation changes (throws / pure / async). Extracting a helper to a new
  domain-related file IS a trigger; extracting to a domain-agnostic utility
  (freeze, merge, clone — invisible in data-flow diagrams) is NOT.
- `DOCS.md` is an architectural contract; updating it requires user approval.

The same shape applies to **conversational decision points**: pick reasonable
defaults on naming, formatting, and mechanical choices — note them rather than
asking — and reserve questions for scope changes, architecture, and destructive
actions. Edit boundaries and decision points are the two tiers of one autonomy
rule: small and reversible → proceed and note; structural or irreversible →
check in.

### Sandbox Checkpoints

When an increment adds a user-observable change (new UI element, new
browser-visible behavior), a **🔍 sandbox checkpoint** fires between quality
checks and the commit: the user exercises the feature at a running dev server;
the agent reports observations verbatim. Cosmetic redirects roll into the next
increment; **behavioral defects block the commit**. Checkpoints are gate points
— only the human skips, and the only legitimate skip is an increment with no
user-visible surface, declared explicitly ("no sandbox checkpoint: pure
utility"). Name a specific action and a specific expected observation; "verify
it works" is not a checkpoint. Full rules:
[DEV.md § Sandbox Checkpoints](./DEV.md#sandbox-checkpoints--user-observable-features).

### Plan Constraints

- Plans describe **behavior, not implementation** — no function bodies, no
  statement sequences. TypeScript type declarations ARE encouraged (they pin the
  contract); pseudocode is OK for describing a proposed strategy. The bright
  line: anything that looks like executable code belongs in the source file. TDD
  discovers the implementation; the sketch constrains the structure; the plan
  names what each increment does and what types enter and exit.
- Plans start from completed work and list ONLY unimplemented work.
- Before starting, verify understanding with the user: what will be built, what
  constraints apply, what success looks like.

### Git Checkpoints

Commits are autonomous and announced; pushing is prompted:

- After Phase 0: commit
  `docs: establish [module] domain model and architectural sketch`, announce the
  SHA, and stop at the Phase-0 → Phase-1 human review gate (unchanged).
- After each passing TDD cycle: commit
  `add: [behavior this increment implements]` and announce the SHA.
- After the last increment: "Sprint complete — ready to push to main" — the push
  itself stays with the human ([§ Git Policy](#git-policy)).

---

## Git Policy

**Default workflow: commit directly to main.** Frequent atomic commits on main
provide rollback points without branching overhead. Agents do NOT create
branches unless explicitly instructed in the current conversation.

**Allowed** (read-only and additive):

- Read-only: `git status`, `git diff`, `git log`, `git show`, `git blame`,
  `git branch --list`, `git ls-files`, `git remote -v`, `git rev-parse`
- Additive: `git add <specific-files>`, `git commit -m "..."` (new commits
  only), `git fetch` (without `--prune`), `git stash push`
- `git commit --no-verify` is permitted — deliberate workflow for repos carrying
  pre-existing hook/lint debt

**Forbidden** (the human runs these, or explicitly instructs):

- History rewriting: `git commit --amend`, `git rebase` (any form),
  `git reset --hard`; `git reset` (soft/mixed) only with explicit user
  instruction for a specific unstage
- Publishing: `git push` (any form)
- Destroying work: `git checkout -- <file>` / `git restore <file>`,
  `git clean -f`, `git stash drop` / `clear`, `git branch -D`/`-d`,
  `git tag -d`, `git fetch --prune` (deletes local remote-tracking refs)
- Undoing history: `git revert`, `git cherry-pick` — these are additive, but the
  agent does not unilaterally undo or replay history; prompt the human
- Merging: `git merge` — branch topology is the human's decision
- `--no-gpg-sign` unless the user explicitly requests it

**Rule of thumb**: if undoing the command would require a force-push or a reflog
rescue, it is destructive — never run it. If it only adds new commits the human
can drop later without losing unrelated work, it is additive — the agent may run
it.

For forbidden actions, prompt: "Ready to [action] — would you like me to run
`git [command]`, or would you prefer to do it yourself?" For allowed actions,
describe what's about to happen in plain language before running it.

**Commit messages**: imperative voice, one line, describe the behavior or
artifact — not the mechanical change. Prefixes: `add:` (new behavior), `docs:`
(documentation/types/README), `fix:` (correcting broken behavior), `refactor:`
(structural change, no behavior change).

---

## Verification

"Should work" ≠ "does work." Untested code is a guess, not a solution. Before
reporting any task complete, all five answer YES:

- Did I run/build the code?
- Did I trigger the exact feature I changed?
- Did I see the expected result with my own observation (including GUI / dev
  server output)?
- Did I check for error messages?
- Would I stake the claim on it without hedging?

| Change         | Verification                         |
| -------------- | ------------------------------------ |
| UI changes     | Actually click the button/link/form  |
| API changes    | Make the actual API call             |
| Data changes   | Query the database                   |
| Logic changes  | Run the specific scenario end-to-end |
| Config changes | Restart and verify it loads          |

Show actual output from quality checks — don't just claim "tests pass."

### Self-Review Checklists

Run both at step 12 of every increment (and at any self-review point).

**LLM anti-patterns** — resist these tendencies:

| Anti-Pattern                | Rule                                                         | Example fix                                                    |
| --------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- |
| **Over-engineering**        | Cross-file helper with one call site? Keep it in-file        | New `utils/get-x.ts` used once → within-file helper            |
| **Trivial indirection**     | Wrapper that names nothing? Inline it                        | `const x = getX(o)` → `const x = o.x`                          |
| **Class addiction**         | Linter blocks, but check first                               | `class X` → `function createX()`                               |
| **Future-proofing**         | User didn't ask? Don't add it                                | `options = {}` with unused fields → direct impl                |
| **Defensive coding**        | Validate at boundaries only                                  | Remove internal re-validation                                  |
| **Verbose docs**            | Name + types explain? Skip JSDoc                             | Only document WHY or non-obvious contracts                     |
| **Fake It without Make It** | Hardcoded values expire at the second test                   | Write the test that makes hardcoding impossible                |
| **Status hedging in docs**  | Status / phase / hedging belongs in plan, handoff, or commit | `## Status — pre-impl...` → plan file or `.planning-handoffs/` |

**Pre-proposal checklist** — before proposing code, YES to all:

- [ ] **Simplest solution?** Not most "elegant" or "extensible"
- [ ] **Only what was requested?** No future-proofing, no nice-to-haves
- [ ] **Helpers placed by the extraction rule?** In-file freely for readability;
      new file only at 2+ call sites
- [ ] **Validate at boundaries only?** No re-validating internal calls
- [ ] **Junior-maintainable?** Understandable without explanation
- [ ] **Structural quality?** Implementation reflects the DOCS.md sketch — named
      phases, separated concerns, no surviving Fake It values

---

## Emergency Brake and Redirects

Work stops immediately if:

- Scope creeps beyond the original plan
- Tests fail in a way that isn't immediately understood
- A change would break a public API without explicit approval
- The agent catches itself skipping workflow steps
- An inter-file data-flow trigger fires during refactor (see
  [§ Two-Tier Autonomy](#two-tier-autonomy))

**Interrupt and redirect** if the user tries to skip planning, documentation,
tests, or quality checks — even if they insist. The only valid skips are the
explicit opt-outs this file names (plan mode, ARs, sandbox checkpoints — all
human-only).

Multi-file changes, refactors, and architectural changes are not forbidden —
they are exactly what the workflow is for. They route through plan mode and
incremental breakdown (invariants 3, 6, 10) rather than proceeding on momentum.

When something breaks: stop, and prompt the user about restoring the last known
working state — restoring is a human action under the git policy. When stuck,
say "I'm stuck" — asking beats shipping broken code. Never edit a file without
understanding why it exists.

---

## Context Discipline

The harness summarizes the conversation automatically when context fills and
work continues across the boundary — do not wrap up early, and do not announce
context estimates. Durability comes from artifacts, not the transcript.

**Persist proactively at natural checkpoints.** The plan file's **RESUMPTION
POINT** block (top of `~/.claude/plans/<plan>.md`) is the durable handoff.
Update it after each meaningful checkpoint with: state at pause, commit log with
one-line summaries, user decisions that won't be obvious from the diff, prose
drafts not yet in canonical files, AR-cycle status and carry-forward notes,
explicit deferrals, and untracked scratch files. Do NOT persist running diffs,
file contents, or tool transcripts — those are recoverable.

**Prefer a deliberate cold-start to riding repeated summarizations.** At a clean
increment-cluster or phase boundary, a fresh session reading the durable
artifacts (this file, DEV.md, the module README/DOCS/types, the committed code,
the plan's RESUMPTION POINT) beats a long, repeatedly compacted context — you
choose what survives, and the next agent reads ground truth instead of a lossy
summary. The discipline that makes this possible:

- **Boundary, not frequency** — cold-start between increment clusters, not every
  commit; re-orientation isn't free.
- **Commit to a clean boundary first** — never hand off between a red test and
  its green implementation, or between an implementation and its AR.
- **The RESUMPTION POINT carries findings, not just status** — audit
  conclusions, cross-increment decisions with rationale, the current
  code-vs-contract gap. Status lives in the plan, never in end-state docs.
- **Validate the handoff with a context-free agent — mandatory at each
  cluster/phase boundary before a cold-start.** Spawn a fresh agent with no
  session context, hand it the RESUMPTION POINT and launch prompt, and have it
  report whether it could orient and execute the next increment. The author is
  structurally blind to what only lives in their context; a context-free reader
  catches it. Apply must-fix findings before handing off. Only the human waives
  this.

After a mid-task summarization: read the plan file's RESUMPTION POINT, re-read
the relevant module docs, and verify understanding with the user before
resuming.

---

## Orchestrated delegation

Development defaults to **delegation fan-out** (distinct from the broad _read_
fan-out that goes to Explore subagents): the
[§ Context Discipline](#context-discipline) cold-start handoff rotated
**temporal → spatial**. Instead of one agent handing off to a future agent across
time, an **orchestrator** session hands off to fresh **worker** subagents across
the dependency graph — automatic because the graph is **type-defined**. After
Phase 0, absent explicit human prompting, a session fans out; dispatch is
mechanical (read from the type-defined DAG the human locked at the
Phase-0 → Phase-1 gate, not the agent's judgment about what is independent). The
human may override to synchronous.

- **The guard.** A type edge ⇒ serialize. The _absence_ of one does NOT license
  parallel — serialize is the default, parallel the earned exception.
  Affirmatively clear every non-type coupling first (environment colocation,
  frozen-singleton /
  registration order, semantic protocol — not an exhaustive list); when in doubt,
  serialize. A hidden dependency the types can't see is a `types.ts` modeling gap
  to enrich, not paper over.
- **A worker** is a fresh subagent owning one complete triangulated unit (a
  function + its ZOMBIES cluster), running the full cycle (ZOMBIES → `ar-3` →
  implement → refactor → `ar-4`) and committing green — full ceremony, never
  split mid-triangulation. Parallelize only committed-and-covered subtrees that
  pass the guard, bottom-up
  ([§ Dependency-order coverage](./DEV.md#dependency-order-coverage)). Each worker
  is a mini cold-start; validate the **decomposition** before each fan-out wave.
- **The orchestrator** holds the spine — `types.ts`, the DOCS `## Data flow`
  diagram, the plan/gate ledger — and reads committed contracts at DAG joins to
  catch seam-slop (Always Works™ at the seam can't be delegated). Lean ≠ blind: it
  writes no per-worker churn and serializes its own spine edits.

**Workers report DONE | BLOCKED | FLAG — no fourth channel.** DONE = verified and
committed (no "green but unverified" — that is BLOCKED, or out of scope and
already on the DAG; coverage a node test can't reach → move the test). BLOCKED =
can't finish; the orchestrator pivots. FLAG = an inter-file contract boundary (the
[two-tier rule](#two-tier-autonomy), delegated; `types.ts`/DOCS changes still need
human approval) **or** a suspected cross-subtree coupling the orchestrator then
checks at the seam. Gates are unchanged; the win is a permanently lean, coherent
orchestrator — not throughput.

---

## Adversarial Review Protocol

The full protocol — prompt structure, verdict definitions, resolution rules,
focus areas for AR-1 through AR-5, and sub-model dispatch — lives in
[DEV.md § Adversarial Review Protocol](./DEV.md#adversarial-review-protocol).

Quick reference:

- ARs use a separate read-only reviewer returning **PROCEED** (continue),
  **CONSIDER** (document a response to each concern, then continue), or
  **PAUSE** (present to the human, wait).
- **Invoke the registered agents by name**: `ar-1` (design challenge, Phase 0
  step 0.3), `ar-2` (sketch challenge, step 0.6), `ar-3` (test strategy, after
  the first failing test), `ar-4` (implementation audit, after self-review),
  `ar-5` (pre-merge, after all increments).
- **Pass file paths and the baseline SHA, never pasted contents.** Record
  `git rev-parse HEAD` at plan approval; AR-5 reviews `baseline..HEAD` and runs
  `git diff` itself. Reviewers have Read/Bash/Grep/Glob — let them pull their
  own inputs.
- ARs are mandatory. Only the human can skip; the implementing agent never skips
  on its own. **Skip-resistance rule**: when you catch yourself reasoning about
  why this particular case doesn't need an AR, that reasoning is the signal it
  does.
- **Batch-fix review findings now.** When a review surfaces multiple concerns,
  default to fixing all of them in the current commit — recommend "fix all
  unless one is out of scope" rather than asking the human to pick. Deferred
  issues cost more than fixed ones: the context you hold now is worth more than
  the context you'd rebuild later.

---

## Sub-Model Dispatch for Subagents

Model selection for AR reviewers follows one mechanism: an explicit `model`
parameter overrides the agent definition's frontmatter, which overrides
inheriting the parent session's model. **The pins live in the `ar-N` agent
frontmatter; do not pass a `model` parameter when spawning ARs** — it would
silently override the configured roster.

The reasoning and the current documented roster live in
[DEV.md § Sub-model dispatch](./DEV.md#sub-model-dispatch): judgment-heavy
reviews (design, sketch, pre-merge) should track or exceed the authoring model's
tier; mechanical reviews (test strategy, implementation audit) ride a cheaper
tier — independence and fresh context, not raw capability, do most of their
work.

---

## Communication

The communication-style rules — forbidden hyperbolic phrases, required certainty
quantification with examples, self-correction phrases — live in
`~/.claude/CLAUDE.md` under `ENFORCEMENT MECHANISM` and apply unconditionally.
Single source of truth; they are not restated here.

Project-specific requirements:

- Certainty quantification is mandatory in AR verdict reporting, plan-mode
  proposals, commit-message proposals, and any technical claim about whether
  something will work.
- Lead with problems and risks, not optimism — architectural drift is the most
  expensive thing this codebase has historically suffered.

---

## Vibetoading and Frogramming — house terms

Two house terms appear throughout this org's documentation, defined in
`spiralearn/welcome-to-programming/syllabus.md` §0.3:

- **Frogramming** (🔬) — development grounded in the notional machine: the
  practitioner predicts what the machine will do, evaluates output against that
  prediction, and applies craft practices to mitigate the specific risks that
  awareness makes visible.
- **Vibetoading** (🎨) — development grounded in user-visible behavior: the
  machine underneath is a black box; iteration is on outcomes.

They are a spectrum, not a binary. This file governs **frogramming** behavior —
Phase 0, ARs, full ceremony — for production work. Deliberate vibetoading is
supported but explicit: the human declares it; it never arises from the agent
skipping ceremony on its own assessment.

---

## References

- [DEV.md](./DEV.md) — conventions, testing strategy, AR protocol, linting
- [AGENTS.md](./AGENTS.md) — governance for pre-fable agents and other tools
- `src/` directory READMEs — module-specific context
- API documentation generated to `docs/` via `npm run docs`
