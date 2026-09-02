# engine

A **generic sandboxed streaming evaluator**. The engine runs untrusted code in a
killable Worker, streams **opaque items** to a consumer one at a time, services
**synchronous worker→thread round-trips**, enforces a **time budget**, and
settles every run through one termination machine. It knows nothing about JEJ,
the notional machine, tracing, events, or pedagogy — all domain logic arrives as
arguments.

The evaluators region builds on it (the region lives elsewhere — today
`evaluators-deprecated/`; the engine knows no consumer): each evaluator — run,
intercept, the tracer family — supplies its code (instrumented or not), its
worker logic (traps, advice, mocks), and its thread logic (event interpretation,
limit refinement), and maps the engine's settlement onto its own kind's.

Light cases use the engine directly: code, a worker entry, a few thread hooks —
no kind contract, no ceremony.

## Public API

```ts
evaluate(spec: EvaluateSpec): EngineHandle
```

The spec is the whole coupling surface:

- `code` — the program, as a string. Instrumented or not — the engine does not
  know or care.
- `workerFactory` — a thunk constructing THIS run's worker, authored as one
  adjacent expression in the consumer's module:
  `() => new Worker(new URL('./entry.ts', import.meta.url), { type: 'module' })`.
  It loads a **thin worker entry** (a few lines wiring the engine's bootstrap to
  this consumer's worker logic). Two obligations ride the thunk, and they are
  different in kind:
  - **Adjacency, unconditionally.** The consumer constructs the worker — not the
    engine — so `new Worker(new URL(…))` stays syntactically adjacent for
    webpack's static worker detection; a split (URL built apart from
    `new Worker`) or a wrapping helper regresses to a broken raw-`.ts` asset.
    The URL stays a static literal; bundlers stay static; dynamic module
    delivery is unsupported.
  - **Worker type — KEEP `{ type: 'module' }`, and know what it pairs with.**
    Omitting it under a toolchain that honors the option yields a classic worker
    whose ESM imports fail at load: a `worker-error` settlement, not a typecheck
    error. The pairing behind the imperative: the entry imports the engine's
    bootstrap, so the worker must be able to resolve those imports — either it
    IS a module worker (what Vite and the vitest browser tier produce) or a
    bundler has already inlined them into a classic chunk (what webpack does —
    it strips `{ type: 'module' }` and emits every worker chunk classic). The
    `'script'` path needs `importScripts`, which **only a classic worker can
    actually call** — a module worker exposes the name and throws on the call,
    so no `typeof` guard can detect the mismatch. So `'script'` runs exactly
    where the bundler emits classic workers, and `{ type: 'module' }` stays in
    the source either way: required where it is honored, inert where it is
    stripped.

  Neither obligation is type-enforceable (`() => Worker` cannot encode the
  options, and a branded wrapper to enforce them would BE the forbidden
  re-splitting helper), so this paragraph and the `workerFactory` JSDoc are the
  whole enforcement mechanism. The measured basis for the pairing is the client
  build and the spike entries at **~90% certainty** — the real engine's worker
  has not been executed inside a production page — which is why the `'script'`
  path does not trust it: it probes `importScripts` at setup and settles a
  mismatch as a worker-error rather than failing inside the learner's program.

