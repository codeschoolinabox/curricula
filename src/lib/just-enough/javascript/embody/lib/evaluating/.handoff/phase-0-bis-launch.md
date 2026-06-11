# Phase 0-bis launch — tracers + adapter DDD (cold-start handoff)

Audience: a fresh Fable-generation agent with NO prior conversation context.
Written 2026-06-11, immediately after commits `f2f1f5e` (engine Phase 0 DDD
artifacts) and `63b71e2` (engine hoisted to
`src/lib/just-enough/javascript/lib/engine/`). All repo paths below are
repo-rooted from `0-curricula/`.

## Path-drift warning — read first

A concurrent agent is running a large orchestrator/embody codebase refactor with
renames. Every path in this handoff was valid at commit `63b71e2`. If a path
does not exist, the refactor moved it — search by module name before assuming
deletion. The engine at `src/lib/just-enough/javascript/lib/engine/` is expected
to keep its path; modules under `embody/` may move — including this directory.

## Orientation (in order, before any work)

1. Read `CLAUDE.md` at the repo root and follow its governance routing for your
   model generation (Fable → `AGENTS.fable.md`; ARs and conventions route into
   `DEV.md`).
2. Read the canonical campaign plan END-TO-END:
   `/Users/master/.claude/plans/read-0-curricula-claude-md-then-lib-eval-reactive-sprout.md`
   It is CANONICAL — where anything (including this handoff) conflicts with it,
   the plan wins. Your scope is **§Phase 0-bis only**: DDD for two new modules,
   no implementation. It depends only on the committed Phase 0 (`f2f1f5e`, done)
   and MUST complete before Cluster B. Cluster A (engine TDD) is a PARALLEL
   workflow — see
   `src/lib/just-enough/javascript/lib/engine/.handoff/cluster-a-launch.md` —
   neither blocks the other.
3. Read the committed engine contract END-TO-END — the tracers and the adapter
   are its first consumers:
   `src/lib/just-enough/javascript/lib/engine/README.md` (two-sided contract,
   drain semantics, outcome carriage, §Pause economics, §What the opaque
   payloads carry, glossary), `…/engine/types.ts`, `…/engine/DOCS.md`.
4. Read the adapter-target ground truth: `…/embody/types.ts` §8–10
   (EvaluateHandle / EndReport / RunInstance / IoMocks); `…/embody/DOCS.md`
   §Consumer-driven stops + §Static/runtime asymmetry. Tier behavior ground
   truth: `…/evaluating/intercept/DOCS.md`, `…/evaluating/run/DOCS.md`,
   `…/evaluating/trace/semantics/tracing/DOCS.md` (and trace-worker.ts for the
   advice-on-globalThis pattern).
5. Enter plan mode. Run the mandatory Plan-agent design pass. Exit for human
   approval before any edit. Record `git rev-parse HEAD` at approval.

## Scope — two new modules, each through the FULL Phase 0 ceremony

Each module: ubiquitous language → README spec → **AR-1** → types.ts → DOCS.md
with the Mermaid `## Data flow` diagram → **AR-2** → review/resolve → commit
prompt → **HUMAN GATE**. ARs via the registered agents, never skipped by you.

- **`…/embody/lib/evaluating/tracers/`** — the five embody tiers as data +
  logic. README pins: the tiers as data (run / intercept / trace.variables /
  trace.syntax / trace.semantics); worker logic and thread logic per tier;
  NM-event production incl. step numbering, prev/next, loc via the node index;
  the mock model (prompt/alert/confirm functionally MANDATORY in workers — they
  do not exist there natively; console optional); iteration limits — ONE shared
  limit-throw shape, classified consumer-side inside `serializeHalt`, plus the
  refinement schema the thread logic produces; the nodePath index moves OUT of
  instrumentation (one parse, index produced by the instrumentation transform).
- **`…/embody/lib/evaluating/adapter/`** — same artifacts, same cycle, same
  commit cadence: Snippet projection; the not-runnable short-circuit (a gated
  snippet never invokes the engine); RunInstance assembly + snippet back-ref +
  AUTHORITATIVE deep-freeze; EndReport vocabulary mapping incl. the
  errored+refinement → limit-exceeded rewrite and the cancelled/failed →
  `error: null` pins.
- `embody/DOCS.md` gets its one-paragraph adapter pointer at WIRING time
  (Cluster B3), not now — embody DOCS is an architectural contract; updating it
  needs explicit user approval.

## Layer rule (canonical settled decision 10 — binding)

ALL critical behavior lives in the standalone engine; embodiments are objects
containing the engine as a property, or light wrappers — mapping and vocabulary
ONLY. The engine's handle already drains (`result` always settles); the adapter
maps it onto embody's `EvaluateHandle`, never re-implements machinery. Layer
test for every design question: "would a non-embody consumer need it?" yes → it
belongs in the engine (raise it, don't build it here); no → embodiment.

## Engine-contract facts the tracers must honor (details in engine README)

- §Pause economics: every emit costs a full pause round-trip even when dropped —
  high-frequency tiers (trace.semantics advice) MUST gate worker-side, before
  emitting.
- §What the opaque payloads carry: the refinement must distinguish an
  instrumentation-owned limit from a learner `RangeError` WITHOUT string
  matching; iteration counts ride the worker-authored halt payload
  (`serializeHalt` fires on every worker-side stop, natural end included);
  downstream errors are built from the halt payload.
- The call channel is `string | boolean | null | undefined` within an 8168-byte
  ceiling — richer data rides JSON-in-string.

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
- Full gates apply to the new modules (OUTSIDE the quarantine excludes); lint
  enforces `type` over `interface`.
- A Claude-Code-Mapper PreToolUse Read hook returns cached structural maps for
  code files — bypass with Read offset/limit to get full content.
- The working tree is SHARED with concurrent sessions — stage explicit paths
  only, never `git add .`; verify the staged diff is only yours; expect HEAD to
  move between your commits.

## Standing rules

Commits on main, no branches, `--no-verify` permitted, never amend, the human
approves every commit, ARs via the registered `ar-1`…`ar-5` agents (pass paths +
baseline SHA, never pasted contents, never a `model` param), batch-fix review
findings in-commit. Campaign AR-5 baseline: `4130b57f`. Update the canonical
plan's RESUMPTION POINT at phase boundaries; validate any further handoff with a
context-free probe before cold-starting it.
