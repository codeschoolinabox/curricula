# WS3 kickoff — operational instructions for the human

> **Audience**: the human coordinator (you), not the agent. This file
> is the playbook for opening a session against
> [`03-orchestrator-and-contracts.md`](./03-orchestrator-and-contracts.md)
> — pre-session checks, the prompt template, what the agent reads
> first, expected cadence, red flags, and coordination points with
> sibling handoffs.

## Pre-session human checks (do these BEFORE opening the agent)

1. **Confirm REFACTOR-HANDOFF.md status.** The 03 handoff's hard
   prerequisite is that
   [`REFACTOR-HANDOFF.md`](../REFACTOR-HANDOFF.md) Steps 1-16 are
   executed and merged. If they are not, do NOT open a session for
   03 — open one for REFACTOR-HANDOFF instead.
2. **Confirm WS2 recommender status if starting Layer II
   (L5/L6).** WS2
   ([`02-analysis-and-recommender.md`](./02-analysis-and-recommender.md))
   ships `orchestrate/lib/recommender/`; Layer II in the 03 handoff
   consumes it. If WS2's recommender doesn't exist yet, restrict
   the session to Foundation tier (F1-F5) or Layer I (L1-L2).
3. **Verify the test suite is green before opening the session:**

   ```bash
   npx vitest run src/lib/welcome-to-programming/just-enough/javascript/
   ```

   If anything is red, surface it before the agent starts code work.
4. **Re-read the 03 handoff yourself** — confirm the increment
   you're about to assign (one of F1-F5, L1-L2, L5-L8) matches the
   current state of the codebase. The pyramid build-order rule is
   hard: don't skip a tier.

## Session prompt template (paste verbatim to start)

Replace `<INCREMENT_ID>` with the specific F-number or L-number
(e.g. `F1`, `L5`):

```text
Read .planning-handoffs/03-orchestrator-and-contracts.md in full
before doing anything else. Pay special attention to:

- The Locked architectural decisions (quadrant + pyramid) — they are
  the bedrock orienting frame.
- The Scope boundary list — confirm what is and isn't ours.
- The Disposable-practice principle — lens state is per-mount only.
- The pyramid build-order — your assigned increment requires the
  prerequisite tier(s) to be done.

Your task is increment <INCREMENT_ID>. Read the increment's
description, its prerequisites, and the cross-handoff dependencies
(REFACTOR-HANDOFF, WS2 recommender, plugin alignment if applicable).

Follow DEV.md and AGENTS.md discipline:

- Plan mode first — propose your Phase 0 and increment plan, get my
  ExitPlanMode approval, then execute.
- Phase 0 (DDD): glossary update if needed → README spec → AR-1 →
  types check → DOCS sketch → AR-2 → commit.
- Phase 1 (TDD): per-increment cycle of JSDoc → stub → failing test
  → AR-3 → implement → lint → refactor → AR-4 → quality checks →
  sandbox checkpoint (if user-observable) → commit.
- Phase 2: AR-5 pre-merge review → commit prompt.

Atomic per-behavior commits with --no-verify. No new git branches
unless I explicitly ask. AR cycles are mandatory; the agent doesn't
skip them.

Start with plan mode.
```

## What the agent reads in priority order

1. [`03-orchestrator-and-contracts.md`](./03-orchestrator-and-contracts.md)
   end-to-end.
2. `0-curricula/AGENTS.md` and `0-curricula/DEV.md` — workflow +
   conventions.
3. [`../README.md`](../README.md) § Pedagogical first principles —
   the quadrant + pyramid frame is mandatory context.
4. [`../DOCS.md`](../DOCS.md) § Pedagogical grounding —
   architectural decisions with framework mapping.
5. [`../REFACTOR-HANDOFF.md`](../REFACTOR-HANDOFF.md) — to confirm
   prerequisite execution state.
6. The peer `README.md` + `DOCS.md` for the directory the
   increment will modify (e.g. `orchestrate/README.md`).
7. [`02-analysis-and-recommender.md`](./02-analysis-and-recommender.md)
   — only if the increment is Layer II (L5/L6) and consumes the
   recommender.
8. The current source under `orchestrate/` (post-refactor)
   — read whole files, never split.

## Expected session cadence

