# Variables tracer launch — DDD + TDD (cold-start handoff)

Audience: a fresh Fable-generation agent with NO prior conversation context.
Written 2026-06-12, after Cluster A of the evaluating-engine campaign completed
(the generic engine is implemented, tested, and committed at
`src/lib/study-lenses/lib/engine/` — commits `e07c8da`..`16c523c`). All paths
below are repo-rooted from `0-curricula/` and were valid at commit `8d7ccb3`;
the tree is SHARED with concurrent sessions — if a path 404s, resolve by name
(`find src -name build-scope.ts`) before assuming deletion.

## Mission

Build a **variables tracer**: a standalone, fully functional tracer that runs a
JEJ program in the engine's sandbox and emits **variable lifecycle events** — a
deliberate hybrid of the semantic-level and syntax-level variable vocabularies:

- **scope creation** when a script or block that declares variables is entered,
  carrying ALL variables declared in that scope (this implicitly expresses the
  TDZ: declared-but-uninitialized);
- **scope close** when that block exits, carrying the cleaned-out variables
  (close must fire on break/continue/throw exits too);
- per-variable, in lifecycle order: **initialize**, **available**, **read**,
  **assign** (the human's working name — the semantic vocabulary says `update`,
  the syntax surface says write; the DDD's pinning table decides), and the
  increment-style update IF the JEJ allowlist admits one (it allows `++`/`--`
  and compound assignment — verify against `just-enough-js.ts` at DDD; do not
  invent events for syntax JEJ forbids).

JEJ-only. Acorn + custom string-splice instrumentation (NO Aran).

It serves four purposes, in priority order: (1) exercise the freshly built
engine end-to-end as its first real consumer; (2) road-test the engine factory's
consumer signature and ergonomics — friction you hit IS a finding, report it;
(3) be the first simple, complete tracer for later embedding in embodiments; (4)
feed a future lens that quizzes learners on the variable lifecycle of arbitrary
JEJ programs (out of scope to build, in scope to keep the stream quiz-friendly:
deterministic ordering, value snapshots, nodePath attribution for source
highlighting).

## Placement (pre-made recommendation; the human ratifies at plan approval)

Build at **`src/lib/study-lenses/embody/lib/evaluating/tracers/variables/`**.

- NOT `evaluating/trace/variables/`: the tsconfig quarantine excludes
  `evaluating/trace/**` (old-engine debt) — new code there gets no typechecking,
  and un-excluding is a root-config edit in the concurrent orchestrator's blast
  zone.
- `evaluating/tracers/` is the campaign's target home for tier logic (Phase
  0-bis direction). `tracers` ≠ `trace`, so full gates apply and the existing
  vitest globs collect its tests with zero config edits.
- Coordination: Phase 0-bis (the tracers + adapter DDD,
  `.handoff/phase-0-bis-launch.md` in this directory) may run in parallel and
  owns the tracers/ MODULE-level DDD. This workflow builds ONE tier inside it;
  keep the tier self-contained so the module DDD can fold around it. If Phase
  0-bis has already created `tracers/README.md`/`DOCS.md`, read them and
  conform; if not, create only your tier directory and leave module-level docs
  to Phase 0-bis.

## Orientation (in order, before any work)

1. Read `CLAUDE.md` at the repo root and follow its governance routing (Fable →
   `AGENTS.fable.md`; conventions, the AR protocol, and the workflow route into
   `DEV.md`).
2. Read the engine contract END-TO-END — you are its first real consumer:
   `src/lib/study-lenses/lib/engine/README.md` (the two-sided contract, drain
   semantics, pause economics, glossary), `…/engine/types.ts`,
   `…/engine/DOCS.md`. Consumption facts: `evaluate(spec)` — code in, lazy
   `EngineHandle` out; you ship a thin worker entry (a few lines wiring
   `engine/worker/bootstrap.js` to YOUR worker setup — pattern:
   `…/engine/testing/test-worker-entry.ts`); your worker setup injects trap
   globals and an attribution-preserving `serializeHalt`; your thread logic maps
   opaque worker messages → typed variable events. (The bootstrap is
   `bootstrap.ts` on disk; `.js` appears only in import specifiers,
   NodeNext-style.) Node tests ride `…/engine/testing/fake-transport.ts` (sync
   calls only); browser tests ride the real transport (vitest `browser` project
   collects `src/lib/**/*.browser.test.ts` with COOP/COEP served).
