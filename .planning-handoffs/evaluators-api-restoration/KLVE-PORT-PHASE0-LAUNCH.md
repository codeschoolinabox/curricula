<!-- TRANSITIONAL — launch prompt for the klve instrumentation-port
library unit's Phase 0. Written and context-free-validated 2026-09-05 by
the recording session (commit ledger in its body's SHA union). Deleted
when the migration completes; the ledgers are the durable record. -->
<!-- cspell:ignore klve jsviz undescribe undescribes -->

# LAUNCH — klve instrumentation-port library, Phase 0 (migration-only)

Execute **Phase 0 ONLY** for the klve instrumentation-port library — the adapted
TypeScript port of the klve tracer core — at
`src/lib/study-lenses/evaluators/lib/<name>/` (the directory name is your FIRST
must-answer; ar-1 challenges it). `ceremony: full` (HR-13 carries from the
campaign). Run the artifact order DEV.md § Phase 0 binds: 0.1 README → 0.2 the
twin ask → ar-1 → 0.3 types.ts + DOCS.md sketch + the suite committed skipped →
ar-2 → review, resolve, commit → pre-gate AR-5 → **STOP at the Phase-0 → Phase-1
human gate**. This unit is the FIRST half of the migration-first split
(launch-discussion ruling 2, KLVE-LEDGER § Rulings of record): the tracer
evaluator unit that hosts this library on the engine comes LATER, in its own
fresh session — none of its work is yours.

## Launch preconditions (verify before anything else)

- **Outside-root read grants.** Two read-only references live OUTSIDE this repo.
  The launcher adds both as additional working directories (or grants reads);
  you verify each with one `ls` at Step 0 and STOP to request access if either
  fails:
  - the quarry package:
    `/Users/master/Documents/0-teach-code/0-spiralearn/0-study-lenses-committee/sl-trace-js-klve/`
  - the original app:
    `/Users/master/Documents/0-teach-code/0---the-big-idea/00--evancole-be/0--snippetry/dump/js_visualized_v2/`
- **Model.** This is design work — run it on the STRONGEST available tier
  (Fable-class). `ar-2`/`ar-5` inherit the session model, so a cheaper launch
  downgrades both judgment reviews; if launched cheaper, name that cost to the
  human before proceeding. NEVER pass a `model` parameter when spawning `ar-N` —
  the frontmatter pins govern.

## Read chain, IN ORDER

1. The repo-root `CLAUDE.md` router → your governance file in full → DEV.md §
   Phase 0 + the § Adversarial Review Protocol opening through § Sub-model
   dispatch (the reviewer sourced-claims rule lives there — state it in EVERY
   reviewer prompt you dispatch) + each § AR-N Trigger/Provide + §
   Shared-worktree git mechanics + § ceremony + § Who decides.
2. `.planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md` — the
   SUPERSEDED-BY-KLVE bullet (grep is case-sensitive: "SUPERSEDED-BY-KLVE"), the
   klve pointer bullet with its 2026-09-05 sub-bullet, and § Rulings of record
   end to end; follow the HR-21 bullet's pointer into the LOSS-LEDGER preamble
   for the full three-part Discharges statement (rulings · the fourteen
   forward-compat requirements via the `git show a8a0128d:` command there ·
   classification rows + FLAGs).
3. **`.planning-handoffs/evaluators-api-restoration/KLVE-LEDGER.md` IN FULL —
   your spine, now RATIFIED.** The rows (ids klve-001–097, 088 deliberately
   unassigned; the list is the record, never a count); the nine
   launch-discussion rulings in § Rulings of record (2026-09-05 — RE-CONFIRM
   nothing, re-litigate nothing; they bind); § Close conditions incl. the
   `TRACER:` gate (2b); § Escalations (r1–r9; r10 sits under § Rulings of
   record) as historical record with the post-ratification state line. Every
   `[measured: Pass-3 probe]` row is reproducible via the committed scripts at
   `klve-probes/` (read-only imports of the quarry's dist).
4. The region, whole files: `src/lib/study-lenses/evaluators/README.md` and
   `notional-machine.md` (the lattice you do NOT extend — your library is not an
   evaluator; read them for vocabulary and boundaries);
   `evaluators/lib/README.md` (the container you join);
   `evaluators/intercept/wrap-call-expressions.ts` (the house instrumentation
   precedent — typed, documented, line-preserving, bottom-up) and
   `evaluators/intercept/intercept-worker-setup.ts`;
   `evaluators/lib/iteration-guard/README.md` and
   `evaluators/lib/guarded-worker-base/README.md` (siblings whose glossaries own
   cap/trip vocabulary); `src/lib/study-lenses/lib/engine/README.md` § Public
   API + § The two-sided contract + § Pause economics (the sandbox's host; your
   library itself never imports it).
5. The quarry, READ-ONLY (copy-never-modify; upstream issues to the human):
   package `README.md`/`DOCS.md` + `src/record/` whole files (`README.md`,
   `trace.ts`, `types.ts`, `filter-steps.ts`, `ast-map.ts`, `index.ts`,
   `babel-standalone.d.ts`).
6. The original app, READ-ONLY: `src/worker/index.js`,
   `src/worker/transpile_plugin.js`, `src/lib/describe.js`,
   `src/lib/add_waiting_time_steps.js`, `src/lib/useReplacableWorker.js`,
   `src/ui/Step.jsx` — the ancestor whose architecture the port returns to
   (worker-hosted, describe on the wire, undescribe at render).
7. For the coercion-legs vocabulary (klve-097): the deprecated Aran config
   surface, read-only, via HR-16's archaeology (LOSS-LEDGER § Rulings of record;
   the HR-16 bullet carries the commands and pins its SHAs — note its "the
   quarry" means the deprecated in-repo trace/semantics lineage, NOT this
   document's sl-trace-js-klve quarry).

## The design frame (rulings by pointer — never re-litigate)

The nine launch-discussion rulings (KLVE-LEDGER § Rulings of record, 2026-09-05)
govern. The north-star, the human verbatim: **"your north-start should be
ECMAScript fidelity _in the final data emitted from tracer events to the
generator consumer_. Whatever it takes to get there while still accurately
capturing the program's execution is ok."**

The port's shape obligations, from the rulings:

- **Adapted TypeScript port** (ruling 1): klve's source ports to TS under this
  repo's conventions; adapt where reasonable; load-bearing Babel idioms ride as
  NAMED TYPED DEVIATIONS (targeted disables + real types, never `@ts-nocheck`);
  Kelley van Evert's attribution rides every ported file's header (klve-072's
  two credits).
- **Instrument-time configuration** (ruling 5, r10): capture instrumentation is
  config-gated at transform time — an un-configured node gets NO wrapper at all;
  meta-control (loop restructures, cache temps, return handling, the counter/cap
  channel) is unconditional; counting splits from recording (`maxSteps` counts
  executed instrumented sites, klve-096's basis, whatever is emitted).
- **The eleven r8 repairs** are native-correct in the port by construction
  (rulings 1/4; the facets are enumerated at KLVE-LEDGER § Escalations r8 and on
  their rows), differential-suite-pinned.
- **Host-agnostic API**: text + config in → instrumented text + the collector
  contract out. The library imports NO engine code — the tracer unit hosts it
  later without rework. (The sandbox page is dev infrastructure OUTSIDE the
  library's import surface; it MAY import the engine — the library itself never
  does.)
- **describe worker-side / undescribe thread-side** (r3 adopted; the original's
  own split): the described form is the wire/transport form; the library exports
  both halves; final emitted data holds the north-star (the klve-030/050/093
  re-adjudications, ruling 4).
- **The differential property** is the spine suite obligation: instrument-time
  output ≡ the quarry's post-filter output for any config, modulo the named
  deltas (klve-095 logs re-attachment; klve-096's counting basis; the
  r8-repaired facets). The quarry's committed `klve-probes/` dist-execution
  pattern is the oracle precedent.

## Phase 0, concretely

- **0.1 README** (end-state docs only): the domain model and bounded context
  (what the library IS — a Babel instrumentation + collector +
  describe/undescribe toolkit; what it is NOT — an evaluator, an engine
  consumer, a wrapper ecosystem); the glossary resolving the
  step/trace/record/collector homonyms against the region and sibling
  glossaries; the correspondence table (klve taxonomy ↔ ECMAScript-locked
  vocabulary, derived from the ratified ledger rows — every shape delta
  enumerated; capability loss stays a defect); § Discharges per HR-21,
  three-part — the rulings encoded; the ledger row ids this design discharges
  (the FIDELITY-METHOD gate check: every cited klve-NNN resolves; the assignment
  sweep is YOURS, under close condition 2b's re-point rule — a MIXED row
  re-points its tracer-only token to the migration-side equivalent or to the
  TRACER row that already owns that artifact, and re-gates `TRACER` only where
  no migration-side half exists; re-pointing never touches a ratified
  disposition, and NM-dependent cells resolve after your 0.2 answer, so the
  sweep completes at your 0.3 commit); and each must-answer decided with its
  trade named.
- **The must-answers** (each an ar-1 target): the module name; the
  one-concept-per-file decomposition map; the public API surface (the transform,
  the collector factory, describe/undescribe exports, the options seam with
  klve-014/082's constraints); the ECMAScript-derived config shape (groupings
  re-derived from the grammar; the Babel type-name mapping table); the
  differential-property harness design; which r8 repairs change observable
  output and how the suite pins NATIVE semantics; the north-star re-adjudication
  of klve-030/050/093/085 plus any instance your §§ A–F sweep finds under ruling
  4's criterion (085's remedy crosses the split — the tracer-side disposition
  path applies); the coercion-legs design and sequencing (klve-097 —
  differential spine first); the typed-deviation roster; the
  `babel-standalone.d.ts` strategy (transport + extend the package's 292-line
  declaration); the transform-side halves of parse-posture and transform-failure
  (module-node handling per r8(ix); the library's own failure surface, empty
  code included — the envelope-side halves are the tracer unit's); the sandbox's
  checkpoint flows (ruling 9 — design content here, built in Phase 1); and the
  container-README member bullet — `evaluators/lib/README.md` gains your
  module's line (its admission rule was already widened by PAUSE-resolution
  ruling 10, landed with the ratification commits).
- **0.2 the twin ask, VERBATIM and FRESH**: put DEV.md § 0.2's question to the
  human for THIS module — the tracer unit's early `machine + data` answer does
  NOT carry (the ledger's twin bullet is scope-annotated). Produce every
  artifact the recorded value names before ar-1; the answer window closes at
  ar-1. Four ratified rows discharge partly into "NM honesty/joins" lines —
  klve-023, klve-027, klve-083, klve-085 — so the answer decides where those
  lines land: a machine twin here, or re-pointed/re-gated per close condition
  2b's re-point rule; put that consequence in front of the human with the ask.
- **ar-1** (registered; no model param): provide the README, every twin the
  recorded value names, the KLVE-LEDGER, the quarry and original paths, the
  sibling/region docs. State IN THE PROMPT: the reviewer sourced-claims rule;
  the HR-21 three-part check including that every cited klve-NNN resolves; the
  §§ B/D north-star sweep (ruling 4); the strays list (below) is owed deletion,
  not canon.
- **0.3**: `types.ts` (the options surface, the step/emission types in the
  ECMAScript-locked vocabulary, the collector contract, the describe/undescribe
  value types — region conventions throughout); `DOCS.md` (the worked examples'
  full section set — Execution phases, Data flow with its Mermaid diagram,
  Structural constraints, Out of scope — plus § Decisions carrying every
  must-answer's decision and trade); the BEHAVIORAL suite committed skipped,
  ZOMBIES order, **grouped per feature so the un-skip order matches ruling 9's
  increment order**: differential rows per feature; r8 native-semantics rows;
  capture-gating rows (an un-configured node emits nothing and costs nothing);
  counting/cap rows (klve-096's equivalence); the describe/undescribe round-trip
  rows incl. the north-star re-adjudicated cases; transform-failure rows (empty
  code; module-node handling); the parse-posture CONFORMANCE rows,
  transform-side (klve-075's explicit `sourceType`, klve-089's module-node
  handling — the rows' "conformance cluster" discharge vocabulary maps here);
  compile probes where types pin.
- **ar-2** (registered; inherits the session model): provide the sketch, README,
  types, suite paths, every twin, the KLVE-LEDGER. State the reviewer
  sourced-claims rule IN THE PROMPT.
- **Commit** per § Standing below; then **pre-gate AR-5** over the unit's OWN
  SHA LIST (state the range-form override, the sourced-claims rule, the task
  description, and the Phase-0 spec paths incl. every twin IN THE PROMPT; open
  `P0` rows must be zero, `P1:`/`TRACER` rows listed in the gate presentation) —
  then **STOP** at the human gate with a context-free-validated gate
  presentation (invariant 12).

## The sandbox cadence (ruling 9 — Phase 1's shape, designed at 0.1/0.3)

Phase 1 (NOT this session's to execute — it launches after the human gate) opens
with **increment 0 — the sandbox plumbing**: `sandbox.html` and
`vite.sandbox.config.ts` beside the module (the run/intercept precedent), hosted
on the **ENGINE, light-case** (ruled; the engine README's own documented mode),
running UN-instrumented code end-to-end with outcome + console output visible,
BEFORE any Babel work. Every later increment is ONE language feature end-to-end:
instrument it → surface its config toggle(s) in the sandbox UI → make its
emitted data inspectable → fire its own 🔍 checkpoint → land its differential +
native rows green. Panel growth per ruling 9 (steps table · value/scopes/logs
inspector · the INSTRUMENTED-SOURCE view), draft feature order per ruling 9
(plumbing → statements → declarations + scope snapshots →
identifiers/literals/operators → calls → loops → functions/arrows →
conditionals/try → describe depth cases → filters → coercion legs) — both
adjustable as the dev process requires (the human's recorded selection — a
paraphrase, not a quote). 🔍-bearing increments never fan out.

## Out of scope (binding)

The tracer evaluator unit — envelope, spec widening, settlement mapping,
enrichment, engine wiring, entwineability delivery, the region-root touches 1–4
(pre-authorized but DEFERRED to that unit's 0.3; the enumeration is in
KLVE-LEDGER § Rulings of record) and every `TRACER`-gated row. The
`@babel/standalone` `package.json` edit — deferred to this unit's own Phase 1's
first importing code (the ledger records the decision; a shared-configuration
change is human-approved when it lands). Any lens work; the Aran/semantics
tracer (klve-097's legs do not reverse its later-deep-tracer status); the
deprecated region; any push; editing the quarry or the original (both
read-only); the banked `writing-evaluators-on-the-engine` skill (ruled NOT
authored; only a fresh explicit human instruction reopens it).

## Measured baselines (the recording session's, 2026-09-05 — diff your own Step-0 re-measurement against these)

Pasted verbatim from `node scripts/repo-facts.mjs` (lint:md is cache-served by
the script's slow-measurement cache; its timestamp lags the others by design):

```text
MEASURED AT 2026-09-05T20:14:28.947Z, not asserted — supersedes any memory or handoff claim about these numbers.

node version vs engines: v20.11.0 vs engines ">=22.11.0" — BELOW the engines minimum
  (via `node --version` at 2026-09-05T20:14:25.622Z)

tsc errors:
  13
  src/lib/embody/language-levels/just-enough-javascript/aithor/aithor.ts(99,11)
  src/lib/embody/language-levels/just-enough-javascript/aithor/aithor.ts(112,11)
  src/lib/embody/language-levels/just-enough-javascript/aithor/evals/tests/run-eval.browser.test.ts(788,4)
  src/lib/embody/language-levels/just-enough-javascript/aithor/evals/tests/run-eval.browser.test.ts(806,3)
  src/lib/embody/language-levels/just-enough-javascript/aithor/load-model.ts(87,8)
  src/lib/embody/language-levels/just-enough-javascript/aithor/tests/aithor.test.ts(26,3)
  src/lib/embody/language-levels/just-enough-javascript/aithor/tests/aithor.test.ts(60,4)
  src/lib/embody/language-levels/just-enough-javascript/aithor/tests/aithor.test.ts(82,4)
  src/lib/embody/language-levels/just-enough-javascript/aithor/tests/load-model.test.ts(22,27)
  src/lib/study-lenses/lib/local-llm/make-local-llm.ts(111,62)
  src/lib/study-lenses/lib/local-llm/make-local-llm.ts(117,5)
  src/lib/study-lenses/lib/local-llm/webllm-adapter.ts(40,2)
  src/lib/study-lenses/lib/local-llm/webllm-adapter.ts(65,3)
  (via `npx tsc --noEmit` at 2026-09-05T20:14:25.623Z)

markdownlint errors (repo-wide): 8123
  (via `npm run lint:md` at 2026-09-05T01:18:26.356Z)

HEAD: 52984a71b9e41a7256b960e5bde6490284b50924
  (via `git rev-parse HEAD` at 2026-09-05T20:14:28.871Z)
```

The recording session's own commits follow that HEAD (its bodies carry the SHA
union). The runner works under node v20 despite the engines line: the region
type-contracts suite passed 21/21 [measured: node
./node_modules/vitest/vitest.mjs run --project unit
src/lib/study-lenses/evaluators/tests/, 2026-09-05]. cspell is RETIRED — never a
gate; `D cspell.json` in the dirty list is foreign and expected. The untracked
strays at recording time (never staged; named in every AR prompt as owed
deletion or foreign work, not canon): `scripts/lib/check-tables/`,
`src/lib/study-lenses/evaluators/intercept/tests/sandbox-flow-probe.claude-delete-if-stale.browser.test.ts`,
`src/lib/study-lenses/evaluators/lib/guarded-worker-base/build-halt-author.ts`,
`src/lib/study-lenses/evaluators/lib/guarded-worker-base/read-cap.ts`,
`src/lib/study-lenses/lenses/scanme/`.

## Standing (binds every step)

- The tree is LIVE — sibling sessions commit daily; your baselines are your own:
  run `node scripts/repo-facts.mjs` at Step 0, paste its output verbatim into
  your plan, and diff against the block above.
- Pathspec commits per DEV.md § Shared-worktree git mechanics:
  `git status --short -- <paths>` first, co-dirty = ask, stage+commit in ONE
  invocation, `--no-verify` with per-file checkpoints run yourself
  (`npx eslint <file>` for `.ts`; `npx markdownlint-cli2 --no-globs "<file>"`
  for `.md`; prettier --check before any --write). Never stage the strays.
- Every repo-state claim carries `[measured:]`/`[read:]`/`[relayed:]` — yours
  AND every reviewer prompt you dispatch (state the reviewer sourced-claims rule
  in each).
- Announce every commit (full SHA + message). The settings line on EVERY commit:
  `work: software - twin-doc: <as recorded at YOUR 0.2> - ceremony: full (HR-13) - prospective`
  (before your 0.2 lands, annotate the slot honestly rather than inventing a
  value).
- The campaign SHA union: read the accumulated union from the LATEST campaign
  commit's body
  (`git log --oneline -- .planning-handoffs/evaluators-api-restoration/` finds
  it), append every commit you land, in every body — carry it in the
  continuation form the latest body itself shows ("continues from 70fb20a7 … now
  carries …"); the list is the record, never a count.
- STOP at the human gate; Phase 1 launches fresh from your gate presentation.
  The human holds: the twin ask's answer, every PAUSE verdict, the Phase-0 →
  Phase-1 gate.
