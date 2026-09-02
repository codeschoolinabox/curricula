# engine — Architecture & Decisions

Vocabulary: [README.md § Glossary](./README.md). The outcome table and what each
settlement carries: [README.md § How a run ends](./README.md). A downstream
vocabulary an evaluator maps onto — the DEPRECATED region's kind, kept here as
the worked example:
[evaluators-deprecated/types.ts](../../evaluators-deprecated/types.ts) §
Settlement.

## Architectural Sketch

> Written Phase 0, before implementation. The Refactor step is held against this
> document — not what the code does, but what shape it takes.

### Execution phases

1. **Lazy handle** (sync) — the factory runs nothing: it assembles a handle
   whose first pull (or result access) starts the run. A cancel or fail before
   the run starts (first pull or result access) settles immediately; no worker
   is ever spawned. Result access starts the run like a first pull; from the
   first item that becomes ready with no consumer iterator in existence, the
   engine drains on the consumer's behalf (phase 3) — `result` always settles.

2. **Creation gate** (sync, first pull or result access, before anything is
   spawned) — on the `'module'` and `'script'` paths only, acorn parses the code
   at `ecmaVersion: 'latest'` on the corresponding goal. A program the parser
   REFUSES settles `errored` from here: the worker factory is never invoked,
   **no transport is constructed**, and no shared memory is allocated: the gate
   precedes every run resource, which is the landmark to hold an implementation
   against. The stop record is an `EngineHalt` the thread authors, carrying
   `phase: 'creation'` and acorn's position, with `haltOrigin: 'engine'`, routed
   through the same errored-halt classification a worker-authored throw takes,
   so `refineError` fires on it unchanged. `'function'` is not parsed:
   `new Function` is its own gate.

   **A gate that cannot decide defers.** Only a parse REFUSAL settles the run
   here; a parser failure that reaches no verdict — acorn exhausting its own
   call stack — is caught, and the run proceeds as though the path were ungated.
   So the gate has one refusal shape and no throwing exit: nothing propagates
   synchronously out of a pull or a `result` access.

3. **Sandbox start** (async, first pull or result access) — a worker is spawned
   via the spec's worker factory (which loads the consumer's thin worker entry;
   module or classic is the toolchain's answer, and it pairs with the execution
   path); readiness is confirmed by handshake; shared memory, the worker config
   and the execution path are delivered at setup, where the `'script'` path
   probes `importScripts` before any global is installed; the consumer's worker
   logic returns its globals (validated as identifiers, loudly, on every path)
   and optional halt serializer; the code is delivered and run via one of THREE
   paths selected by the spec's `execution` preference — the `'function'` path
   wraps it in `new Function` (globals as parameters, strict per the `strict`
   preference); the `'module'` path runs it as an ES module from a blob URL
   (globals installed on globalThis, always strict — the `strict` preference is
   inert); the `'script'` path runs it as a genuine Script Record via
   `importScripts` on a blob URL (globals installed on globalThis, the program's
   bytes verbatim — the `strict` preference is inert here too, nothing is
   prepended, so a script is sloppy unless it says otherwise). Both
   blob-carrying paths revoke their object URL on every exit. Three kinds of
   code-level `SyntaxError` still reach the worker — `new Function` construction
   on the unparsed path; a script instantiation failure the gate cannot see
   (`let NaN = 1`); and the real syntax error of a program the gate ABSTAINED
   on, which the host's own parser reports here — and each is caught there and
   surfaced as a worker-authored throw halt, settling `errored`, never a
   worker-error (which is reserved for environment, factory, and setup
   failures). Environment failures — shared memory unavailable, a throwing
   worker factory — are worker-error terminations with the condition in the
   engine error, never throws; consumer setup failures (invalid global keys, a
   throwing setup, clone-unsafe worker config) settle the same way; and an
   engine-internal defect (a contract-violating value that reaches runtime, e.g.
   a factory returning a non-`Worker`) settles loudly the same way, the defect
   named in the engine error — the engine never hangs and never throws.

4. **Streaming** (async, per message) — the running program emits messages one
   at a time under the pause protocol; each is handed to the message hook and
   either dropped (immediate resume) or yielded (frozen at yield; the worker
   resumes on the next pull — the consumer's, or the engine's own when draining
   an unclaimed stream). Synchronous round-trips block the worker until the call
   hook's awaited response is written back over shared memory. Worker-post order
   is preserved — emissions and call requests are serviced FIFO as posted, and a
   call round-trip completes before the worker proceeds (consumer dialog
   patterns — call, then emit carrying the returned value — rely on this). The
   time budget counts only while the worker is unblocked.