- `workerConfig` — clone-safe data delivered to the worker logic at setup (trap
  selections, whitelists — whatever the consumer's logic wants).
- `threadLogic` — the thread-side hooks: `onMessage` (interpret / augment /
  drop), `onCall` (service round-trips), `refineError` (annotate a throw).
- `seconds` — the time budget, the only limit the engine owns. Defaults to 5
  when omitted.
- `strict` — whether the code runs under a `"use strict"` prefix. Defaults to
  true; consumers running sloppy-mode constructs (`with`) pass false. It governs
  the `'function'` path alone: `'module'` is always strict by the language's
  rule, and on `'script'` the engine prepends nothing, so a script is sloppy
  unless its own first line says otherwise.
- `execution` — which of three paths the worker runs the code on
  (`ExecutionPath`). Defaults to `'function'`.
  - `'function'` — the code becomes a `new Function` body, run under the
    `strict` preference, with the injected globals as the function's parameters;
    its natural end is synchronous. This is a **simulation of a script, not a
    script**: top-level `var` and function declarations are locals of the
    wrapper, a top-level `return` is legal, top-level `this` is `undefined`
    under the default `strict: true`, top-level `arguments` is the wrapper's
    own, a hashbang line is a `SyntaxError`, and a syntax error is reported
    against a brace the learner never typed.
  - `'module'` — the code is delivered and run as an ES module: always strict,
    globals installed on `globalThis` (a module takes no parameters), and an
    **asynchronous natural end** — the run ends when the module's top-level
    evaluation settles; work scheduled beyond it (a pending timer) never runs,
    matching the function path. An evaluation that rejects reaches
    `serializeHalt` as `kind: 'throw'`, exactly like a function-path throw, with
    `phase: 'evaluation'` — the one-stage dynamic import gives no structural
    link/run boundary, so an unresolvable import specifier rides `'evaluation'`
    as a named residual (see `HaltPhase`). Parse failures the gate REFUSES do
    not reach the worker at all; one it cannot judge does.
  - `'script'` — the code is delivered and run as a genuine **Script Record**,
    via `importScripts` on a blob URL. **It is the first spec value whose
    validity depends on the consumer's build toolchain**, and today that means
    it runs under webpack and **fails under Vite dev and the vitest browser
    project**, both of which produce module workers — the capability probe
    settles those runs `worker-error` at setup rather than letting them fail
    inside the learner's program. Globals install on `globalThis` (a script
    takes no parameters either), the natural end is synchronous, and `strict` is
    an **ignored input** here — both values behave identically and the engine
    gives no signal, because a real script's strictness is the program's own to
    declare. Top-level `var` reaches `globalThis`, top-level `this` IS
    `globalThis`, there is no `arguments` binding, a hashbang runs, and a
    top-level `return` or `new.target` is the syntax error the language says it
    is. A runtime throw reaches `serializeHalt` with `phase: 'evaluation'` — the
    gate ran on the thread, so a program it refused never got here. Moving a
    snippet from `'function'` to `'script'` therefore drops the `strict: true`
    default silently: correct fidelity, surprising diff, and a `with` program
    that degrades to a syntax error today will simply run.
- `yieldCharge` — whether each yield deducts the flat yield charge from the
  budget. Defaults to true; densely emitting consumers (an intercept evaluator
  when its spec carries an iteration cap, the tracers) pass false, because at
  one event per program step the fee alone exhausts a default budget with almost
  no real runtime. It waives the FEE only — the budget still pauses for
  yield-waits and call servicing, and real running time still times the run out;
  loop safety under the waiver rests on the consumer's own iteration cap.

**Why the default stays `'function'`.** A default is the hardest thing in this
contract to change later: every future consumer that names no path is posed by
it, and flipping it would silently re-pose all of them at once. (Today that
population is empty — both evaluator kinds make `execution` required and forward
it explicitly — so the default is currently reached only by the engine's own
tests and by consumers not yet written. That is the argument for settling it
now, while nothing depends on it.) That `'function'` is the only value with no
fidelity story is a reason to choose `'script'` deliberately, not a reason to
change what an unspecified run means.

**When to pick `'function'` over `'script'`: when the code is not a program.**
An expression, a fragment, a snippet a lens wants to run with a top-level
`return` — anything where function-body semantics are the point rather than the
compromise. For anything a learner could save to a file and run, `'script'` is
the faithful path.

Two further reasons are live rather than semantic, and both belong in the same
decision. `'function'` is the only path where a consumer can **force strict
mode**; a program moved to `'script'` runs sloppy unless it says otherwise. And
`'script'` only runs where the toolchain emits classic workers, so a consumer
that must work under Vite dev picks `'function'` or `'module'`, never
`'script'`. `'script'`'s own cost is worth naming too: a bare top-level
`var URL = 1` in a script reaches the same global object the engine's own
worker-side code reads, where on the other two paths it reaches nothing. That
exposure is what the worker realm's latched built-ins exist to survive
([worker/README.md § Realms](./worker/README.md)).

