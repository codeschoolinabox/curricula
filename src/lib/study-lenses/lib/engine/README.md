# engine

A **generic sandboxed streaming evaluator**. The engine runs untrusted code in a
killable module Worker, streams **opaque items** to a consumer one at a time,
services **synchronous worker→thread round-trips**, enforces a **time budget**,
and settles every run through one termination machine. It knows nothing about
JEJ, the notional machine, tracing, events, or pedagogy — all domain logic
arrives as arguments.

The evaluators region builds on it (the region lives elsewhere; the engine knows
no consumer): each evaluator — run, intercept, the tracer family — supplies its
code (instrumented or not), its worker logic (traps, advice, mocks), and its
thread logic (event interpretation, limit refinement), and maps the engine's
settlement onto the evaluator kind's own.

Light cases use the engine directly: code, a worker entry, a few thread hooks —
no kind contract, no ceremony.

## Public API

```ts
evaluate(spec: EvaluateSpec): EngineHandle
```

The spec is the whole coupling surface:

- `code` — the program, as a string. Instrumented or not — the engine does not
  know or care.
- `workerFactory` — a thunk constructing THIS run's module worker, authored as
  one adjacent expression in the consumer's module:
  `() => new Worker(new URL('./entry.ts', import.meta.url), { type: 'module' })`.
  It loads a **thin worker entry** (a few lines wiring the engine's bootstrap to
  this consumer's worker logic). The consumer constructs the worker — not the
  engine — so `new Worker(new URL(…))` stays syntactically adjacent for
  webpack's static worker detection; a split (URL built apart from `new Worker`)
  or a wrapping helper regresses to a broken raw-`.ts` asset. Omitting
  `{ type: 'module' }` is a separate failure: a classic worker whose ESM imports
  fail at load (a worker-error settlement, not a typecheck error). Both
  constraints — module-type AND adjacency — are load-bearing. The URL stays a
  static literal; bundlers stay static; dynamic module delivery is still
  unsupported.
- `workerConfig` — clone-safe data delivered to the worker logic at setup (trap
  selections, whitelists — whatever the consumer's logic wants).
- `threadLogic` — the thread-side hooks: `onMessage` (interpret / augment /
  drop), `onCall` (service round-trips), `refineError` (annotate a throw).
- `seconds` — the time budget, the only limit the engine owns. Defaults to 5
  when omitted.
- `strict` — whether the code runs under a `"use strict"` prefix. Defaults to
  true; consumers running sloppy-mode constructs (`with`) pass false.
- `execution` — how the worker runs the code. Defaults to `'function'` (wrapped
  in `new Function`, run under the `strict` preference, globals as parameters,
  synchronous natural end). `'module'` delivers it as an ES module: always
  strict — `strict` is inert on this path — with globals installed on
  `globalThis`, and an **asynchronous natural end**: the run ends when the
  module's top-level evaluation settles; work scheduled beyond it (a pending
  timer) never runs, matching the function path. A module evaluation that
  rejects reaches `serializeHalt` as `kind: 'throw'`, exactly like a
  function-path throw.

The handle is `AsyncIterable` over whatever `onMessage` yields, plus `result`
(the items array + settlement), `cancel()`, and `fail(reason?)`. Construction is
**fully lazy**: nothing runs until the first pull or `result` access; a cancel
or fail before that settles without spawning anything. Breaking out of a
`for await` loop is equivalent to `cancel()` — the early exit routes through the
termination machine and the run settles `cancelled`; items already yielded
remain valid.

`result` always settles — with one exception, the abandoned claimed stream
below. When no consumer iterator claims the stream, the engine **drains** on the
consumer's behalf: from the first item that becomes ready with no iterator in
existence, the engine pulls — and keeps pulling — so awaiting `result` alone
runs the program to settlement, items accumulating into the items array as
always. An iterator created before any engine pull owns the stream (the engine
then never pulls), so taking `result` early and then iterating keeps full
backpressure. The drain is the run's one consuming iteration: iterating after
settlement yields nothing (`result`'s items array is the record), and an
iterator created after the engine's first pull is the unsupported concurrent
case — one stream, silently split. The one way to suspend a run is to claim the
stream and walk away: an iterator created and then abandoned (whether or not it
ever pulled) holds the run like any abandoned generator holding a resource —
break or `cancel()` is the exit.

The engine's `EngineHandle` is not the evaluator kind's `EvaluationStream` — an
evaluator consumes the former to implement the latter. Same idea, different
layers, deliberately different names.

## The two-sided contract

Functions cannot cross the worker boundary, so each side's logic is authored
against the engine's API for that side:

**Worker side** — the engine's bootstrap hands the consumer's worker logic an
api and the config; the logic returns the globals to inject around the code, and
optionally the halt serializer:

```ts
setup(api: WorkerApi, workerConfig: unknown): WorkerSetupResult
// api.emit(message)  — post an opaque clone-safe message; execution pauses
//                      until the thread disposes of it
// api.call(request)  — synchronous round-trip: blocks on shared memory
//                      until threadLogic.onCall's response is written back
// returns { globals, serializeHalt? }
```

The returned globals' delivery depends on `EvaluateSpec.execution`: on the
`'function'` path they are injected as `new Function` parameters around the
code; on the `'module'` path they are installed on the worker's `globalThis` (a
module cannot receive function parameters). Keys MUST be valid JavaScript
identifiers so the code can reference them; the bootstrap rejects invalid keys
at setup on either path. Avoiding collisions with names the evaluated program
uses is the consumer's job. Consumer failures at setup — invalid global keys, a
throwing setup, clone-unsafe worker config — settle the run as `errored` with a
worker-error engine error; the engine surfaces failures as settlements, never
thrown exceptions. Injected globals are how interception works: a trapped
`console` emits; a `prompt` calls. A global you don't inject keeps its native
behavior in the Worker — inject only what you want to observe or replace. (Note
for dialog mocks: Workers have no native `prompt`/`alert`/`confirm` at all — a
program that calls them needs injected implementations to exist.)

On the `'function'` path, parameter injection shadows; it is not the only
channel. Setup may also install worker-GLOBAL state on the worker's `globalThis`
— instrumentation that resolves its hooks by global lookup (Aran advice)
registers there, not in the parameter list. (On the `'module'` path the returned
globals are themselves installed on `globalThis`.)

`serializeHalt(kind, rawError)` is the **worker-side halt author**. The
bootstrap invokes it on EVERY worker-side stop — `kind: 'natural-end'` when the
program runs out (`rawError` undefined), `kind: 'throw'` when it throws — and
posts the clone-safe payload it returns as the halt. Worker-side authoring is
the seam that preserves attribution data living only in the worker (an error's
stamped node path), classifies non-Error throws (`throw 'oops'`), and lets
instrumentation recognize its own limit-throw shape — the engine has no
`'limit'` kind; limit classification is consumer-owned inside `serializeHalt`. A
throwing `serializeHalt` is a worker crash (the worker-error termination cause).
When the hook is absent, the engine defaults the payload to `{ name, message }`
— drawn from the raw error on throws, and `{ name: 'natural-end', message: '' }`
on natural ends.

**Thread side**:

```ts
onMessage(message: unknown): unknown
// undefined — drop: the engine resumes the worker immediately
// any other value — yield: it becomes an item on the stream; the worker
//             resumes on the next pull. Items are frozen at yield. (The
//             undefined sentinel means a literal undefined item cannot be
//             yielded — a deliberate tradeoff.) A throw here ends the run
//             with the hook-error termination cause.
onCall(request: unknown): CallResponse | Promise<CallResponse>
// services api.call round-trips; the engine awaits the returned value
// (sync and async logic both work); the time budget is paused while it
// runs. A worker that calls while onCall is absent — or whose onCall
// throws — ends the run with the call-error termination cause.
refineError(haltPayload: unknown): unknown
// inspects an errored halt's worker-authored payload; returns a domain
// refinement (e.g. "this is an instrumentation-owned iteration limit") or
// undefined for none. The refinement rides the settlement opaquely. A
// throw here is a hook-error: the halt stays, the refinement is absent.
```

## The call channel

`api.call` responses are typed `string | boolean | null | undefined` and ride a
fixed shared-memory slot with a **payload ceiling of 8168 bytes** —
bounds-checked, failing loudly on overflow, never truncating silently. Richer
response data rides JSON-in-string at the consumer's choice. This is
deliberately a narrow, honest channel: a synchronous cross-thread reply slot,
not a general data path.

## How a run ends

Five generic outcomes — the engine's complete vocabulary:

| Stop                              | `outcome`   | carries               |
| --------------------------------- | ----------- | --------------------- |
| program reached its natural end   | `completed` | `halt`                |
| program threw (halt)              | `errored`   | `halt`, `refinement?` |
| consumer called `cancel()`        | `cancelled` | —                     |
| consumer called `fail(reason)`    | `failed`    | `failReason`          |
| time budget exhausted             | `timed-out` | `error`               |
| worker crashed / round-trip error | `errored`   | `error`               |

Every settlement also carries `durationMs`, the consumed budget. The halt is
present on EVERY worker-side stop — completed runs carry one too
(`serializeHalt` fires on natural end), which is how worker-only metrics like
iteration counts reach the thread. The engine-made `error` appears only when the
engine itself ended the run, and it names its cause structurally — `timeout`,
`worker-error` (crash, environment failure, a throwing halt serializer, a
consumer setup failure, an engine-internal defect settled loudly), `call-error`
(a round-trip that could not be serviced), or `hook-error` (a throwing thread
hook) — never by prose that a consumer would have to string-match. One corner
carries both: a `refineError` throw keeps the existing halt alongside a
hook-error.

A worker **crash is not a halt**: halts are posted by the bootstrap, exactly
once, through `serializeHalt` (including classified instrumentation-limit
throws); a crash is the worker-error termination cause and settles with an
engine-made `error`, no halt.

Consumer-driven stops (`cancelled`, `failed`) carry NO engine error — nothing
misbehaved; the consumer ended a healthy run. The evaluator kind's `canceled`
settlement arm mirrors `cancelled`
([evaluators/types.ts § Settlement](../../evaluators/types.ts)): a
consumer-ended run carries no error there either. `failed` has no kind-level
counterpart — what becomes of a `failReason` is each evaluator's own mapping.

The division of limits: **time is engine-owned and standardly available;
everything else (iteration counts, step budgets, domain rules) is owned by the
instrumentation + thread logic** and reaches the settlement through
`serializeHalt`'s halt payload and `refineError`'s opaque refinement. Downstream
vocabularies (a tracer's limit classification, the evaluator kind's error arm)
are mappings applied by the layers that own them.

### The time budget

The budget counts only while the worker is unblocked: it pauses while a yielded
item awaits its pull and while `onCall` runs. Each yield deducts a flat **yield
charge** approximating the thread-side cost of one emission cycle — and the
charge attaches **per yield, not per drop**: a high-frequency consumer that
drops most messages pays only worker-active time for the drops and never charges
itself into a timeout. When the budget fires while an emission is pending
thread-side disposal, it reschedules for the positive remaining budget; an
exhausted budget times out even then.

### What the opaque payloads carry

The engine never reads payload shapes, but downstream vocabularies put
requirements on them; recording those here keeps evaluator authors honest:

- The **refinement** is structured data, rich enough to distinguish an
  instrumentation-owned limit from a learner-thrown `RangeError` WITHOUT string
  matching — the misclassification gate survives at the evaluator layer, not in
  the engine.
- The **halt payload** carries the run metrics only the worker knows — iteration
  counts ride it, on completed runs too. On main-thread terminations there is no
  halt; a downstream owner defaults such metrics (e.g. an evaluator defaulting
  an iteration count to 0).
- The halt payload is what downstream errors are built from (e.g. an evaluator's
  structurally richer settlement error).
- Outcome rewrites belong downstream (e.g. an evaluator surfacing **errored +
  refinement** in its own limit vocabulary); the engine settles `errored` either
  way.
- `failReason` is stored by reference and is NOT deep-frozen by the engine; a
  downstream owner's deep pass is the authoritative freeze for its own data
  (consumers pass a clone if the original must stay mutable).

## Pause economics

An honesty rule for consumer authors: **every emit costs a full pause round-trip
even when dropped** — the worker pauses, posts, and waits for the thread to
dispose of the message; a drop saves only the yield-and-pull leg, never the
pause-post-resume leg. High-frequency producers (an advice layer observing
thousands of moments) MUST gate worker-side, before emitting. That is consumer
discipline the engine cannot guarantee.

## Conformance testing

Two tiers, scoped honestly:

- `tests/conformance/agnostic/` runs against the REAL transport AND the
  engine-shipped fake — clone-safety (the fake structured-clones every payload),
  drop-vs-yield logic, call servicing, refinement, settlement classification.
- `tests/conformance/transport/` runs against the real transport ONLY — Atomics
  blocking, pause ordering, the call payload ceiling, timer and yield-charge
  behavior, COOP/COEP-dependent setup, and the module execution axis (globalThis
  delivery, `import.meta`, top-level await — the fake runs the function path
  regardless of the axis and cannot reproduce these).

A green fake run is NOT evidence for any transport-fidelity invariant; the fake
exists so consumer logic is Node-testable, not to certify the transport.

## Structure

| Path          | Purpose                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `evaluate.ts` | The factory — handle assembly, pump, termination machine, timer, call dispatch                                              |
| `types.ts`    | The public engine contract — spec, two-sided logic types, settlement                                                        |
| `worker/`     | Transport internals — shared-memory protocol, the worker-side bootstrap; message-protocol types live here                   |
| `testing/`    | The reference **fake transport** + engine-owned trivial worker/thread logic for the engine's own suites                     |
| `tests/`      | Unit suites + the two-tier conformance suites (`conformance/agnostic/` both transports, `conformance/transport/` real-only) |

## Glossary (ubiquitous language)

These terms propagate into types, JSDoc, DOCS.md, tests, and commit messages.
Using a different name in code is a bug, not a stylistic choice.

- **engine** — this module: the generic machinery. Domain logic never lives
  here; the anti-goal is any engine code that interprets a payload.
- **factory** — the `evaluate` entry point: spec in, handle out.
- **spec** — the factory argument: code, worker factory, worker config, thread
  logic, seconds, strict, execution.
- **worker logic** — consumer-authored, worker-side:
  `setup(api, workerConfig) → { globals, serializeHalt? }` (typed
  `WorkerSetup`). Owns traps, mocks, emission decisions, halt authoring.
- **worker factory** — the consumer-supplied thunk in the spec that constructs
  this run's module worker; authored as one adjacent expression (never split,
  never behind a helper) so webpack emits a real worker chunk. Loads the worker
  entry. See § Public API for the canonical snippet and why.
