# .handoffs — evaluating/run

## Active work

One task remaining: **Merge continuation (M.3–M.6 + AR-5)**.

Loop-guard work is complete (commits `641435f` through `a41eaf3` on main).

## Pre-spawn checklist

Do this before spawning the agent:

1. Run `npx tsc --noEmit` and note any errors — this is the baseline.
   Expect errors in `shared/create-execution.ts` and trace files.
   Those are pre-existing and not the agent's problem.
2. The agent's first task is fixing `api/default.ts:15` (M.1-cleanup —
   a dangling import left over from when `api/run.ts` was deleted).
   This is fast; let it proceed before checking in.

## Invocation prompt (copy-paste)

```text
You are the merge continuation agent for the evaluating/run engine in
the @study-lenses codebase. Your spec is at:

/Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/.handoffs/agent-merge.md

Read that spec end-to-end first. Then read AGENTS.md and DEV.md at the
repo root before writing any code.

Your scope is M.3 (EVENT_READY), M.4 (replay), M.5 (timer-pause-during-
yield), M.6 (doc cleanup), and AR-5 (pre-merge review).

Before starting M.3: do the M.1-cleanup task in the spec (fix
api/default.ts:15 import).

Check-ins with me are expected at:
- After M.5 lands (sandbox checkpoint — I will run stepping mode)
- After AR-5 batch-fix (final review before push)
```

## Check-ins to expect

| When | What you do |
| --- | --- |
| After M.5 commits | Run sandbox stepping mode: step through a ~30-event program over 2+ minutes. Timer must NOT fire. |
| After AR-5 batch-fix | Final review of punch list before agent asks you to push. |

## Sandbox

URL: `http://localhost:5173/lib/editing/sandbox.html`

Start command:

```bash
cd /Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula
npx vite --config src/lib/welcome-to-programming/just-enough/javascript/lib/evaluating/run/vite.sandbox.config.ts
```
