<!-- cspell:ignore bivariant sandboxing unservable widenable widenings -->

# evaluators

The evaluator kind: strategies that run the learner's program and answer with
data. A consuming lens hands an evaluator the evaluation spec — embody's
gate-guaranteed facts plus how the run is posed — and receives a handle it can
await for the complete result or iterate for live events, or a structured
refusal. Nothing here throws at the learner: a spec an evaluator cannot serve is
refused as data, a program that fails is an outcome on the result, and a broken
machine is a machinery defect discriminated from the learner's own error.

The package README owns the package-level shape; this document owns the region
root — the kind contract every evaluator satisfies, the handles evaluators
answer with, and the vocabulary the region speaks. The contract is restored from
a working reference implementation (the quarry — see § Navigation), with the
frozen previous region kept beside it as a second reference.

## What lives here

```text
evaluators/
├── types.ts     the kind contract: Evaluator, the spec, the handle base,
│                the refusal, the shared vocabulary types
├── run/         plain execution: program in, result out, io mocks answered
├── intercept/   step-through execution: live event stream, generator surface,
│                entwined enrichment, pending interactions
├── lib/         the execution-handle library the evaluators build handles on —
│                region-level because only evaluators consume it; machinery
│                consumed beyond this region lives in the package lib/
└── tests/       the kind's type-contract assertions
```

Each evaluator's own directory documents that evaluator; this root documents
only what they share. The region grows by Phase-0 design, evaluator by evaluator
— a variables tracer is in the region's scope and joins the tree when its own
design lands.

## The kind contract

An evaluator is an importable object with three members:

```ts
type Evaluator<
	TSpec extends EvaluationSpec = EvaluationSpec,
	THandle extends ExecutionBase<unknown> = ExecutionBase<unknown>,
> = {
	readonly name: string;
	readonly applicability: (spec: TSpec) => boolean;
	readonly main: (spec: TSpec) => THandle | EvaluatorRefusal;
};
// ExecutionBase<TResult> = PromiseLike<TResult> & { result; cancel }
// Execution<TEvent, TResult> = AsyncIterable<TEvent> & ExecutionBase<TResult>
```

- **name** — a stable label; a consumer keying an options list by name owns that
  collection's uniqueness.
- **applicability** — pure and synchronous over the same spec domain main
  serves; the consuming lens calls it to build its options list before ever
  driving main.
- **main** — given the spec, returns the evaluator's handle — or a structured
  refusal, never a throw at the learner. A typed synchronous boundary throw and
  creation-error-as-data remain legal postures for an evaluator kind to take
  (settled per evaluator); the evaluators in this region refuse (human ruling
  2026-08-12).

The members are declared as readonly function PROPERTIES, and that syntax is
contract, not style: method-shorthand parameters are bivariant in TypeScript,
and under them the misplacement signal § The handles' second widening rule
relies on vanishes silently. The generic parameters carry defaults so the bare
`Evaluator` name types a heterogeneous roster.

## The caller protocol

The consuming lens calls applicability first — that is how it builds its options
list — and only then drives main. The object itself is the evaluator's identity:
consumers import it directly. A handle answers in both consumption modes:
`for await` pulls events one at a time, `await handle` (or `handle.result`)
drains internally and resolves with the complete result (human ruling
2026-08-06).

Creation is inert, and consumption is a closed list of exactly three touches:
the first iterator pull, an `await`/`.then` subscription, or a `.result`
property access. The first of the three starts the run; construction never does
— the region's one deliberate laziness departure from its reference, which
auto-started on a microtask (human ruling 2026-08-06). `cancel()` stops the run
from outside the loop — a Stop button needs no iterator — and a cancel before
any consumption settles without spawning anything: the result still fulfills,
with the cancel outcome and no events.

Edge cases every evaluator answers the same way:

- **An iterator created and then abandoned holds the run** — break or cancel is
  the exit; ceasing to pull is not a stop.
- **One handle, both modes in one run** is each evaluator's to specify — the
  reference forbade mixing them; the kind promises each mode alone.
