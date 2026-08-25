<!-- cspell:ignore backpressure empts widenable -->

# execution-handle

The library the evaluators build handles on. The kind contract
([`../../README.md`](../../README.md)) promises every consumer the same
consumption laws — inert creation, the closed-touch ignition, a memoized
always-fulfilling result, idempotent out-of-band cancel, the teardown latch,
one-shot streaming — and this library is where those laws are BUILT, once, so an
evaluator obeys them structurally rather than by re-implementation. The
deprecated region's evaluators each hand-rolled this discipline and the settled
expectations that pinned it travel here (see § The laws, each with its pin).
Restored from the reference's `createExecution`
(`src/lib/embody/lib/evaluating/shared/create-execution.ts`, the read-only
quarry) minus its replay cache (human ruling 2026-08-05, HR-2) and minus its
creation-time auto-start (human ruling 2026-08-06, HR-6).

## What lives here

```text
execution-handle/
├── types.ts              the source seam: what an evaluator supplies
├── create-execution.ts   the one factory (human ruling 2026-08-18) —
│                         createExecution(source, buildExtras?) returns
│                         Execution<TEvent, TResult> & TExtras for a source
│                         with events, ExecutionBase<TResult> & TExtras for
│                         one without (two overloads × optional extras)
└── tests/                the behavioral suite (quarry transport map below)
```

The directory answers the region README's "execution-handle library" line by
name; the quarry called its area `shared/`, a name this region's vocabulary has
no use for. One factory, one discipline: the same latch, settle, and teardown
core serves both handle shapes, so nothing is implemented twice and no private
channel between factories exists. The widened return type is the point — an
evaluator's `main` returns its NAMED handle with no cast and no erasure ceremony
(forward-compat requirement 1); where a named handle's member types are narrower
than an extras literal infers, the evaluator passes the type argument
explicitly.

## The source seam

An evaluator supplies a **source** — the library's one input, entered lazily:

- **`start(mode)`** — invoked by the library AT MOST ONCE, at the first
  consumption touch, with the engaged consumption mode. Everything the evaluator
  assembles to run a program — engine spec projection, worker spawn, stream
  claim — lives inside it. **The start latch closes BEFORE `start` is invoked**,
  so a source that throws is never re-entered — the historical restart defect
  was a guard keyed on successful assignment (pins run:300, intercept:465; the
  deprecated region's H-7 ruling — not HR-7 — recorded in the ledger's § Pin
  dispositions authority cells), and latch-on-entry is what makes it
  unrepeatable.
- **`stop()`** — the out-of-band teardown, the library's word to the source (the
  consumer's word is `cancel`, on the handle). Called AT MOST ONCE, and only on
  the cancel/teardown route — a natural end never calls it (the quarry's
  `cancelFunction` had the same call-at-most-once cardinality). **A cancel AFTER
  settlement is inert on the source** — `stop()` is not called; source cleanup
  rides the source's own settle path. A named deviation from the quarry, which
  still invoked its `cancelFunction` after a natural end (its worker backends
  made that an idempotent terminate); here the settle route owns release. An
  inert cancel — before any touch — does not call `stop()` either: nothing
  started, so there is nothing to stop. Never routed through a generator's
  `.return()` and never queued behind a pending pull (pins run:140,
  intercept:292 — the quarry's own `cancel()` did `generator.return()`, which
  deadlocks a suspended ask against the machinery's teardown design;
  superseded).
- **`result`** — the source's promise of the settled result, for every STARTED
  route, authored under the evaluator's own vocabulary (each evaluator owns its
  settlement mapping). **The library's memoized settle IS this promise** (routed
  through the source-defect fallback on rejection) — see § Consumption modes for
  what that buys. Named for the reference's spelling per HR-8 — the deprecated
  region's `settled` companion retires with that region and does not return
  here.
- **`events`** (streaming sources only) — the pull seam the library's drainer
  and iterator consume — an ASYNC ITERATOR (an async generator satisfies it):
  the library never asks the source for a second iterator, so one-shot-ness is
  by construction. The consumer side mirrors it — **the handle is
  self-iterating**: `[Symbol.asyncIterator]()` answers ONE memoized iterator for
  the handle's life, the async-generator convention (human ruling 2026-08-19, at
  P0-I's design review), so a second call can never split the stream, and a
  widening's own stepping member can alias the same iterator a later `for await`
  continues. A source that settles `result` SHOULD end its `events`; the library
  does not require it — on a settle it stops pulling and ATTEMPTS disposal
  itself, once, never awaited (§ The laws — settle ends consumption). `types.ts`
  declares TWO NAMED source types — the streaming source, with `events`
  REQUIRED, and the result-only source, which declares `events?: never` — and
  the factory's overloads discriminate on them, streaming declared first, so the
  discrimination survives non-literal call sites (under this repo's
  `exactOptionalPropertyTypes`, an author writing `events: undefined` must not
  slip between the overloads, and `never` bars it even off-literal).

