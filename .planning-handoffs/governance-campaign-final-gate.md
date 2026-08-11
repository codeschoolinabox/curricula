# Governance-mechanisation campaign — YOUR final-gate checklist

> Written 2026-07-30 at session close. Campaign COMPLETE: 40 commits,
> `3da375e9..04633f1f`, all unpushed at time of writing. Full trail:
> `~/.claude/plans/you-are-picking-up-foamy-wall.md` (plan of record). Delete
> this file once every box is ticked (transitional scaffolding).

## Do these (any order, at your leisure)

- [ ] **1. Push.** `git push --set-upstream origin main` — local `main` has no
      upstream yet. Moves ~181 commits total: the campaign's 40 plus ~141
      pre-existing peer/prior-campaign commits sharing this tree. Expected, not
      an alarm. (Re-measure before pushing if days have passed:
      `git log --oneline origin/main..HEAD | wc -l`.)
- [ ] **2. Live-fire the pinned-guard's ASK path** (the one behavior never
      exercised live — an unattended permission prompt would have stalled the
      autonomous session). Recipe: run
      `git grep -n "// PINNED" -- "*.test.ts" "*.test.tsx"` (5 hits at close),
      pick any hit, ask any agent to Edit that pinned line. EXPECT: an ASK
      permission prompt quoting the pin's ruling text. Answer **deny** to leave
      the tree unchanged. If NO ask appears, the guard is not firing — check the
      registration in `.claude/settings.json` (PreToolUse `Edit|Write`) and run
      `npm run test:hooks`.
- [ ] **3. At your next fresh session start:** confirm `tdd-worker` appears in
      the agent roster (the registry snapshots at session start; the file landed
      at `b49e5834`). Ten seconds.
- [ ] **4. Audit the SIMULATED rulings** (whenever you like):
      `grep SIMULATED ~/.claude/plans/you-are-picking-up-foamy-wall.md` — 15
      entries at close, each ledgered with its rationale. Overrule any and tell
      the next agent session what to unwind.

## Decide these (AR-5 counter-proposals — routed to you by the

## governance-surface invariant; none are built yet)

- [ ] **5a. CI visibility for the checker:** add `npm run check:governance` as a
      `continue-on-error: true` CI step next to lint — a crashed checker entry
      becomes visible in CI logs instead of silent (the advisory hook degrades a
      crashed checker to silence by design).
- [ ] **5b. Allowlist the campaign's own instruments:** settings.json `allow`
      rows for `Bash(npm run check:governance)`, `Bash(npm run repo:facts)`,
      `Bash(npm run typecheck:scripts)` — today every manual run prompts, which
      taxes exactly the behavior you want more of.
- [ ] **5c. The SessionStart instrument gap:** nothing measures whether
      SessionStart injection reaches a spawned subagent (harness-probe covers
      router reach only; two docs now state this honestly instead of asserting).
      Option: extend `.claude/agents/harness-probe.md` with a fifth probe.
      Bigger than 5a/5b; fine to defer.

To build any of 5a–5c: open a fresh session (any capable model; these are small,
well-specified edits) and say e.g. — "Build items 5a and 5b from
.planning-handoffs/governance-campaign-final-gate.md; governance chain first;
full AR ceremony; the plan of record is
~/.claude/plans/you-are-picking-up-foamy-wall.md."

## Parked (already-decided deferrals, no action now)

- `.md`-pin extension (`<!-- PINNED(...) -->`) → the anti-impoverishment design
  round (ruling-9 simulated deferral).
- Wave-P Probes A/B → deferred with the job-B follow-ons.
- Ruling dates in ledgers/pins mix local and UTC day-frames — cosmetic, flagged
  by AR-5, left unfixed.