**`'script'` has no evaluator consumer yet**, by ruling: the engine carries an
execution path nothing in `evaluators/` can request, because that region's own
`ExecutionAxis` union stays closed and its tsc tripwire stays armed. Widening it
is a separate later unit, and that unit — not this contract — owns the collision
between this path's `'script'` and the `facts.type: 'script'` parse goal, which
are different concepts sharing a word.

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

The engine's `EngineHandle` is not an evaluator's own stream or handle type — an
evaluator consumes this handle to implement its own. Same idea, different
layers, deliberately different names.

### The creation gate

`'module'` and `'script'` are **parsed thread-side before anything is spawned**
— acorn, `ecmaVersion: 'latest'`, on the module goal and the script goal
respectively. A program the parser REFUSES settles `errored` with no sandbox
ever constructed: **the worker factory is never invoked**, and no shared memory
is allocated.

**A gate that cannot decide defers.** Only a refusal settles the run here. Where
the parser fails without reaching a verdict — acorn exhausting its own call
stack on deeply nested input, which instrumented source reaches long before a
learner's does — the gate abstains and the run proceeds to the worker exactly as
though the path were ungated. A gate's failure mode is FALSE REFUSAL, and
refusing a program because the parser hit its own limit would be that failure.
The program usually fails anyway, in the host's own parser, in the host's own
words, inside the budget — which is a better answer than the engine's.

The stop it authors is a halt like any other, with two things a consumer needs
in order to handle it structurally rather than by inspection:

- **`halt` carries `{ name, message, line, column, phase: 'creation' }`.** The
  position is acorn's own, kept as data — a syntax error's position is the thing
  this path exists to report honestly, and recovering it by matching `"(1:3)"`
  out of a message string is the technique this module rejects everywhere else.
  **`line` is 1-based and `column` is 0-based**, acorn's convention verbatim; a
  consumer drawing a caret converts once, at its own edge. This makes two
  engine-authored payload shapes, told apart by `haltOrigin`: this one, and the
  worker-side default `{ name, message, phase }`, which carries no position. So
  the `'function'` path's creation failure reports none — deliberately, since
  the only position `new Function` could offer counts the wrapper's own lines,
  and a wrong position is worse than none.
- **`settlement.haltOrigin` says who wrote it** — `'worker'` for every halt
  `serializeHalt` (or the engine's worker-side default) authored, `'engine'` for
  this one. **It is present exactly when `halt` is**, so a consumer never has to
  interpret its absence: no halt, no origin. A consumer whose settlement mapping
  narrows the halt to its own shape needs to know which shape arrived, and the
  engine's own rule is that classification reads structured data, never payload
  shape.

`refineError` fires on a gate stop like any other errored halt. The consumer's
`serializeHalt` does not — there is no worker to run it in, so this is the one
path on which a consumer that supplied a halt author still receives an
engine-shaped payload. That is what `haltOrigin` is for.

**The parse runs synchronously, on whichever thread called `evaluate` — the
page's main thread for a lens — and is not charged to the time budget.** The
engine's time guarantee does not reach it. That is acceptable on measurement,
not on principle: acorn parses 500 lines in ~0.34ms against a ~22.8ms mean
worker spawn, and a program that fails to parse is refused ~760× cheaper than by
spawning a sandbox to find out. `durationMs` on a gate settlement is the
budget's consumed time, which is zero — the budget arms when the code begins
running, and on this path it never does. That is the existing rule rather than a
special case: an environment failure settles at zero for the same reason.

`'function'` is not parsed. It keeps its own structural split — construction
failed, or the body threw — because a function body is not a parse goal the
language defines, and `new Function` is already the gate.

Two properties of the gate are contract, not implementation detail:

- **Acorn's grammar is the language level**, on both gated paths. It diverges
  from a given host in two directions, and they cost differently. Where acorn
  **rejects** what a host accepts (decorators, measured), the gated paths'
  accepted grammar is narrower than that host's — accepted deliberately, since
  learners are not guaranteed to run on V8, so a construct acorn rejects is out
  of bounds everywhere rather than accidentally allowed on one browser. Where
  acorn **accepts** what the runtime then refuses (`let NaN = 1` on `'script'`,
  which no static parser can see — it depends on the live global object), the
  program is not refused; it fails later and reports `phase: 'evaluation'` for
  what is structurally a creation failure. A mislabelled phase, never a false
  refusal. The acorn version pins exactly so the level does not move under a
  learner on an `npm update`; that pin lands with Phase 1's gate, not with this
  contract.
- **The parse is a GATE, not a fact-producer.** Its failure mode is refusing a
  program that would have run, so it is pinned to `'latest'` rather than to any
  numeral, and never tighter than the instrumenters whose output it receives:
  the engine is handed instrumented source, so a parse failure there is an
  instrumentation defect and must not be reported as the learner's syntax error.

Gating both goals rather than only the new one was a **choice between two
forks**, not a consequence. The narrow fork — gate `'script'` alone and leave
`'module'` byte-identical — was posed and declined, in favour of one language
level across the paths that have one. The cost is that a module _parse_ failure
which ships today as `phase: 'evaluation'` becomes `'creation'`, and that the
`'module'` path's accepted grammar narrows to acorn's. Both were accepted
knowingly.

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
code; on the `'module'` and `'script'` paths they are installed on the worker's
`globalThis`, because neither a module nor a script can receive parameters. Keys
MUST be valid JavaScript identifiers so the code can reference them; the
bootstrap rejects invalid keys at setup on every path. Avoiding collisions with
names the evaluated program uses is the consumer's job. Consumer failures at
setup — invalid global keys, a throwing setup, clone-unsafe worker config —
settle the run as `errored` with a worker-error engine error; the engine
surfaces failures as settlements, never thrown exceptions. The `'script'` path's
own setup-time capability probe joins that family: setup attempts
`importScripts` on a known-good empty blob **before any global is installed**,
and a worker that cannot run scripts settles the same way rather than failing
inside the learner's program. A probe blocked for another reason (a CSP that
forbids `blob:`) lands in the same bucket, which is acceptable because the cause
stays `worker-error` either way.