| Increment | Expected sessions | Notes                                                |
| --------- | ----------------- | ---------------------------------------------------- |
| F1        | 2                 | Phase 0 + Phase 1 implementation.                    |
| F2        | 1                 |                                                      |
| F3        | 1                 |                                                      |
| F4        | 1                 | Coordinate with `04-lens-migration.md`.              |
| F5        | 1                 |                                                      |
| L1 + L2   | 1 combined        | Educator default rides the picker.                   |
| L5 + L6   | 1 combined        | Only if WS2 recommender is ready.                    |
| L7 + L8   | 1 combined        | Mostly plugin work.                                  |

Each session ends with a sandbox checkpoint if the increment is
user-observable. Pause for human browser verification before
committing user-observable behavior.

Per `development-guide.md`, ideal session length is 1-2 hours;
maximum useful is ~3 hours before context quality degrades. Signs
of degradation: agent starts repeating itself, forgets earlier
decisions, proposes things that contradict the plan. Start a new
session at any natural Phase boundary or when degradation appears.

## Red flags to watch for during the session

Stop the agent and redirect if you see:

- **Agent skipping Phase 0** — point it at the 03 handoff.
- **Agent treating the toolbar lens-picker as obsolete** — wrong;
  Q-I picker is the always-on autonomy guarantee.
- **Agent building progress-modelling, learner-state, or LMS
  integration** — wrong; those are out of scope per the 03
  handoff's §Scope boundary.
- **Agent re-implementing the recommender's applicability filter
  or ranking engine** — wrong; defer to WS2
  (`02-analysis-and-recommender.md`).
- **Agent re-introducing per-snippet study tours / `lensSequence`
  / `config.sequence`** — DEFERRED per user decision.
- **Agent emitting events out of `<StudyLenses>` to a host** —
  DEFERRED until a concrete integration target exists.
- **Agent debouncing or pre-building embodiments in the
  background** — wrong; embodiment is built lazily on lens-open /
  evaluation trigger only.
- **Agent treating lenses as single-file React components** —
  wrong; lenses are TS core + React wrapper (two-layer module).
- **Agent surfacing format/parse errors while the learner is
  typing** — wrong; errors surface at re-embodiment trigger
  (lens-open or evaluation), not on every keystroke.

## Coordination points with other handoffs

- **[`REFACTOR-HANDOFF.md`](../REFACTOR-HANDOFF.md)** — prerequisite.
  If a session uncovers a refactor bug, stop and surface it; don't
  fix it in-line. The refactor is its own change.
- **[`02-analysis-and-recommender.md`](./02-analysis-and-recommender.md)
  (WS2)** — produces `orchestrate/lib/recommender/`. Layer II in the
  03 handoff consumes it. Coordinate via `.planning-handoffs/`
  notes if both are in flight.
- **[`04-lens-migration.md`](./04-lens-migration.md)** — produces
  individual lenses at `lenses/<name>/`. F4 (first trial lens)
  overlaps; coordinate so one lens is finished end-to-end (TS
  core + React wrapper) before F4's sandbox checkpoint.
- **`src/plugins/study-lenses/`** — alignment work (drop
  `transforms`, drop `lang`, rename `code` → `snippet`) is
  cross-tier. Lands AFTER F1; gates L7-L8. Note that
  REFACTOR-HANDOFF does NOT currently include plugin steps;
  recommend adding new steps there OR creating a sibling
  plugin-alignment handoff.

## What to do after the agent completes a session

1. **Review the diff.** Confirm changes match the increment's
   intent. AR-5 (pre-merge review) is the agent's responsibility,
   but spot-check before approving the commit.
2. **Run the test suite locally.** `npx vitest run …` — confirm
   green; don't trust agent claims of "tests pass" without
   verifying.
3. **Run the dev server and browse.** For user-observable
   increments, the sandbox checkpoint should already have
   happened, but a fresh browser session catches regressions the
   agent didn't think to test.
4. **Push to main.** Per `feedback_no_branches`, the user pushes
   directly to main; agents do not push.
5. **Update `.planning-handoffs/` notes** if the session surfaced
   open questions or decisions that need cross-stream
   communication.
6. **Decide the next session's increment.** The pyramid
   build-order is the default; deviate only if a sibling stream
   needs unblocking.