- **worker entry** — the thin per-consumer worker file wiring the engine's
  bootstrap to that consumer's worker logic.
- **bootstrap** — the engine's worker-side module: receives setup/execute, hands
  the api to worker logic, injects the returned globals, runs the code, posts
  the halt.
- **worker api** — `{ emit, call }`, the only powers worker logic gets.
- **emit** — post an opaque message thread-ward; execution pauses until the
  thread disposes of it (drop or yield-and-pull).
- **call** — the synchronous round-trip: the worker blocks until the thread's
  response is written back over shared memory.
- **call response** — the value a round-trip returns: string, boolean, null, or
  undefined, within the bounded payload ceiling. Richer data rides
  JSON-in-string.
- **thread logic** — consumer-authored, thread-side: `onMessage` / `onCall` /
  `refineError`.
- **message** — an opaque, structured-clone-safe payload crossing the boundary.
  Clone-safety is the engine's only constraint on it.
- **item** — what `onMessage` yields; what the stream carries (pulled by the
  consumer, or by the engine when draining); frozen at yield. The engine never
  reads its shape.
- **drop** — `onMessage` returning undefined: no yield, immediate resume.
- **drain** — the engine pulling on the consumer's behalf, engaged from the
  first item that becomes ready with no consumer iterator in existence. The
  drain IS the run's one consuming iteration; it is how `result` settles without
  anyone iterating.
