# Cluster A launch — engine TDD (cold-start handoff)

Audience: a fresh Fable-generation agent with NO prior conversation context.
Written 2026-06-11, immediately after commits `f2f1f5e` (engine Phase 0 DDD
artifacts) and `63b71e2` (engine hoisted to
`src/lib/just-enough/javascript/lib/engine/`, since renamed to
`src/lib/study-lenses/lib/engine/`). All repo paths below are repo-rooted from
`0-curricula/`.

## Path-drift warning — read first

A concurrent agent ran a large orchestrator/embody codebase refactor with
renames AFTER this handoff was written. Every path in this handoff was valid at
commit `63b71e2`; by the time it was committed the refactor had already begun
renaming `src/lib/just-enough/javascript/` → `src/lib/study-lenses/`, and more
renames may have followed. Paths here are HINTS, not truth — if a path does not
exist, search by module/file name (`engine/types.ts`, `worker-protocol.ts`,
`trace-worker.ts`) before assuming deletion. Module CONTENTS, commit SHAs, and
the canonical plan's decision numbers are rename-proof; only paths drift.

## Path refresh — your FIRST task, before Orientation

1. Establish ground truth: the directory containing this handoff is the engine's
   real home (`…/engine/.handoff/` → the module is one level up). Locate the
   oracles by name, not path:
   `git log --oneline --follow -- '**/worker-protocol.ts'`, or
   `find src -name trace-worker.ts`; `git log -1 --follow -- <found-path>`
   confirms a move preserved content.
2. Rewrite every stale path IN THIS HANDOFF to the post-refactor truth
   (repo-rooted), and fix the same paths where they appear in the canonical
   plan's RESUMPTION POINT and §Launch prompts.
3. Prompt the human for a small commit:
   `docs: refresh campaign handoff paths after the orchestrator refactor`.
4. **If the refactor is still IN FLIGHT when you start** (you may be launched in
   parallel with it — check `git status` for a large foreign staged rename set):
   skip the refresh commit (step 3), resolve paths by name continuously instead
   of once, and do the refresh commit when the tree stabilizes. Your own module
   directory may move mid-session — re-`find` it rather than caching its
   absolute path.
5. Only then start Orientation below.

## Running in parallel with the orchestrator refactor

This workflow is isolated enough to run alongside the refactor (all writes land
inside the engine module; oracles are read-only). Three disciplines make it
safe:

- **Commit discipline**: before EVERY commit, `git status` — if a foreign staged
  set exists (the orchestrator's renames), a bare `git commit` would swallow it.
  Commit with explicit pathspecs (`git commit <your-paths> -m "…"`), which is
  clean for new files, or wait for the foreign commit to land. Never unstage or
  touch the foreign entries.
- **Root configs are the orchestrator's blast zone** (eslint.config.mjs,
  tsconfig, vitest config). If wiring your tests requires a ROOT config edit,
  check `git status` on that file first and check in with the human —
  engine-local files are always safe, root files need coordination.
- **Old-engine suites are reference, not signal, during the refactor window**:
  derive your tests from them by reading; do not gate your increments on the old
  browser suites passing while the tree is being renamed under them.

## Orientation (in order, before any work)

1. Read `CLAUDE.md` at the repo root and follow its governance routing for your
   model generation (Fable → `AGENTS.fable.md`; ARs and conventions route into
   `DEV.md`).
2. Read the canonical campaign plan END-TO-END:
   `/Users/master/.claude/plans/read-0-curricula-claude-md-then-lib-eval-reactive-sprout.md`
   It is CANONICAL — where anything (including this handoff) conflicts with it,
   the plan wins. Your scope is **§Cluster A only** (A1 → A4). Phase 0 is
   committed. Phase 0-bis (tracers + adapter DDD) is a PARALLEL workflow — see
   `src/lib/study-lenses/embody/lib/evaluating/.handoff/phase-0-bis-launch.md` —
   and Cluster A does NOT depend on it: the engine ships its own trivial test
   logic (A2).
3. Read this module's committed ground truth END-TO-END — it is the contract you
   implement, not a suggestion: [README.md](../README.md) (drain semantics, the
   two-sided contract, outcome carriage, pause economics, glossary),
   [types.ts](../types.ts), [DOCS.md](../DOCS.md) (the architectural sketch
   every Refactor step is held against — phases, Mermaid data flow, structural
   constraints incl. the Stops block).
