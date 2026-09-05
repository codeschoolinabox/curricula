<!-- cspell:ignore backpressure unmocked -->

# intercept

Step-through execution: a live event stream, the full generator surface,
entwined enrichment, pending interactions. intercept runs the learner's program
and yields its boundary moments — console calls, dialogs, errors — as enriched
events in arrival order; a consuming lens steps them, answers its asks, or
awaits the complete result. A lens that only needs how a program ended drives
the run evaluator (`../run/`); intercept is for lenses that render the running
itself.

The contract is restored from the reference intercept engine (the read-only
quarry — see § Navigation) under the region's kind contract
([`../README.md`](../README.md)): spec in, streaming handle or structured
refusal out, nothing thrown at the learner.

## What lives here

```text
intercept/
├── types.ts                  intercept's contract: the spec widening, the
│                             handle with its generator surface, the event
│                             union, the result, the error taxonomy, the
│                             seam records (InterceptHalt, worker config)
├── notional-machine.md       the machine twin: intercept's fill of the
│                             region NM's black box
├── index.ts                  the Evaluator object: name · applicability ·
│                             main
├── create-intercept-handle.ts  main's body: the streaming source over the
│                             region's execution-handle library + the
│                             generator-surface extras
├── map-settlement.ts         the seam: engine settlement → intercept's
│                             result
├── create-interaction-channel.ts  the pending interaction's mint: one
│                             answer, teardown-inert respond
├── serve-ask.ts              thread-side ask service: mock-before-mint,
│                             per-verb validation, the pending interaction
├── enrich-event.ts           wire record → delivered event: offsets,
│                             node path, the graph accessors
├── narrow-record-message.ts  the wire narrowing (one site)
├── wrap-call-expressions.ts  the loc wrap: spliced text in, original spans
├── intercept-worker-setup.ts worker-side setup: guard globals + traps +
│                             the halt author
├── worker-entry.ts           the worker entry the engine's factory loads
├── sandbox.html              the hand-test page (card flows, presets,
│                             the full-data serializer)
├── vite.sandbox.config.ts
└── tests/                    the behavioral suite
```

## The evaluator object

intercept satisfies the kind envelope `{ name, applicability, main }`:

- **name** — `'intercept'`.
- **applicability** — constant-true: intercept is level-blind (human ruling
  2026-08-12) and serves both execution axes; whether this environment can host
  a run is answered at main, as data.
- **main** — returns the inert `InterceptHandle`, or a structured refusal. The
  two refusal species are the region's ([`../README.md`](../README.md) §
  Outcomes, errors, refusals): environment refusals come from the shared
  environment-refusal module
  ([`../lib/environment-refusal/README.md`](../lib/environment-refusal/README.md)),
  read FIRST — the deprecated port's pinned order, same as run's — and spec
  refusals (a spec driven outside the evaluation phase's gate: its `ast` or
  `entwined` fact is not a success) name the spec in intercept's own words. The
  residual is the machinery defect it is.

## The spec

intercept widens the shared spec with one optional member, per the kind's
optional-members-only rule:

```ts
type InterceptSpec = EvaluationSpec & {
	readonly io?: IoMocks; // dialog + console answers; absent dialog slots
	// take intercept's posture — the pending interaction
};
```

`facts`, `execution`, `seconds`, and `iterations` mean exactly what the kind
says they mean. `IoMocks` is a per-evaluator type name, not a shared one — run's
declares three dialog slots, intercept's adds `console`; the kind rules io
per-evaluator at the root, each quarry file declared its own `IoMocks` (HR-8
restores per unit), and the shared spelling is a recorded decision (the quarry's
newer `InterceptIoMocks` alternative was considered and declined, human ruling
2026-08-19). intercept's `IoMocks` is the reference's shape —
`prompt`/`alert`/`confirm`, value or Promise — plus the reference's `console`:
per-method callbacks (`IoConsole`, closed over the reference's nineteen
`ConsoleMethod` keys), each awaited before the NEXT moment is delivered — the
shipped guarantee is next-delivery gating at a one-call lag (the emitting call's
own return is already in flight; at the stream's tail the settle is what is
gated), never a pause at the callback's own call site. intercept consumes the
machinery's per-yield fee waiver CONDITIONALLY (human ruling 2026-08-19):
`yieldCharge` is false exactly when the spec carries a FINITE, POSITIVE
`iterations` cap — a cap that cannot trip (`Infinity`, `NaN`, absent) is not an
owner of loop safety, so those spellings keep the fee — because the waiver's
premise is that loop safety rests on the cap: the waiver and a real cap arrive
together, and loop safety always has exactly one named owner. An uncapped spec
keeps the fee, and pin intercept:495 stays RETAINED for exactly the fee-charged
case it was written about; :504's discipline (loose floors, never exact counts)
binds every budget-adjacent suite row, though its flat arithmetic exists only
where the fee does.

## The handle

intercept's handle is the streaming handle plus the full generator surface and
its eager echoes (HR-5):

```ts
type InterceptHandle = Execution<InterceptEvent, InterceptResult> & {
	readonly next: () => Promise<IteratorResult<InterceptEvent, InterceptResult>>;
	readonly return: () => Promise<
		IteratorResult<InterceptEvent, InterceptResult>
	>;
	readonly throw: (
		thrown?: unknown,
	) => Promise<IteratorResult<InterceptEvent, InterceptResult>>;
	readonly fail: (reason?: unknown) => void;
	readonly code: string; // facts.source.value — the learner's own text
	readonly options: ResolvedInterceptOptions; // seconds always populated
	readonly entwined: Entwined; // the facts' entwined record, eager
};
```