**Every route fulfills.** The library never rejects a result, and it makes that
true structurally:

- A throw or rejection from ANY source member — `start` throws, `events` rejects
  mid-pull, `stop` throws, `result` rejects — routes to the **source-defect
  result**, an evaluator-supplied fallback shaped as that evaluator's
  machinery-defect record (the kind pins only the `'defect'` discriminant).
  Where the quarry rejected (its generator-throws test), this library settles.
- A cancel BEFORE any touch settles with the **inert-cancel result** — nothing
  started, nothing spawned (the quarry resolved `undefined` here; under
  result-as-data the evaluator shapes a real cancel-outcome result). **The
  teardown latch pre-empts the start latch**: a touch after an inert cancel is
  served from that settle and never opens the start latch (pins run:154,
  intercept:265 — and the quarry had a latent crash on exactly this route: its
  replay iterator dereferenced the `null` result).
- **Liveness stays a source obligation, stated:** the library provides no
  watchdog — a source whose `result` never settles hangs the settle channel, and
  the kind's "an unanswered interaction never hangs the settle channel" promise
  is kept by each evaluator's posture and the machinery's budget, not by this
  library. A source author owes a settle on every started route; the region's
  sources get this from the engine's budget and their own ask postures. And one
  hang is the CONSUMER's, sanctioned by the kind: an iterate ignition whose
  iterator is then abandoned holds the run — a well-behaved source still never
  settles until break or cancel, because ceasing to pull is not a stop. The same
  clause covers `events` release: a source suspended at its own unanswered pull
  holds its `finally` hostage — disposal is offered, never forced, and the
  release is the source's own obligation.

Why not the quarry's bare `(generatorFunction, cancelFunction)` seam: the
teardown pins above forbid stop-through-the-generator; the machinery's
claim-before-result ordering needs start-time sequencing a generator shape
hides; and the seam must carry richer producers than one generator — the tracers
ride this library too (HR-3's handle ruling; the fourteen tracer forward-compat
requirements bind the seam per HR-10).

## Widening — the library installs the eager echoes

