<!-- cspell:ignore trapless unmocked unrestorable widenings -->

# run

Plain execution: program in, result out, io answered by mocks. run is the
region's trapless evaluator — it runs the learner's program in the machinery's
worker sandbox and answers with the complete result, streaming nothing: no event
stream, no console traps, no step-through. A consuming lens that only needs to
know how a program ended — completed, timed out, tripped its loop cap, was
cancelled, or threw — drives run; a lens that needs live events drives the
intercept evaluator (`../intercept/`, its own unit).

The contract is restored from the reference run engine (the read-only quarry —
see § Navigation) under the region's kind contract
([`../README.md`](../README.md)): spec in, result-only handle or structured
refusal out, nothing thrown at the learner.

## What lives here

```text
run/
├── types.ts             run's contract: the spec widening, the handle, the
│                        result, the error taxonomy, the seam records
│                        (RunHalt, the worker config)
├── notional-machine.md  the machine twin: run's fill of the region NM's
│                        black box
├── index.ts             the Evaluator object: name · applicability · main
├── create-run-handle.ts main's body: the source over the region's
│                        execution-handle library
├── map-settlement.ts    the seam: engine settlement → run's result
├── resolve-io.ts        thread-side io-mock resolution and classification
├── run-worker-setup.ts  worker-side setup: guard globals + dialog traps +
│                        the halt author
├── worker-entry.ts      the worker entry the engine's factory loads
├── sandbox.html         the hand-test page (io toggles, presets, dumps)
├── vite.sandbox.config.ts
└── tests/               the behavioral suite
```

## The evaluator object

run satisfies the kind envelope `{ name, applicability, main }`:

- **name** — `'run'`.
- **applicability** — constant-true: run is level-blind (human ruling
  2026-08-12) and serves both execution axes, so the options list a consuming
  lens builds is never environment-dependent. Whether this environment can host
  a run is answered at main, as data.
- **main** — returns the inert `RunHandle`, or a structured refusal. Two refusal
  species, distinguishable by their stated wording convention:
  - **Environment refusals** come from the region's shared environment-refusal
    module
    ([`../lib/environment-refusal/README.md`](../lib/environment-refusal/README.md),
    hoisted by human ruling 2026-08-18 so run's and intercept's wordings cannot
    drift): no `Worker` (server-side rendering, plain Node), or no
    `SharedArrayBuffer` (the page is not cross-origin isolated). Their reasons
    name the missing capability and open with the evaluator's name — something
    the consuming lens can act on. run reads the environment FIRST, then the
    spec — the deprecated port's pinned order — so where both grounds apply, the
    environment refusal answers.
  - **Spec refusals** name the spec itself: a spec driven outside the evaluation
    phase's gate (its `ast` fact is not a success — the kind's facts are
    gate-guaranteed at drive time, and run narrows that guarantee once, at the
    door). A lens receiving this refusal has a bug on its own side, and the
    reason says so in those words. Whether the kind's refusal shape grows a
    discriminating field is P0-K's question, named here and not decided.

  The residual — every capability present but the machinery still failing — is
  never a refusal; it surfaces as the machinery defect it is.

## The spec

run widens the shared spec with one optional member, per the kind's
optional-members-only rule:

```ts
type RunSpec = EvaluationSpec & {
	readonly io?: IoMocks; // dialog answers; absent slots take the io posture
};
```

`facts`, `execution`, `seconds`, and `iterations` mean exactly what the kind
says they mean ([`../README.md`](../README.md) § The spec). `io` is run's own:
per-verb dialog answers, in the reference's shape — `prompt`/`alert`/`confirm`,
each independently suppliable, each returning its value directly or via Promise.

## The handle

run's handle is the settle base plus its eager echoes — result-only, NOT
AsyncIterable; run streams nothing, and a result-only evaluator is a legal
evaluator (forward-compatibility requirement 13):

```ts
type RunHandle = ExecutionBase<RunResult> & {
	readonly code: string; // facts.source.value — the learner's own text
	readonly ast: Program; // the facts' parsed root, gate-guaranteed
	readonly options: ResolvedRunOptions; // seconds always populated
};
```