5. **Stop** (first writer wins; async on the in-flight-call path) — either the
   worker stops on its own — synchronously at the `'function'` and `'script'`
   paths' natural ends, or asynchronously when the `'module'` path's
   module-evaluation promise fulfills (work scheduled beyond the natural end, a
   pending timer, never runs on any path); a rejecting module evaluation and a
   throwing script both reach the halt author as a throw, exactly like a
   function-path throw; the bootstrap posts exactly one halt whichever path ran,
   authored by the consumer's halt serializer or the engine default — or the
   thread stops the run (cancel, fail with payload, timeout, worker crash, call
   error, hook error), or the creation gate refuses it before any worker exists.
   The halt and the termination causes claim the same first-write-wins slot:
   exactly one stop settles a run; anything later — including after settlement —
   is a no-op. When a call is in flight, stop processing awaits it (discarding
   the response) before teardown — the one async leg of stopping.

6. **Settlement** (sync) — the outcome is classified from structured stop data;
   the refinement hook runs on errored halts; the settlement (outcome, carried
   data, consumed-budget duration) and the items array are frozen; the sandbox
   is torn down — on every path.

### Data flow

```mermaid
flowchart TD
    SPEC[spec<br/>code · worker factory · worker config ·<br/>thread logic · seconds · strict · execution ·<br/>yield charge] --> HANDLE[lazy handle<br/>no work before first pull or result access]
    HANDLE -->|cancel or fail before the run starts| SETTLE
    HANDLE -->|first pull or result access| GATE{creation gate<br/>acorn, thread-side, 'latest'<br/>module and script goals only}
    GATE -->|the parser REFUSES it — no spawn,<br/>engine-authored halt, phase 'creation'| FWW
    GATE -->|"parses, is not parsed ('function'),<br/>or the parser could not decide —<br/>spawn · handshake · setup, where<br/>'script' probes importScripts first"| RUN[running program in the sandbox<br/>'function': globals as parameters, sync end<br/>'module': globals on globalThis, async end<br/>'script': globals on globalThis, sync end]
    RUN -->|emit: clone-safe message,<br/>pauses until disposed| MSG[message on thread]
    MSG -->|message hook| DY{drop or yield?<br/>items frozen at yield}
    DY -->|drop — immediate resume| RUN
    DY -->|item — resume on next pull| STREAM[consumer stream<br/>when an iterator claims it]
    DY -->|item — engine pulls on the consumer's<br/>behalf when no iterator claims the stream| DRAIN[engine drain<br/>to settlement]
    DRAIN --> RESULT
    RUN -->|call: sync round-trip| CALL[call response<br/>string · boolean · null · undefined · bounded]
    CALL --> RUN
    RUN -->|halt — authored worker-side,<br/>posted once per worker-side stop| FWW[one first-write-wins stop slot]
    TERM[termination causes<br/>cancel · fail · timeout · worker error ·<br/>call error · hook error] --> FWW
    FWW -->|classify · refine errored halts · freeze| SETTLE[settlement<br/>outcome · halt? · haltOrigin? · refinement? ·<br/>failReason? · error? · durationMs<br/>sandbox torn down]
    STREAM --> RESULT[result<br/>frozen items + settlement]
    SETTLE --> RESULT
```

### Structural constraints

- **Pause-protocol ordering** (correctness, not style): both flags are armed
  before the message is posted; the event-ready flag is cleared before the pause
  is released; the pause is released before the timer is re-armed; the timer
  handler deducts elapsed budget before consulting the event-ready flag, and
  reschedules only with positive remaining budget. A paused program with a
  pending message is rescheduled rather than timed out while remaining budget is
  positive; an exhausted budget times out even while paused.
- **Stops block** — the termination machine's non-negotiables:
  - Exactly one stop wins: the halt claims the same first-write-wins slot as the
    termination causes; later stop requests — including any after settlement —
    are no-ops.
  - Teardown-without-resume: a stopping run never releases the pause; the worker
    is terminated while still paused.
  - In-flight call servicing is uninterruptible: the engine awaits the call
    hook, DISCARDS the response (no shared-memory write-back), then tears down.
  - A stop wakes any pending pump wait — the wake is unconditional (a sentinel),
    never conditional on queue state.