An evaluator's handle carries eager fields (`code`, `options`, its derivation
echo) and controls of its own, and **the library installs them** (human ruling
2026-08-18, this unit's design review): the factory's second parameter is a
BUILDER over library-supplied controls —
`createExecution(source, (controls) => extras)`, where `controls` is
`{ cancel }` — and the factory returns the handle with the extras installed,
correct descriptors and all, frozen LAST. `TExtras` is inferred from the
builder's return.

That placement is load-bearing, not convenience. Ignition-on-`.result`- access
requires `result` to be a GETTER that fires the start latch (the engine's own
handle is the precedent), so the idiomatic spread — `{ ...handle, code, ast }` —
would READ that getter while copying and start the run at creation, silently
destroying creation-inert; and spread copies own ENUMERABLE keys only, so the
copy would also drop the non-enumerable iterator — typed `AsyncIterable`, not
one at runtime. The library therefore owns property installation (getter
`result`, non-enumerable iterator, freeze last — the construction half of the
ledger's run-handle freeze row, whose discharge stays P0-R's), and no evaluator
ever composes around a live handle.

**Extras keys are disjoint from a FIXED four-key list on BOTH overloads** —
`result`, `cancel`, `then`, `Symbol.asyncIterator` — result-only handles
included (a `Symbol.asyncIterator` extra would make a result-only handle TYPE as
streaming while nothing drives it). The constraint is STRUCTURAL and binds the
builder's literal key set — an index-signature return evades the check and is
banned by rule, not by the compiler — so a colliding extra (an eager
`result`-adjacent field, a shadowing `cancel`) is a compile error, never a
silent overwrite of the two laws this library exists to build. A compile-time
probe in the tests pins the rejection, on both arms. And the builder is the
caller's code at the construction boundary: a builder that throws does so
synchronously out of `createExecution`, before any handle exists — a caller bug,
not a source-defect settle. A builder that synchronously calls
`controls.cancel()` instead closes the teardown latch before any touch: the
factory still returns the handle, already settled with the inert-cancel result —
legal, and stated so nobody discovers it.

The builder is also how a widened consumer stop stays representable
(forward-compat requirement 4's constraint; its full discharge is P0-I's): a
`fail(reason)` extra records the reason in the evaluator's own closure — shared
with the source it built — and calls `controls.cancel()`, closing the library's
teardown latch with no live handle in sight; the source's settlement mapping
reads the recorded reason and speaks `'fail'`.

## Consumption modes, and the drainer

The library implements the kind's closed touch list — three touches on a
streaming handle (first pull; `await`/`.then`; `.result` access), two on a
result-only one — and ONE INTERNAL DRAINER (human ruling 2026-08-18) serves the
batch path: when a batch touch is the IGNITION touch, `await handle`,
`handle.then(…)`, and `handle.result` all engage the same internal loop. **The
memoized settle is the source's `result` promise**; the drainer exists to
relieve backpressure — it pulls `events` so a pull-driven source can progress
when no consumer is pulling, discarding delivered items (the result's own record
is the evaluator's business) — and it exits on events-exhaustion OR on the
settle, whichever comes first. That ordering is what makes a mid-drain
source-side stop free to specify: a source that cancels at an unanswered ask
(intercept's ruled posture) settles `result`, and the drainer stands down with
no further pulls owed — the settle channel cannot hang on the drainer's account.
Iteration is the consumer-driven path to the same settle. A result-only source
has no drainer at all — batch is start plus the source's `result`.

**The mode latch** (human ruling 2026-08-18). The ignition touch fixes the
consumption mode for the handle's life, and the source learns the engaged mode
at `start(mode)` — the literals are `'iterate' | 'batch'`, and a result-only
source is always told `'batch'`:

- iterate first → later batch touches SUBSCRIBE to the memoized settle (they
  never spin up the drainer; the consumer's pulls drive the run — an abandoned
  iterator still holds it, and `await` after the loop resolves the result, both
  as the kind promises).
- batch first → the drainer consumes the stream; a later iterator is ALREADY
  ENDED (zero events — an extension of the one-shot law: one-shot governs a
  settled handle, and this arm also ends an iterator created before settlement;
  the result's `events` array is the record either way).

**Holding `.result` before iterating is therefore a stream-voiding touch.** The
engine's own docs offer the opposite affordance (an early `result` plus a later
iterator keeps full backpressure there) — this library diverges deliberately:
the engine defers its claim and documents the mixed case as "one stream,
silently split"; this library fixes the mode at ignition and buys determinism.
Take the iterator first, then `await`.

**Mixing is answered here, once.** The kind leaves one-handle-both-modes to each
evaluator; every evaluator built on this library inherits THIS answer — the mode
latch above — and restates it as its own in its unit docs.

**Ask posture stays the source's.** What an ask encountered mid-drain does is
NOT the library's: the source read the engaged mode at start and takes its own
declared posture (the region NM's deliberate non-statement lands here: drain
MECHANICS are this library's, drain ASK POLICY is each evaluator's — intercept's
ruled drain-cancel stays intercept's, P0-I's).

**Break awaits settlement** — the stated behavior change the ledger records: the
library's iterator `.return()` runs the full teardown sequence and resolves only
after the settle — not after disposal, which is never awaited; a disposal
rejection is swallowed, never routed to the already-fixed settle — where the
quarry resolved instantly with `undefined`.

## The laws

What the library enforces, each traceable to the kind contract and the pins that
kept it true in the deprecated region:

- **Inert creation** — constructing a handle calls nothing on the source (pins
  run:103, intercept:118; the quarry's `queueMicrotask` auto-start is
  superseded, HR-6). Installing extras never touches the `result` getter — a NEW
  test row pins it.
- **Closed-touch ignition** — the start latch opens on the first touch, once,
  ever; closed before `start` runs.
- **Memoized settle** — one result promise (the source's, defect-routed), every
  touch reaches it, it fulfills on every path, exactly once.
- **Idempotent out-of-band cancel** — callable before, during, after; never
  queued behind a pull; teardown latches (pins run:154, intercept:265,
  intercept:309) and pre-empts the start latch.
- **One-shot** — a settled streaming handle does not replay; the result's events
  array is the record (HR-2; the quarry's replay iterator and `.result.logs`
  cache do not cross).
- **Settle ends consumption — a guarantee and a best effort.** GUARANTEED,
  library-side, unconditional: on the settle, whatever the mode, the library
  stops pulling `events` and ends any live consumer iterator; later pulls are
  inert, exactly as the teardown latch already promises — the drainer stands
  down and the live loop ends on the same rule. BEST-EFFORT, source-side: the
  library ATTEMPTS disposal of the source's iterator, once
  (`events.return?.()`), never awaited by the settle, errors swallowed — a
  generator source's `finally` runs only when the source is not suspended on its
  own pending pull, because the out-of-band teardown pins name exactly that
  suspension as the deadlock route (pins run:140, intercept:292). Disposal is
  offered, never relied on; a suspended source's cleanup is its own liveness
  obligation, the same clause as `result`.

## Quarry test transport map

The spec for this unit's behavioral suite is the quarry's 21-test
`shared/tests/create-execution.test.ts`, mapped test-by-test. The ledger's
`createExecution`'s test suite row estimated "~16 of 21 … 3 drop … ~2 adapt";
the enumeration lands **13 rows transport (assertion-level) · 3 drop · 5
adapt**, and the deltas from the estimate are themselves named here:

- **13 rows transport, assertion-level** (fixtures re-authored against the
  source seam — every quarry test constructs `(generatorFunction, cancelFn)`, so
  what transports is each ASSERTION, not the test text): batch consumption ×3,
  step-through ×3, PromiseLike ×2, `.result` is-a-Promise, `.result` resolves
  without iteration (lands under the internal drainer), cancel idempotence,
  cancel-before-iteration prevents execution, immediate-return generator.
- **3 dropped**: the `replay` describe block — HR-2, replay stays out.
- **5 adaptations, each a named delta**: _cancel before iteration resolves
  `.result` to `undefined`_ → resolves the **inert-cancel result**; _generator
  that throws rejects `.result`_ → settles the **source-defect result** (never
  rejects); _break in for-await_ keeps its no-hang assertion and adapts its
  resolved value (the source's cancel-route result, and break now awaits
  settlement); _`.result` accessed during live iteration_ → under the mode latch
  `.result` is a batch touch, so the quarry's ordering (result first, then
  iterate, both observed) cannot transport — the adapted rows assert batch-first
  (result resolves; a later iterator is ended) and iterate-first-then- `.result`
  (both observed), covering the intent without the reference's microtask race;
  _cancelFn is called on cancel_ → the quarry's fixture cancelled a
  NEVER-STARTED execution, a route where this library calls nothing — the
  assertion (`stop` called once) re-targets to a cancel after ignition, and the
  never-started route is pinned separately as inert.
- **NEW rows the quarry never had**: creation-inert per touch; extras
  installation does not ignite; out-of-band teardown (cancel never queues behind
  a pending pull); teardown pre-empts start (post-inert-cancel touch never
  starts); latch-before-start (a throwing source is never re-entered); the mode
  latch both ways (after-batch iterator ended; iterate-first batch touches
  subscribe); the source learns the engaged mode at start; the drainer stands
  down on a mid-drain settle; cancel never queues behind a PENDING pull (a
  source suspended mid-pull still settles); each source member's defect route
  (start throws, events rejects mid-pull, stop throws, result rejects); a
  mid-ITERATION settle ends the live consumer iterator (later pulls inert); the
  source's iterator is disposed on any settle-first exit (a generator source's
  `finally` runs); cancel after settlement is inert on the source (`stop()`
  uncalled); the extras collision is rejected (compile-time probe); the builder
  edges (synchronous cancel yields a settled handle; a throwing builder throws
  at construction; extras land); the result-only base handle's laws (two-touch
  ignition, settle, cancel).

## Glossary — unit terms

The region glossary owns handle, streaming handle, consumption, settling,
machinery defect, cancel; these entries add what this unit owns.

- **source** — what an evaluator supplies: `start`, `stop`, `result`, and
  (streaming) `events`.
- **`start(mode)`** — the source's once-only entry, told which consumption mode
  engaged (`'iterate' | 'batch'`).
- **`stop()`** — the library's teardown word to the source; at most once, on a
  post-ignition cancel only (inert and post-settlement cancels call nothing).
  The consumer's word stays `cancel`, on the handle.
- **`result` (source member)** — the source's always-fulfilling promise of the
  settled result for started routes; the library's memoized settle is this
  promise, defect-routed. Deliberately the reference's spelling; the retired
  `settled` companion does not return.
- **`events`** — the streaming source's pull seam; its absence makes the handle
  result-only.
- **consumption mode** — which of the two consumption paths ignited: `'iterate'`
  (consumer-pulled) or `'batch'` (drainer-pulled). Fixed at ignition; exposed to
  the source at `start`.
- **ask posture** — what a source does with an ask given the engaged mode;
  always the evaluator's declared policy, never the library's.
- **the drainer** — the library's one internal batch loop: pull to relieve
  backpressure, discard, exit on exhaustion or settle. Engaged by a batch
  IGNITION; never by iteration, and never by a batch touch after an iterate
  ignition.
- **controls** — what the extras builder receives: `{ cancel }`, the library's
  own teardown door, so a widening can close the latch without a live handle.
- **start latch** — the once-only gate between inert and running; closed before
  `start` is invoked.
- **teardown latch** — the settled/torn state that makes every later pull inert;
  pre-empts the start latch.
- **one-shot** — no second live iteration of a settled handle; the region law
  this library enforces mechanically.
- **inert-cancel result** — the evaluator-shaped result for a cancel that
  preceded ignition.
- **source-defect result** — the evaluator-shaped result for a source that
  broke, on any member; fulfills where the quarry rejected.

## Discharges

What this Phase-0 design encodes, by identifier (HR-21). Rulings and rows
resolve against the campaign's LOSS-LEDGER
(`.planning-handoffs/evaluators-api-restoration/LOSS-LEDGER.md`).

**Rulings of record encoded here:** HR-2 (replay out — the one-shot law and the
3 dropped tests); HR-3 (the handle restored — this library constructs the
shape); HR-4 (fidelity-first — the quarry's createExecution is the reference;
every deviation is a named row here); HR-6 (creation inert, the closed-touch
ignition, both consumption modes); HR-8 (reference names wholesale:
`createExecution`, `Execution`, `result`, `cancel` — and the retired `settled`
spelling kept retired); HR-10's design constraint (the seam is designed against
the fourteen tracer forward-compat requirements). The drainer's home, the
settle-is-source-`result` rule, the mode latch, library-installed widening, the
single factory, and the post-settlement/inert-cancel `stop()` deviations are
settled by the 2026-08-18 P0-E rulings (this unit's design-review rounds),
recorded as a dated bullet in the ledger's § Rulings of record — HR-6 rules the
modes and the inertness, not the drainer's home; the `stop()` deviations are
HR-4 exceptions carrying their strength argument in that bullet. NOT discharged
here, named for honesty: HR-5 and HR-7 (intercept's generator surface and
drain-cancel posture — P0-I's; this library only tells the source which mode
engaged and stands its drainer down on the settle), HR-9 (io seams — P0-R's and
P0-I's), HR-12 (enrichment — P0-I's).

**Ledger rows answered, by verbatim member cell:** `Execution<TEvent,TResult>`
(AsyncIterable & PromiseLike & {result, cancel}); `ExecutionBase<TResult>`
(PromiseLike & {result, cancel} — the settle base beneath Execution); `.then` /
`await handle` batch mode; `.result` memoized, always-settles; `.cancel()`
named, idempotent; creation-time auto-start (queueMicrotask drain) — superseded,
encoded as the start latch; replay / re-iteration (`===`-identity re-yield,
`.result.logs` cache) — superseded, encoded as one-shot; `createExecution`'s
test suite — the transport map above, with its enumerated correction of the
row's estimated counts.

**Forward-compatibility requirements discharged:** 1 (the widened return type
`… & TExtras` keeps `main`'s return a named, unsealed extension — discharged
where the builder's members are authored at the named handle's declared
parameter types; where they are narrower, the call supplies the type arguments
explicitly), 2 (eager fields legal at creation — extras land before any touch
and never ignite), 13 (result-only handles are first-class — an events-less
source yields `ExecutionBase`). Requirement 4 (a structured consumer stop stays
representable in a widening): its constraint on this library — a widened `fail`
must be able to close the teardown latch with its own reason — is met by the
controls builder (§ Widening); the full discharge is P0-I's.

## Navigation

- The region root: [`../../README.md`](../../README.md) — the kind contract this
  library serves; [`../../types.ts`](../../types.ts) — `Execution` and
  `ExecutionBase`, the shapes constructed here;
  [`../../notional-machine.md`](../../notional-machine.md) — the machine a
  consumer predicts against.
- Container: [`../README.md`](../README.md).
- The reference (read-only quarry):
  `src/lib/embody/lib/evaluating/shared/create-execution.ts` and its tests.
- The deprecated region's pins this design carries:
  `../../../evaluators-deprecated/{run,intercept}/tests/create-*-stream.test.ts`.
- Architecture and decisions: `DOCS.md` (written at this unit's 0.3).