- **halt** — the worker-side stop: the program ended or threw. Authored by
  `serializeHalt` (or the engine default), posted by the bootstrap as structured
  data, exactly once per worker-side stop — natural end included.
- **serializeHalt** — the consumer's worker-side halt author:
  `(kind, rawError) → clone-safe payload`, kinds `'natural-end'` and `'throw'`.
  Owns limit classification; preserves worker-only attribution.
- **termination cause** — the thread-side stop: cancel, fail (with payload),
  timeout, worker-error (crash, environment failure, throwing halt serializer,
  consumer setup failure, engine-internal defect — a contract-violating value
  reaching runtime settles loudly, never hangs), call-error (round-trip
  unserviceable), hook-error (throwing thread hook). First-write-wins with the
  halt — exactly one stop settles a run; anything later (including after
  settlement) is a no-op.
- **termination machine** — the engine's single stop-and-settle mechanism: the
  first-write-wins slot, teardown, and settlement classification. Every path
  that ends a run goes through it.
- **settlement** — how the run ended: one of the five outcomes plus its carried
  data and the consumed-budget `durationMs`.
- **engine error** — the engine-authored `{ cause, name, message }` on
  settlements the engine itself ended (timeout, worker-error, call-error,
  hook-error). Never consumer payload; the cause is structured, never
  string-matched.