- **The generator members are an explicit surface, never the TypeScript lib's
  `AsyncGenerator` token** (its ratified supersede row: the lib type drags in
  `AsyncDisposable` and a required `return()` argument). Their semantics, where
  the reference's were accidental or engine-incompatible, are specified here and
  each carries its ledger row:
  - **`next()`** steps one moment. A first `next()` on an un-ignited handle is
    an `'iterate'` ignition: the member wraps the handle's OWN iterator — one
    memoized iterator for the handle's life, the library's ruled self-iteration
    guarantee (human ruling 2026-08-19, a named amendment to the committed
    library contract) — so manual stepping and `for await` are structurally one
    consumption path, and wherever the iterator answers `done` (the natural end,
    a teardown, an after-batch iterator already ended), the member substitutes
    the settled result: `{ done: true, value: await handle.result }` — every end
    route, one answer.
  - **`return()`** is the break door: it aliases the memoized iterator's own
    `return` — the same function `for await`-break invokes — which runs the full
    teardown sequence (latch, release any pending ask, stop the machinery,
    settle) and resolves `{ done: true, value }` with the COMPLETE result only
    AFTER the settle (the reference's drain-through-`origNext` would deadlock a
    suspended ask against the machinery's out-of-band teardown; superseded, its
    row carries the argument). Break awaits settlement — the stated behavior
    change the ledger records.
  - **`throw(thrown)`** ≡ `fail(thrown)` then settle: the run ends with
    `outcome: 'fail'` and `result.reason === thrown`, and the member resolves
    `{ done: true, value }` with that result. The reference left `.throw` as the
    NATIVE generator method — a latent defect that skipped teardown; superseded,
    its row carries the argument.
- **`fail(reason)`** — the mid-stream consumer stop with a reason (intercept's
  second door beside `cancel`; run deliberately has none). It records the reason
  closure-side and closes the library's teardown latch through the builder's
  controls; the source's `stop()` reads the record and speaks the MACHINERY's
  own `fail(reason)` rather than its cancel, so the engine's `'failed'`
  settlement is real and the mapping speaks `'fail'` from carried data. The
  doors answer before ignition too: a pre-ignition `fail(reason)` (or `throw`)
  settles through the evaluator-authored inert-settle thunk — the library's
  `inertCancelResult` member, whose ROUTE is a pre-ignition stop while its SHAPE
  is intercept's own to author, here reading the recorded reason and speaking
  `outcome: 'fail'` — and a pre-ignition `return()` settles the inert cancel and
  resolves with that result; nothing ever spawns.
- **code / options** — eager echoes, as run's: the learner's own text (never the
  spliced text), and the resolved options with `seconds` always populated (the
  machinery-owned default imported — the same named additive engine increment
  run's echo depends on; the reconciliation lands once, both units citing it).
- **entwined** — the facts' entwined record — `root`, `byPath`, `byOffset`,
  `parenSpans`, the whole committed shape — echoed EAGERLY and synchronously.
  Two ruled departures from the reference's `.ast` member, each with its
  strength argument in the ledger's P0-I rulings bullet (human rulings
  2026-08-19): the NAME (run's `ast` is a real `Program`; one region must not
  spell two things one way) and the retired Promise wrapper (the reference's own
  validation gate was still ahead; under the kind the entwining is
  gate-guaranteed before main is ever driven, so a promise would be ceremony
  around a value the caller's facts already hold). The member is re-derived
  against the CURRENT embodiment (HR-12) — never the reference's shadow `ast`
  record, whose tree does not return (its supersede row: a second node-identity
  space beside the facts).

Consumption is the region's closed three-touch list; the mode latch is the
library's, and intercept restates it as its own: iterate first (a pull or a
first `next()`) and later batch touches subscribe to the settle; batch first
(`await handle` / `.then` / `.result`) and a later iterator is already ended,
the result's `events` array being the record.

## io — asks, answers, and the pending interaction

The learner's program asks through its dialogs; console calls are records, never
asks. intercept answers at its `serveAsk` seam:

- **A supplied dialog mock answers BEFORE a pending interaction is minted.** The
  mock's answer is validated per verb (run's validity table is the shared
  discipline: `prompt` accepts `string | null`, `confirm` accepts `boolean` —
  `undefined` does not coerce; `alert`'s expected answer is the void contract's
  `undefined`, stated and not policed); the validated answer is written back and
  the program continues. The record event then carries what the program
  received.
