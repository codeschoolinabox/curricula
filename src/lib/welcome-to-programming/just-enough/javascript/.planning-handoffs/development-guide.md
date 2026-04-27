# Development Guide: Managing Study-Lenses Work Streams

How to coordinate Claude Code agents across the 4 work streams defined in this
directory. Written for you (the human coordinator) — not for the agents
themselves.

> **WS3 current status**: See `03-orchestrator-and-contracts.md` — it opens
> with a status banner showing exactly which increment is next.

## How Claude Code sessions work

Each Claude Code session (whether CLI, desktop app, VS Code extension, or web)
is a **fresh start**. The agent has:

- No memory of prior sessions beyond what's persisted in files
- A context window that fills up over time (~200K tokens practical)
- Access to the repo files, git history, and any tools you've allowed
- Auto-memory at `~/.claude/` (machine-local, not in the repo)

**Implications:**

- Everything an agent needs must be **in the repo** — not in your head, not in a
  prior conversation, not in `~/.claude/`
- Long sessions degrade — context compaction loses nuance. Prefer shorter
  focused sessions with frequent commits over marathon runs
- Agents on other machines (worktrees, CI, collaborators) won't see `~/.claude/`
  — all context lives in `.planning-handoffs/`

## Kicking off a work stream

### What to say to the agent

```
Read these files before doing anything:
1. .planning-handoffs/0N-[work-stream].md (your assignment)
2. .planning-handoffs/00-master-plan.md (full architecture context)
3. 0-curricula/AGENTS.md and 0-curricula/DEV.md at the repo root (workflow + conventions)
4. study-lenses/README.md and study-lenses/DOCS.md (architecture docs)
5. study-lenses/types.ts (existing shared types)

Then ask me questions before writing any code.
```

### What to expect

1. The agent reads the files and asks questions (5-15 minutes)
2. You answer questions and approve the approach
3. The agent enters Phase 0 (DDD: glossary, README, AR-1, types, DOCS)
4. You review Phase 0 artifacts and approve
5. The agent enters Phase 1 (TDD increments, one commit each)
6. You spot-check along the way
7. The agent does Phase 2 (AR-5 pre-merge review)
8. You do final review and approve the commit/merge

### Red flags to watch for