- **code** — `facts.source.value`, the learner's own text, echoed so a consumer
  holding the handle needs no other reference. The guard-spliced text run
  actually poses is never surfaced: the trip record's span decodes against the
  ORIGINAL text (the guard's splice-on-original commitment), so the original is
  the only text a consumer can render against.
- **ast** — the embodiment's parsed `Program`, by reference. The reference
  declared `Program | undefined` with the `undefined` arm meaning "parse
  failed"; under the kind's gate guarantee that arm is unreachable, so the type
  says so and this sentence is its record.
- **options** — the resolved options record: `seconds` ALWAYS populated (the
  engine owns the default; run echoes the resolved number), `iterations` and
  `io` as given.

Consumption is the base's two touches — `await handle` / `.then`, or `.result`
access. The first touch starts the run; construction never does; `cancel()`
before any touch settles with the cancel outcome and nothing spawned. Reading
`code`, `ast`, or `options` observes and never ignites.

## io — mocks, and the io posture

The learner's program may call `prompt`, `alert`, or `confirm`. The worker traps
those verbs and asks the thread; run answers at its own seam:

- **A supplied mock answers.** Its return value is validated at the seam per the
  table below — what the reference silently coerced is classified instead — and
  written back; the program continues.
- **No mock for that verb ends the run as a classified io error.** Never a
  native browser dialog (the reference's fallback — superseded with its
  rescission history engaged, see [`DOCS.md`](./DOCS.md) § Decisions), and never
  the deprecated port's bare `ReferenceError`: the failure is the io layer's,
  and the result says so, discriminated from the learner's own errors.
- **A mock that throws or rejects is the same classification** — run's wrapper
  catches it, records the classification closure-side, and routes it before the
  machinery can mislabel it as a machinery defect.
- **Cancel during an in-flight mock discards the answer.** The machinery's call
  is uninterruptible and its response is discarded on stop; the reference's
  cancel-waits-for-mock is structurally unrestorable against that design and is
  superseded (its ledger row carries the argument). The mock's own side effects
  are the consumer's business.
- **A mock's liveness is the consumer's own obligation** (human ruling
  2026-08-18, this unit's design review). The machinery's budget pauses for the
  whole of an io exchange, and neither the machinery nor the handle library
  installs watchdogs — so a mock that never settles holds the run, and
  `cancel()` is the exit. This is the same clause the handle library states for
  sources; run restates it for the one callback its consumers author.

Answer validity, per verb — an invalid answer is an io error, never a silent
coercion:

| verb      | accepted answer (value or Promise)                | invalid → io error                                                                                                                                                                                        |
| --------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`  | `string` or `null`                                | anything else — no coercion to string                                                                                                                                                                     |
| `alert`   | `undefined` — the void contract's expected answer | never invalid — TypeScript's void-return assignability makes value-returning callbacks legal in a void slot, so run states the expectation and does not police it (a throw or rejection still classifies) |
| `confirm` | `boolean`                                         | anything else — including `undefined`; the reference's silent `undefined`→`false` does not return                                                                                                         |

An answer the transport channel cannot carry (the machinery's documented payload
ceiling) is an answer-validity failure — classified as an io error, not a
machinery defect. The constraints the io increment's design must satisfy: the
check runs on run's side of the call boundary, BEFORE the wrapper returns — only
there can the io flag still be set (the machinery's own overflow failure arrives
as a call-error the flag no longer covers); only `prompt`'s string answer can
exceed the ceiling; and the ceiling is the machinery's, imported from its
protocol module and measured in ENCODED bytes, never characters and never a
second copy of the number.

run traps no console: `console.log` writes to the worker's native console, and
captured logs are intercept's business.

## The result

```ts
type RunResult = // one arm per outcome; each error kind paired to its arm
	| { outcome: 'complete'; ok: true; ast; iterationCount }
	| { outcome: 'cancel'; ok: false; ast }
	| { outcome: 'timeout'; ok: false; ast; error: /* kind: 'timeout' */ }
	| { outcome: 'iteration-limit'; ok: false; ast; error: /* kind: 'iteration-limit' */ }
	| { outcome: 'error'; ok: false; ast; error: /* 'javascript' | 'io' | 'defect' */ };
```

run's result is a discriminated union on `outcome`, so each arm carries exactly
the fields that exist for it and a consumer narrowing on `outcome` never reads
an absent field — the deprecated port's precision, kept deliberately over the
reference's flat optional-member shape (human ruling 2026-08-18; the runtime
values are identical, the types stop lying about presence). The correspondence,
one row per outcome:

| `outcome`           | `ok`    | `error` arm (`kind`)                   | `iterationCount`                                                                     |
| ------------------- | ------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| `'complete'`        | `true`  | —                                      | on the arm — the halt's total                                                        |
| `'cancel'`          | `false` | —                                      | absent — the machinery's cancel route discards any halt                              |
| `'timeout'`         | `false` | `'timeout'`                            | absent — no halt, no count                                                           |
| `'iteration-limit'` | `false` | `'iteration-limit'`                    | inside the error record — the halt's total                                           |
| `'error'`           | `false` | `'javascript'` \| `'io'` \| `'defect'` | inside the `'javascript'` record — the halt's total; absent on `'io'` and `'defect'` |

- **outcome** — run speaks five of the kind's six values
  (`Exclude<EvaluationOutcome, 'fail'>`). run has no `fail` — it streams
  nothing, so cancel is its one consumer stop (ratified 2026-08-06; the
  reference asymmetry is kept).
- **ok** — true exactly on `'complete'`. run's truth table is the strictest in
  the region; intercept's differs, and the kind makes each evaluator state its
  own.
- **ast** — the same gate-guaranteed reference the handle echoes, on every
  outcome.
- **iterationCount** — the run's real guarded-loop total, required exactly where
  a worker halt exists to carry it and structurally absent everywhere else:
  inside the `'javascript'` and `'iteration-limit'` error records — the
  deprecated port's own placement — and on the `'complete'` arm at the result,
  which is the 2026-08-06 ruled addition, not the port's (guards always splice,
  so the total is real wherever a halt is). Never a `0` that means "unknown":
  the machinery's own docs suggest defaulting such metrics to zero, and run
  diverges deliberately, because an honest absence is readable and a fake zero
  is not. Surfacing the clean-arm count is a ruled reference-plus addition
  (2026-08-06); the deprecated port computed it and withheld it. The cancel arm
  carries none — the machinery's stop slot is first-write-wins and its cancel
  route discards any halt, so no settlement carries both `'cancel'` and a count.

The result always fulfills, is deep-frozen through its interior (the machinery
freezes only its own floor; the deep pass on run's payload is run's), and is
memoized — every touch reaches the same settled record.

## The error taxonomy

One discriminated union, reference spellings, discriminant `kind`. The two-value
phase (`'creation' | 'evaluation'`, human ruling 2026-08-13) is carried ONLY
where it varies — the `'javascript'` arm; every other learner-facing arm is
mid-run by construction, and a discriminant with one reachable value would be
noise (human ruling 2026-08-18, this unit's design review). The defect arm
carries no phase: a broken machine is not a phase of the learner's program.

- **`'javascript'`** — the program's own failure: a runtime throw, or a
  construction failure. Carries `name`, `message`, the halt's `iterationCount`,
  and `phase: 'creation' | 'evaluation'` — did the program fail before it ran,
  or while running. The engine's error-phase split is its own future increment
  (the run chain's opener, human ruling 2026-08-17); run's suite keeps its phase
  rows skipped until that increment lands, and the sketch names the dependency.
- **`'io'`** — the io layer's failure: an unmocked verb was called, a mock threw
  or rejected, or a mock's answer failed validation. Carries the `verb`, `name`,
  `message`. This arm is an ADDITION carrying a named supersede (recorded in the
  ledger's P0-R rulings bullet): the reference classified a mock's failure as
  the learner-shaped `kind: 'javascript'` — superseded because the unmocked-verb
  posture (HR-9) requires an answer distinguishable from the learner's own
  error, a mock's failure is the same io-layer lesson, and adding the union
  member later would break exhaustive consumers while adding it now is free.
- **`'timeout'`** — the budget elapsed. Carries `name`, `message`, the `limit`
  (the budget echoed, restored with settable seconds) and `durationMs` (the
  consumed budget the machinery already computes — a ruled free addition; free
  on the timeout arm does not mean unavailable elsewhere — widening later is
  additive).
- **`'iteration-limit'`** — the guard's marked trip. Carries `name`, `message`,
  the halt's `iterationCount`, and the whole `trip` record — loop index and
  decoded span — never a bare loc. The reference's `limit` echo is dropped
  (signed 2026-08-06): the caller supplied `spec.iterations` and holds its own
  copy, and the trip is strictly richer.
- **`'defect'`** — the machinery broke; never the learner's error. The
  discriminant literal is the kind's pin (`MachineryDefectKind`); the record is
  run's: `name`, `message`, and a `cause` mirroring the machinery's structured
  causes minus its timeout value, plus run's own `'unreachable-outcome'` for a
  condition it refuses to guess about — a settlement combination the mapper
  cannot answer, or an assemble-time dev condition where no machine ran and no
  machinery cause would be honest. The mirror is locked by a compile-time probe
  in the suite, inbound: a new machinery cause fails the build loudly (the
  deprecated port's own net, restored).

No arm carries a source `line`: the reference's numbers came from an untested
stack parse, the region ruling forbids stack parsing, and run has no wrap layer
to stamp positions from — run-side call-site instrumentation is a named future
increment, deferred at ratification (2026-08-06).

## The seam

run's source over the region's execution-handle library is result-only: the
library tells it `'batch'`, its `start` assembles the machinery spec and begins
the run, its `stop` is the machinery's cancel, and its `result` is the
settlement mapping's output. The mapping is total by a precedence rule over the
CARRIED DATA plus exactly one evaluator-owned input — run's io classification
flag, recorded closure-side at the io seam, because an io failure reaches the
machinery as its generic call-error cause and only run knows the exchange it
interrupted. The precedence, in order:

0. **A consumer-ended run settles `'cancel'`, whatever else happened** — the
   consumer's explicit stop outranks even the io flag (human ruling 2026-08-19):
   a Stop pressed during an in-flight mock answers `'cancel'`, never an io
   lesson the presser did not ask for.
1. **The io flag answers next** — whatever the machinery's cause says, a flagged
   run settles `'error'` with the `'io'` arm. (An io failure arrives AS an
   engine call-error; without this step the arm would be unreachable.)
2. A well-formed worker halt recording a throw wins next — the guard's trip when
   classification attributed one (structural, never a message match), else the
   program's own throw.
3. Else an engine-made error answers — the budget when that is its structured
   cause, the machinery defect otherwise.
4. Else a completed run carrying its natural halt is `'complete'`.
5. Every remaining combination is the defensive defect arm — including the
   machinery's `'failed'` outcome, which run's surface cannot produce (run
   installs no `fail`): it maps to `'defect'` with cause
   `'unreachable-outcome'`, loudly, never a guess.

The engine's spellings (`'completed'`, `'cancelled'`, `'timed-out'`, …) never
appear on run's results; T1 — the region README's reference-to-deprecated
correspondence ([`../README.md`](../README.md) § T1) — specifies the live
mapping by composition, and this section is its run-side completion, with one
named departure: T1 maps every reference `error` through the throw route, while
precedence step 1 sends io failures to the `'io'` arm — the ledger's named
supersede, not drift. The halt payload is narrowed exactly once, thread-side;
anything failing the narrowing routes to the defect arm rather than being read
field by field.

Two spec fields ride the machinery unchanged: `iterations` passes through — run
owns the cap policy, and its policy is pass-through: no clamp, no default, no
finiteness gate, with each cap value's consequences being iteration-guard's
documented edge set (`null` is not type-reachable through the spec, and run adds
no runtime gate for it) — and `seconds` passes through only when the caller set
it, so the machinery's own default governs. run echoes the resolved number on
`options.seconds` by importing the machinery's exported default, never by
declaring a second copy of it — and that export does not exist today: the
machinery's default is module-private, so the export is its own additive engine
increment in the run chain (beside the error-phase increment), named here as
this echo's dependency. The machinery's per-yield fee is left at its default:
run yields nothing, so the fee never accrues and waiving it would be a statement
with no referent.

## Glossary — unit terms

The region glossary owns evaluator, spec, handle, result, outcome, ok, echo,
refusal, machinery, seam, settling, cancel, io mocks
([`../README.md`](../README.md) § Glossary); these entries add what run owns,
and narrow one.

- **trapless** — run's posture toward streams and console: no console traps, no
  event stream. The name predates the dialog traps and does not contradict them
  — the three verbs are trapped precisely so the io seam can answer them;
  nothing else is.
- **verb** — one of the three dialog calls a program can make: `prompt`,
  `alert`, `confirm`.
- **io mocks** (narrowing the region entry) — run's `io` widening: per-verb
  answers in the reference's shape, value or Promise, each slot independent.
- **dialog trap** — the worker-side shim run installs over a verb; it asks the
  thread and blocks on the machinery's call channel until answered.
- **io posture** — what an unanswered verb does: run's is a classified io error
  ending the run — never a native dialog, never a bare `ReferenceError`, never a
  hang.
- **environment refusal / spec refusal** — the region glossary owns the species
  pair ([`../README.md`](../README.md) § Glossary); run's environment wording
  comes from `../lib/environment-refusal/`, its spec refusals are its own words.
- **io error** — the `'io'` arm: the io layer failed the program — unmocked
  verb, throwing or rejecting mock, or invalid mock answer.
- **io flag** — run's closure-side classification record at the io seam; the
  settlement mapping's first precedence step reads it.
- **halt** — the worker-authored stop record, authored on EVERY worker-side stop
  (natural end and throw alike) by run's halt author, carrying the real
  iteration count; narrowed once, thread-side.
- **trip record** — iteration-guard's marker value for a tripped cap: loop index
  plus decoded span (`{ loopIndex, loc }`); its presence IS the loop-cap
  classification. The word "trip" alone stays the guard's — the moment the
  marked throw is built.
- **iteration count (run total)** — the guard's never-reset count of
  guarded-loop iterations, real on every halt because guards always splice;
  surfaced as the result's `iterationCount`. The guard's own glossary owns the
  term; run adds only the surfacing rule.
- **the mapper** — run's settlement seam: engine settlement in, run result out,
  by the six-step precedence above (numbered 0-5, and the prose means those
  numbers literally).
- **resolved options** — `ResolvedRunOptions`, the options record echoed on the
  handle: `seconds` always populated, `iterations` and `io` as given.
- **pre-spawn cancel** — a cancel that lands before any consumption touch: the
  library settles it inert; nothing spawned, no events, the cancel outcome on
  the result.
- **sandbox** (homonym, resolved) — two senses in this unit: the machinery's
  worker sandbox (where the program runs), and `sandbox.html` (the hand-test
  page). Prose says "worker sandbox" or "the sandbox page" where the bare word
  would be ambiguous.

## The suite — sources and dispositions

The behavioral suite is authored fresh against this contract, its rows mapped
from three sources (committed skipped; the region's Phase-1 un-skips one at a
time):

- **The quarry's browser suite** (`run/tests/run.browser.test.ts`, the
  behavioral core): completes, timeout, the iteration cap and its
  unguarded-`RangeError` non-misclassification triangulation, runtime errors,
  the io-mock family, the cancel family, memoization and PromiseLike, the sync
  surface, result-side ast, cancel-races-timeout. Adapted rows, each a named
  delta: cancel-during-slow-mock asserts discard-on-stop (the superseded
  wait-for-mock's row carries the argument); the per-pause budget-charging row
  defers to the machinery's own suite (it asserts engine mechanics, not run's
  contract).
- **The quarry's unit suite** (`run/tests/run.test.ts`): the sync-surface,
  defaults, freeze, PromiseLike, and pre-spawn-cancel rows re-fixture over
  `main(spec)`; its gate rows (parse, rejections, formatting) do NOT transport —
  those arms were resolved upstream of the kind (parse superseded to the
  embodiment's gate; rejections and formatting relocated to the orchestrator's
  layer, drop-as-loss, ratified 2026-08-06); its no-`logs` rows drop with the
  `logs` concept itself (run's result never had the field to forbid).
- **The deprecated port's seam suites** (`map-settlement`, `run-worker-setup`,
  `index` — content-level transport under reference spellings): the refusal rows
  ride this unit's behavioral suite now; the precedence rule's rows, the halt
  narrowing's rows, the `'failed'`-route and defect-routing rows, and the
  guard-config pass-through are SEAM-level — they land WITH their seam files
  (`map-settlement`, `run-worker-setup`) in the run chain, transported then,
  because they drive surfaces this Phase 0 deliberately does not stub. The
  port's fourth suite — `create-run-stream.test.ts` — does not transport here:
  its nine pinned rows ride the handle library and the copied guard, where their
  dispositions already landed.

New rows with no source: the io posture (unmocked verb classified; invalid mock
answer classified, per verb), the io-flag precedence (a flagged run settles
`'io'`, never `'defect'`), the clean-arm iteration count, `durationMs` on the
timeout arm, the two-touch result-only ignition over the library (the library's
own suite pins the base laws; run's rows pin only its widening), the inbound
compile-time mirror probe on the defect causes, and the phase rows — skipped
until the engine's error-phase increment lands.

## Discharges

What this Phase-0 design encodes, by identifier (human ruling 2026-08-12,
HR-21). Rulings and rows resolve against the campaign's LOSS-LEDGER
(`.planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md`); the fourteen
forward-compatibility requirements resolve against the recovered digest
(`git show a8a0128d:.planning-handoffs/evaluators-api-restoration/research-digests-2026-08-05.json`,
key `.result.tracers`).

**Rulings of record encoded here:** HR-4 (fidelity-first — the quarry run engine
is the reference; every deviation cites its row: one named supersede — the
`'io'` classification — and one HR-4 exception — the discriminated result shape
— each carrying its strength argument in the ledger's P0-R rulings bullet,
2026-08-18); HR-8 (reference names wholesale: `RunHandle`, `RunResult`,
`ResolvedRunOptions`, `IoMocks`, the five-value outcome subset, the `kind`
discriminant and its reference spellings; the trip record and defect
discrimination riding as additions in reference style); HR-9's run half (worker
dialog traps over the machinery's call seam; a supplied mock answers, validated
per verb; no mock → the classified io posture; `io` as the spec widening —
placement was P0-K's, shape and seam semantics land here); HR-17
(refusal-as-data at main, two species named; the shared environment-refusal
module is the environment species' one wording, human rulings 2026-08-18/19);
HR-18 (level-blind — constant-true applicability; no JEJ vocabulary anywhere in
this unit); HR-19 (instrumentation assumed sound — the guard's splices are
trusted; a guard-introduced failure presents as the learner's own); HR-20 (the
two-value phase, spelled `'evaluation'`, carried only where it varies — the
`'javascript'` arm, human ruling 2026-08-18; the quarry's `'execution'` does not
return; the engine split is the run chain's opening increment, human ruling
2026-08-17, and the suite's phase rows stay skipped until it lands); HR-21 (this
section). NOT discharged here, named for honesty: HR-5, HR-7, HR-12
(intercept's), HR-15 (sandbox cadence — the run chain builds and extends
`sandbox.html`, each user-observable increment firing its own checkpoint).

**Ledger rows answered, by verbatim member cell** (three trees carry a
`run/types.ts`; rows below cite the quarry as "reference" and
`src/lib/study-lenses/evaluators-deprecated/` as "the deprecated port"):

- `RunHandle` name + shape — restored result-only over `ExecutionBase`.
- `.code` eager — `facts.source.value`, the learner's own text; the spliced text
  is never surfaced.
- `.ast` SYNC (`Program \| undefined`) — eager echo; the `undefined` arm retired
  by the gate guarantee, recorded at the field.
- `.options` / `ResolvedRunOptions` (seconds always populated) — the echo, with
  the machinery-owned default imported via its own named additive engine
  increment, never re-declared.
- handle `Object.freeze` — the region's handle library installs and freezes the
  handle (its construction row); run's discharge is the echoes riding that
  installation and the deep pass on its own result.
- `seconds` (default 5, settable) — spec placement was P0-K's; the
  pass-through-only-when-set and the always-populated echo land here.
- `iterations` — already survives; rides the machinery config unchanged (pin
  run:235 in § Pin dispositions).
- "iterations omitted = no guard injection" (source-runs-unmodified guarantee) —
  superseded: guards always splice; the real total on every halt is the visible
  consequence.
- `io` / `IoMocks` (3 dialog slots, sync-or-Promise) — restored as the spec
  widening, reference shape, with the per-verb answer-validity table.
- native-dialog fallback for unmocked verbs — superseded by the classified io
  posture; the D5b rescission history is engaged in DOCS § Decisions (the
  `D5b decision record engagement` row's restore-as-doc), including the parity
  ground the rescission cited and this region's ruled asymmetry.
- cancel-waits-for-in-flight-mock — superseded; discard-on-stop stated in § io
  and asserted by the adapted suite row.
- `io-error` termination cause (mock failure as a classified run outcome) —
  restored as the `'io'` arm, classified closure-side at run's seam; the arm's
  departure from the reference's `'javascript'` classification is the named
  supersede above.
- `RunResult` name; `outcome` 5-value; `ok` — the types land here (the
  vocabulary and T1 landed at the region root); the discriminated shape is the
  HR-4 exception above — the row itself stays a restore.
- machinery-defect discrimination — the `'defect'` arm; discriminant
  kind-pinned, record run's own, causes mirrored minus timeout plus
  `'unreachable-outcome'` (pins run:272, run:289), the mirror compile-locked
  inbound.
- `result.ast` on every parsed outcome — restored; under the gate, every outcome
  is a parsed outcome.
- `rejections` (JeJ violations) — drop-as-loss, resolved upstream; run's suite
  does not transport the quarry's rejection rows.
- parse error arm — superseded upstream (the embodiment's gate); run refuses a
  spec whose `ast` fact is not a success rather than re-modeling a parse arm.
- formatting error arm — drop, resolved upstream; the quarry's formatting rows
  do not transport.
- error `line` on a learner throw — DEFERRED on run (ruled 2026-08-06): no arm
  carries `line`; wrap-style instrumentation is a named future increment, never
  a stack parse.
- error `column` — drop; declared-never-populated in the reference itself.
- `phase: 'creation' \| 'execution'` — restored under HR-20's respelling and
  narrowed to the one arm where it varies (human ruling 2026-08-18); the engine
  increment (E2) opens the run chain.
- `TimeoutResultError.limit` (+ `durationMs`) — both on the timeout arm.
- `IterationLimitResultError.limit` — dropped (signed); the trip record rides
  instead.
- clean-arm `iterationCount` — the result's `iterationCount`, required exactly
  where a worker halt carries it.
- dialog io-request round-trip protocol (3 typed SAB writers, worker traps) —
  superseded: the machinery's generic call channel carries run's traps; encoded
  in § io and the worker-setup file's charter.
- exported worker-protocol surface (19 symbols) — drop; run exports no protocol
  surface.
- tagged `IoResult` union — refuted, not a loss (Appendix A); no row to encode,
  named so nobody re-audits it. Its one live residue — the reference wire's
  `undefined`→`false` coercion on confirm — is retired by the per-verb validity
  table.
- Blob-URL worker script (source-as-a-value) — superseded: the static module-URL
  factory is the machinery's contract; the no-bundler-regression FLAG rides the
  increment that authors run's `workerFactory` (the run chain's first), not this
  design.
- per-round-trip budget charge on the SAB handshake — drop; the machinery
  charges per yield, and run yields nothing.
- D5b decision record engagement — restore-as-doc; DOCS § Decisions (authored at
  0.3, this unit) carries the engagement — a row AR-5 verifies against the
  written document.
- README runnable commands (sandbox launch, 2 test-tier commands) — restored in
  § Sandbox and § Tests below, re-derived against this region's paths (the
  quarry's own command paths predate its move and no longer resolve).

**The 2026-08-19 second-round rulings encoded here:** the precedence's step 0
(cancel outranks the io flag); and the banked halt-shape question — run's Phase
0 declares its own `RunHalt` per the deprecated port's precedent, and whether
the halt payload shape consolidates into a shared home is P0-I's design
inventory's, decided with both units' halt needs visible.

**Pin dispositions encoded** (§ Pin dispositions, paths relative to the
deprecated port): run:235 (iterations rides through unchanged — no clamp, no
default, no gate); run:272 (the engine's refinement hook goes unused; the stop
record is authored where the raw throw lives — run's halt author); run:289 (no
machine ran → no machinery cause is honest — `'unreachable-outcome'`).
run:103/140/154/300 were discharged structurally by the handle library;
run:208/217 ride the copied iteration-guard.

**Forward-compatibility requirements engaged here:** 2 (eager echoes at
creation, igniting nothing), 3 (the result fully run-owned), 5 (settlement
extensibility exercised — the trip, the iteration count, and `durationMs` are
the refinement pattern the requirement names), 11 (the call-channel interaction
posture's first real exercise — run services dialogs through the machinery's
call channel while intercept's respond-posture stays legal), 13 (the result-only
handle consumed as a first-class shape). Requirement 9 was discharged by the
engine's yield-charge opt-out (commit `976baed9`); the remainder were discharged
at the region root and the handle library.

## Sandbox

The run chain builds and extends `sandbox.html` (io toggles, presets including
timeout and defect arms, result dumps, an unexpected-throw catch guarding the
never-rejects contract):

```bash
npx vite --config src/lib/study-lenses/evaluators/run/vite.sandbox.config.ts
```

## Tests

```bash
node ./node_modules/vitest/vitest.mjs run --project unit \
	src/lib/study-lenses/evaluators/run/tests/

node ./node_modules/vitest/vitest.mjs run --project browser \
	src/lib/study-lenses/evaluators/run/tests/
```

## Navigation

- The region root: [`../README.md`](../README.md) — the kind contract;
  [`../types.ts`](../types.ts) — `Evaluator`, `EvaluationSpec`, `ExecutionBase`,
  `EvaluationOutcome`, `ErrorPhase`, `MachineryDefectKind`;
  [`../notional-machine.md`](../notional-machine.md) — the consumption surface
  this unit's twin opens.
- The machine twin: [`notional-machine.md`](./notional-machine.md) — run's fill
  of the region NM's black box.
- Architecture and decisions: [`DOCS.md`](./DOCS.md).
- The handle library:
  [`../lib/execution-handle/README.md`](../lib/execution-handle/README.md) — the
  source seam run's main builds on.
- The environment refusal:
  [`../lib/environment-refusal/README.md`](../lib/environment-refusal/README.md)
  — the shared environment-refusal wording.
- The iteration guard:
  [`../lib/iteration-guard/README.md`](../lib/iteration-guard/README.md) — the
  trip record and the always-splice commitment.
- The machinery: [`../../lib/engine/README.md`](../../lib/engine/README.md).
- The reference (read-only quarry): `src/lib/embody/lib/evaluating/run/`.
- The deprecated port (frozen second reference):
  `../../evaluators-deprecated/run/`.
- The sibling evaluator: `../intercept/` — its own unit; its docs link back
  here.
