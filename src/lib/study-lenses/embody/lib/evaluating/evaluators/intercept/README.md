# evaluating/evaluators/intercept

A standalone **intercept evaluator**: it runs a Just-Enough-JavaScript program
in the generic engine's sandbox and streams **host-boundary I/O events** —
console calls and the three dialog round-trips (`alert` / `confirm` / `prompt`)
— pausing the program at each dialog so a consumer can answer it live, then
settles with a typed halt that records how the run ended (a natural end or a
throw).

It is a peer of the [`../tracers/`](../../tracers/) tiers on the engine
([`../../../../../lib/engine/`](../../../../../lib/engine/)), but it is an
**evaluator, not a tracer**: it performs **no instrumentation**. It never
rewrites the program and never looks inside the runtime. It only replaces the
host's missing I/O globals (`console`, `alert`, `confirm`, `prompt`) with
**global mocks** injected at the worker boundary, so the only thing it observes
is what the program does at the edge — the same distinction the notional machine
draws between the machine's interior and its environment. **`evaluator` names a
category** (`intercept` today, `run` in future — an evaluator that observes the
boundary and happens to emit nothing); it is distinct from the embody
**`evaluation` phase** and the engine's **`evaluate`** call.

Code in, handle out — consumers never assemble engine parts. Like the variables
tracer, this evaluator produces **its own typed event union and settlement**;
the translation to embody's `AnyNMEvent` / `RunInstance` / `EndReport` is the
embody adapter's concern (see § Bounded context), not this evaluator's.

Its one authority is the intercept engine that preceded it — the behavior this
evaluator reproduces on the new engine:

- [`../../intercept/`](../../intercept/) (the former SAB-per-engine
  implementation) — **behavior oracle**: the consumer-facing
  console/dialog/error vocabulary and the call-then-emit dialog ordering this
  evaluator reproduces. Its `__$ic` node-path instrumentation and Blob-URL
  transport are **not** reproduced — they are exactly what moving onto the
  generic engine retires.
- [`../../shared/types.ts`](../../shared/types.ts) `InterceptEvent` /
  `ConsoleMethod` — **inspiration**: the existing event names this evaluator
  borrows, not a vocabulary it imports (the old dirs are tsconfig-excluded; this
  evaluator re-authors the shapes it needs).
- [`../../../../types.ts`](../../../../types.ts) `EmitNMEvent` / `ErrorNMEvent`
  — **correspondence**: the embody NM-event types a future embody adapter maps
  this evaluator's events onto (`TierFilters.intercept = [emit, error]`). This
  evaluator produces its own typed union; the adapter mapping is out of scope.

## Vocabulary pinning

The evaluator's **streamed event** names are pinned here. This table is the
naming contract; code, types, JSDoc, and tests use these terms. The **oracle**
column records the old intercept event this one reproduces (inspiration, not
import). The **embody correspondence** column names the `AnyNMEvent` type a
future adapter maps the event onto (reference, not a contract this evaluator
conforms to). Where a name deviates from the oracle, the deviation is deliberate
and noted in the glossary.

| Streamed event | Payload (beyond `step`)                                                                    | Oracle event   | embody correspondence                                 | Host producer                        |
| -------------- | ------------------------------------------------------------------------------------------ | -------------- | ----------------------------------------------------- | ------------------------------------ |
| console        | `method` (an open `string`; the 19 standard names, faithfully); `args[]` (clone-safe pass) | `ConsoleEvent` | `EmitNMEvent` `kind:'console'`, `method`, `args`      | any `console.<method>(…)` call       |
| alert          | `args[]`; no `returnValue` (yields `undefined`)                                            | `AlertEvent`   | `EmitNMEvent` `kind:'alert'`, `args`                  | `alert(…)` — one dialog round-trip   |
| confirm        | `args[]`; `returnValue` (`boolean`)                                                        | `ConfirmEvent` | `EmitNMEvent` `kind:'confirm'`, `args`, `returnValue` | `confirm(…)` — one dialog round-trip |
| prompt         | `args[]`; `returnValue` (`string \| null`)                                                 | `PromptEvent`  | `EmitNMEvent` `kind:'prompt'`, `args`, `returnValue`  | `prompt(…)` — one dialog round-trip  |