- **A second iteration of a settled streaming handle is unsupported** — the
  one-shot rule; the result's `events` array is the record.
- **applicability true, then a refusal at main, is a legal pairing** — the
  verdict is an options-list answer, not a total pre-check; an environment or a
  budget can make a spec unservable after the verdict.

## The handles

Three layers, each a widening of the last:

- **The base — `ExecutionBase<TResult>`.** Every handle settles: it is
  awaitable, carries a memoized `result` promise, and cancels. The result ALWAYS
  fulfills — errors, timeouts, and cancellations are data on the result, so no
  consumer writes a rejection path. A handle with an already-determined result
  and no stream satisfies the base trivially.
- **The streaming handle — `Execution<TEvent, TResult>`.** The base plus
  `AsyncIterable<TEvent>`: live step-through in arrival order. One-shot — a
  settled handle does not replay its events; the result's `events` array is the
  record (human ruling 2026-08-05).
- **Per-evaluator widenings.** Each evaluator names its own handle as an
  intersection with the base or the streaming handle, adding its eager echoes
  (`code`, `ast`, `options`) and its own controls (`fail`, the generator
  surface). Eager-versus-deferred is per evaluator — the reference made it both
  ways, and the reference's own sync sibling (`SyncExecution` with `ParseHandle`
  and `TokenizeHandle` over it) is the in-house precedent for exactly this
  widening-by-intersection.

Two rules keep the lattice coherent:

- **Handle widening is intersection, with reference names.** A widened handle
  never renames what the base provides; it only adds.
- **Spec widening adds optional members only.** That single rule keeps every
  widened evaluator assignable to the bare `Evaluator` type, so a heterogeneous
  roster types as `ReadonlyArray<Evaluator>` with no erasure ceremony. A
  REQUIRED addition costs bare-roster assignability — the compiler makes the
  cost loud, and that cost is the signal to reconsider the field's placement,
  not an obligation to hoist it.

Narrowing is not widening: an evaluator serving only one axis value does not
narrow its spec type — it accepts the shared spec and refuses, as data, what it
cannot serve. And the roster is for names and applicability verdicts; a handle's
concrete type is reached through the evaluator's own import, never through the
roster's erased `main`.

Generator surfaces are declared as explicit type aliases reproducing the
reference's member signatures — never the TypeScript lib's `AsyncGenerator`
token, which drags in `AsyncDisposable` and a required `return()` argument.

## The spec

```ts
type EvaluationSpec = {
	facts: Facts; // embody's frozen graph, gate-guaranteed
	execution: 'function' | 'module'; // how the run is posed
	seconds?: number; // wall-clock budget; absent = the engine's default
	iterations?: number; // guarded-loop cap; absent = no cap
};
```

The placement rule: a field belongs on the shared spec exactly when its meaning
is identical at the machinery layer for every evaluator. Everything else rides
per-evaluator widenings.

- **facts** — handed in by reference, gate-guaranteed at drive time: an
  evaluator is driven only in the evaluation phase, which embody bars unless
  parsing and entwining succeeded. Facts stay on the main thread; an evaluator
  running off-thread projects its own clone-safe slice, never posting the graph.
