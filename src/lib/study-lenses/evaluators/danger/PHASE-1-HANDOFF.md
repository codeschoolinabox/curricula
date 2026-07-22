# danger — Phase-1 handoff (TDD)

> **Transitional coordination scaffolding, not an end-state doc.** Delete when
> danger's implementation lands. Cold-start-validated before hand-off.

## Where this is

- **Phase 0 (DDD) is COMPLETE and committed** — `09045cb4` (`docs: danger
  evaluator Phase-0 spec …`). Artifacts: `evaluators/danger/{README.md, DOCS.md,
  types.ts, backend/types.ts}`, both ARs run and resolved (AR-1 PAUSE→resolved,
  AR-2 CONSIDER→resolved).
- **The Phase-0 → Phase-1 human gate is the current stop.** Do **not** start Inc 0
  until the human approves Phase 1. (This handoff is input to that gate, not a
  license to skip it.)
- **AR-5 baseline SHA = `09045cb4`** (AR-5 pulls `git diff 09045cb4..HEAD`).
- Model routing: an Opus/Sonnet/Haiku agent follows `AGENTS.md`; a Fable agent
  follows `AGENTS.fable.md`; **`DEV.md` is canonical** for both. Never pass a
  `model` param to `ar-*` agents.

## Authority order (read this first)

1. **The committed spec is authoritative:** `evaluators/danger/{README.md,
   DOCS.md, types.ts, backend/types.ts}` and the kind contract
   `evaluators/types.ts`. Conform to it.
2. **The increment roadmap** (Inc 0–6, TDD sequence, quarry pointers, verification)
   is in the plan `~/.claude/plans/your-instructions-claude-plans-claude-pl-linear-conway.md`.
   It is a roadmap, not a contract — **on any plan-vs-spec conflict, the committed
   spec wins.** The plan has been reconciled to the spec, but confirm the points
   below.

### Reconciliations the committed spec pins (do not re-derive wrongly)

- **debugger** is **opt-in, default off** (`backend/types.ts` `debuggerEnabled?`),
  NOT "always-on." A learner's *own* `debugger;` is a real breakpoint with no
  injection; the injected step-from-top bracketing is the toggle.
- **The evaluator object lives in `index.ts`** (default export), per the committed
  README + the region anatomy — not `danger.ts`. `main`/`applicability`/
  `settlement` are optional internal helpers (sibling files or inline), decided at
  Inc 6 by newspaper-order + size.
- **`toSettlement` MUST attach `reason`** (`threw` | `loop-cap` | `timeout`), per
  committed `danger/types.ts` `DangerEvaluationError`/`DangerSettlement`. A bare
  `{name,message}` error does not typecheck. Mapping: `errored→threw`,
  `limit-exceeded→loop-cap`, `timed-out→timeout` (there is no `parse` reason — a
  `SyntaxError` is a `threw` whose `name` carries the signal).
- **applicability is pure over the spec**; the no-`document` (SSR) refusal is
  returned by **`main`** as refusal-as-data, not decided in applicability.

## Copy-only + shared-tree discipline

- The quarry (`study-lenses--deprecated-architecture/**`, `src/lib/embody/**`) is
  **read-only**: `cp -p` then `git add`; never edit, move, or stage it. Copy
  sources: `…/lib/loop-guard/` (Inc 0) and `…/lib/danger-runner/` (Inc 1–2), whose
  `LOOP-GUARD-READY.md` carries the exact `guardLoops → spliceLoopGuards` swap
  checklist + hook text.
- The working tree is shared with **concurrent streams** (aithor evals, jej,
  orchestrate/generator, telemetry, and a dirty `lib/README.md`). **Stage only
  your own files, by explicit path**; verify `git diff --cached --name-only` before
  every commit.

## Supersedes the region handoff

`evaluators/PHASE-1-HANDOFF.md` (dated 2026-07-17) predates the danger-first
pivot: it says "no implementation exists," frames the *first* evaluator as a
**tracer**, and its gate/baseline are stale. For the danger sub-effort it is
**superseded** — danger is the first concrete evaluator being built. That doc
still describes the eventual *tracer* Phase 1; do not follow its "build a tracer
first" framing here.

## Do-not

- Do not start Inc 0 before the human Phase-1 approval.
- Do not edit the kind contract (`evaluators/types.ts`) — danger needs no change
  to it (settled).
- Do not push (human-gated); do not branch or amend.