**The terminal error is not a streamed event — it is a typed halt on the
settlement.** A throw ends the run: the engine catches it and settles `errored`,
carrying a worker-authored halt (`errorName`, `message`). The evaluator does
**not** wrap the program in its own `try/catch` and does **not** stream an
`error` item — doing either would mask the throw as a natural completion. The
old intercept's `ErrorEvent` (with a `creation` / `execution` phase) is
reconstructed by the embody adapter as the run's terminal `ErrorNMEvent` from
that halt (see § Bounded context). The phase is **not** reproduced: the engine
collapses the program's construction (`new Function`) and execution into one
`throw` halt
([`../../../../../lib/engine/worker/bootstrap.ts`](../../../../../lib/engine/worker/bootstrap.ts)),
so the phase is not authorable worker-side; a construction `SyntaxError` is
near-unreachable for admissible JEJ, and embody's `ErrorNMEvent` carries no
phase.

## Glossary (ubiquitous language)

These terms propagate into types, JSDoc, DOCS.md, tests, and this README. Use
them consistently.

- **evaluator** — this module (and its category): a self-contained pipeline that
  turns a runnable JS source string into a stream of host-boundary I/O events
  plus a settlement. Distinguished from a **tracer** by _how it observes_: a
  tracer **instruments** the program (rewrites it to emit interior lifecycle
  moments); an evaluator runs the program **uninstrumented** and observes only
  the host boundary through **global mocks**. The category has two members —
  `intercept` (this module) and a future `run` (an evaluator that observes and
  emits nothing). Not to be confused with the embody `evaluation` phase or the
  engine `evaluate` call.
- **global mock** — the replacement `console` / `alert` / `confirm` / `prompt`
  injected into the worker as engine-provided globals (a worker has no native
  DOM dialogs, and its native `console` would escape observation). Each mock
  routes its call to the engine: `console` methods **emit**, dialogs **call**.
- **emit event** — a `console.<method>(…)` call. One-way: the mock hands the
  call to the engine's `emit`, the program pauses until the message is disposed
  of, then resumes. No value returns to the program (`console` returns
  `undefined`). `method` is carried as an open `string` — the 19 standard
  console names are reproduced faithfully, but an unlisted method still rides
  through rather than being dropped (matching the open `EmitNMEvent.method`).
- **dialog round-trip** — an `alert` / `confirm` / `prompt` call. Two-part and
  order-critical (**call-then-emit**): the mock first makes the engine's
  synchronous `call` — blocking the program until the thread answers — then
  **emits** the completed event carrying the answer as `returnValue`, then
  returns the answer to the program. The call is where the consumer supplies the
  answer; the emit is the record of what happened.
