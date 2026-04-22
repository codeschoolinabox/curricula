# Development Guide: trace/syntax — NM syntax-level tracer

How to coordinate Claude Code agents across the NM-layer DDD + implementation
phases. Written for you (the human coordinator) — not for the agents themselves.

## What this directory is for

The syntax tracer at `lib/evaluating/trace/syntax/` is a **JEJ NM
syntax-level tracer of the semantic-level tracer** (sibling at
`../semantics/`). It aggregates raw semantic-tracer events into NM-step
categories mapping to visible syntactic units, plus one data-flow-edge
category (resolves), so lens authors write against NM semantics instead
of raw events.

Both tracers are independently exportable — semantics is the core, syntax
is an abstraction layer on top.

The plan for this work is in [PLAN.md](./PLAN.md). It contains:

- **Resolutions** — the load-bearing design decisions (two rounds)
- **Phase 0-A** — tracer-side doc updates (parallel with Phase 0)
- **Phase 0** — DDD artifacts (README, types.ts, DOCS.md)
- **Phase 1** — ~26 TDD increments
- **Phase 2** — pre-merge review
- **Handoff** — what's settled, what's still open, where to begin
- **Partial Phase 0 execution** — what was written pre-handoff
- **ARCHIVE** — design-iteration canvas (reference only; Resolutions supersede)

## State of the work

The prior session wrote:

- `PLAN.md` — full plan + resolutions + archive
- `development-guide.md` — this file
- `README.md` — Phase 0.2 output (glossary + diagrams)
- `DOCS.md` — Phase 0.5 architectural sketch
- `types.ts` — Phase 0.4 types skeleton with stubs for deferred items

**Not yet written** (needs fresh session + your input):

- Phase 0-A tracer doc updates
- Environment / Scope / Binding / EnvDiff concrete types (Resolution 22)
- NMConfig final tree shape (Resolution 23)
- Q3b register-read decision
- Terminal-step kind enum details
- AR-1 (design challenge) and AR-2 (sketch challenge) adversarial reviews
- 0.7 review + 0.8 commit
- Phase 1 implementation
- Phase 2 pre-merge review

## How Claude Code sessions work

Each Claude Code session is a **fresh start**. The agent has:

- No memory of prior sessions beyond what's persisted in files
- A context window that fills up over time (~200K tokens practical)
- Access to the repo files, git history, and any tools you've allowed
- Auto-memory at `~/.claude/` (machine-local, not in the repo)

**Implications:**

- Everything an agent needs must be **in the repo** — not in your head, not in
  a prior conversation, not in `~/.claude/`
- Long design sessions degrade fast. This plan was iterated across multiple
  sessions with a compaction midway. Prefer shorter focused sessions with
  frequent commits.
- Agents on other machines won't see `~/.claude/` — all context lives in
  `lib/evaluating/trace/syntax/` and the broader `.planning-handoffs/`.

## Kicking off a session

### What to say to the agent

```
Read these files before doing anything:
1. just-enough/javascript/lib/evaluating/trace/syntax/PLAN.md (the plan — your assignment)
2. just-enough/javascript/lib/evaluating/trace/syntax/development-guide.md (this file, skim)
3. just-enough/javascript/lib/evaluating/trace/syntax/README.md (Phase 0.2 output)
4. just-enough/javascript/lib/evaluating/trace/syntax/DOCS.md (Phase 0.5 output)
5. just-enough/javascript/lib/evaluating/trace/syntax/types.ts (Phase 0.4 skeleton)
6. just-enough/javascript/lib/evaluating/trace/semantics/README.md and DOCS.md
   (the sibling semantic tracer — our input)
7. 0-curricula/AGENTS.md and 0-curricula/DEV.md (workflow + conventions)
8. just-enough/javascript/notional-machine.md (the NM spec — what we're modelling)
9. just-enough/javascript/tracer.md, tracer.architecture.md, tracer.walkthroughs.md
   (semantic-tracer docs — our input contract)
10. just-enough/javascript/syllabus.md (pedagogical framing — "twinning", layers)
11. just-enough/javascript/.planning-handoffs/00-master-plan.md (study-lenses
    architecture context — NM layer feeds this)

Then resolve the "What's still open" items in PLAN.md §Handoff §What's still
open, ask me questions. Do NOT write or edit any code before I've answered.
```

### What to expect

1. Agent reads the files and asks clarifying questions (10-20 min).
2. You resolve the open items. Minimum set:
   - Environment / Scope / Binding / EnvDiff data shape (Resolution 22).
   - NMConfig tree finalization (Resolution 23).
   - Q3b expression-kind register-read decision.
   - Terminal-step kind enums (initialization, write, emit, error kinds).
3. Agent enters **Phase 0-A** — tracer doc updates (prompt signature, I/O mock
   API, event-timing footnote, operandSteps flagged as under-discussion).
4. Agent refines **Phase 0** artifacts: update types.ts stubs to concrete
   types, flesh out DOCS.md's NMConfig → TraceConfig mapping table, run AR-1
   and AR-2, address verdicts.
