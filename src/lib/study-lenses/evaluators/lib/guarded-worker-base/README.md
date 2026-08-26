<!-- cspell:ignore tripwired unfrozen -->

# guarded-worker-base

The GUARDED engine-backed evaluators' shared worker-setup opening: one call —
`createGuardedWorkerBase(workerConfig, finish?)` — answers the iteration guard's
injectable helpers and the registered halt author together, so the wiring the
deprecated kind's two worker setups each hand-rolled (48 identical trimmed lines
measured across `run-worker-setup.ts` and `intercept-worker-setup.ts`) exists
once and the two authors cannot drift. Ruled 2026-08-25 (the dedup resolves
SHARED, the loc seam rides a parameter) and reshaped to this one-concept form
2026-08-26 (both in the campaign LOSS-LEDGER's § Rulings of record). The halt
SHAPES stay per-evaluator, as ruled 2026-08-19: each unit's `types.ts` declares
its own record — intercept's carries the attributed call site run cannot
honestly stamp — and this module's FINISHER seam is how those members ride,
never a fork of the skeleton.

## What lives here

```text
guarded-worker-base/
├── types.ts                      HaltCore (a union on `natural`) ·
│                                 FinishHalt · GuardedWorkerBase
├── create-guarded-worker-base.ts the one export; the cap reading, the
│                                 guard construction, and the halt author
│                                 are its in-file helpers
└── tests/                        the behavioral suite + compile probes
```

## The skeleton

`createGuardedWorkerBase(workerConfig, finish?)` returns
`{ guardGlobals, serializeHalt }`:

- **guardGlobals** — iteration-guard's two injectable helpers, built over the
  cap read from the worker config. The cap reading is pass-through — a number
  rides UNCHANGED, no clamp, no default, no finiteness gate (`0`, negatives,
  `Infinity`, `NaN` all pass; the consequences are iteration-guard's documented
  edge set — its glossary owns "cap"; this module adds only the reading rule: a
  non-number reads as no cap, the guard counts and never throws). Pass-through
  is the ruled cap policy (pins run:235, intercept:394).
- **serializeHalt** — the halt author the setup registers with the engine. It
  fires on EVERY worker-side stop and stamps the **halt core**, a discriminated
  union on `natural`:
  - the **natural arm** pins its empty members as literals — no error, no trip,
    no phase;
  - the **throw arm** carries `errorName`/`message` (a non-Error throw
    classifies as `'Error'` / `String(thrown)`), the guard's marked-trip record
    classified STRUCTURALLY through `readLimitTrip` (never a name, never a
    message match), and the engine's structural `phase`
    (`'creation' | 'evaluation'`, the E2 increment) — non-null on this arm, so a
    unit's settlement mapper narrows on `natural` and never fabricates a phase;
  - BOTH arms carry `iterationCount`, the guard's never-reset run total read at
    halt time — real on every halt (the always-splice commitment's visible half;
    iteration-guard's glossary owns the term, this module adds only the stamping
    rule).

The **finisher** is the per-evaluator seam: `finish(core, rawError)` maps the
core onto that unit's own halt shape. It fires on EVERY stop — natural ends
included, with `rawError` undefined (that is how intercept's `loc: null` natural
arm survives the hoist) — and it is **guarded at the builder**: a throwing
finisher degrades to the unfinished core, never a lost halt (ruled 2026-08-26 —
the alternative, a worker crash, would cost the trip and the count too;
intercept's stack-parse residual is the named first client, and where its
spliced-coordinate conversion lands is intercept's open question, not
pre-decided here). The finisher is built by the unit's worker setup and closes
over everything else that setup holds — that closure is why `(core, rawError)`
is a sufficient signature. Absent, the author answers the core itself — run's
case. A finisher's product must stay clone-safe: the payload crosses a
postMessage boundary.

The authored record is deliberately UNFROZEN: the binding requirement across
postMessage is clone-safe SHAPE; the record's only consumer is the engine
bootstrap, which clones it and drops it, and a freeze would reach into `trip`,
which iteration-guard hands back by reference (the deprecated kind's own
recorded reasoning, carried verbatim).

## Boundary — what this module does NOT do

- It does not own the units' halt shapes (`RunHalt`, `InterceptHalt` — each
  unit's `types.ts`, ruled 2026-08-19; their `phase` members land at each unit's
  worker-setup increment, and this module's compile probes tripwire that
  deferral).
- It classifies no phase — the engine's structural split authors it (E2); this
  module only carries it, and it trusts the engine's contract that every throw
  arrives with one.
- It never reads a spec, injects nothing itself, and never runs thread-side;
  assembling and freezing the `WorkerSetupResult` — and everything else a setup
  injects (traps, wraps) — stays each unit's.
- It serves the GUARDED evaluators only: the guard is constitutive, and the core
  mandates `trip` and `iterationCount`. An unguarded engine-backed evaluator
  authors its own halt — the quarry's variables tracer halt
  (`natural`/`errorName`/`message`/`nodePath`, no trip, no count) is the live
  counterexample that makes this exclusion real, not theoretical.

## Glossary — unit terms

The region glossary owns machinery and seam; run's glossary owns "halt",
intercept's owns "the stop record"; iteration-guard's owns "cap", "trip", and
"iteration count" — borrowed here, never redefined. These entries add what this
module owns.

- **the guarded worker base** — what the one export answers:
  `{ guardGlobals, serializeHalt }`, the shared opening of a guarded evaluator's
  worker setup.
- **halt core** — the shared members every authored halt carries, a
  discriminated union on `natural` (the arms in § The skeleton).
- **finisher** — the per-evaluator hook mapping the core onto that unit's own
  halt shape; identity when absent; guarded at the builder.

## Discharges

What this design encodes, by identifier (HR-21). Rulings resolve against the
campaign's LOSS-LEDGER
(`.planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md`).

**Rulings encoded:** the 2026-08-25 W4 opening ruling (the halt-AUTHOR dedup
resolves SHARED; the loc seam rides a parameter — the finisher; the
per-evaluator halt SHAPES stay as ruled 2026-08-19) and the 2026-08-25/26
guarded-worker-base bullet (the one-concept reshape, the union core, the
builder-guarded finisher, this module's fix-alls); HR-4 as classification — the
author skeleton is a `restore` from the working lineage (the deprecated kind's
two setups; the quarry's `shared/` had no halt author — halts were per-engine),
with the unfrozen rationale and the non-Error classification carried verbatim;
HR-19 (instrumentation assumed sound — the guard's marker is trusted); HR-20 via
E2 (the core carries the engine's structural phase; this module classifies
nothing); pin run:272 (the stop record is authored where the raw throw lives —
in the worker, by this builder's product); pins run:208/:217 by consumption
(counting and splicing stay the guard's). NOT discharged here, named for
honesty: intercept's loc stamp and stack-parse residual (its chain's, via the
finisher — including where the spliced-coordinate conversion lands, intercept's
named open question); the `phase` members on `RunHalt`/`InterceptHalt` (each
unit's worker-setup increment, citing E2 and this module — tripwired in tests/).

## Navigation

- Container: [`../README.md`](../README.md); region root:
  [`../../README.md`](../../README.md).
- The guard this base constructs:
  [`../iteration-guard/README.md`](../iteration-guard/README.md).
- The engine contract the author satisfies: `../../../lib/engine/types.ts`
  (`SerializeHalt`, `HaltPhase`).
- The deprecated kind's two worker setups this hoists from (the frozen second
  reference, HR-11/HR-14):
  `../../../evaluators-deprecated/{run/run-worker-setup.ts,intercept/intercept-worker-setup.ts}`.