3. Read the campaign plan for CONTEXT and coordination (NOT canonical for this
   workflow — this is its own campaign):
   `/Users/master/.claude/plans/read-0-curricula-claude-md-then-lib-eval-reactive-sprout.md`
   — especially §Settled decisions 5–10 (streaming-only, opaque items,
   time-vs-other-limits split, drain) and the §RESUMPTION POINT's Cluster A
   decisions. The plan's older sections predate the study-lenses rename in
   places (`just-enough/javascript` paths); this handoff's paths are current.
   The export-shape direction binding on every tier: the tier calls the engine
   factory IN-MODULE and exports the final built generator as its primary export
   — code in, handle out; consumers never assemble engine parts.
4. Read the ground truth you hybridize:
   - `src/lib/study-lenses/embody/language-levels/just-enough-javascript/` —
     study the WHOLE directory; `notional-machine.md` is the vocabulary
     AUTHORITY for this tracer (§ Lifecycle: four phases, § Bindings, § Scopes,
     § Scope chain lookup, § Environment is derivable, not an event) — the DDD's
     ubiquitous language comes from here first, the trace type files second;
     `reference.md` is the learner-facing JEJ surface.
   - `src/lib/study-lenses/embody/lib/evaluating/trace/semantics/tracing/types.ts`
     — `BindingEvent` (`declare | initialize | available | read | update`, kind
     `let | const | global`, the TDZ lifecycle ordering) — the semantic
     vocabulary;
   - `src/lib/study-lenses/embody/lib/evaluating/trace/syntax/types.ts` —
     `ScopeStep` (create/leave + hoistedBindings), `InitializationStep`,
     `WriteStep`, `IdentifierExpressionStep` — the syntax-surface shapes;
   - `src/lib/study-lenses/embody/types.ts` — the embody NM events
     (`RuntimeScopeNMEvent` push/pop, `RuntimeBindingNMEvent`,
     `InitializationNMEvent`, `WriteNMEvent`) and the tier whitelist: the
     contract's `trace.variables` tier = intercept categories + binding. MVP
     scope here is the variable lifecycle ONLY; the console/dialog half of that
     tier contract is embodiment-wiring territory (the engine campaign's
     Clusters B–D) — record the gap in your README's bounded context, do not
     build it.
   - `src/lib/study-lenses/embody/lib/scope/build-scope.ts` — static scope
     analysis (program/block/for-of scopes, per-scope let/const declarations):
     your scope-creation payloads come from here, one parse, at instrumentation
     time;
   - `src/lib/study-lenses/embody/lib/evaluating/intercept/wrap-call-expressions.ts`
     — the proven instrumentation technique: bottom-up acorn-offset string
     splicing, line-preserving, nesting-safe, `__$`-prefixed helper names;
   - `src/lib/study-lenses/embody/lib/validating/validate-program.ts` +
     `just-enough-js.ts` — the JEJ gate (parse + allowlist + scope check);
     validate BEFORE instrumenting; a gated program never reaches the engine.
5. Enter plan mode. Run the mandatory Plan-agent design pass. Exit for human
   approval before any edit. Record `git rev-parse HEAD` at approval (your AR
   baseline).

## Design cruxes — retire these in plan mode, do not discover them mid-TDD

- **Vocabulary pinning**: one table mapping your hybrid events onto (a) the
  semantics `BindingEvent` lifecycle, (b) the embody NM event shapes, (c) what
  JEJ syntax can actually produce (check the allowlist for
  UpdateExpression/compound assignment before promising an "increment" event).
  The DDD's README pins this table; AR-1 challenges it.
- **Read instrumentation**: wrapping every identifier READ (e.g. `x` →
  `__$vrRead('<nodePath>', 'x', x)`) — argument evaluation order means a TDZ
  read throws BEFORE the helper runs; the throw becomes the halt with
  attribution. Decide and document whether that is the wanted TDZ-violation
  story (it matches engine halt semantics). Mind contexts where wrapping an
  identifier is wrong: assignment TARGETS, declaration ids, property keys, the
  callee position you must not detach from intercept-style wrapping.
- **Scope close on every exit path**: block bodies wrapped in
  `try { … } finally { __$vrScopeClose(…) }` fire on break/continue/ throw;
  string-splice this without inserting newlines (line fidelity). Decide what
  "cleaned-out variables" carries (final values? names only?) with the quiz lens
  in mind.