5. You review Phase 0 artifacts and approve (0.7 + 0.8 commit).
6. Agent enters **Phase 1** — ~26 TDD increments, one commit each (AR-3 +
   AR-4 per increment per AGENTS.md).
7. You spot-check along the way.
8. Agent does **Phase 2** — AR-5 pre-merge review.
9. You do final review and approve the commit/merge.

### Red flags to watch for

- Agent skipping Phase 0.1 open items and jumping to types.ts edits — stop it;
  it'll guess at Environment shape or NMConfig tree and lock in wrong choices.
- Agent skipping adversarial reviews (AR-0A, AR-1, AR-2, AR-3, AR-4, AR-5).
- Agent modifying the ARCHIVE canvas in PLAN.md — it's historical;
  Resolutions supersede. Edits belong in Resolutions.
- Agent treating deferred items (Environment shape, NMConfig tree, Q3b,
  terminal-kinds) as settled — these need YOUR input first.
- Agent removing dual-representation patterns (coercion as property + events;
  resolves with `dependent` co-gating) — load-bearing per Resolutions.
- Agent re-introducing old step model language ("DataStep", plural
  `sources[]`/`destinations[]` on resolves) — the Resolutions committed to
  edge-based ResolveStep with singular `.from`/`.to`.
- Agent proposing "pure helpers" (provenance, envPrefix, bindingTimeline) —
  explicitly rejected per Resolution 20.
- Agent conflating tracer concerns with NM-layer concerns — the NM layer
  PASSES THROUGH I/O mocks; it does not implement them (consumer concern).
- Agent writing tests AFTER implementation (not TDD).
- Large uncommitted changes (should be atomic commits per increment).

## Open decisions that need YOUR input

Before types.ts can be completed and Phase 1 begun, the following items need
your decisions:

### 1. Environment / Scope / Binding / EnvDiff data shape (Resolution 22)

TDZ state representation, scope tree shape (Map? nested objects?), binding
versioning scheme, envDiff delta format, active-scope-stack maintenance.
Cross-check: serialization is OK with in-memory cycles (Resolution 19) but
envDiff probably shouldn't have them.

### 2. NMConfig tree finalization (Resolution 23)

Draft from Phase 0.4 stub:

```ts
{
  expressions?: boolean | { literals?, identifiers?, properties?, operators?, calls?, templates? }
  resolves?: boolean | { dependent?: boolean }
  statementSteps?: boolean
  scopeSteps?: boolean
  controlFlowSteps?: boolean
  initializationSteps?: boolean
  forInitSteps?: boolean
  writeSteps?: boolean
  emitSteps?: boolean
  errorSteps?: boolean            // probably always on
  semanticEvents?: boolean
  seconds?: number
  iterations?: number
  range?: { start, end }          // deferred to Phase 1+
  io?: { prompt?, alert?, confirm?, console? }   // passthrough to tracer
}
```

Check against tracer's `TraceConfig.options` structure for naming
consistency. AST-aware vocabulary per Resolution 23.

### 3. Q3b — register-read decision

Candidate drafts:

- (A) `identifier` kind with `.register: true` flag when read resolves to a
  pre-hoisted global (Math, prompt).
- (B) Separate `register-read` kind on the expression category.

Trade-off: (A) keeps kind count at 6, requires a flag; (B) adds a 7th kind,
cleaner filter semantics.

### 4. Terminal-step kind details

- `initialization`: single kind, or sub-kinds `let` / `const`?
- `write`: `simple` vs `compound` (e.g. `+=`) worth distinguishing?
- `emit`: per-method kinds (`prompt`, `alert`, `confirm`, `console-log`,
  `console-warn`, ...) or per-channel (`user-channel`, `dev-channel`)?
- `error`: one kind per error type (`ReferenceError` / `TypeError` /
  `RangeError`)?

### 5. Machine-based category reorganization — revisit?

During design we considered adding `binding` and `prototype` as top-level
categories (env-visible events as first-class steps) aligned with
notional-machine.md's machine-at-a-glance. Concluded to defer — env-access
events stay as sub-events in the owning step's `.events[]`, preserving the
nodes-and-edges structural model (resolves are edges; env-access would be
intra-node). Revisit only if a concrete pedagogical use case forces it.

## Coordination with the tracer

The NM layer is built on top of the semantic tracer. Phase 0-A makes small
additions to tracer docs (at `just-enough/javascript/tracer.md`,
`tracer.architecture.md`, `tracer.walkthroughs.md`):

- `io: { prompt, alert, confirm, console }` field on `TraceConfig`.
  `prompt` takes `(message: string, placeholder?: string)` per the spec.
- Event-timing footnote: mocked vs native I/O have identical event sequences
  but different wall-time (mocks gate inter-event gaps via main-thread await).
- `operandSteps: number[]` on operator events — **flagged as under-discussion,
  dispatcher-layer**; NOT committed in this DDD. Needs a separate tracer-side
  RFC.

