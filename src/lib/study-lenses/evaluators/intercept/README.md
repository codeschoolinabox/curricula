# intercept

The **boundary evaluator** — run plus the program's own I/O as events. intercept
executes the studied program in the engine's sandboxed worker and streams what
the program says to its host and what it asks of its user: `console` calls as
records, and each of the three dialogs as a **pending interaction** that
suspends the run until the consumer answers it. Where run answers "does this
program end, and how?", intercept answers the next question a learner asks:
**what did my program say, and what did it want?**

## Where this sits

An engine-backed evaluator under [`evaluators/`](../README.md), exporting a
single `Evaluator` object — name, applicability, main — over the kind's
evaluation spec. The kind's [README](../README.md) owns the caller protocol
(applicability first, then main; laziness and cancellation belong to the
consumer); this document owns what intercept adds to it.

intercept drives the package's shared [engine](../../lib/engine/README.md) — the
generic sandboxed streaming evaluator — as leaf machinery, and consumes the
region's shared [iteration-guard](../lib/iteration-guard/README.md) for the
runaway-loop discipline. It is the first evaluator to emit anything at all, and
the first to emit the kind's distinguished **pending interaction**, so it is
where three kind obligations are proved for the first time: an event union over
the open envelope, a suspended run, and a resume path that rides the event
rather than the iterator.

## Ubiquitous language

Defers to the committed glossaries it builds on: the kind's (evaluation spec,
evaluation event stream, event, pending interaction, settlement, refusal,
execution axis, gate-guaranteed — [`../README.md`](../README.md)),
iteration-guard's (cap, per-entry counter, iteration count, trip, marker,
classification, guard call, loc string —
[`../lib/iteration-guard/README.md`](../lib/iteration-guard/README.md)), and the
engine's (spec, worker factory, worker entry, worker logic, thread logic, emit,
call, item, drop, drain, halt, serializeHalt, termination cause, settlement,
pause protocol, time budget —
[`../../lib/engine/README.md`](../../lib/engine/README.md)).

**Shared in waiting, re-expressed here.** The region rule keeps evaluators
self-contained, so intercept cannot import from a sibling: **assemble**,
**guarded source**, **halt payload**, **map-settlement**, **richer error**,
**reason**, **defect cause**, **refusal**, and the **engine seam** are shapes
the sibling [`run`](../run/README.md) pinned first and intercept re-expresses in
its own module. Their meanings are that document's; the deltas intercept adds
are named below. Promotion into `evaluators/lib/` is designed against both
evaluators at close-out, never mid-sprint.

This module owns:

- **boundary moment** — one moment where the program speaks to or asks its host:
  a `console` call, or a dialog call. A console moment surfaces as one event; a
  dialog moment surfaces as two, its pending interaction and then its record.
  (The kind's own word for one streamed moment is **event**; this term names the
  moment in the PROGRAM that produces one or two of them.)
- **step** — an event's ordinal on the stream, numbered from 1 worker-side in
  emission order. Every event has its own; a dialog's two events therefore
  differ by one, and it is their **adjacency** that pairs them, not a shared
  number: a dialog's record is the very next event after its pending
  interaction, or the run ended before it was answered. Adjacency is guaranteed
  rather than conventional — the worker thread is genuinely blocked for a
  dialog's whole span, so nothing can be emitted between the two.
- **console record** — the event for a `console.<method>(…)` call: the method as
  an open string, the call's clone-safe arguments, its `loc`, and its `step`.
  Emitted and nothing more — a console call makes no round-trip and returns
  `undefined` to the program, exactly as the platform's does.
- **interaction request** — what a dialog asked, in intercept's own vocabulary:
  which dialog, the **message** the program passed, and `prompt`'s default value
  when it passed one. The message is the _decoded_ fact — what a dialog would
  show, the first argument as the platform would render it — while a record's
  `args` are the _raw_ fact, what was actually called with. The two are
  different questions, which is why both exist and only `console` carries an
  unbounded argument list.
- **ask message** — the request's clone-safe wire envelope, which is what
  actually crosses: the request, plus the `loc` and `step` the pending
  interaction will wear. The `loc` and the `step` ride the envelope rather than
  the request, so a consumer reads them off the event beside `request` — the
  same place every other event carries them.