- **clone-safe args pass** — the check applied to a call's arguments before they
  cross the worker boundary: arguments that survive a structured clone ride as
  themselves; an argument that cannot be cloned (a function, a symbol) rides as
  its `String(…)` form so the emit never crashes the run. (Re-homed from the
  oracle's `safeCloneArgs`.)
- **io mock** — the consumer-supplied handlers (`IoMocks`: `console`, `alert`,
  `confirm`, `prompt`) that the **thread logic** invokes. A **console** mock is
  invoked as a **synchronous side effect** when a console message arrives (the
  engine's `onMessage` hook is synchronous — an async console mock runs but is
  not awaited before the program resumes; the panel's console mock is
  synchronous). A **dialog** mock is the **answer source** when a dialog call
  arrives, and it **is awaited** (the engine's `onCall` hook is async), so the
  answer may be asynchronous (a styled dialog the learner fills in); the
  program's time budget is paused meanwhile.
- **answer** — a dialog mock's result, returned to the program as the dialog's
  value, and recorded on the emit as `returnValue` at the embody boundary.
  `alert` → `undefined`; `confirm` → `boolean`; `prompt` → `string | null`. The
  set of answers is exactly the engine's `CallResponse`, so an answer rides the
  call channel with no coercion.
- **terminal error** — the throw that ends a run: a `SyntaxError` from compiling
  the program, or any throw during execution. It is **not** a streamed event; it
  is carried as the **halt** on the settlement (`errorName`, `message`) and
  mapped by the adapter to the run's terminal `ErrorNMEvent`. The `creation` /
  `execution` phase is not reproduced (see § Vocabulary pinning).
- **halt** — the worker-authored record of how the program stopped on its own: a
  natural end, or a throw with its `errorName` and `message`. The evaluator's
  halt author classifies natural-end vs. throw; the engine posts exactly one
  halt per worker-side stop.
- **worker logic** — the worker-side half: the injected global mocks, the
  clone-safe args pass, and the halt author (natural end vs. throw, with the
  thrown error's name and message).
- **thread logic** — the thread-side half: it invokes the consumer's io mocks
  and maps each opaque worker message to one typed event (dropping anything
  malformed). Unlike a tracer's thread logic it is **io-bound** — built per run
  around the consumer's `IoMocks` — because observing the host boundary _is_
  invoking the consumer's I/O.
- **handle / settlement** — the engine vocabulary this evaluator wraps: the
  handle is the lazy `AsyncIterable` + `result` + `cancel` + `fail`; the
  settlement is how the run ended (completed / errored / cancelled / failed /
  timed-out) plus its carried halt and duration. This evaluator narrows the
  stream to typed events and types the halt; the engine itself stays opaque.

## Bounded context

This evaluator **owns**: the global-mock injection (console/dialog); the
clone-safe args pass; the worker logic and its thin worker entry; the io-bound
thread logic; the built generator and its typed facade; the worker-side halt
author (natural end vs. throw, with the thrown error's name and message).

It does **not** own, and explicitly excludes:

- **The embody adapter mapping.** Translating the streamed events into
  `EmitNMEvent`, the settlement into `RunInstance` / `EndReport`
  (outcome-vocabulary map, `ok`-axis, `runMetrics`, the authoritative
  deep-freeze), and reconstructing the run's terminal `ErrorNMEvent` and
  `EmbodyError` from an errored halt, belong to the embody adapter.
- **The JEJ admission gate and the _not-runnable_ short-circuit.** This
  evaluator assumes a runnable JS string and never re-parses or re-validates; it
  is an internal entry, and the adapter is its only caller. Admission lives in
  the **adapter**, not here, for a contract reason — not an arbitrary asymmetry
  with the variables tracer. The variables tracer self-gates and _throws_
  because its consumer (`traceVariableLifecycle`) is permitted to throw. The
  embody `intercept()` member, by contrast, must **return a handle and never
  throw** (canned scenarios and non-JEJ input both return a handle). The
  not-runnable-without-throwing decision must therefore be made where the
  not-runnable shape is produced — the adapter — which self-gates on JEJ
  admission rather than trusting a create-phase status that has not yet landed.
  A redundant self-gate in the evaluator would only double-parse.
- **Instrumentation and interior observation.** No AST rewrite, no `__$ic`
  node-path stamping, no per-call wrapping, no variable/scope/expression events.
  An evaluator sees only the host boundary. Consequently no event carries a
  `nodePath`, the error phase is not distinguishable (above), and `loc` on the
  corresponding embody event is `null` until a future instrumented tier supplies
  it.
- **The iteration limit.** The engine owns only the time budget (`seconds`); a
  runaway loop ends `timed-out`. Enforcing an `iterations` cap would require
  loop instrumentation (an AST touch, against an evaluator's nature); it is
  deferred, and `EvaluateOptions.iterations` is accepted but not yet enforced.
- **Event linking, replay, the AST record, `visitCounts`.** The oracle's
  doubly-linked timeline, `node.events` back-references, re-iteration replay,
  and per-node visit counts are not reproduced — no consumer of this milestone
  reads them, and the embody contract does not require them.
- **The `run` and `trace.*` tiers, and retiring the old `intercept/` dir.** This
  module wires only `evaluation.events.intercept`; `run` is a future sibling
  evaluator, and deleting the superseded `intercept/` directory is a later step.

The full 19-method console surface and the console `method` string are
reproduced for host-boundary **fidelity**; no `AnyNMEvent` consumer in this
milestone discriminates on a method beyond what the panel shows (`console.log`),
and `EmitNMEvent.method` stays an open `string`.

## Structure

| File                        | Purpose                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                  | The streamed-event union, handle, options, result, and typed halt; the worker→thread message envelope and the dialog call-request shape (the two seams) |
| `intercept-evaluate.ts`     | Public entry: `interceptEvaluate(code, { seconds?, io? }?)` — assemble the engine spec, build the generator, return the handle                          |
| `intercept-worker-setup.ts` | Worker logic: injects the console/dialog global mocks + clone-safe args pass; authors the halt (natural end vs. throw)                                  |
| `intercept-worker-entry.ts` | Thin worker entry wiring the engine bootstrap to the worker logic                                                                                       |
| `intercept-thread-logic.ts` | Thread logic: an io-bound factory that invokes the consumer's io mocks and maps worker messages to typed events                                         |

## Navigation

- Enclosing module front door: [`../../README.md`](../../README.md) (the
  `evaluating/` module)
- The engine it consumes:
  [`../../../../../lib/engine/README.md`](../../../../../lib/engine/README.md)
- The structural template (a sibling tier that composes the engine):
  [`../../tracers/variables/README.md`](../../tracers/variables/README.md)
- The behavior oracle: [`../../intercept/README.md`](../../intercept/README.md)
- Architecture and data flow: [`./DOCS.md`](./DOCS.md)
- The contract: [`./types.ts`](./types.ts)