- **No mock for that verb takes intercept's posture: a pending interaction** —
  the kind's distinguished event, riding the STREAM, never the settle channel.
  Its `respond` resumes the run from the event itself; answering twice is inert;
  answering after teardown is a no-op; a wrong answer shape is a loud, retryable
  dev error at the responder (validated at the same per-verb table; run's
  transport-ceiling classification applies at the responder too — an
  over-ceiling `prompt` answer is an io failure, checked before the channel,
  never a machinery defect), never a learner outcome. This is the ruled sibling
  asymmetry: run ends where intercept converses (both units' models state it).
- **Under a batch drain, an unmocked ask cancels the run at that ask** (HR-7):
  nobody is stepping, so nobody can respond — "unanswered" is STRUCTURAL (no
  mock supplied for that verb), never temporal. The source reads the engaged
  mode at `start(mode)` and takes this posture itself; the library's drainer
  only relieves backpressure. The run settles `'cancel'` with the events so far.
- **An invalid mock answer is the same io error as run's** — on the mock path
  exactly as on the responder path, the per-verb table governs and nothing
  coerces.
- **A throwing or rejecting console callback is classified at intercept's seam**
  — an io error, run's ADDITION arm mirrored with its citation: the io layer
  failed the program, discriminated from the learner's own error (the reference
  surfaced it as a learner-shaped `InternalError` event; superseded with the
  same strength argument as run's `'io'` supersede). A throwing dialog MOCK is
  the same classification. intercept's io record declares its own field shape —
  run's classification transfers, run's fields do not: `source` names the
  failing surface (a dialog verb, or `console.<method>`), beside `name` and
  `message`; and the failure ALSO lands in the stream as a step-stamped
  `'error'` event, because errors land twice by design.
- **An unmocked console method records and nothing more** (human ruling
  2026-08-19 — a supersede of the reference's native forwarding, its strength
  argument in the ledger's P0-I bullet): the record IS the observation, the
  consuming lens renders it, and the host console stays the machinery's. The
  worker traps the WHOLE console surface, so an exotic-but-legal call
  (`console.profile(…)`) records faithfully instead of failing learner-shaped
  (HR-18); mock keys stay closed over the nineteen standard methods — an exotic
  method records, never mocks.
- **Cancel during an in-flight mock discards the answer** (the machinery's
  uninterruptible call + discard-on-stop), and a mock's liveness is the
  consumer's own — both exactly as run states them; intercept restates rather
  than re-derives.

## The events

The union, in reference spellings — discriminant `event`, fields `method`,
`args`, `return`, `step` as the reference spelled them; the deprecated port's
`kind`/`returnValue` vocabulary retires with its region:

- **`'console'`** — `method` (an open `string`, the reference's nineteen
  `ConsoleMethod` names documented as the standard set — the whole-surface trap
  reports every legal call, human ruling 2026-08-19), `args`. Emit-only: nothing
  returns to the program.
- **`'prompt'` / `'alert'` / `'confirm'`** — an ANSWERED dialog: `args` plus
  `return`, the value the program received. A dialog that is asked and not yet
  answered is not a record — it is the pending interaction immediately before
  it; the two are adjacent by construction (the worker is blocked for the
  dialog's whole span).
- **`'pending-interaction'`** — the ask nobody has answered yet (an UNMOCKED
  dialog under a stepping consumer is two adjacent moments — the ask, then the
  answered record; a mocked dialog is one, the record alone): `request` (the
  decoded ask, per verb, `defaultValue` absent-not-undefined) and `respond`,
  binding the kind's generic
  (`PendingInteraction<InterceptInteractionRequest, InterceptDialogAnswer>`) to
  intercept's real shapes.
- **`'error'`** — the in-stream error arm, restored (its escalated ruled row):
  `name`, `message`, landing in stream order, step-stamped, so in-timeline
  rendering needs no settlement join — plus an optional `source` mirroring the
  settlement io record's field (human ruling 2026-08-19): present on an io
  failure ('prompt', 'console.table', …), absent on the learner's own throw, so
  a timeline lens discriminates the two without waiting for the settle. Which
  kinds reach the stream, stated: learner throws and io failures do; a machinery
  defect is settlement-only — a broken machine ends the timeline anyway — and so
  are the engine-made stops (`'timeout'`, `'iteration-limit'`): the halt ends
  the timeline, closing the enumeration over all five kinds. Error events carry
  no phase (its drop row: near-constant under the gate architecture) and a
  narrower enrichment: no `callee`/`calleePath` (there is no call), the
  attribution span where one exists.

**Every delivered event is richer than its wire message** (HR-12). Enumerable
plain data: `step` (worker-minted, never renumbered), `loc` (the call-site span,
1-based lines / 0-based columns, `null` where no wrap attributed), the **offset
pair** `start`/`end` (the ADDITION row: stamped near-free from the wrap's
original-text parse, valid in the facts' coordinate space, making the `byOffset`
join direct), `nodePath` (the resolved entwined path, `null` with `loc`), and
`calleePath` (the call's callee path, derived). Non-enumerable accessors:
`node`, `prev`, `next`, `callee` — resolving through the facts' entwined record
and a thread-side pointer, installed during enrichment before the machinery's
freeze-at-yield, never written after yield — so serializing any event or result
stays safe while `event.node` answers with the real `EntwinedNode`. The
accessors answer from the facts the run was driven with; across a re-embodiment
they go stale, and the plain-data `nodePath` is the durable attribution (the
region README carries the cost).

## The result

intercept's result is discriminated on `outcome` — run's HR-4 exception,
mirrored with its citation (each arm carries exactly the fields that exist for
it; runtime values identical to a flat shape):

| `outcome`           | `ok`    | `error` arm (`kind`)                   | carries                                                                                                                                                                       |
| ------------------- | ------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'complete'`        | `true`  | —                                      | `iterationCount`                                                                                                                                                              |
| `'cancel'`          | `true`  | —                                      | — (the machinery's cancel route discards a halt)                                                                                                                              |
| `'fail'`            | `true`  | —                                      | `reason` — the consumer's payload, by reference and FROZEN THROUGH (the quarry's own fail-arm behavior: an object the consumer keeps using elsewhere is frozen by the settle) |
| `'timeout'`         | `false` | `'timeout'`                            | `limit` + `durationMs`; no count — no halt exists                                                                                                                             |
| `'iteration-limit'` | `false` | `'iteration-limit'`                    | the whole `trip` record + `iterationCount`                                                                                                                                    |
| `'error'`           | `false` | `'javascript'` \| `'io'` \| `'defect'` | `'javascript'`: the attributed `loc` + `iterationCount` + phase; `'io'`/`'defect'`: no count — the run ended thread-side                                                      |

The `'fail'` arm carries no count either: the fail door speaks the machinery's
own `fail`, which ends the run thread-side — no worker stop record exists to
carry one (run's cancel-arm honesty, mirrored).

Every arm carries the common record: `events` (every delivered event, in order —
the one archive; one-shot streaming means no replay), `code` and `options` (the
reference's result echoes, restored), `entwined` (the result-side echo of the
same record the handle carries), `visitCounts`, and `eventsByNode`.

- **ok** — true on `'complete' | 'cancel' | 'fail'`, the reference's own table:
  cancel and fail are consumer verbs, not failures.
- **The error taxonomy** mirrors run's where the concern is shared —
  discriminant `kind`, reference spellings; `'io'` as the same named
  ADDITION-with-supersede (citing run's row) with intercept's own `source`
  field; the defect record shape mirrored with citation (`cause` = the
  machinery's causes minus timeout, plus `'unreachable-outcome'`), the mirror
  compile-locked inbound — and differs where intercept is richer: the
  `'javascript'` arm carries the ATTRIBUTED CALL SITE (error `line` restored ON
  intercept, its escalated ruled row — the wrap-style span, richer than the
  reference's line): the wrap's recorded innermost live call for an in-wrap
  throw, or the one sanctioned stack-parse position for the no-live-frame
  residual (§ The seam carries the exception and its constraint). The
  `'javascript'` arm's phase is run's convergence (`ErrorPhase`, the one arm
  where it varies; the rows run live against the landed E2 split). The
  reference's `line?`/`phase` on the timeout and iteration-limit arms do not
  return — run's phase convergence covers the phase halves, and those arms'
  `line` has no honest source on engine-made stops (named drops).
- **visitCounts / eventsByNode** — the per-node join and count, both keyed by
  resolved `nodePath`, both accumulated thread-side. `visitCounts` counts
  RECORDS, the reference's own semantics: one count per dialog (at its record,
  which exists on the mocked and unmocked paths alike) and one per console
  record — never per delivered event, so the number is mock-independent;
  `eventsByNode` joins EVERY event, asks included, because a join is not a count
  (fix-all, this unit's design review). **The null-key policy, decided:** an
  event whose `nodePath` is `null` (the wrap declined the call; nothing to
  resolve) is EXCLUDED from both — an honest absence over a sentinel bucket, the
  same honesty rule as run's iteration count; the exclusion is per event,
  visible (the event itself still rides `events` with its `loc: null`), and the
  enclosing-fallback interaction is stated: fallback attribution applies to the
  SETTLEMENT error's `loc`, not to stream events, so it mints no keys and the
  two mechanisms never collide. `eventsByNode` is the ADDITION replacing the
  reference's `node.events[]` back-refs (its supersede row: the facts' graph is
  frozen and cannot grow arrays; the result-side join carries the same
  information JSON-safe).

The result always fulfills, is deep-frozen through its interior (the accessors
excepted by design — they are the named no-mutable-closures exception, installed
before yield and never written after), and is memoized.

## The seam

intercept's source over the region's execution-handle library is STREAMING:
`events` is the enriched delivery iterator; `start(mode)` assembles the
machinery spec (guard-spliced code over the ORIGINAL text — splice order pinned
by the guard; the loc wrap's spans read from the original parse — the wrap
stamps offsets and spans in the facts' coordinate space), spawns through the
engine, and RECORDS the engaged mode — intercept's ask posture reads it (iterate
→ pending interactions; batch → the structural HR-7 cancel). `stop()` is the
machinery's cancel; `result` is the settlement mapping's output.

The settlement precedence is run's six steps, mirrored with citation, plus
intercept's fail door: step 0 splits — a consumer-ended run settles `'cancel'`
on the cancel route and `'fail'` (with the recorded reason) on the fail route,
outranking the io flag either way; the machinery's `'failed'` outcome is REAL
here (the source's stop speaks the engine's own `fail` when the fail door closed
it — the plumbing in § The handle) and maps to `'fail'`. Steps 1–5 are run's:
the io flag; the worker stop record's throw (the trip, or `'javascript'` with
the attributed call site); the engine-made error; the natural end; the defensive
defect. The stop record is narrowed once, thread-side; engine spellings never
reach the result.

**Attribution, and the one sanctioned stack parse** (human ruling 2026-08-19): a
throw inside a live wrapped frame is attributed by the wrap's recorded innermost
call site — worker-side, honest, the reference's own in-wrap mechanism. A throw
with NO live wrapped frame (the bare statement-level `null.foo;` residual) takes
its position from a stack parse at the worker's stop-record author — the
campaign's ONE escalated exception to the never-a-stack-parse ruling, its
strength argument in the ledger's P0-I bullet: the alternatives were losing
attribution the reference had, or a fallback with no input at all. The parsed
position is in the SPLICED text's coordinates, and the correction is the
WORKER'S (human ruling 2026-09-01, ledger `9e692aa7`): the worker config carries
per-line column deltas computed at assembly where both texts exist, and the halt
author corrects the column BEFORE stamping — lines are preserved 1:1 by every
instrumentation pass, so one coordinate space rides the wire, matching the
wrap's original-parse stamps. The corrected position joins its entwined node
thread-side like any original-space span (`nodeAtLoc`, the enrichment surface).

**The worker stop record is intercept's own** —
`{ natural, errorName, message, loc, trip, iterationCount }` — and here the
banked question (2026-08-19) resolves in two halves: the SHAPE stays
per-evaluator (intercept's record carries the attributed call site — a member
run's lacks and run cannot honestly stamp, no wrap layer — so the two shapes
genuinely differ and each unit declares its own); the AUTHOR dedup the bank also
named (the two builders and the config readers, 57 shared port lines) is
DEFERRED to the W4b chain openers, where the first worker-setup lands and the
environment-refusal hoist's anti-drift argument is weighed against a
parameterized shared author — recorded, not dropped.

## Glossary — unit terms

The region glossary owns evaluator, spec, handle, streaming handle, consumption,
refusal (both species), outcome, ok, echo, machinery, seam, settling, cancel,
fail, pending interaction, io mocks, enrichment ([`../README.md`](../README.md)
§ Glossary); these entries add what intercept owns.

- **moment** (homonym, resolved) — one boundary event of the running program: a
  console call, a dialog, an error; the stream yields moments in arrival order.
  The region glossary's "notional-machine moments" (the tracer entry) are a
  different, finer grain — a future tracer's steps, not intercept's boundary
  events.
- **record** (homonym, resolved) — a COMPLETED moment: a console call, or a
  dialog that has been answered (`return` carries what the program received).
  Unqualified, the word means this; every other sense travels qualified: the
  entwined record, the trip record, the stop record, the defect record.
- **ask** — a dialog moment awaiting its answer; served at `serveAsk` (mock
  first), minted as a pending interaction only when no mock answers and the mode
  is iterate.
- **the wrap** — the call-expression instrumentation, applied to the
  GUARD-SPLICED text with every stamped span READ FROM THE ORIGINAL parse — so
  each coordinate is in the facts' space while the running text is not (pins
  :356/:361) — and it never changes what runs (instrumentation assumed sound,
  HR-19).
- **enrichment** — the thread-side step between wire message and yielded event:
  offsets, node path, callee path, and the four graph accessors.
- **the generator surface** — `next` / `return` / `throw` on the handle, an
  explicit alias of the reference's member signatures.
- **break door** — `return()`: teardown, then the complete result;
  `for await`-break routes through it and awaits settlement.
- **fail door** — `fail(reason)` / `throw(thrown)`: the structured consumer
  stop; the result settles `'fail'` carrying the reason.
- **step** — the event's worker-minted ordinal, 1-based, strictly increasing;
  enrichment never renumbers. GAPS ARE LEGAL AND MEANINGFUL: a mocked dialog's
  ask consumed an ordinal the stream never delivers, so delivered steps are
  monotonic, not contiguous — and the suite pins the gap so nobody "fixes" it.
  Adjacency is an ARRAY-ORDER property of `events`: an unmocked dialog's ask and
  record are neighbours there (the program is suspended for the dialog's whole
  span).
- **loc / offsets** — the call-site span in lines/columns and in UTF-16 offsets,
  both in the facts' coordinate space; `null` together where no wrap attributed.
- **attribution fallback** — settlement-side attribution for a throw with no
  live wrapped frame: the one sanctioned stack-parse position (§ The seam),
  column-corrected WORKER-SIDE through the config's per-line splice deltas
  (human ruling 2026-09-01 — one coordinate space on the wire) and joined to its
  entwined node via `byOffset` ascent at enrichment.
- **the stop record** — intercept's worker-authored stop payload: run's members
  plus the attributed call site.
- **verb / io error / io flag** — run's entries, borrowed whole
  ([`../run/README.md`](../run/README.md) § Glossary); intercept's io error
  record carries `source` in place of run's `verb` field.
- **`'error'` twice** (homonym, named) — the event union's `'error'`
  discriminant and `console.error`'s method name coexist by reference fidelity:
  `{ event: 'console', method: 'error' }` is a console record;
  `{ event: 'error' }` is the error arm. A lens filters on `event`, never on
  `method` alone.

## The suite — sources and dispositions

The behavioral suite is authored fresh against this contract, its rows mapped
from the quarry's `intercept/tests/` per the P0-E enumeration precedent, with
the deprecated port's eight suites (260 rows) set out below rather than waved
at:

- **`cancel.test.ts` (20) + `cancel.browser.test.ts` (8)** — transport/adapt:
  the cancel family; pre-touch cancel adapts to the library's inert-cancel
  result; break≡cancel adapts to break-awaits-settlement (the `return()`
  supersede row).
- **`outcome.browser.test.ts` (16 `it` blocks + one four-row `it.each` — 20
  runnable rows)** — transport/adapt: the six outcomes, `ok`'s consistency table
  (the `it.each` — the one row set that pins the truth table this design carries
  forward), `fail`/`reason` identity (`toBe`, by reference).
- **`entwining.browser.test.ts` (43)** — the heaviest cluster, ADAPTED under
  HR-12: `node`/`prev`/`next`/`callee` assertions re-target the non-enumerable
  accessors; `nodePathSource` rows drop (audit-refuted); `node.events[]` and
  identity rows re-target `eventsByNode`; deepest-exact-span join rows run LIVE
  through the landed join helper (`nodeAtSpan` in `embody/`, built with its
  consumer at enrichment per HR-22).
- **DROP, each with its named reason**: `replay.browser.test.ts` (9 — HR-2,
  replay stays out); `validation.test.ts` (14 — the gate arms resolved upstream:
  parse superseded to the embodiment, validation drop-as-loss with its recorded
  level-agnostic delta); `worker-protocol.test.ts` (14) and
  `create-worker-script.test.ts` (27) — the protocol surface's drop rows ("27
  string tests became 170 behavioral tests"); `event-ready.browser.test.ts` (3)
  and `timer-pause-yield.browser.test.ts` (3) — engine-tier mechanics, the timer
  proof weakened per the audit and owned by the engine's own suite.
- **NOT this suite**: `wrap-call-expressions.test.ts` (a Phase-1 seam
  transport); `link/tests/` (the shadow tree's — superseded;
  `lookup-node-path`'s cases inform the attribution-fallback rows only).
- **The deprecated port's eight suites, each with its disposition** (the port is
  a first-class second reference, HR-11/HR-14): `map-settlement` (29),
  `narrow-record-message` (25), `intercept-worker-setup` (63),
  `create-interaction-channel` (25), and `wrap-call-expressions` (29) transport
  at Phase 1 WITH their seam files, literals rewritten under HR-8 — and
  `create-interaction-channel`'s rows are the second reference for this suite's
  pending-interaction and answer-validation rows (they assert the three
  guarantees and the per-verb table in detail; "no quarry counterpart" below
  means the QUARRY, not the port). `create-intercept-stream` (42, the eighteen
  pins) does not transport as a file: its pins are disposed in § Pin
  dispositions, its structural rows ride the handle library and the copied
  guard, and its behavioral rows' successors are this suite's fresh rows.
  `index` (8) and `index.browser` (39): the refusal and envelope rows ride this
  unit's suite now; the sandbox-adjacent rows ride the chain's own increments.

New rows with no quarry counterpart: `throw(thrown)` ≡ fail + settle; the
`return()` teardown sequencing (latch → release ask → stop → settle →
resolve-after-settle); the structural drain-cancel at an unmocked ask (batch
mode); the pending-interaction guarantees ×3 (respond resumes; twice inert;
post-teardown no-op) and its per-verb answer validation; the mock-before-mint
order; the in-stream `'error'` event's order and step stamp; the offset pair's
coordinate validity; the null-key exclusions; the console-callback io
classification; `iterationCount` on halt-backed arms; the mode latch as
intercept observes it; the delivered-step GAP at a mocked dialog (strictly
increasing, not contiguous — pinned so nobody "fixes" it); stepping-to-loop
continuation (`next()` twice, then `for await` continues — no restart, no replay
— over the library's memoized iterator); the conditional fee waiver both ways
(an uncapped spec keeps the fee — pin :495's own case, retained; a capped spec's
budget rows use loose floors, never exact counts — :504). Pin constraints bind
fixtures: intercept:173 (one arrival queue, worker post order), :200/:356/:361
(coordinates from the ORIGINAL text; splice order), :250 (the engine fake
rejects async round-trips — io fixtures route around the double), :292/:309
(`return()` builds ON out-of-band + latching teardown), :337 re-scoped (batch
rows legal), :394/:443/:456 (options/defect rows), :480 (an outstanding pull
completes as the end); :118/:265/:465 were discharged structurally by the handle
library; superseded :208 is the one pin the attribution-fallback rows now
contradict — its loc-null half by the 2026-08-06 ratification, its
never-a-stack-parse half by the 2026-08-19 exception.

## Discharges

What this Phase-0 design encodes, by identifier (human ruling 2026-08-12,
HR-21). Rulings and rows resolve against the campaign's LOSS-LEDGER
(`.planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md`); the fourteen
forward-compatibility requirements resolve against the recovered digest
(`git show a8a0128d:.planning-handoffs/evaluators-api-restoration/research-digests-2026-08-05.json`,
key `.result.tracers`).

**Rulings of record encoded here:** HR-2 (no replay — one-shot streaming; the
result's `events` array is the record); HR-4 (fidelity-first; every deviation
cites its row); HR-6 (both consumption modes, creation inert — consumed through
the library and restated at the mode latch); HR-5 (the full generator surface —
`next`/`return`/`throw` plus `fail`, `code`, `options`, and the entwined echo,
with the two specified semantics where the reference's were accidental); HR-7
(the structural drain-cancel, delivered through the library's mode latch); HR-8
(reference names and event-field spellings wholesale — `event`, `method`,
`args`, `return`, `step`; `InterceptHandle`, `InterceptResult`,
`InterceptOptions`' resolved form, `IoMocks`, `IoConsole`; the six-value
outcome; the additions riding in reference style); HR-9's intercept half (mocks
answer at `serveAsk` BEFORE a pending interaction is minted; no mock → the
pending interaction; `io.console` per-method callbacks awaited; per-verb
validation of what the reference silently coerced); HR-12 (the enrichment:
offsets + `nodePath` + `calleePath` enumerable, the four accessors
non-enumerable through the facts' entwined record; `eventsByNode` +
`visitCounts` with the null-key policy decided; the result-side entwined echo;
the attribution fallback with its named input and one sanctioned exception);
HR-17/HR-18/HR-19 (refusal-as-data with the shared environment wording;
level-blind; instrumentation assumed sound — the wrap changes nothing); HR-20
(the two-value phase on the `'javascript'` arm only, run's convergence; the rows
run live against the landed E2 split); HR-21 (this section); HR-22 (the join
helper landed beside its consumer — `nodeAtSpan`, the deepest-exact-span
contract, joined live at enrichment). NOT discharged here, named for honesty:
HR-15 (sandbox cadence — the intercept chain builds and extends `sandbox.html`,
each user-observable increment firing its own 🔍).

**Ledger rows answered, by verbatim member cell** (the quarry is "reference";
`src/lib/study-lenses/evaluators-deprecated/` is "the deprecated port"):

- `InterceptHandle` name; full generator surface (`.next`/`.return`/`.throw`) —
  restored as the explicit surface above.
- the lib-`AsyncGenerator` TYPE token — superseded; the explicit alias rule,
  encoded in § The handle.
- reference `.throw` semantics — superseded: `throw(thrown)` ≡ fail + settle.
- reference `.return()` drain-through-`origNext` — superseded: the sequenced
  teardown, resolve after settle; break awaits settlement.
- `.fail(reason)` + `outcome:'fail'` + `result.reason` — restored; the reason by
  reference.
- `.code`, `.options` eager — restored, run's echo discipline.
- `.ast` promise on the handle — restored RE-DERIVED as the eager `entwined`
  echo, under TWO ruled departures (human rulings 2026-08-19, the ledger's P0-I
  bullet): the NAME departs HR-8's enumeration (run's `ast` is a real `Program`
  — one region, one spelling per thing) and the Promise wrapper retires (the
  gate guarantee); resolves-to-the-entwined-record is the row's substance, kept.
- `then`/`result`/`cancel` — the library's, consumed here.
- `InterceptOptions` name; `seconds` — the spec placement was P0-K's; the
  resolved echo and the machinery-default import land here, shared with run.
- `io` dialog mocks — restored: mock-before-mint at `serveAsk`.
- `io.console` / `IoConsole` per-method callbacks — restored: awaited before the
  program continues; a throwing callback classifies as the io arm (the
  reference's `InternalError` disguise superseded, citing run's `'io'` supersede
  argument). Two ruled departures ride the same surface (2026-08-19): the
  reference's native-console forwarding for unmocked methods does NOT return
  (record-only, the supersede's strength in the ledger bullet), and the event's
  `method` is an open string over a whole-surface trap (HR-18's ground) while
  the MOCK keys keep the reference's closed nineteen.
- `iterations` `Infinity`/omitted = skip injection — dropped (signed); as run's
  always-splice row.
- `InterceptResult` name; `events` array on the result — restored: the
  await-without-pulling regression dies; replay identity NOT restored (HR-2).
- `outcome` 6-value incl. `fail`; `ok` — restored; `ok` true on
  `'complete' | 'cancel' | 'fail'`.
- `reason?: unknown` — restored, rides the fail arm.
- `code` / `options` echoes — restored on the result.
- `ast` record on the result — restored RE-DERIVED: the result-side `entwined`
  echo (the real graph, never a shadow tree).
- `visitCounts` — restored, keyed by resolved `nodePath`, null keys excluded
  (the decided policy).
- `eventsByNode` — the ADDITION, replacing `node.events[]` back-refs.
- `nodePath` per event — restored, enumerable plain data.
- offset pair on events — the ADDITION; the direct `byOffset` join.
- `node` live reference; `prev` / `next` timeline links; `callee` / `calleePath`
  — restored as the accessor mechanism (the `node`/`callee` extension of the
  reference's newer precedent is defended at the region root; the accessor types
  land in this unit's types.ts).
- `node.events[]` back-refs — superseded by `eventsByNode`.
- `nodePathSource` 3-state provenance — dropped (audit-refuted); `loc`'s
  nullability is the one degraded state.
- `loc === node.loc` identity — dropped (signed); `loc` is a fresh per-event
  span.
- `'enclosing-fallback'` (stack → deepest enclosing node) — restored, with the
  input named (human ruling 2026-08-19): the wrap's recorded innermost live call
  site where one exists, and the campaign's ONE sanctioned stack-parse position
  for the no-live-frame residual, joined AST-side via `entwined.byOffset` at the
  enrichment increment; supersedes pin intercept:208.
- link/ shadow AST tree (456 lines) — superseded; the facts' entwined record is
  the one graph.
- streamed `ErrorEvent` (errors as step-stamped events IN the stream) —
  restored; the settlement keeps the structured form.
- `phase` on error events — dropped (signed).
- `ValidationResultError` + violations — drop-as-loss with its recorded
  behavioral delta; intercept's suite drops the quarry's validation rows.
- `ExecuteMessage.scriptMode` (sloppy/`with`) — superseded; the kind's strict
  collapse, stated at the axis.
- `createWorkerScript(): string` — dropped (signed); the importable-module
  successor is the port's own precedent.
- error `line` on a learner throw — RESTORED ON INTERCEPT (its escalated row):
  the stop record's wrap-style `loc` — the attributed call site, richer than the
  reference's line — with the one sanctioned stack-parse exception for the
  no-live-frame residual; run's half stays deferred.
- `TimeoutResultError.limit` (+ `durationMs`) — `limit` is intercept's OWN
  reference restore (the quarry's intercept timeout arm declares it);
  `durationMs` is the transferred run-row addition. The reference's `line?` and
  `phase` on the timeout and iteration-limit arms do not return — named drops:
  run's phase convergence covers phase, and engine-made stops have no honest
  position source.
- `IterationLimitResultError.limit` — dropped ON INTERCEPT TOO, its own cell
  (the quarry's intercept arm declares it; the ledger's drop row sits in the run
  table): the caller holds its own copy and the trip record is strictly richer —
  run's signed rationale, applied to intercept's own declaration. The quarry
  javascript arm's `column?` is subsumed by the richer wrap-style `loc` (a span
  carries both ends), named so the omission is never read as silent.
- clean-arm `iterationCount` — as run's: required exactly where a halt carries
  it.
- REFERENCE run sandbox / DEPRECATED-PORT sandboxes / sandbox cadence (HR-15's
  rows) — the intercept chain's, at its own increments; the deprecated page's
  five C2 checkpoint items and the full-data serializer are the inventory the
  rebuild carries (named, not built here).

**Pin dispositions encoded**: intercept:173, :200, :250, :292, :309, :337
(re-scoped), :356, :361, :394, :443, :456, :480, :495, :504 — each named at its
binding site in § The seam and § The suite; intercept:118, :265, and :465 were
discharged structurally by the handle library; superseded :208 is contradicted
twice, each half ruled — its loc-null half by the 2026-08-06 ratification (the
fallback restored), its never-a-stack-parse half by the 2026-08-19 exception
(the fallback's no-live-frame input).

**Forward-compatibility requirements engaged here:** 4's full discharge (the
widened consumer stop — `fail` closes the library's latch through the controls
builder with its reason recorded source-side, exactly the constraint the
library's README assigns this unit), 6 (delivered events richer than wire
messages — the enrichment step is this unit's), 7's remainder (the chain and
index shapes: `eventsByNode`, `visitCounts`, the offset join — the
entwined-resolution legality landed at the root), 8 (the non-pinning claimed
directly: nothing in this contract pins one moment per yield, and payloads may
be iterables or promises), 11 (the respond posture's real exercise, beside run's
call-channel posture), 14 (worker-authored `step`, never renumbered). The
remainder were discharged at the region root, the handle library, and P0-R.

## Sandbox

The intercept chain builds and extends `sandbox.html` (the deprecated page's
five checkpoint flows — console event with loc, prompt card
suspend/answer/record, confirm-cancel `return: false`, unanswered card plus
cancel with the stale answer inert, loop-cap with the loop's span — plus io-mock
toggles and the full-data serializer):

```bash
npx vite --config src/lib/study-lenses/evaluators/intercept/vite.sandbox.config.ts
```

## Tests

```bash
node ./node_modules/vitest/vitest.mjs run --project unit \
	src/lib/study-lenses/evaluators/intercept/tests/

node ./node_modules/vitest/vitest.mjs run --project browser \
	src/lib/study-lenses/evaluators/intercept/tests/
```

## Navigation

- The region root: [`../README.md`](../README.md) — the kind contract;
  [`../types.ts`](../types.ts) — `Evaluator`, `EvaluationSpec`, `Execution`,
  `EvaluationOutcome`, `ErrorPhase`, `MachineryDefectKind`,
  `PendingInteraction`; [`../notional-machine.md`](../notional-machine.md) — the
  consumption surface this unit's twin opens.
- The machine twin: [`notional-machine.md`](./notional-machine.md) — intercept's
  fill of the region NM's black box.
- Architecture and decisions: [`DOCS.md`](./DOCS.md).
- The handle library:
  [`../lib/execution-handle/README.md`](../lib/execution-handle/README.md).
- The environment refusal:
  [`../lib/environment-refusal/README.md`](../lib/environment-refusal/README.md).
- The iteration guard:
  [`../lib/iteration-guard/README.md`](../lib/iteration-guard/README.md).
- The machinery: [`../../lib/engine/README.md`](../../lib/engine/README.md).
- The facts and the entwined record:
  [`../../embody/types.ts`](../../embody/types.ts) — `Facts`, `Entwined`,
  `EntwinedNode`, `NodePath` (the greenfield region; the quarry's same-named
  file is a superseded two-file citation hazard).
- The sibling evaluator: [`../run/README.md`](../run/README.md) — the
  result-only fill; the shared discipline rows cite each other.
- The reference (read-only quarry): `src/lib/embody/lib/evaluating/intercept/`.
- The deprecated port (frozen second reference):
  `../../evaluators-deprecated/intercept/`.