- **pending interaction** — the kind's distinguished event, carrying the
  interaction request and its **answer channel**. It is authored thread-side and
  never crosses the wire, because its answer channel is a live main-thread
  function. While it is unanswered the run is **suspended**: the program is
  blocked inside its dialog call, and the engine's time budget is not counting.
- **answer channel** — the pending interaction's `respond`. Answering it
  releases the suspended program and resumes the run. The answer is validated
  for that request's kind at this boundary; answering twice is inert; answering
  after teardown is inert.
- **dialog record** — the event a dialog emits AFTER its answer, carrying what
  the program received: `confirm`'s boolean, `prompt`'s string or null, and
  `alert`'s `undefined`. Every dialog record carries a return value, `alert`'s
  included: these traps model the browser's own dialogs, and the fact that
  `alert` hands back `undefined` is part of what is being modelled, not an
  absence to be inferred.
- **loc wrap** — the pure, line-preserving rewrite that makes a boundary moment
  point at the learner's own source: every call expression is wrapped in a call
  to the `__$lc` helper, so the worker knows which call site is executing. It is
  what gives every record and every dialog its `loc`, and it stamps a
  propagating throw so the halt can carry one too. It observes nothing else. The
  name is the region's, not a new one — iteration-guard's README already
  reserves "the call-expression loc wrap (`__$lc`)" to intercept by that name,
  and loop-guard pins the `__$` prefix as the collision guard the wrap must
  respect.
- **loc** — a call site's own source span, in iteration-guard's and loop-guard's
  committed shape (1-based lines, 0-based columns). One word for one concept
  across the region: a trip's `loc` is its loop's span, a record's `loc` is its
  call's. `null` when a throw fired outside any wrap — every `console` and
  dialog call IS a call expression, so a record's `loc` is `null` only in the
  defensive case a correct instrumentation cannot produce.
- **current loc** — the wrap's worker-side stack of the call sites currently
  executing, whose top is what a record or a throw is stamped with. It is
  intercept's declared mutable-state exception: closed over, per-run disposable,
  and written only by the wrap's enter and exit. The encoded span is pushed as
  given and decoded only when a record or a halt actually needs it, so a decode
  never rides the per-call hot path.
- **clone-safe arguments** — a call's arguments as they cross the worker
  boundary: an argument that survives a structured clone rides as itself, and
  one that cannot (a function, a symbol) rides as its string form, so a boundary
  moment never crashes a run.
- **demand-driven pull** — the discipline that makes the program's pause the
  consumer's to release. intercept asks the engine for the next thing only when
  its own consumer is waiting for one, so a record's emit-pause holds the
  program until the consumer takes it, and the run advances at the pace the
  consumer reads.

## What a consumer can predict

The glossary and § Design commitments carry the mechanics. These are the four
facts a consuming lens must be able to predict that no other section states, and
that a reasonable reading of the kind alone would get wrong:

1. **A dialog's record is the very next event after its pending interaction** —
   guaranteed by the blocked worker, not by convention — **or the run ended
   before it was answered.** That adjacency is the only pairing there is.
2. **A dialog record does not describe itself.** It carries what the program
   received, not what was asked; the question lives on the pending interaction
   that preceded it. A lens rendering a completed dialog needs both.
3. **No wall clock and no crash ends a suspended run.** The budget stops
   counting the moment a dialog asks, and the machinery is blocked behind it, so
   a worker-side failure is not even observable until the interaction is
   released. The run is unbounded, and its only exit is the consumer's — that is
   an accepted cost of holding the program, not an oversight.
4. **A densely emitting program ends on the engine's per-yield charge, not on
   real time.** A run emitting on the order of a thousand records will settle
   `reason: 'timeout'` having used almost no runtime. The records already
   delivered stand, and the cap that keeps a runaway loop safe is `iterations`.

## Owns vs. excludes

### Owns

- **Instrumentation, in one fixed order**: iteration guards spliced FIRST on the
  ORIGINAL source, then the loc wrap — which never wraps the guard protocol's
  own calls. Both passes are pure and line-preserving.