**The globals install `configurable: true`, and on `'script'` that descriptor
acquires a second job.** A script's top-level `let`/`const` collides fatally
with a **non-configurable** global property — that is why `let NaN = 1` fails
(the other two collision causes, an existing `var` or another lexical
declaration in the same realm, cannot arise in a fresh worker running one
script) — so the configurable descriptor is what keeps a learner's
`let <injectedName> = 1` a legal shadow rather than an instantiation-time
`SyntaxError`. A future hardening of those descriptors would silently convert a
working consumer global into a syntax error on this path alone. Recorded here
because nothing tripwires it.

Injected globals are how interception works: a trapped `console` emits; a
`prompt` calls. A global you don't inject keeps its native behavior in the
Worker — inject only what you want to observe or replace. (Note for dialog
mocks: Workers have no native `prompt`/`alert`/`confirm` at all — a program that
calls them needs injected implementations to exist.)

On the `'function'` path, parameter injection shadows; it is not the only
channel. Setup may also install worker-GLOBAL state on the worker's `globalThis`
— instrumentation that resolves its hooks by global lookup (Aran advice)
registers there, not in the parameter list. (On the `'module'` and `'script'`
paths the returned globals are themselves installed on `globalThis`, so the two
channels coincide.)

`serializeHalt(kind, rawError, phase)` is the **worker-side halt author**. The
bootstrap invokes it on EVERY worker-side stop — `kind: 'natural-end'` when the
program runs out (`rawError` and `phase` undefined), `kind: 'throw'` when it
throws — and posts the clone-safe payload it returns as the halt. On throws,
`phase` says where the error arose — `'creation'` (the program failed before it
ran) or `'evaluation'` (while running) — and the split is STRUCTURAL, never the
error's type: a learner's runtime `throw new SyntaxError(...)` is
`'evaluation'`. Which structure decides it depends on the path: on `'function'`
it is which try/catch caught, `new Function` construction versus the body; on
`'module'` and `'script'` it is the creation gate, which runs on the thread
before the worker exists. **A `'creation'` stop on those two paths therefore
never reaches this hook at all** — the engine authors that payload itself.
Worker-side authoring is the seam that preserves attribution data living only in
the worker (an error's stamped node path), classifies non-Error throws
(`throw 'oops'`), and lets instrumentation recognize its own limit-throw shape —
the engine has no `'limit'` kind; limit classification is consumer-owned inside
`serializeHalt`. A throwing `serializeHalt` is a worker crash (the worker-error
termination cause). When the hook is absent, the engine defaults the payload to
`{ name, message, phase }` on throws — drawn from the raw error and the
structural split (human ruling 2026-08-25) — and
`{ name: 'natural-end', message: '' }` on natural ends.

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
| the gate refuses the program      | `errored`   | `halt`, `refinement?` |
| consumer called `cancel()`        | `cancelled` | —                     |
| consumer called `fail(reason)`    | `failed`    | `failReason`          |
| time budget exhausted             | `timed-out` | `error`               |
| worker crashed / round-trip error | `errored`   | `error`               |

Every settlement also carries `durationMs`, the consumed budget. The halt is
present on EVERY worker-side stop — completed runs carry one too
(`serializeHalt` fires on natural end), which is how worker-only metrics like
iteration counts reach the thread. **One halt is not worker-side at all**: the
creation gate authors its own, on the thread, for a program that never reached a
sandbox. It is the single exception to "a halt means a worker stopped", it
carries the engine's own payload shape rather than the consumer's, and
`haltOrigin` (`'worker'` | `'engine'`) is how a consumer tells them apart
without inspecting the payload. The engine-made `error` appears only when the
engine itself ended the run, and it names its cause structurally — `timeout`,
`worker-error` (crash, environment failure, a throwing halt serializer, a
consumer setup failure, an engine-internal defect settled loudly), `call-error`
(a round-trip that could not be serviced), or `hook-error` (a throwing thread
hook) — never by prose that a consumer would have to string-match. One corner
carries both: a `refineError` throw keeps the existing halt alongside a
hook-error.

A worker **crash is not a halt**: worker-side halts are posted by the bootstrap,
exactly once, through `serializeHalt` (including classified
instrumentation-limit throws), and the creation gate's is authored on the
thread; a crash is neither — it is the worker-error termination cause and
settles with an engine-made `error`, no halt.

Consumer-driven stops (`cancelled`, `failed`) carry NO engine error — nothing
misbehaved; the consumer ended a healthy run. The DEPRECATED kind's `canceled`
settlement arm mirrors `cancelled`
([evaluators-deprecated/types.ts § Settlement](../../evaluators-deprecated/types.ts)):
a consumer-ended run carries no error there either. `failed` has no counterpart
there — what becomes of a `failReason` is each evaluator's own mapping.

The division of limits: **time is engine-owned and standardly available;
everything else (iteration counts, step budgets, domain rules) is owned by the
instrumentation + thread logic** and reaches the settlement through
`serializeHalt`'s halt payload and `refineError`'s opaque refinement. Downstream
vocabularies (a tracer's limit classification, an evaluator kind's error arm)
are mappings applied by the layers that own them.

### The time budget

The budget counts only while the worker is unblocked: it pauses while a yielded
item awaits its pull and while `onCall` runs. Each yield deducts a flat **yield
charge** approximating the thread-side cost of one emission cycle — and the
charge attaches **per yield, not per drop**: a high-frequency consumer that
drops most messages pays only worker-active time for the drops and never charges
itself into a timeout. A consumer that YIELDS at every program step has no such
escape, so it waives the fee for its run with `yieldCharge: false` — the fee
alone: the pauses above still apply, and real running time still exhausts the
budget. When the budget fires while an emission is pending thread-side disposal,
it reschedules for the positive remaining budget; an exhausted budget times out
even then.

### What the opaque payloads carry

The engine never reads payload shapes, but downstream vocabularies put
requirements on them; recording those here keeps evaluator authors honest:

- The **refinement** is structured data, rich enough to distinguish an
  instrumentation-owned limit from a learner-thrown `RangeError` WITHOUT string
  matching — the misclassification gate survives at the evaluator layer, not in
  the engine.
- The **halt payload** carries the run metrics only the worker knows — iteration
  counts ride it, on completed runs too. On main-thread terminations there is
  none — except the creation gate's, which is engine-authored and carries no
  metrics at all — so a downstream owner defaults such metrics (e.g. an
  evaluator defaulting an iteration count to 0) on both kinds of stop.
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
  behavior, COOP/COEP-dependent setup, and the `'module'` and `'script'`
  execution paths (globalThis delivery, `import.meta`, top-level await,
  `importScripts`, and real Script semantics — the fake runs the function path
  whatever the spec says and cannot reproduce these). The creation gate is NOT
  real-only: it sits above the transport seam, so a `'module'` or `'script'`
  spec is parse-gated on the fake too, and it is each path's evaluation-time
  behavior the fake cannot evidence. That combination exists on no real path:
  under the fake a `'script'` spec is gated at the script goal and then executed
  as a function body, so `return 1` is refused while `var x = 1` stays
  wrapper-local. Read a green fake row as evidence about the GATE, never about
  the path.

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
  logic, seconds, strict, execution, yield charge.
- **worker logic** — consumer-authored, worker-side:
  `setup(api, workerConfig) → { globals, serializeHalt? }` (typed
  `WorkerSetup`). Owns traps, mocks, emission decisions, halt authoring.
- **worker factory** — the consumer-supplied thunk in the spec that constructs
  this run's worker; authored as one adjacent expression (never split, never
  behind a helper) so webpack emits a real worker chunk. Whether that worker
  ends up module or classic is the toolchain's answer, not the engine's, and it
  pairs with the execution path. Loads the worker entry. See § Public API for
  the canonical snippet, the pairing rule, and why.