- **refinement** — the opaque annotation `refineError` attaches to an errored
  settlement; the engine transports it, downstream layers interpret it.
- **pause protocol** — the two-flag shared-memory coordination that freezes the
  worker between emissions. Ordering invariants in
  [DOCS.md § Structural constraints](./DOCS.md).
- **pump** — the engine's thread-side message loop: receives worker posts in
  FIFO order, runs the message hook, services calls, feeds the stream.
- **sandbox** — the killable module worker a run executes in; spawned on first
  pull, torn down on every stop path.
- **time budget** — the `seconds` limit. Counts only while the worker is
  unblocked: paused while a yielded item awaits the pull and while `onCall`
  runs. When it fires while an emission is pending thread-side disposal, it
  reschedules for the positive remaining budget; an exhausted budget times out
  even then.
- **yield charge** — a flat per-YIELD deduction approximating the thread-side
  cost of one emission cycle, keeping render-bound loops finite in wall-clock
  terms. Drops are never charged it.
- **lazy pull** — no work until the first pull or result access; the handle is
  fully lazy. Laziness governs when the run starts; the drain governs who pulls
  after.
- **fake transport** — the engine-shipped reference test double. It
  structured-clones every payload (clone-safety enforced in Node tests) and
  services calls synchronously. The agnostic conformance tier runs against the
  real transport AND the fake, so the fake cannot drift — but only the real
  transport evidences transport fidelity.