- **Assemble**: reading the spec's gate-guaranteed source — narrowed once at the
  read site, its unreachable failure arm a loud dev-mode defect settling on the
  `'defect'` arm — instrumenting it, and passing `iterations` through UNCHANGED.
  As in the sibling: no clamping, no defaulting, no finiteness gate, and NO
  default cap.
- **Its worker setup**: the trapped `console` and the three dialogs, the
  iteration-guard helpers, and the loc-wrap helper are the injected globals. Its
  **halt authoring**: classification via the guard's verbs, the throw's stamped
  `loc`, the run total on every halt, non-Error throws in the machine's words.
- **The interaction channel**: turning a blocked dialog call into a pending
  interaction, validating its answer, and releasing it exactly once.
- **The event stream** — one ordered sequence carrying records and pending
  interactions in the program's own order — its demand-driven pull discipline,
  and its teardown discipline.
- **Map-settlement and the richer error**, including the defensive arm.
- **The refusal** when the environment cannot host a run.

### Excludes

- **Answering interactions.** intercept never supplies an answer and has no
  default for one: every dialog suspends, and only the consumer resolves it.
  There is no mock surface, no handler registry, and no inert fallback. A real
  window that answers its own dialogs is [danger](../danger/README.md)'s.
- **Rendering** — dialog cards, output channels, pairing a card with its record,
  per-audience wording: the run lens's, over these events.
- **Interior observation** — variables, scopes, expression values, node paths,
  an AST index: the tracers'. intercept's two passes enforce and attribute; they
  observe nothing.
- **Loop placement and guard semantics** — loop-guard's and iteration-guard's,
  consumed whole. **Cap semantics beyond the pass-through** — iteration-guard's.
- **Engine mechanics** — worker lifecycle, pause protocol, time budget,
  draining, and the call channel's payload ceiling.

## Edge cases

- **`console.log('hi')` → one console record**, then the program continues when
  the consumer takes it. The worker's own console is not forwarded; the record
  is the observation.
- **An unlisted console method rides through.** `method` is an open string, so a
  method outside the nineteen standard names is reported faithfully rather than
  dropped. The trap covers exactly the methods the worker's own console has, so
  a name that is not a console method at all fails as it would on the platform,
  rather than being invented into a record.
- **A learner reassigning or deleting a trap disables its own observation.**
  `console.log = () => {}` silences that method's records for the rest of the
  run, and the program continues. The trap is an injected value, not a protected
  one; the `__$` collision guard covers accident, and this is not one.
- **A dialog inside a console argument** — `console.log(prompt('who?'))` — is
  two boundary moments, strictly sequential: the prompt suspends, is answered,
  emits its record, and only then does the console call happen and emit its own.
  Two interactions are never pending at once even here.
- **An argument that cannot cross the boundary** — a function, a symbol — rides
  as its string form. The record is honest about what was passed and the run
  does not crash.
- **`alert('hi')` suspends like the others**, and its answer is ignored: any
  answer releases it, and the record it emits carries `undefined` — the value
  the browser's own `alert` hands back, modelled rather than inferred.
- **A `prompt` answered with more than the call channel can carry** is the one
  bad answer the channel does not catch: it is accepted, and the run then ends
  `reason: 'defect'` when the machinery cannot write it back. The byte ceiling
  is the engine's, and sizing an answer input against it is the consuming
  lens's.
- **A dialog answered with the wrong kind of value** — a boolean for a `prompt`
  — is a dev defect at the consumer, not a learner condition: the answer channel
  throws synchronously at the caller, the run stays suspended, and the
  interaction can be answered again.
- **A dialog answered twice** — the second answer is inert; the run is already
  released.
- **Cancel while suspended** → canceled. Teardown stops the run and then
  releases the interaction; the released answer never reaches the program.
- **An answer after teardown** is inert, whatever it carries — including a
  wrong-kind one. Teardown is consulted before validation, so a lens unmounting
  mid-interaction never throws out of a dead stream; a post-teardown answer that
  would have failed validation is warned about, so the dev defect is not silent
  merely because it arrived late.
- **A throw inside a wrapped call** → error settlement, `reason: 'threw'`,
  carrying the innermost call site's `loc`. **A throw outside any wrap** — a
  statement-level `null.foo` — carries `loc: null`; no stack is parsed to
  recover one.