- **Timer semantics**: the budget arms when the code begins running — spawn,
  handshake, and setup are never charged. The yield charge attaches per yield
  (item pulled — by the consumer, or by the engine when draining), never per
  drop — a dropping high-frequency consumer must not time itself out; drops cost
  only worker-active time. The budget pauses while a yielded item awaits the
  pull and while the call hook runs. A consumer that emits at every program step
  waives the fee with `yieldCharge: false`; the PAUSES are unconditional, so a
  waived run still stops its clock for yield-waits and call servicing, and still
  times out on real wall-clock time. Because the budget arms only when the code
  begins running, a run that never gets there — refused at the creation gate, or
  ended by an environment failure — reports `durationMs: 0` by that same rule
  rather than by a special case. The gate's own parse is not charged: it is
  synchronous on the calling thread and outside the budget entirely.
- **The natural end ends the run — on all three paths.** Work scheduled beyond
  it (a pending timer) never runs. `'function'` and `'script'` end
  synchronously, `'module'` asynchronously when its evaluation promise settles;
  the asynchrony changes WHEN the stop fires, never whether trailing work runs.
- **Freeze at yield; freeze at settlement.** The engine freezes its OWN
  structures — each yielded item, the items array, the settlement object — and
  never deep-freezes consumer payload interiors (halt, refinement, failReason);
  downstream owners deep-freeze their own data (e.g. an evaluator's own deep
  pass).
- **Classification reads structured data only.** Stop kinds, causes, and the
  engine error's cause are discriminated values; the engine never interprets
  consumer payloads — domain knowledge in the engine is the anti-goal.
- **Consumer hooks fail loudly, structurally.** A throwing thread hook is an
  engine-made hook-error termination (a refinement-time throw keeps the halt,
  drops the refinement); a throwing halt serializer is a worker crash; consumer
  setup failures settle as worker-error. The engine surfaces failures as
  settlements, never thrown exceptions.
- **Result always settles — the engine drains an unclaimed stream** (sole
  exception: the abandoned claimed stream, below). The drain engages at the
  engine's first on-behalf pull (an item ready with no consumer iterator in
  existence), never at result access itself. An iterator created before any
  engine pull owns the stream (full backpressure); one created after the
  engine's first pull is the unsupported concurrent case (one stream, silently
  split). The one suspension is an abandoned claimed stream: an iterator created
  and then walked away from — whether or not it ever pulled — holds the run;
  break or cancel is the exit.
- **Worker-post order is preserved.** Emissions and call requests are serviced
  FIFO as posted.
- **Environment failures are settlements, never throws** — shared memory
  unavailable and a throwing worker factory settle as errored with the condition
  in the engine error. Serving the cross-origin isolation headers (COOP/COEP) is
  the host page's responsibility.
- **The engine spawns only what the factory returns, and asserts one thing about
  it.** Worker construction is consumer-owned and the engine asserts nothing
  about the worker at runtime — module-vs-classic, adjacency, bundler — **except
  the `'script'` path's `importScripts` capability probe**, which runs at setup,
  before any consumer global is installed, and settles a mismatch as
  worker-error. The carve-out is bounded to that one path and that one question.
  A _throwing_ worker factory is a worker-error settlement; a factory returning
  a non-`Worker` is a consumer-side type error (it lands on the internal-defect
  path if it reaches runtime). Adjacency and the worker-type/execution-path
  pairing are consumer obligations, doc-enforced (§ Why this design → Module
  workers), never type-enforced.
- **The engine's source transformations are a closed set of exactly one.** The
  `'function'` path prepends `"use strict";\n` when the consumer asks for it.
  Nothing else rewrites the program's bytes: the `'module'` and `'script'` paths
  deliver it verbatim, and the creation gate READS without writing. This is
  stated as a set so a future increment has to change the set rather than add
  quietly to it — the retired module line-1 marker would have been the second
  member, and declining it is why acorn is here.
- **Halts have two authoring SIDES, and the engine's own payload is typed.**
  Worker-side stops are authored by `serializeHalt` — or, when the consumer
  supplies none, by the engine's worker-side default — and posted by the
  bootstrap; the creation gate's is authored on the thread. `haltOrigin` is
  present exactly when `halt` is and names the side; a consumer narrowing the
  halt to its own shape reads THAT, never the payload. Every payload the ENGINE
  authors is one exported `EngineHalt` — shared `{ name, message }` core,
  optional `phase`, optional `line`/`column` that only the gate fills. The type
  is the single place that literal is written; once Phase 1 annotates the
  authors with it, a compiler rather than a conformance test is what keeps them
  from drifting.