- **worker entry** — the thin per-consumer worker file wiring the engine's
  bootstrap to that consumer's worker logic.
- **execution path** — which of `'function'`, `'module'` and `'script'` the
  worker runs the code on; the spec's `execution` field, typed `ExecutionPath`.
  Consumer-chosen, never inferred from the code. Not the same word as the
  evaluators region's `ExecutionAxis`, which is that region's own narrower type,
  nor the same as a parse goal: a consumer may pose script-goal facts on the
  `'function'` path and the engine will not object.
- **creation gate** — the thread-side acorn parse that runs before any sandbox
  is spawned, on the `'module'` and `'script'` paths. A program the parser
  REFUSES settles `errored` with an engine-authored halt carrying
  `phase: 'creation'`, and the worker factory is never invoked; a program it
  cannot judge is deferred to the worker instead. It gates evaluation on whether
  the program parses; it is not the evaluators region's kind of gate (embody's
  evaluation-phase gate, an evaluator's refusal-as-data), which decide whether a
  program should be run at all and fire before the engine is invoked.
- **parse goal** — which grammar the gate parses a program under: the **module
  goal** for `'module'`, the **script goal** for `'script'`. The goal follows
  the execution path and is never sniffed from the code. Distinct from an
  evaluator's `facts.type`, which records the goal the FACTS were produced
  under; the two may legally disagree.