- **A call the wrap declines to enclose still runs, and carries no location.** A
  call awaiting inside its own arguments, or one whose short-circuit a wrap
  would defeat, is left as the learner wrote it — its records and any throw
  through it carry `loc: null`. The program's meaning is never traded for
  attribution.
- **A module run whose top-level evaluation rejects** → `reason: 'threw'`,
  exactly like any throw, and with `loc: null`: the wraps it passed through
  unwound before the rejection surfaced.
- **Capped runaway loop** → `reason: 'loop-cap'` with the guard's trip record
  and the run-total iteration count. The trip's own span attributes it to the
  loop; no second location rides that arm.
- **Uncapped runaway loop** → the guard counts, the engine's wall-clock budget
  ends the run → `reason: 'timeout'`. A suspended run is the one thing that
  budget cannot end, because it is not counting while a dialog waits.
- **A densely emitting program can time out with no real runtime.** The engine's
  budget measures worker runtime and pauses for both interaction and consumer
  think-time, so it is honest about time — but it also deducts a flat charge per
  yielded event, a synthetic valve that keeps render-bound loops finite in
  wall-clock terms. At one record per `console` call that valve is what binds
  first: a program emitting on the order of a thousand records exhausts the
  engine's default budget on the charge alone and settles `reason: 'timeout'`,
  however fast the consumer pulls. The records already delivered stand. The cap
  that keeps a runaway loop safe is `iterations`, not the clock.
- **An environment that cannot host a run** — no `Worker` (server-side
  rendering, plain Node) or no `SharedArrayBuffer` (COOP/COEP not served) → main
  returns the structured refusal naming the missing capability; nothing spawns,
  nothing throws.
- **Work scheduled past the natural end never runs**, on both axes — so a
  program whose only `console.log` rides a timer settles clean having emitted
  nothing.
- **Ceasing to pull / breaking out** → canceled at teardown; a pull after
  teardown never starts a fresh run.
- **Awaiting `settled` without pulling** starts nothing. One pull is enough to
  start a run but not to finish one: a stream that yields must be pulled for
  every event it holds, so a consumer that pulls once and then only awaits stops
  the program at its first boundary moment.

## Design commitments

- **Applicability is pure over the spec — `() => true`.** intercept is
  level-agnostic and serves both execution axes. The environment question —
  `Worker` AND `SharedArrayBuffer`, the engine's two synchronously probeable
  prerequisites — is answered at main, as one refusal naming the missing
  capability.
- **Guard-first, on the original source; the loc wrap second, blind to the
  guard.** The trip's span is faithful because the guard ran on the learner's
  own text, and the loc wrap skips every call whose callee name carries the
  `__$` prefix, so it never wraps the guard protocol's own calls. This order is
  not interchangeable: the reverse shifts the columns the guard reports.
- **A wrapped call's span is read from the learner's own text.** Guard-first
  makes the guarded source the text the wrap rewrites, and that text's columns
  are shifted on every line a guard or reset call was spliced into — which is
  the commonest shape there is, a one-line loop body whose only statement is the
  call being attributed. So placement is computed against the guarded text while
  the span reported is the original's, and the two readings are reconciled
  rather than assumed to agree: a disagreement about how many calls there are is
  a machinery defect and settles as one, never a silently mis-attributed span.
  Which parse goal intercept reads its own text under is fixed, not inherited:
  the same goal the snippet was parsed with, so a program that parsed upstream
  cannot fail to parse here.
- **Splice and inject are one obligation, twice over.** Guard calls pair with
  the guard helpers; loc wraps pair with the loc-wrap helper. Both pairs are
  intercept's; the engine only carries the config between the halves.
- **The loc wrap preserves the program's meaning or declines to wrap.** A wrap
  is an ordinary function call around an expression, so a call whose meaning
  depends on where it sits cannot be enclosed. The rule is the contract; the
  shapes it covers are a reading aid, not a closed set — a call whose arguments
  suspend on the surrounding function, one whose short-circuit a wrap would
  defeat, one whose scope is its own call site. Those are left unwrapped and
  carry no location, which the contract already allows. Instrumentation that
  turns a working program into a syntax error the learner never wrote, or moves
  where a call is evaluated, is the outcome this pass may not produce.