- **execution** — the axis the consuming lens maps the snippet type onto;
  authoritative for how the run is posed, and distinct from the static parse
  goal the facts carry (`facts.type: 'script' | 'module'`). An applicability may
  assume the lens supplied a coherent pairing. The two values are honest about
  their semantics: `'function'` runs the snippet as a function body — top-level
  `var` and `function` declarations become locals, a `"use strict"` line is
  prepended, and a top-level `return` is legal where a real script would be a
  syntax error; `'module'` runs a genuine ES module — always strict,
  asynchronous natural end. The kind poses every run under the machinery's
  strict default: strict-versus-sloppy is a recorded deliberate collapse (the
  reference's `scriptMode` toggle does not return), and an evaluator needing
  sloppy semantics takes it as a widening or refuses. A `'script'`-goal snippet
  posed on `'function'` therefore gets function-body semantics, not script
  semantics — the one pairing where "as a bare runtime would" is not fully met.
  No script execution path is ratified (human ruling 2026-08-13); a third axis
  value joins only through its own design review and engine increment. DOCS.md §
  Decisions records the candidate and its constraints.
- **seconds** — the engine-uniform wall-clock budget; absent means the engine's
  own default applies, and the engine owns the number. The resolved value is
  echoed on each evaluator's options record, always populated. Richer budget
  semantics stay legal as evaluator widenings.
- **iterations** — the runaway-loop cap the iteration guard enforces. Guards
  always splice, so the run's iteration total is real on every halt; the cap
  alone decides whether tripping it ends the run.
- **Per-evaluator options ride widenings, not this type.** io mocks differ per
  evaluator in both shape and seam semantics, and richer evaluator-owned bags —
  up to schema-validated configuration trees — are expressly representable
  (human ruling 2026-08-10). The kind never enumerates what a widening may add.

## Outcomes, errors, refusals

Three channels, never mixed:

- **Refusal** — main's answer to a spec it cannot serve:
  `{ refused: true, reason }`, in the evaluator's own words.
- **Learner outcomes** — the result's `outcome` field, spoken in the reference
  vocabulary. The kind exports the six values as `EvaluationOutcome` —
  `'complete'`, `'cancel'`, `'fail'`, `'timeout'`, `'iteration-limit'`,
  `'error'` (human ruling 2026-08-06) — and each evaluator declares its own
  outcome union as a SUBSET of it (run excludes `'fail'`), so the shared
  spellings are compiler-pinned while the vocabulary stays open: an evaluator
  needing a value beyond the six extends the union in its own types. Each
  evaluator states its own `ok` truth table; the tables genuinely differ (run:
  `ok` iff `'complete'`; intercept: `ok` on `'complete' | 'cancel' | 'fail'`).
- **Machinery defects** — an added error kind discriminating a broken machine
  from a learner error; the reference disguised the former as a learner-shaped
  `WorkerError`. The kind pins the discriminant literal (`'defect'`,
  `MachineryDefectKind`); the record behind it is per-evaluator seam material,
  and the engine's cause spellings never appear on results.

Errors carry a two-value phase: `'creation' | 'evaluation'` — did the program
fail before it ran, or while running (human ruling 2026-08-13). Nuance within
creation belongs to the embodiment and the orchestrator; the spelling matches
the lifecycle's fifth phase in `src/lib/study-lenses/embody/types.ts`.

Delivered events are richer than wire messages. The worker authors clone-safe
records; the thread narrows and ENRICHES them before yield: plain-data fields
(step, loc, offsets, node path) stay enumerable, while live-graph views —
`node`, `prev`, `next`, `callee` — are non-enumerable accessors resolving
through the embodiment's entwined record (human ruling 2026-08-06). The `node`
and `callee` accessors EXTEND the reference's own newer precedent, which chains
`prev`/`next` as step-navigable data and declines a `.node` reference to keep
events immutable and results JSON-safe. The extension answers that ground
directly: non-enumerable accessors are data-equivalent on every count that
ruling protected — serialization stays safe, enumerable fields stay plain and
immutable, and no second node-identity space is minted, because resolution goes
through the embodiment's own entwined record. One cost is new, and named: an
accessor resolves against the Facts the run was driven with, so a result held
across a re-embodiment answers `event.node` from a graph that no longer
describes the buffer — the plain-data `nodePath` is the durable attribution.

## Rules every evaluator obeys

- **Refusal-as-data at main.** A spec an evaluator cannot serve gets a
  structured refusal, never a throw at the learner; boundary-throw postures stay
  kind-legal but unexercised here.
- **Level-blind.** The kind, the shared signature, and the engine are designed
  against all of JavaScript; a language level is a per-tracer scoping concern,
  settled later, and a design argument resting on what a level admits is out of
  order at this layer (human ruling 2026-08-12).
- **Instrumentation is assumed sound.** Tracer authors carry the guarantee that
  instrumentation introduces no errors of its own; no contract surface reports
  instrumentation defects, and when the premise is violated the failure presents
  as the learner's own (human ruling 2026-08-12).
- **Creation inert.** No learner code executes and no worker spawns before first
  consumption (the closed three-touch list in § The caller protocol).
  Evaluator-owned eager derivation at creation — echo fields, capability
  probing, parsing, instrumentation — is expressly permitted; inert bounds the
  RUN, not the evaluator's own preparation.
- **The result never rejects.** Every path fulfills with data.
- **Facts never cross the worker boundary.** Clone-safety is a wire-message
  obligation only; delivered events may carry functions and accessors.
- **Classification happens at the evaluator's seam.** An evaluator validates its
  own mock answers and classifies its own io failures before the engine can
  mislabel them as machinery defects.
- **Worker-authored order is authoritative.** Step numbers and event order are
  minted worker-side; enrichment adds fields, never renumbers.
- **Widenings follow the two rules.** Intersection handles; optional-only spec
  additions; narrowing routes to refusal.

## Glossary — region terms

The package glossary owns the shared meanings; these entries add the mechanics
this region owns, and resolve its homonyms.

- **evaluator** — one strategy object satisfying the kind contract:
  `{ name, applicability, main }`.
- **the kind** — this region's shared contract. Distinct from the `kind`
  discriminant field per-evaluator error taxonomies use.
- **the engine** — the generic execution machinery one package level up
  (`../lib/engine/`): spec in, lazy handle out, worker sandboxing, the time
  budget. Evaluators build on it; nothing in it knows this region.
- **the reference** — the working implementation this contract is restored from:
  the read-only quarry at `src/lib/embody/lib/evaluating/`. Its names and shapes
  return wholesale (human ruling 2026-08-06); its retired spellings are named
  where they differ.
- **the deprecated kind** — the frozen previous region
  (`../evaluators-deprecated/`), kept as a second reference and regression net;
  its vocabulary retires with it.
- **spec** — `EvaluationSpec`: facts, execution axis, budget, cap. Distinct from
  the engine's `EvaluateSpec`, which an evaluator projects from it.
- **facts** — embody's frozen main-thread graph, gate-guaranteed by the
  evaluation phase's bar.
- **execution axis** — the spec's `execution` field: how the run is posed
  (`'function' | 'module'`). One of three senses of "execution" in this region:
  the axis; the `Execution` handle type (the reference's name for
  stream-plus-settle); and the reference's retired error-phase spelling
  `'execution'`, which does not return here — the phase's second value is
  `'evaluation'` (human ruling 2026-08-13).
- **evaluate / evaluation** — four senses, resolved: this kind's verb (to run
  the learner's program); embody's fifth lifecycle phase, in which evaluators
  are driven — the error phase's `'evaluation'` literal deliberately matches its
  spelling; the engine's `evaluate` factory; and the parsons lens's `evaluate*`
  grading modules, a pure homonym with no relation to this kind.
- **handle** — main's answer: the base (`ExecutionBase`) or a widening of it.
  The deprecated kind's "evaluation event stream" retires with that region.
- **streaming handle** — `Execution<TEvent, TResult>`: the base plus
  `AsyncIterable`.
- **refusal** — the kind's refusal-as-data shape: returned by main instead of a
  handle, with the reason in the evaluator's own words.
- **inert** — the creation guarantee: no learner code, no worker, before first
  consumption. Not a ban on evaluator-owned eager derivation.
- **consumption** — the closed trigger list that starts a run: the first
  iterator pull, an `await`/`.then` subscription, or a `.result` property
  access.
- **outcome** — the result field naming how the run ended; `EvaluationOutcome`
  carries the reference vocabulary's six values, and each evaluator's union is a
  subset or a declared extension. The engine's five-value `SettlementOutcome` is
  a different vocabulary at a different layer; each evaluator maps the seam.
- **ok** — the result's boolean summary; its truth table is per evaluator. Not a
  "verdict" — in this region that word names the applicability answer alone.
- **result** — the complete record a handle resolves with: outcome, ok, events,
  echoes. Always fulfills.
- **echo** — a spec or derivation field repeated on the handle or the result
  (`code`, `ast`, `options`) so a consumer holding the answer needs no other
  reference; the resolved options echo always carries the populated budget.
- **settling** — the moment a run ends and the result fulfills. The engine's
  `EngineSettlement` is its seam-level input; the deprecated kind's `Settlement`
  type and `settled` companion retire with that region. Distinct from the
  package's **settle**, which re-embodies the buffer and ends mounts: a settling
  ends one run, and a result held across a settle keeps its settled record while
  the graph beneath its accessors goes stale.
- **seam** — a boundary where one layer's vocabulary is mapped into another's:
  the engine settlement into an evaluator's outcome, a worker record into a
  delivered event, a dialog ask into a mock answer.
- **machinery** — the run's infrastructure (engine, worker, transport) as
  distinct from the learner's program; a machinery failure is a defect, never a
  learner error.
- **wire message** — a clone-safe record crossing the worker boundary; narrower
  than the delivered event enrichment builds from it.
- **cancel** — the consumer stop: `'cancel'` as a reference outcome value. The
  engine spells its outcome `'cancelled'`; the deprecated kind spelled its arm
  `'canceled'`. Reference spellings are the only ones legal on results; engine
  spellings appear only at the seam.
- **fail** — the mid-stream consumer stop with a reason; a per-evaluator
  widening, never on the base. Run deliberately has none (ratified 2026-08-06).
- **pending interaction** — the protocol for an ask nobody answered: the event
  carries `respond`; resume rides the event, never the iterator; answering twice
  is inert; answering after teardown is a no-op. The type is generic —
  `PendingInteraction<TRequest, TAnswer>`, `unknown` defaults — so a carrying
  evaluator binds its real shapes instead of inheriting an `unknown`-parameter
  ceiling.
- **io mocks** — per-evaluator dialog answers, consumed at per-evaluator seams
  with per-evaluator no-mock postures (human ruling 2026-08-06).
- **machinery defect** — the added error kind for a broken machine,
  discriminated from learner errors; its discriminant literal is pinned
  kind-level (`'defect'`), its record shape per evaluator.
- **error phase** — `'creation' | 'evaluation'`: failed before running, or while
  running. Distinct from embody's lifecycle phase, whose fifth name it
  deliberately reuses.
- **event** — one delivered moment of a streaming handle; the union and its
  discriminant spellings are per evaluator, in reference spellings.
- **tracer** — a future evaluator that streams notional-machine moments (the
  variables lifecycle first); the kind is designed so tracer handles, results,
  and configs are widenings, never reshapes.
- **enrichment** — the thread-side step between wire message and yielded event
  that adds offsets, node paths, and graph accessors.
- **widening** — a per-evaluator extension of the base, the streaming handle, or
  the spec, under the two rules.
- **seconds / iterations** — the shared budget and cap; see § The spec.

### Vocabulary correspondence

The three vocabularies this region touches, one concept per row. The deprecated
column is historical: that region is frozen and its vocabulary retires with it.

| concept          | this region (reference names)                                                                                         | engine                                                         | deprecated region (retiring)              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------- |
| handle           | `Execution<TEvent, TResult>`; per-evaluator widenings                                                                 | `EngineHandle`                                                 | `EvaluationStream`                        |
| settle channel   | `result` promise; `await handle`                                                                                      | `result`                                                       | `settled` companion promise               |
| outcome values   | `EvaluationOutcome`: `complete` · `cancel` · `fail` · `timeout` · `iteration-limit` · `error` — per-evaluator subsets | `completed` · `errored` · `cancelled` · `failed` · `timed-out` | `ended`: `clean` · `error` · `canceled`   |
| cancel spelling  | `'cancel'`                                                                                                            | `'cancelled'`                                                  | `'canceled'`                              |
| consumer stop    | `cancel()`; `fail()` where widened                                                                                    | `cancel()` and `fail()`                                        | breaking out of the pull                  |
| events           | per-evaluator union, reference `event` spellings                                                                      | opaque items, frozen at yield                                  | `EvaluatorEvent { kind: string }`         |
| budget           | `seconds` on the spec; the engine owns the default                                                                    | `seconds` on the spec — the engine's only limit                | engine-owned; not on the spec             |
| iteration cap    | `iterations` on the spec                                                                                              | consumer-owned; no engine field                                | `iterations` on the spec                  |
| error phase      | `'creation' \| 'evaluation'`                                                                                          | halt kinds `'natural-end' \| 'throw'`                          | none                                      |
| machinery defect | added error kind on results                                                                                           | `EngineError` (`cause`, four values)                           | `reason: 'defect'` arm (deprecated run's) |

The read-only quarry's error taxonomy spells the phase's second value
`'execution'`; that spelling is superseded (human ruling 2026-08-13) and does
not return.

### T1 — reference outcome ↔ deprecated-port settlement

Historical and run-scoped: the correspondence the fidelity audit built between
the reference run's `outcome` and the deprecated port's `ended` × `reason`
settlement. The port columns retire with the deprecated region; the live seam
mapping is engine settlement → reference vocabulary, which this table specifies
by composition through the deprecated map. Source: the run-audit digest
(recovery command in § Discharges).

| reference `outcome`                                                                             | port `ended` | port `reason`                                                                               |
| ----------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| `complete`                                                                                      | `clean`      | —                                                                                           |
| `cancel`                                                                                        | `canceled`   | —                                                                                           |
| `timeout`                                                                                       | `error`      | `timeout`                                                                                   |
| `iteration-limit`                                                                               | `error`      | `loop-cap`                                                                                  |
| `error`                                                                                         | `error`      | `threw`                                                                                     |
| _(no reference equivalent — machinery failure was disguised as a learner-shaped `WorkerError`)_ | `error`      | `defect` (`cause: 'worker-error' \| 'call-error' \| 'hook-error' \| 'unreachable-outcome'`) |

For run, `ok === true` ⇔ `outcome === 'complete'` ⇔ `ended === 'clean'`. That
equivalence is run's alone — an evaluator that widens with `fail` adds an `ok`
arm (intercept's `ok` covers `complete`, `cancel`, and `fail`). The defect row
rides forward as the machinery-defect error kind.

## Discharges

What this Phase-0 design encodes, by identifier (human ruling 2026-08-12,
HR-21). Rulings and rows resolve against the campaign's LOSS-LEDGER
(`.planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md`); the fourteen
forward-compatibility requirements and T1 resolve against the recovered digest:
`git show a8a0128d:.planning-handoffs/evaluators-api-restoration/research-digests-2026-08-05.json`
(keys `.result.tracers` § 3 and `.result.runAudit`).

**Rulings of record encoded here:** HR-2 (no replay — one-shot stated on the
streaming handle); HR-3 (the handle restored: base + streaming + per-evaluator
widening mechanism); HR-4 (fidelity-first posture throughout); HR-6 (both
consumption modes; creation inert, with the closed consumption list); HR-8
(reference names and outcome vocabulary wholesale; this glossary; the
correspondence table); HR-9 (the spec-placement half: io as per-evaluator
widenings; mock shapes and seam semantics are P0-R's and P0-I's); HR-12 (the
enrichment mechanism's contract half: enumerable plain data, non-enumerable
graph accessors, the extension defended on the precedent's own ground and its
staleness cost named; accessor types are P0-I's); HR-16 (its consequence that
the kind must not foreclose the historical config richness — the widening rules
keep evaluator-owned config trees representable); HR-17 (refusal-as-data, with
the typed-throw permission retained as kind-legal); HR-18 (level-blind); HR-19
(instrumentation assumed sound, cost stated); HR-20 (two-value error phase
declared; the script-semantics gap named at the axis; no execution path ratified
— explicit deferral); HR-21 (this section). NOT discharged here, named for
honesty: HR-5 and HR-7 (intercept's generator surface and drain-cancel —
P0-I's), HR-15 (sandbox cadence — the evaluator chains').

**Forward-compatibility requirements discharged:** 1 (base
intersection-widenable), 2 (eager fields legal at creation), 3 (results fully
evaluator-owned), 4 (`fail` representable as a widening), 5 (settlement
extensibility — no kind-level result base; the outcome union is
subset-and-extension legal), 6 (delivered events ≠ wire messages; enrichment
step legal), 8 (no one-moment-per-yield pin; payloads may be iterables or
promises), 10 (evaluator-owned option bags up to validated config trees), 11
(both interaction postures legal per evaluator), 12 (typed sync throws stay
kind-legal), 13 (result-only handles satisfy the base), 14 (worker-authored
determinism never renumbered). Requirement 7 is discharged in part
(entwined-resolution legality here; chain and index shapes are P0-I's);
requirement 9 was discharged by the engine's yield-charge opt-out, commit
`976baed9`.

**Ledger rows answered, by member name:** `Execution<TEvent,TResult>`;
`ExecutionBase<TResult>` (ADDITION, ruled 2026-08-17 at this unit's design
review); `.then` / `await handle` batch mode; `.result` memoized,
always-settles; `.cancel()` named, idempotent; creation-time auto-start
(queueMicrotask drain) — superseded, encoded as creation-inert; replay /
re-iteration (`===`-identity re-yield, `.result.logs` cache) — superseded,
encoded as one-shot; `createExecution`'s test suite — the result-always-fulfills
contract its adapted row records; `seconds` (default 5, settable) and
`InterceptOptions` name; `seconds` — spec placement, engine owns the default;
`iterations` — already survives, spec placement; `io` / `IoMocks` — placement
half only; native-dialog fallback for unmocked verbs and `io-error` termination
cause — the per-evaluator no-mock postures named in the glossary, seam semantics
P0-R's and P0-I's; the lib-`AsyncGenerator` TYPE token — the explicit-alias rule
pinned; `ExecuteMessage.scriptMode` (sloppy/`with`) — the strict collapse stated
at the axis; machinery-defect discrimination — the added error kind, its
discriminant literal pinned kind-level, and the correspondence table's defect
row; `node` live reference, `prev` / `next` timeline links, `callee` /
`calleePath`, `nodePath` per event, offset pair on events — the enrichment
members the mechanism paragraph names, accessor types P0-I's;
`phase: 'creation' \| 'execution'` — the row under its ledger spelling; its
second value is respelled `'evaluation'` by HR-20, the one human-ruled departure
from reference names; `RunResult` name; `outcome` 5-value; `ok` — the vocabulary
and T1 land here, the types are P0-R's. **FLAGs answered: none** — Appendix B's
flags are the variables unit's design questions, and the run-protocol FLAGs
belong to the units that build those surfaces.

## Navigation

- Package root: [`../README.md`](../README.md)
- Architecture and decisions: [`DOCS.md`](./DOCS.md)
- The contract in types: [`types.ts`](./types.ts) — `Evaluator`,
  `EvaluationSpec`, `ExecutionBase`, `Execution`, `EvaluationOutcome`,
  `EvaluatorRefusal`, `ErrorPhase`, `ExecutionAxis`, `MachineryDefectKind`,
  `PendingInteraction`
- The engine beneath: [`../lib/engine/README.md`](../lib/engine/README.md)
- The frozen previous region:
  [`../evaluators-deprecated/README.md`](../evaluators-deprecated/README.md)
- The read-only reference (quarry): `src/lib/embody/lib/evaluating/`
- The facts and the entwined record: [`../embody/types.ts`](../embody/types.ts)
- Each evaluator's own directory documents that evaluator.