- **Script Record** — what the `'script'` path actually creates: the language's
  own top-level program form, where `var` and function declarations become
  properties of the global object, `this` is the global object, and there is no
  `arguments` binding. The word is the language's, and the path is named after
  it.
- **classic worker** vs **module worker** — a worker constructed without and
  with `{ type: 'module' }`. The distinction was invisible while the engine
  required module workers unconditionally; it is contract now, because only a
  classic worker can call `importScripts` and therefore only a classic worker
  can run the `'script'` path. Which one a consumer ends up with is the
  toolchain's answer (§ Public API, the pairing rule), not the engine's.
- **capability probe** — the engine's setup-time attempt to call `importScripts`
  on a known-good empty blob, on the `'script'` path only, before any consumer
  global is installed. It is the engine's one runtime assertion about the worker
  it was handed, and a failure settles `worker-error` rather than surfacing
  inside the learner's program.
- **haltOrigin** — `'worker'` or `'engine'`: which SIDE authored the halt on the
  settlement. Every worker-side stop is `'worker'`, whether the consumer's
  `serializeHalt` wrote it or the engine's worker-side default did; the creation
  gate's stop is `'engine'`, authored on the thread. A consumer that supplied a
  `serializeHalt` reads it to know whether the payload is its own; one that
  omitted it receives an `EngineHalt` everywhere and knows so statically. Either
  way the discrimination is structural rather than an inspection of the payload.