**Rule:** if the agent wants to modify the tracer spec beyond Phase 0-A's
scope, STOP. Tracer changes need a separate RFC.

## Git strategy

### Branch naming

```
nm/phase-0a-tracer-docs
nm/phase-0-ddd-completion
nm/phase-1-<category>    # e.g. nm/phase-1-expression-step
nm/phase-1-<other>
```

### Commit conventions

- Each TDD increment = one atomic commit (Phase 1).
- Phase 0-A tracer doc updates: separate commit (`docs: add tracer I/O mock
  configuration spec`).
- Phase 0 DDD completion: commit after 0.8 (`docs: establish trace/syntax
  domain model and architectural sketch`).
- Commit messages per AGENTS.md: `add:`, `docs:`, `fix:`, `refactor:`.
- Commit after EVERY passing increment in Phase 1 — don't batch.
- If the agent's session ends mid-work: commit what's done with a
  `checkpoint:` prefix so the next session can pick up.

### Merge order

1. `nm/phase-0a-tracer-docs` → main (can go first, standalone).
2. `nm/phase-0-ddd-completion` → main (after Phase 0 review).
3. `nm/phase-1-*` → main (one per category or batched).

### Pre-commit hook

Same markdownlint issue as the broader repo — commits currently need
`--no-verify`. Known issue; don't let agents spend time fixing the linter.

## Context management tips

### Session length

- **Ideal**: 1-2 hours per session, focused on one phase or one increment.
- **Maximum useful**: ~3 hours before context quality degrades.
- **Signs of degradation**: agent repeats itself, forgets earlier decisions,
  proposes things that contradict PLAN.md Resolutions.

### When to start a new session

- After completing Phase 0-A (tracer docs committed).
- After resolving Phase 0.1 open items with you and completing Phase 0 DDD.
- After each Phase 1 increment block (e.g. all ExpressionStep kinds done).
- After context compaction triggers (agent warns about capacity).
- After a major blocker that requires your input.

### What to preserve between sessions

The agent should update these before ending a session:

1. A notes file `notes.md` in this directory (decisions made, current state,
   what's next, any deviations from PLAN.md).
2. Git commits (all completed increments).
3. PLAN.md Resolutions (if the plan changed during implementation — additions
   go as new numbered Resolutions; amendments annotate existing ones).

The NEXT agent picks up by reading: PLAN.md + notes.md + git log.

### Worktree agents

If you use `isolation: "worktree"` for parallel agents:

- Each worktree is a git copy — changes don't interfere.
- Worktree agents can't see each other's uncommitted changes.
- Merge conflicts are resolved when you merge branches to main.
- Worktrees are auto-cleaned if the agent makes no changes.

## What you do manually

- **Resolve the Phase 0.1 prerequisite items** (Environment shape, NMConfig
  tree, Q3b, terminal kinds) — the agent CAN'T fill types.ts stubs without
  these.
- **Merge branches** — agents can't push or merge.
- **Review Phase 0 artifacts** — catch design issues early (README + types.ts
  - DOCS.md should be readable together and predict the implementation).
- **Review adversarial-review verdicts** — if AR-1, AR-2, AR-3, AR-4, or AR-5
  flags CONSIDER or PAUSE, you decide how to respond.
- **Spot-check TDD increments** — verify tests are meaningful, not
  tautological; verify Fake-It-first followed by real implementation.
- **Decide on deferred items** as they surface.
- **Verify no backwards-incompatible changes** to the tracer contract beyond
  Phase 0-A.

## What agents handle autonomously

- Phase 0-A tracer doc edits (with your approval of the AR-0A verdict).
- Phase 0 DDD artifact writing (with your approval of AR-1 + AR-2 verdicts).
- TDD cycles in Phase 1 (with your spot-checking + AR-3/AR-4 verdicts).
- Phase 2 AR-5 pre-merge review.
- Documentation updates within the scope of an increment.
- Git commits (additive only — per AGENTS.md).

## Quick reference: what's in `lib/evaluating/trace/syntax/`

| File                   | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| `PLAN.md`              | Full DDD plan (Resolutions + phases + ARCHIVE)       |
| `development-guide.md` | This file (for you, not for agents)                  |
| `README.md`            | Phase 0.2 output — module README with diagrams/tables|
| `DOCS.md`              | Phase 0.5 output — architectural sketch              |
| `types.ts`             | Phase 0.4 output — public types (partial; stubs flagged) |
| `notes.md`             | Created by agent during work — decisions/blockers    |
| `nm.ts`, `aggregate-steps/`, etc. | Phase 1 implementation files (not yet)    |

## One last note

This DDD was iterated hard — 40+ rounds, one context compaction, multiple
adversarial agent reviews. Treat the Resolutions as load-bearing. When a
fresh agent wants to change a Resolution: they need a compelling reason AND
your approval, not a fresh opinion. The ARCHIVE canvas in PLAN.md explains
why each Resolution is what it is — read it when you want the history, skip
it when you want the decision.