- **A throw is attributed to the innermost call it escaped.** Wraps nest, so a
  propagating throw passes through many; the first stamp wins and the first
  stamp is the innermost — the same first-write rule the guard's marker follows,
  and the reason a throw's location means "where it happened" rather than "what
  was running". A throw with no wrap left to escape — an asynchronous rejection,
  whose wraps unwound long before — carries none.
- **Console is emit-only; a dialog is ask-then-record.** A console call needs
  nothing back, so it makes no round-trip. A dialog's record carries its answer
  precisely because the ask completed first; the two are distinct worker
  operations and are never collapsed.
- **At most one boundary moment is ever in flight.** The worker is a single
  blocked thread for a dialog's whole span, so an answer channel is never
  re-entered and two interactions are never pending at once.
- **One arrival queue keeps the program's order; a pull takes its head.**
  Records arrive on the engine's item path and interaction requests on its call
  path, and the engine services worker posts in the order they were posted — so
  there is no merge policy to invent and no timestamp to sort on. Both sources
  join ONE queue in that order, and a pull is answered from its head. Order is
  therefore the queue's property, never a question of which source happens to be
  ready when a pull arrives: answering each pull with whichever source has
  something would let a later interaction overtake an earlier record, which is
  exactly the adjacency the pairing rests on. A pull still watches both sources
  — a request arrives by being handed to intercept rather than by being pulled
  for — but only to fill an empty queue.
- **The pull is demand-driven, with one bounded exception.** intercept reaches
  for the engine's next event only when its own consumer is waiting, and a reach
  already outstanding is retained rather than re-issued — the engine keeps one
  waiting pull, so a second concurrent request would strand the first forever.
  That is what makes a record's emit-pause a real hold. The exception is the
  reach retained across an interaction: whatever lands on it releases the
  program's next pause with nobody waiting, so at most one event of slack
  follows a pending interaction. It waits in the queue — never lost, never
  reordered.
- **The engine's stream is claimed before its settlement is ever touched.** An
  engine that finds no consumer iterator drains on the consumer's behalf, which
  would consume the very records intercept exists to yield. The claim therefore
  happens as the run starts, not when the first event is wanted — the one place
  the eventless sibling's shape must not be copied, because a stream it never
  claimed cost it nothing.
- **Teardown stops the run before it releases what is suspended.** A suspended
  run cannot be ended from outside — the engine's in-flight call servicing is
  uninterruptible and its budget is disarmed while a dialog waits — so releasing
  the interaction is intercept's own duty, and doing it after the stop is what
  makes the released answer inert instead of a resume. For the same reason
  teardown never waits on the engine's own stream to finish before releasing:
  that finish is downstream of the release, and waiting for it first is the
  deadlock this ordering exists to prevent.
- **The answer channel keeps the kind's signature.** Its parameter stays the
  kind's `unknown`: narrowing it per request kind would break assignability to
  the kind's pending interaction, because function parameters are contravariant.
  The per-kind discipline is therefore a runtime boundary check, which is what
  makes a wrong answer a loud, retryable dev error rather than a compile error a
  consumer would cast away.
- **Events are deep-frozen by their author, on both sides of the wire.** The
  engine freezes each item shallowly at yield, and only what came through its
  message path; intercept's deep pass is the one that binds. A record is frozen
  where it is narrowed — a fresh allocation after the clone, nobody else's — and
  a pending interaction is frozen where it is authored. Freezing does not
  disable its answer channel.
- **The halt payload is not frozen; the settlement is.** What DEV.md § 13
  requires of a value crossing `postMessage` is clone-safe SHAPE, which the halt
  has; the freeze half of that rule protects in-process consumers, and this
  payload's only one is the bootstrap, which clones it and drops it. Freezing it
  in place would additionally reach into the trip record, which the guard's
  classification verb hands back BY REFERENCE and intercept does not own — on a
  well-formed forgery that record belongs to the learner's program.
- **Classification is structural, worker-side.** The halt author reads the
  guard's marker through its classification verb — never a name, never a
  message. The engine's thread-side refinement hook goes unused.