4. Enter plan mode. Run the mandatory Plan-agent design pass. Exit for human
   approval before any edit. Record `git rev-parse HEAD` at approval.

## Scope — Cluster A increments (TDD; ARs are NEVER agent-skippable)

Per-increment chain (canonical §Execution checklist, binding for EVERY
increment): JSDoc → stub → ONE failing test (ZOMBIES order, triangulated) →
**AR-3** → implement → `npx eslint <file>` → refactor vs the DOCS.md sketch →
self-review checklists → **AR-4** → quality gates → declare "no sandbox
checkpoint: pure infrastructure" → commit prompt → HUMAN approval.

- **A1** `worker/protocol.ts` — shared-memory layout + typed call channel +
  BOUNDS CHECK (loud failure at the 8168-byte payload ceiling; fixes the old
  engines' unbounded `payload.set`).
- **A2** `worker/bootstrap.ts` + the thin-entry pattern + ready handshake +
  identifier-validated globals injection + strict flag. Named deliverables:
  `testing/reference-logic.ts` (engine-owned trivial worker+thread logic),
  `testing/test-worker-entry.ts`, and the engine's COOP/COEP browser harness
  (vite sandbox-config pattern from intercept).
- **A3** `evaluate.ts` — lazy handle; pump with drop-vs-yield; **result drain**
  (engine pulls an unclaimed stream; engagement at the engine's first on-behalf
  pull, never at result access; iterator-first keeps backpressure); termination
  machine (first-write-wins incl. halt; break≡cancel iterator interception —
  drive via next, never native return); timer (per-yield charge, event-ready +
  positive-budget reschedule, pause during yield-wait + call service); call
  dispatch (uninterruptible, response discarded on stop).
- **A4** `testing/fake-transport.ts` + the two-tier conformance suites:
  `tests/conformance/agnostic/` (real AND fake transports) and
  `tests/conformance/transport/` (real-only — Atomics, pause ordering, payload
  ceiling, timer). A fake-green proves logic, never transport fidelity.

## Oracles (read before the increment that uses them; do NOT delete them)

- A1: `src/lib/study-lenses/embody/lib/evaluating/intercept/worker-protocol.ts`
  and its tests — 8192-byte buffer, 6×Int32 header, payload at byte 24.
- A2:
  `src/lib/study-lenses/embody/lib/evaluating/trace/semantics/tracing/trace-worker.ts`
  (worker-global advice registration) and intercept's `vite.sandbox.config.ts`.
- A3: intercept's cancel / event-ready / timer-pause-yield suites AND its
  PromiseLike/await-drain suites (genericize them); `…/evaluating/run/DOCS.md`
  §Cancel mechanics (settle-guard table, discard-mock-response, leading-defer).
- The old engines keep running as oracles until Cluster E retires them.

## Landmines (verified this campaign)

- Shell cwd resets between Bash calls — `cd` with an absolute path every time;
  gates run from the repo root.
- markdownlint-cli2 force-globs the whole repo — grep its output for YOUR files;
  pre-existing noise elsewhere is not yours.
- cspell is broken in this env (Node 20.11 < required 20.18) — skip it and
  declare the skip in every commit prompt; `npm run validate` will fail on it,
  so run gates individually.
- prettier: `--check` first; `--write` only on files that are yours and clean
  (it reflows whole files).
- Full gates apply here (this module is OUTSIDE the tsconfig/eslint quarantine
  excludes); lint enforces `type` over `interface`.
- A Claude-Code-Mapper PreToolUse Read hook returns cached structural maps for
  code files — bypass with Read offset/limit to get full content.
- The working tree is SHARED with concurrent sessions — stage explicit paths
  only, never `git add .`; verify the staged diff is only yours; expect HEAD to
  move between your commits.
- vitest: "Unhandled Errors" fail a FILE without failing any test — read the
  `Test Files`, `Tests`, and `Errors` summary lines, all three.
- Browser suites run with `fileParallelism: false`; old-engine browser suites
  run alongside as oracles (accepted CI duplication until Cluster E).

## Standing rules

Commits on main, no branches, `--no-verify` permitted, never amend, the human
approves every commit, ARs via the registered `ar-1`…`ar-5` agents (pass paths +
baseline SHA, never pasted contents, never a `model` param), batch-fix review
findings in-commit. Campaign AR-5 baseline: `4130b57f`. Update the canonical
plan's RESUMPTION POINT at increment-cluster boundaries; validate any further
handoff with a context-free probe before cold-starting it.