- **A blob-carrying path revokes its object URL on every exit.** `'module'` and
  `'script'` both deliver the program as a blob and both revoke in a `finally`,
  throwing path included. `importScripts` is synchronous, so the script path's
  revoke lands on the same turn as its execution — identical discipline,
  different turn boundary (worker/DOCS.md § Capture order).
- **`strict` is honored on `'function'` alone.** `'module'` is always strict by
  the language's rule; on `'script'` it is an ignored input, because the engine
  prepends nothing. Moving a snippet between those paths changes its strictness
  silently — a consumer-visible cost accepted for fidelity.
- **The gate's language level is contract, not configuration.** `ecmaVersion` is
  `'latest'` — a gate must never be stricter than the instrumenters whose output
  it receives — and acorn's version pins exactly, so the level cannot move under
  a learner on an `npm update`. That pin is a repo-wide manifest edit shared
  with every other acorn reader here.
- **The sandbox is torn down on every path.**

### Out of scope

- Instrumentation and every non-time limit (iteration counts, step budgets,
  domain rules) — the evaluators own them; the engine transports their halt
  payloads and refinements opaquely.
- Payload vocabularies: NM events, categories, whitelists — consumer logic on
  either side of the boundary.
- PEDAGOGICAL gates and refusal — downstream concerns (the evaluators region's:
  embody's evaluation-phase gate and an evaluator's refusal-as-data both decide
  whether a program should be run at all, and both fire before the engine is
  ever invoked). The engine's own creation gate is a different thing under the
  same word: it decides only whether the program PARSES on the goal it was posed
  as, and it is owned here (§ Execution phases, item 2).