- **The halt payload is narrowed exactly once**, thread-side, and a malformed or
  missing payload is the defensive `'defect'` arm — never a guess.
- **Precedence over the carried data runs through the trip, not the loc.** A
  well-formed trip means the guard stopped the run; otherwise a non-natural halt
  means the program threw. Branching on whether a location exists would be the
  outcome-label anti-pattern in a new costume — and a guard throw propagating
  through a wrapped call legitimately carries both.
- **`loop-cap` carries the trip and no separate location.** The trip is the
  classification AND the attribution in one field; a second span beside it would
  be a second copy of one fact, and the two would disagree the moment a guard
  throw crosses a wrapped call.
- **Emit everything; the pressure valve waits until a consumer needs it.** A
  learner program is small and a consuming lens wants a hold at every boundary
  moment, so intercept gates nothing worker-side and prices the cost honestly
  instead: the engine's per-yield charge, not real runtime, is what ends a
  densely emitting run. The valve, if one is ever needed, is worker-side
  aggregation before emitting — discipline the engine cannot enforce for a
  consumer, and not a shape to build speculatively. The narrower fix belongs to
  the engine, not here: a consumer that owns its own iteration cap has no use
  for a synthetic wall-clock valve, and intercept owns one.
- **The execution axis rides through unchanged**, and neither a strict posture
  nor a time budget is carried: strict is the kind's deliberate collapse, and
  seconds stay the engine's own default.

## Testing posture

The refusal's **worker** arm is proven through main in Node (no global `Worker`
there — exactly the refused environment); its **shared-memory** arm is not
reachable from either tier by construction, because the probe names the missing
worker first and every surface under test — the browser project, the engine's
sandbox config — serves the isolation headers. That arm is live all the same, on
any host that does not serve COOP/COEP.

Everything else splits along one boundary, and the split is **logic versus
timing**, not console versus dialog. The engine's fake transport runs the whole
program eagerly and synchronously before the first pull is ever answered, and it
services a round-trip synchronously — so it can represent what intercept
computes and nothing about when. **The Node tier therefore reaches every piece
of logic a console-only program exercises** — the instrumentation passes and
their ordering, the narrowing of a record and the dropping of a malformed one,
the settlement mapping truth-tabled over synthetic engine settlements, the
worker setup and halt author driven against a stub of the engine's worker api,
laziness, and the teardown latch — **plus the interaction channel as its own
leaf**, driven directly: per-kind validation, twice-inert, and
inert-after-teardown. A dialog driven through the fake does not merely fail to
suspend; it settles as a machinery defect, because the fake rejects an
asynchronous round-trip outright. That is a property of the double, never a
statement about the design.

**Everything about timing is browser-tier**, for one structural reason: only the
real transport has a program that is still running. That tier owns the
emit-pause hold (a record holds the program until it is taken), consumer-paced
execution, a cancel issued mid-stream against a program that is demonstrably
still going, the full ask–suspend–answer–record–resume loop, and the
cancel-while-suspended case. The last of those is the row that matters most and
whose failure is quietest: it must assert that the settlement **resolves**,
because a missing release surfaces as a runner timeout rather than a failed
expectation. The browser tier also carries the end-to-end evidence through main
— a console flow, a throw's stamped location, a limit trip, and a module-axis
row, since the fake runs the function path regardless of the axis. The sandbox
page is permanent dev infrastructure for exercising the same paths by hand.

## Navigation

- Region: [`../README.md`](../README.md) — the evaluator kind this implements.
- [`../lib/iteration-guard/README.md`](../lib/iteration-guard/README.md) — the
  shared iteration-guard semantics intercept consumes.
- [`../../lib/engine/README.md`](../../lib/engine/README.md) — the engine
  intercept drives.
- Siblings: [`../run/`](../run/README.md) — the baseline evaluator, where the
  shared-in-waiting shapes were pinned first;
  [`../danger/`](../danger/README.md) — the real-window evaluator, which answers
  its own dialogs and emits nothing.
- [`./DOCS.md`](./DOCS.md) — the architectural sketch and `## Data flow`.
- [`./types.ts`](./types.ts) — intercept's contract in TypeScript.