## Bounded context

**Owns**: worker lifecycle (spawn, ready handshake, terminate-on-every-path);
the transport (emit/call, pause protocol, shared-memory layout, the bounded call
channel); the time budget and yield charge; the termination machine and
settlement; the draining result surface (`result` settles without iteration);
freezing its own structures (items at yield, the items array and settlement at
settlement); the fake transport and the conformance suites.

**Does not own**: payload shapes and vocabularies (consumer logic); deep
freezing of consumer payload interiors — halt, refinement, failReason
(downstream owners deep-freeze their own data); instrumentation and any non-time
limit (instrumentation + `serializeHalt` + `refineError`); mock behavior (worker
logic + `onCall`); whitelisting (consumer logic, either side); the evaluator
kind's contract — `EvaluationSpec`, `EvaluationStream`, event unions,
refusal-as-data, pending-interaction suspension (the kind's distinguished event
and its respond channel, built by an evaluator atop emit/call), and every
mapping from an engine settlement onto the kind's (the evaluators region);
hosting headers (COOP/COEP are the host page's concern); worker construction
(the consumer's worker factory builds the `Worker`; the engine spawns only what
it is handed — module-type and adjacency are consumer obligations, doc-enforced,
and a classic or non-adjacent worker fails at load).

**Placement**: the engine is a shared leaf of the study-lenses package
(`src/lib/study-lenses/lib/engine/`); it depends on nothing outside itself, so
every region — or any consumer beyond this package — imports it directly.

**Vocabulary bridges**: what an evaluator emits as an _event_ is, to the engine,
an opaque _item_. The engine's `EngineHandle` is not the evaluator kind's
`EvaluationStream` — an evaluator wraps the former to implement the latter. The
engine's _settlement_ — five outcomes — is not the kind's _settlement_ — three
arms; an evaluator maps the former onto the latter. Likewise the engine's
`EvaluateSpec` is not the kind's `EvaluationSpec`: an evaluator builds the
former from the latter on every run. A worker _crash_ is not a _halt_ — crash is
the worker-error termination cause; halts are bootstrap-posted, exactly once.

## Navigation

- [DOCS.md](./DOCS.md) — architectural sketch, data flow, decision records
- [types.ts](./types.ts) — the engine contract
- [../README.md](../README.md) — the shared-leaf `lib/` directory
- [../../evaluators/README.md](../../evaluators/README.md) — the evaluator kind:
  the consuming contract implemented on top of this engine
- [../../README.md](../../README.md) — the study-lenses package root