- Agent skipping Phase 0 and jumping to code — stop it immediately
- Agent writing tests AFTER implementation (not TDD)
- Agent modifying `study-lenses/types.ts` without asking you first
- Agent making assumptions instead of asking questions
- Large uncommitted changes (should be atomic commits per increment)
- Agent referencing `/lenses/study/` code as ground truth (it's old)

## Starting a new WS3 session

### Human pre-checks (do these BEFORE opening Claude Code)

1. **Read `03-orchestrator-and-contracts.md` yourself** — the status banner at
   the top tells you which increment to kick off. Confirm the behavioral contract
   makes sense to you before the agent starts.
2. **Sandbox check Option-A** (pending since Increment 1): start the dev server,
   find a code fence using `js:format,editor` syntax, open React DevTools and
   confirm a `transforms` prop is visible on the `<StudyLenses>` component. This
   validates the pipeline prop wiring the agent will build on.
3. **Verify tests still pass**: `npx vitest run` scoped to
   `src/lib/welcome-to-programming/just-enough/javascript/study-lenses/tests/`

### Prompt template (paste this verbatim to start the session)

```text
Read .planning-handoffs/03-orchestrator-and-contracts.md in full before doing
anything else. That document contains your task, the complete behavioral
contract, the ZOMBIES test order, and the conventions to follow. Follow
DEV.md and AGENTS.md discipline throughout — full Phase 1 TDD cycle
including AR-3 before implementing and AR-4 after. Start with plan mode.
```

### What NOT to do

- Do not paste the prompt and immediately leave — the agent will enter plan mode
  and ask alignment questions. Stay present for the first 10 minutes.
- Do not skip the Option-A sandbox check — it validates the plugin prop wiring
  that Increment 2 depends on.
- Do not approve the agent's plan without reading the behavioral contract in the
  handoff yourself first. The type-mismatch throw rules are easy to accidentally
  soften.

---

## Coordination between work streams

### Dependency graph

```text
lib/evaluating/trace/syntax/  (standalone syntax tracer module)
         │
         │  StepCategory enum + docs
         ▼
WS1 (NM components — 01-NM-components.md) ──────────┐
                                                     ├──► WS2 (analysis + recommender)
WS3 (orchestrator + contracts) ─────────────────────┘         │
         │                                                    │
         └──► WS4 (lens migration) ◄──────────────────────────┘
```

- **Build is fixed** — WS3 Increment 0 completed; `MDXComponents.js` now points
  to the orchestrator stub. `npm run build` is green.
- **WS3 Phase 1 in progress** — Increments 0–1 committed to `main`. Next: Increment 2 (Pipeline validation).
- **WS1 depends on the syntax tracer at `lib/evaluating/trace/syntax/`** —
  its Phase 0 stabilized the `StepCategory` enum (the 3rd Block Model
  dimension). WS1 is now a thin coordination layer (wire the enum into
  `study-lenses/types.ts`, document the contract). See
  `01-NM-components.md` for full details and the "sub-language levels
  → NM components" pivot note.
- **WS1 and WS3 can run in parallel** — no dependency between them
- **WS2 depends on both WS1 and WS3** — needs the NM-components enum
  from WS1 and the LensModule contract from WS3 (`study-lenses/types.ts`)
- **WS4 depends on WS3** — needs proven contracts + trial lenses
- **Within WS4**, individual lenses can run in parallel

### The shared types.ts problem

`study-lenses/types.ts` is consumed by ALL work streams. It already exists with
the core types. Rules:

- **If an agent finds a flaw in types.ts**: STOP. Write the issue to the work
  stream's notes file. Notify you. Do NOT modify types.ts unilaterally.
- **You** review the proposed change, assess impact on other streams, and either
  apply it yourself or approve the agent to do so.
- After a types.ts change: notify all active agents in other streams to re-read
  it.

### Per-stream notes files

Each work stream writes its own notes file in `.planning-handoffs/`:

- `01-NM-components-notes.md`
- `02-analysis-and-recommender-notes.md`
- `04-lens-migration-notes.md`

WS3 does not have a notes file — decisions were folded into
`03-orchestrator-and-contracts.md` when the handoff was rewritten for Increment 2.

**Convention:**

- Each agent READS other streams' notes at session start
- Each agent WRITES only to its own notes file
- Notes include: questions asked/answered, decisions made, blockers, deviations
  from the handoff, things the next agent should know
- You review notes between sessions and resolve cross-stream issues

### When to sync

- After WS1 completes: review output, confirm the NM-components enum
  (`StepCategory` from the syntax tracer) is wired into
  `study-lenses/types.ts` and ready for WS2
- After WS3 Phase 0 completes: verify types.ts + contracts are stable before
  starting WS2 or WS4
- After WS3 trial lenses (editor + highlight) work end-to-end: green light for
  WS4 lens migration
- After any types.ts change: check all active streams

## Git strategy

### Branch naming

```
ws1/nm-components
ws3/orchestrator-contracts
ws2/analysis-recommender
ws4/lens-blanks
ws4/lens-parsons
ws4/lens-trace-table
```

### Commit conventions

- Each TDD increment = one atomic commit
- Commit messages per AGENTS.md: `add:`, `docs:`, `fix:`, `refactor:`
- Commit after EVERY passing increment — don't batch
- If the agent's session ends mid-work: commit what's done with a `checkpoint:`
  prefix so the next session can pick up

### Merge order

1. WS1 → main
2. WS3 → main (may conflict with WS1 if both touch docs)
3. WS2 → main (depends on WS1 + WS3 being merged)
4. WS4 branches → main (one per lens, sequential or batched)

### Pre-commit hook

The pre-commit hook runs markdownlint on ALL `.md` files (not just staged ones)
and has 300+ pre-existing errors. All commits currently need `--no-verify`. This
is a known issue — don't let agents spend time trying to fix the linter.

## Context management tips

### Session length

- **Ideal**: 1-2 hours per session, focused on one work stream
- **Maximum useful**: ~3 hours before context quality degrades
- **Signs of degradation**: agent starts repeating itself, forgets earlier
  decisions, proposes things that contradict the plan

### When to start a new session

- After completing a Phase (0, 1, or 2)
- After context compaction triggers (agent warns about capacity)
- After a major blocker that requires your input
- When the agent seems confused or repetitive

### What to preserve between sessions

The agent should update these before ending a session:

1. Its notes file (decisions made, current state, what's next)
2. Git commits (all completed increments)
3. The handoff file (if the plan changed during implementation)

The NEXT agent picks up by reading: handoff + notes + git log.

### Worktree agents

If you use `isolation: "worktree"` for parallel agents:

- Each worktree is a git copy — changes don't interfere
- Worktree agents can't see each other's uncommitted changes
- Merge conflicts are resolved when you merge branches to main
- Worktrees are auto-cleaned if the agent makes no changes

## What you should do manually

- **Merge branches** — agents can't push or merge
- **Resolve types.ts conflicts** — you're the coordinator
- **Review Phase 0 artifacts** — catch design issues early
- **Spot-check TDD increments** — verify tests are meaningful
- **Run the dev server** — agents can run it, but you should visually verify
  features in the browser (sandbox checkpoints)
- **Decide on open questions** — caching mechanism, event system, reset
  semantics. Agents will ask; you decide.

## What agents handle autonomously

- Phase 0 DDD (with your approval of artifacts)
- TDD cycles (with your spot-checking)
- Adversarial reviews (AR-1 through AR-5)
- Documentation updates
- Git commits (additive only — per AGENTS.md)

## The `/lenses/` directory (old code)

The `/lenses/study/` directory contains V2 code from a prior sprint. It is
**historical reference only** — not ground truth. Wherever it disagrees with
`.planning-handoffs/`, the handoffs win. Agents should treat it as inspiration,
not as code to preserve.

## Quick reference: what's in `.planning-handoffs/`

| File                               | Purpose                                          |
| ---------------------------------- | ------------------------------------------------ |
| `00-master-plan.md`                | Full architecture context (canonical reference)  |
| `01-NM-components.md`              | WS1: wire `StepCategory` enum from the syntax tracer as the 3rd Block Model dimension |
| `02-analysis-and-recommender.md`   | WS2: snippet analysis + recommendation engine    |
| `03-orchestrator-and-contracts.md` | WS3: Increment 2 handoff (forward-looking only)  |
| `04-lens-migration.md`             | WS4: individual lens implementations             |
| `development-guide.md`             | This file (for the human, not for agents)        |
| `*-notes.md`                       | Per-stream notes (created by agents during work) |