- **phase** — where a `'throw'` halt's error arose, `'creation'` or
  `'evaluation'`; typed `HaltPhase`, and never a settlement field. The engine
  passes it as an ARGUMENT to `serializeHalt`; whether it survives into the
  payload is the consumer's choice. Only the engine's own default author, and
  the creation gate, guarantee the field. **creation** is before the program ran
  — the `'function'` path's `new Function` construction, or the creation gate on
  the other two. **evaluation** is while it ran, whatever the error's own type.
  The spelling is deliberate: it lines up with the embodiment's
  `source → tokens → ast → environment → evaluation` lifecycle, so a parse
  failure reads as "never reached evaluation" in vocabulary a learner meets
  elsewhere.
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
- **evaluator kind** — the consuming contract an evaluator implements atop this
  engine. Its outcome vocabulary, its shape, and its names are its own, never
  the engine's; the engine neither imports nor validates it.
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
- **halt** — the structured stop payload a settlement carries on `halt`.
  Authored worker-side on every worker-side stop by `serializeHalt` (or the
  engine's default) and posted by the bootstrap, exactly once, natural end
  included; authored thread-side on the one creation-gate stop. `haltOrigin`
  discriminates the two, structurally. A timeout, a cancel, a fail, or a worker
  crash carries **no** halt — a program can cause those and they are still not
  halts, because the genus is the carriage, not the blame. A gate stop carries
  no `HaltKind`: that vocabulary says why a WORKER stopped on its own, and a
  refused program never reached one. How the engine's internal stop record is
  shaped is `evaluate.ts`'s business, not this contract's.
- **serializeHalt** — the consumer's worker-side halt author:
  `(kind, rawError, phase?) → clone-safe payload`, kinds `'natural-end'` and
  `'throw'`; `phase` (`'creation' | 'evaluation'`) present exactly on throws.
  Owns limit classification; preserves worker-only attribution. It does not run
  on a creation-gate stop — there is no worker to run it in.
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
- **sandbox** — the killable worker a run executes in; spawned on first pull,
  torn down on every stop path. Module or classic is the toolchain's answer (§
  Public API, the pairing rule); the engine spawns whatever the factory returns.
- **global lexical environment** — the realm's declarative half: where a
  script's top-level `let`, `const` and `class` bindings live. They never become
  properties of the global object, but every free name in that realm — including
  one the engine's own worker-side modules read — resolves through them first.
  It is why the `'script'` path's shadowing surface is wider than `globalThis`
  alone.
- **realm** — one side of the worker boundary, identified by its global object.
  The engine spans two: a program runs in the worker realm and shares its global
  object with the engine's own worker-side code, while the thread realm's
  globals are unreachable from the program. The same expression is therefore
  safe on one side and exposed on the other, so
  [worker/README.md § Realms](./worker/README.md) fixes each file's realm by its
  import graph rather than by inspection.
- **latched built-in** — a worker-side capture, taken at module load before any
  program can run, of the exact callable or object the engine will use
  afterwards. Every ambient global the engine resolves in the worker realm is
  latched; the thread realm is unreachable from the program and is left live.
  Latching fixes the **binding**, not the object: it survives a rebound global,
  and a callable capture also survives a mutated namespace, but an engine and a
  program sharing a realm share the intrinsics and no capture defends against
  that. Unlatched, the failure is silent and misattributed — the halt never
  posts, so a program that finished instantly settles `timed-out`. (Distinct
  from the settle-once "latch" the evaluator machine uses for first-write-wins;
  same word, unrelated concept.)