- Deep-freezing consumer payloads — downstream owners freeze their own data
  (e.g. an evaluator's own deep pass).
- Replay by re-iterating a settled handle — the result's items array is the
  cache; each evaluate call is a fresh run.
- Inferring the execution path from the code — the engine never sniffs for
  `import`/`export`; path selection is consumer-owned (the consuming lens maps
  the snippet type onto the path). **Reading is not inferring**, and the
  boundary is stated rather than left to be deduced: the creation gate parses
  the code to classify a FAILURE PHASE for the path it was already given. It
  never lets what it read choose the path.
- Choosing a toolchain that can run the requested path — `'script'` needs a
  worker the bundler emits CLASSIC, and asking for it under a toolchain that
  produces module workers gets a worker-error settlement from the capability
  probe rather than a run. The engine detects the mismatch; it does not choose
  the build.
- COOP/COEP hosting headers; caching; per-run indexes; derived analytics;
  rendering and pedagogy.

## Why this design

### Module workers, thin per-consumer entries

Module workers make the worker-side protocol a single typed, directly-testable
module — the blob-URL alternative forces the protocol to be inlined as
duplicated worker-script strings, which is exactly the drift this engine exists
to end. Each consumer ships a thin worker entry (a few lines wiring the engine's
bootstrap to that consumer's worker logic) rather than receiving modules
dynamically: bundlers stay static, and heavy instrumentation that registers
itself at module load ships only into the runs that use it. Dynamic module
delivery is rejected — it has no pedagogical case and real bundler risk. (The
rejection covers consumer LOGIC modules; the learner's program arriving as an ES
module on the `'module'` execution path is the execution axis at work, not
dynamic logic delivery.)

The spec carries a **worker factory** (`() => Worker`), not a worker URL,
because the consumer — not the engine — must own the `new Worker(new URL(...))`
expression. webpack 5's static worker detection only emits a real worker chunk
when `new Worker(new URL('./entry.ts', import.meta.url), { type: 'module' })` is
ONE syntactically adjacent expression in the consumer's module; the older
URL-in-the-spec form split that across modules (the consumer built the URL, the
engine's `transport.ts` did the `new Worker`) and webpack emitted the entry as a
raw `.ts` asset that crashes at load. Vite resolves the split — which is why
this hid behind green browser tests until a real `npm run build` exposed it. The
factory keeps the URL a static literal, so "bundlers stay static" still holds.

Two consequences are deliberate. **(1) The duplicated adjacent
`new Worker(new URL(...), { type: 'module' })` across consumers is
load-bearing.** A centralizing helper (`moduleWorker(url)`) would move the
`new Worker` into the helper's module — re-splitting it from the consumer's
`new URL` and re-breaking webpack. Do NOT DRY it up. **(2) The engine no longer
guarantees `{ type: 'module' }`, and the worker's type PAIRS with the execution
path** — a consumer that omits the option under a toolchain that honors it gets
a classic worker whose ESM imports fail, while webpack strips the option and
emits every worker chunk classic regardless, which is both why the `'module'`
path keeps working in production and why `'script'` is possible there at all.
The imperative stays unconditional (keep the option); what is conditional is
what the toolchain does with it. Neither constraint is type-enforceable
(`() => Worker` can't encode the options, and a branded wrapper to enforce them
is exactly the forbidden helper), so the guard is documentation by necessity —
see the `workerFactory` JSDoc and README § Public API. The measured basis is the
client build at ~90% certainty; the real engine's worker has not been run inside
a production page, which is why the `'script'` path probes rather than trusts.

### One author for the engine's own payload

The engine authors a stop payload in two places — the worker-side default, when
a consumer supplies no `serializeHalt`, and the creation gate — and the fake
transport carries a third copy of the first. `EngineHalt` types all three, and
Phase 1 extracts the author itself into `worker/` so there is one implementation
as well as one type.

`worker/` is the right home for a reason that outlives any test: realm is fixed
by the import graph, and a module `bootstrap.ts` imports is worker-realm by that
rule — placing it elsewhere would put a worker-realm module outside the
directory whose rule governs it, and incidentally outside the predicate that
mechanizes that rule. The cost is three edits into another unit's committed
suite, not one: the live realm-classification row gains a filename; the pinned
capture set for `bootstrap.ts` LOSES `Error` and `String`, because the extracted
author is what reads them; and the new module takes on its own latch obligation
for those two names. Named here so the second unit to arrive inherits it rather
than discovers it.

### Fully opaque items

The engine's only payload constraint is structured-clone safety. Event
vocabularies, whitelists, and category filtering are consumer logic — the engine
is tested once, generically, and the anti-goal is any engine code that
interprets a payload. What an evaluator emits as an event is, here, an opaque
item.

### Time is the engine's only limit

Time cannot be enforced from inside the evaluated program; every other limit can
— injected loop guards, advice counters. So the engine owns the budget and the
termination machine, and every other limit lives in instrumentation, classified
worker-side (inside the halt serializer) and refined thread-side (the refinement
hook). The budget measures the learner's program, not the learner: it pauses
during yield-waits (think time on a step) and call servicing (styled dialogs),
and a flat per-yield charge keeps render-bound loops finite in wall-clock terms
for consumers that emit selectively. That last part does not generalize: an
evaluator emitting at every program step exhausts a default budget through the
fee alone, with almost no real runtime — so a run may waive the fee
(`yieldCharge: false`), and loop safety for those consumers rests on the
iteration cap they already carry. The pauses never lift, so the wall-clock
guarantee survives the waiver. The five generic outcomes stay generic for the
same reason — limit-exceeded is a downstream interpretation of an errored halt
plus a refinement, not an engine concept.

### Worker-side halt authoring

The halt payload is authored in the worker, by the consumer's halt serializer,
on every worker-side stop — natural end included. Attribution that exists only
worker-side (a node path stamped on an error as it propagates) and the
classification of non-Error throws survive the clone boundary because the
payload is built where they live. Limit classification happens in the same
place: only the worker logic knows its own limit-throw shape, so the engine
never has a limit kind, the thread never matches message strings, and an
unguarded learner RangeError can never be misclassified as an instrumentation
limit. Natural ends pass through the same author, which is how worker-only run
metrics (iteration counts) reach completed settlements.

### A fake transport with honestly-scoped conformance

Consumer logic is pure given the engine's two-sided API, so consumer logic tests
bottom-up in Node against the engine-shipped fake transport. The fake
structured-clones every payload — clone-safety violations surface in cheap unit
tests, not in a browser. Two conformance tiers keep the fake honest about what
it can and cannot prove: the agnostic suite runs against the real transport AND
the fake (logic, drop-vs-yield, settlement classification), while the transport
suite is real-only (Atomics blocking, pause ordering, payload ceiling, timer
behavior). A green fake is evidence for logic, never for transport fidelity.

### Lazy pull, draining result

Handle construction does no work: the worker spawns on the first pull or result
access. Cancel-or-fail before the run starts settles without ever spawning;
breaking out of a `for await` routes through the termination machine exactly
like cancel; and a `result` awaited without an iterator drains engine-side to
settlement — so no consumer ergonomic can leak a worker or hang a promise.
Laziness governs when the run starts; the drain governs who pulls after — two
orthogonal axes, both engine-owned. The drain lives in the engine, not in a
wrapper above it, because a settling `result` is critical behavior: any consumer
of the standalone module needs it, evaluator or not.