- **Assignment events**: capturing priorValue requires reading the target before
  writing — TDZ/const corners change what is observable. Decide per-form (plain
  `=`, compound, the for-of binding per iteration).
- **Event volume and pause economics**: every emit costs a full pause round-trip
  (engine README § Pause economics). JEJ learner programs are tiny, so
  emit-everything is acceptable for MVP — but state the worker-side aggregation
  fallback in DOCS §Why as the pressure valve.
- **Handle shape**: the tier's primary export wraps `evaluate(spec)` — decide
  what it returns (the EngineHandle as-is, or a thin typed facade narrowing
  items to your event union) and how options (seconds) pass through. Typed
  events at YOUR layer; the engine stays opaque.

## Scope — full ceremony, own workflow

Phase 0 DDD for the tier module (ubiquitous language → README spec → **AR-1** →
types.ts → DOCS.md with the Mermaid data flow → **AR-2** → commit) → **HUMAN
GATE** (the Phase-0 → Phase-1 review gate is human; present the DDD and wait) →
TDD increments per the standing chain (JSDoc → stub → ONE failing test, ZOMBIES,
triangulated → **AR-3** → implement → lint → refactor vs the DOCS sketch →
self-review → **AR-4** → gates → commit, announced). A natural increment shape
(your plan decides): instrumentation transform (pure, Node-tested, oracle:
wrap-call-expressions tests) → worker logic + thin entry (browser harness
exists) → thread logic (pure) → the built generator (integration: fake transport
in Node, real in browser). **AR-5** fires once, pre-merge, after the final
increment (baseline = the SHA you recorded at plan approval). The
engine-ergonomics findings (purpose 2) accumulate in your plan file's RESUMPTION
POINT as you hit them and are reported to the human in the final commit
announcement; anything contract-worthy becomes a PROPOSED engine README/DOCS
amendment for the human — engine docs are an approved contract you never edit
unilaterally. Out of scope: embody/index.ts wiring, the quiz lens,
console/dialog traps, non-JEJ programs. If Phase 0-bis lands tracers/
module-level docs while you are mid-TDD, the module DDD wins: conform your tier
at the next increment boundary.

## Landmines (verified across this campaign)

- Shell cwd resets between Bash calls — `cd` with an absolute path every time;
  `npx` outside the repo root fetches a FOREIGN vitest that crashes on this
  env's Node 20.11.
- `git commit <pathspec>` does NOT pick up untracked files — `git add` explicit
  paths first, always; the tree is shared (never `git add .`, verify the staged
  diff is only yours, expect HEAD to move).
- cspell is broken in this env (Node 20.11 < required 20.18) — skip it and
  declare the skip in every commit announcement; run gates individually, never
  `npm run validate`.
- markdownlint-cli2 force-globs the whole repo — grep its output for YOUR files;
  `npx tsc --noEmit` may show FOREIGN errors from concurrent WIP — your gate is
  zero errors in YOUR paths.
- prettier: `--check` first; `--write` only on files that are yours.
- A Claude-Code-Mapper PreToolUse Read hook returns cached structural maps for
  code files — bypass with Read offset/limit.
- vitest: read all three summary lines (`Test Files`, `Tests`, `Errors`);
  browser project runs with `fileParallelism: false`, `retry: 2` — prefer
  structural parking (the pause protocol) over wall-clock races in browser
  tests.
- Lint conventions that bite: default-only exports (one concept per file; a
  "protocol-as-data" constant file is the pattern for layout tables);
  `sonarjs/no-empty-test-file` is file-level-unsuppressable (runner-style files
  need one real test); `functional/immutable-data` needs reasoned disables
  (file-level only for a declared mutable-state module).

## Standing rules

Commits on main, no branches, `--no-verify` permitted, never amend, commits
autonomous and announced (SHA + message — AGENTS.fable.md invariant 5; pushes
stay human-gated; the Phase-0 → Phase-1 review gate is human), ARs via the
registered `ar-1`…`ar-5` agents (pass paths + your recorded baseline SHA, never
pasted contents, never a `model` param), batch-fix review findings in-commit.
Keep a RESUMPTION POINT in your own plan file at increment boundaries; retire
this handoff (delete it, pointing at your plan) when the workflow completes.