- **ambient name** vs **ambient global** — the _name_ is the identifier a module
  writes; the _global_ is the value that name resolves to. The distinction is
  load-bearing rather than pedantic: whether a capture sits at module scope is a
  question about names and is decidable by reading the source, while whether a
  capture took the callable or the namespace it hangs off is a question about
  values and is not. The two halves are verified separately
  ([worker/DOCS.md § What counts as compliant](./worker/DOCS.md#what-counts-as-compliant)).
- **time budget** — the `seconds` limit. Counts only while the worker is
  unblocked: paused while a yielded item awaits the pull and while `onCall`
  runs. When it fires while an emission is pending thread-side disposal, it
  reschedules for the positive remaining budget; an exhausted budget times out
  even then.
- **yield charge** — a flat per-YIELD deduction approximating the thread-side
  cost of one emission cycle, keeping render-bound loops finite in wall-clock
  terms. Drops are never charged it, and a consumer that emits at every program
  step waives it per run with `yieldCharge: false` — the fee alone, never the
  pauses.
- **lazy pull** — no work until the first pull or result access; the handle is
  fully lazy. Laziness governs when the run starts; the drain governs who pulls
  after.
- **fake transport** — the engine-shipped reference test double. It
  structured-clones every payload (clone-safety enforced in Node tests) and
  services calls synchronously. The agnostic conformance tier runs against the
  real transport AND the fake, so the fake cannot drift — but only the real
  transport evidences transport fidelity.

## Bounded context

**Owns**: the creation gate (the thread-side parse of the module and script
goals, and the acorn version that fixes the language level); the `'script'`
path's setup-time capability probe; worker lifecycle (spawn, ready handshake,
terminate-on-every-path); the transport (emit/call, pause protocol,
shared-memory layout, the bounded call channel); the time budget and yield
charge; the termination machine and settlement; the draining result surface
(`result` settles without iteration); freezing its own structures (items at
yield, the items array and settlement at settlement); the fake transport and the
conformance suites.

**Does not own**: payload shapes and vocabularies (consumer logic); deep
freezing of consumer payload interiors — halt, refinement, failReason
(downstream owners deep-freeze their own data); instrumentation and any non-time
limit (instrumentation + `serializeHalt` + `refineError`); mock behavior (worker
logic + `onCall`); whitelisting (consumer logic, either side); an evaluator
kind's contract — its own spec and handle types, event unions, refusal-as-data,
pending-interaction suspension (the kind's distinguished event and its respond
channel, built by an evaluator atop emit/call), and every mapping from an engine
settlement onto the kind's (the evaluators region); hosting headers (COOP/COEP
are the host page's concern); worker construction (the consumer's worker factory
builds the `Worker`; the engine spawns only what it is handed — adjacency and
the worker-type/execution-path pairing are consumer obligations, doc-enforced,
and a mismatch fails at load or at the script path's setup probe); and the
latching of consumer worker logic's own built-ins — `setup`, `serializeHalt` and
the injected globals all run in the worker realm alongside the program, and
`serializeHalt` runs after it, so the engine latches the engine's resolutions
and consumer logic latches its own
([worker/README.md § Realms](./worker/README.md)).

**Placement**: the engine is a shared leaf of the study-lenses package
(`src/lib/study-lenses/lib/engine/`). It depends on **no region of this
package**, which is the load-bearing property — importability, not
import-freedom: every region, and any consumer beyond this package, imports it
directly without acquiring a sibling's dependencies. Its one external dependency
is acorn, a third-party parser, imported thread-side for the creation gate and
never shipped into a worker chunk.

**Vocabulary bridges**: what an evaluator emits as an _event_ is, to the engine,
an opaque _item_. The engine's `EngineHandle` is not an evaluator's own stream
or handle type — an evaluator wraps this handle to implement its own. The
engine's _settlement_ — five outcomes — is not an evaluator kind's _settlement_;
an evaluator maps the former onto the latter, under whatever arms and names its
kind declares. Likewise the engine's `EvaluateSpec` is not a kind's own spec
type: an evaluator builds the former from the latter on every run. A worker
_crash_ is not a _halt_ — crash is the worker-error termination cause, carrying
an engine error and no halt. And a _halt_ is not always the consumer's:
worker-side halts are bootstrap-posted through `serializeHalt`, exactly once,
while the creation gate's is engine-authored on the thread — `haltOrigin` is the
discriminant, never the payload's shape.

## Navigation

- [DOCS.md](./DOCS.md) — architectural sketch, data flow, decision records
- [notional-machine.md](./notional-machine.md) — the machine twin: how the
  engine runs a program, and what a program can and cannot do to it
- [types.ts](./types.ts) — the engine contract
- [worker/README.md](./worker/README.md) — the transport internals and the two
  realms
- [../README.md](../README.md) — the shared-leaf `lib/` directory
- [../../evaluators-deprecated/README.md](../../evaluators-deprecated/README.md)
  — the DEPRECATED evaluator kind: a frozen consuming contract implemented on
  top of this engine, and this document's worked example
- [../../README.md](../../README.md) — the study-lenses package root
