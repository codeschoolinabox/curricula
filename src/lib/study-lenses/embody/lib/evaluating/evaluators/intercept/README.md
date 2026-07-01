# evaluating/evaluators/intercept

A standalone **intercept evaluator**: it runs a Just-Enough-JavaScript program
in the generic engine's sandbox and streams **host-boundary I/O events** —
console calls and the three dialogs (`alert` / `confirm` / `prompt`), each
carrying its source location — pausing the program at **every** I/O moment until
the consumer's mock settles (a dialog until it is answered; a console call until
its mock finishes — the pause that makes quizzing and reactive animation
possible). It enforces the consumer's **iteration limit** and settles with a
typed halt that records how the run ended (a natural end, a throw, or the
limit).

It is a peer of the tracer tiers under [`../../trace/`](../../trace/) on the
engine ([`../../../../../lib/engine/`](../../../../../lib/engine/)), but it is
an **evaluator, not a tracer**. The axis is _what is observed_: a tracer
instruments the program to observe its **interior** (variables, scopes,
expressions); an evaluator observes only the **host boundary** — what the
program prints and which dialogs it opens — through **global mocks** injected at
the worker boundary (`console`, `alert`, `confirm`, `prompt` — a worker has none
of these natively). An evaluator's only source rewrites are **light,
line-preserving, observation-free splices**: an iteration guard (limit
_enforcement_) and call-site loc stamps (boundary _attribution_). Neither
observes anything the boundary does not already show. **`evaluator` names a
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
  console/dialog/error vocabulary, the awaited io mocks (its thread awaited
  `io.console[method]` before releasing the worker), the call-then-emit dialog
  ordering, and the same-line call-wrap attribution this evaluator reproduces
  (loc-valued instead of nodePath-valued). Its Blob-URL transport and SAB pause
  machinery are **not** reproduced — the generic engine owns them now.
- [`../../shared/guard-loops/`](../../shared/guard-loops/) — **behavior oracle**
  for the iteration guard: zero-line-shift body injection after each loop's
  opening `{`, counter resets after the loop. Re-authored here (acorn + string
  splicing, no recast); never imported (the old dirs are tsconfig-excluded).
- [`../../shared/types.ts`](../../shared/types.ts) `InterceptEvent` /
  `ConsoleMethod` — **inspiration**: the existing event names this evaluator
  borrows, not a vocabulary it imports.
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
conforms to). Every streamed event also carries `loc` (the stamped source
location of the io call, or `null` when unattributable). Where a name deviates
from the oracle, the deviation is deliberate and noted in the glossary.

| Streamed event | Payload (beyond `step`, `loc`)                                                             | Oracle event   | embody correspondence                                 | Host producer                    |
| -------------- | ------------------------------------------------------------------------------------------ | -------------- | ----------------------------------------------------- | -------------------------------- |
| console        | `method` (an open `string`; the 19 standard names, faithfully); `args[]` (clone-safe pass) | `ConsoleEvent` | `EmitNMEvent` `kind:'console'`, `method`, `args`      | any `console.<method>(…)` call   |
| alert          | `args[]`; no `returnValue` (yields `undefined`)                                            | `AlertEvent`   | `EmitNMEvent` `kind:'alert'`, `args`                  | `alert(…)` — one io round-trip   |
| confirm        | `args[]`; `returnValue` (`boolean`)                                                        | `ConfirmEvent` | `EmitNMEvent` `kind:'confirm'`, `args`, `returnValue` | `confirm(…)` — one io round-trip |
| prompt         | `args[]`; `returnValue` (`string \| null`)                                                 | `PromptEvent`  | `EmitNMEvent` `kind:'prompt'`, `args`, `returnValue`  | `prompt(…)` — one io round-trip  |

**The terminal error is not a streamed event — it is a typed halt on the
settlement.** A throw ends the run: the engine catches it and settles `errored`,
carrying a worker-authored halt (`errorName`, `message`, the stamped `loc` — the
call site for a throw inside a wrapped call, the loop's own span for the
iteration guard's throw — `iterationLimit` when the throw was the iteration
guard's, and the run's `iterationCount`). The evaluator does **not** wrap the
program in its own `try/catch` and does **not** stream an `error` item — doing
either would mask the throw as a natural completion. The old intercept's
`ErrorEvent` is reconstructed by the embody adapter as the run's terminal
`ErrorNMEvent` from that halt (see § Bounded context). The oracle's `creation` /
`execution` phase is **not** reproduced: the engine collapses the program's
construction (`new Function`) and execution into one `throw` halt
([`../../../../../lib/engine/worker/bootstrap.ts`](../../../../../lib/engine/worker/bootstrap.ts)),
so the phase is not authorable worker-side; a construction `SyntaxError` is
near-unreachable for admissible JEJ, and embody's `ErrorNMEvent` carries no
phase.

## Glossary (ubiquitous language)

These terms propagate into types, JSDoc, DOCS.md, tests, and this README. Use
them consistently.

- **evaluator** — this module (and its category): a self-contained pipeline that
  turns a runnable JS source string into a stream of host-boundary I/O events
  plus a settlement. Distinguished from a **tracer** by _what it observes_: a
  tracer instruments the program to observe its **interior** (variable, scope,
  and expression lifecycle); an evaluator observes only the **host boundary**
  through **global mocks**, and its only splices are line-preserving and
  observation-free (the **iteration guard** and the **loc stamp**). The category
  has two members — `intercept` (this module) and a future `run` (an evaluator
  that observes and emits nothing). Not to be confused with the embody
  `evaluation` phase or the engine `evaluate` call.
- **global mock** — the replacement `console` / `alert` / `confirm` / `prompt`
  injected into the worker as engine-provided globals (a worker has no native
  DOM dialogs, and its native `console` would escape observation). Every mock
  routes its call through one uniform **io round-trip**.
- **io round-trip (call-then-emit)** — how every trapped io call crosses the
  boundary, two parts, order-critical: the mock first makes the engine's
  synchronous **call** — blocking the program while the thread **awaits the
  consumer's io mock** (the time budget paused) — then **emits** the completed
  event record (carrying the answer, for dialogs), then returns to the program.
  The call is where the consumer's mock runs (and, for dialogs, supplies the
  answer); the emit is the record of what happened. Console calls make the same
  round-trip with an `undefined` answer — the await is the point: a quiz or an
  animation can hold the program at a `console.log` until it finishes.
- **clone-safe args pass** — the check applied to a call's arguments before they
  cross the worker boundary: arguments that survive a structured clone ride as
  themselves; an argument that cannot be cloned (a function, a symbol) rides as
  its `String(…)` form so the round-trip never crashes the run. (Re-homed from
  the oracle's `safeCloneArgs`.)
- **io mock** — the consumer-supplied handlers (`IoMocks`: `console`, `alert`,
  `confirm`, `prompt`) that the **thread logic** invokes during the call half of
  each io round-trip. **Every mock is awaited** (matching embody's `IoMocks`
  contract and the oracle, which awaited console mocks before resuming the
  worker); a mock's answer may be asynchronous, and the program's time budget is
  paused meanwhile. An omitted console mock is a no-op; an omitted dialog mock
  falls back to the inert native default (`alert` → `undefined`, `confirm` →
  `false`, `prompt` → `null`). A **throwing** (or rejecting) mock is an
  engine-made `call-error` stop — the run ends `errored`, with no halt and no
  event for that call. (Deliberate deviation: the oracle surfaced a terminal
  in-stream InternalError event instead. Consumer mocks should not throw.)
- **answer** — an io mock's result, written back to the worker as the call's
  value and recorded on the emit as `returnValue` at the embody boundary.
  `console` → `undefined` (nothing returns to the program); `alert` →
  `undefined`; `confirm` → `boolean`; `prompt` → `string | null`. The set of
  answers is exactly the engine's `CallResponse`, so an answer rides the call
  channel with no coercion.
- **instrumenter** — the evaluator's single pure, **line-preserving** splice
  pass over the source (acorn parse + string splicing; no splice inserts or
  removes a newline, so every stamped or reported line matches the learner's
  source). It plants exactly two things: **iteration guards** and **loc
  stamps**. It observes nothing.
- **iteration guard** — the spliced `__$il(n, 'L:C:L:C');` call at the top of
  each guarded loop's braced body, carrying the LOOP's own span (encoded at
  splice time, so a limit halt is always attributed to its loop), with the
  counter reset `__$ir(n);` spliced after the loop (the counters live in the
  worker logic's closure, so the reset is a call too). The guarded set is the
  oracle's: `while`, classic `for`, `do-while`, and `for-of` with a **braced**
  body; `for-in` and brace-less bodies are NOT guarded (a brace-less runaway
  loop is caught by the time budget only). The helper keeps TWO counts: a
  **per-loop-entry counter** — the one checked against the consumer's
  `iterations` limit, reset after the loop so each fresh entry restarts the
  count (oracle semantics: the limit is per loop entry, never a run total) — and
  the never-reset run-total `iterationCount` carried on every halt. On exceed it
  throws a **marked** `RangeError` — the marker is a structured flag the halt
  author recognizes (never string matching). No limit configured → the guard
  counts but never throws.
- **loc stamp** — the spliced same-line call wrap `__$lc('L:C:L:C', () => …)`
  around each `CallExpression` — and ONLY `CallExpression`s, the oracle's exact
  node set (`NewExpression` is not wrapped; `super()` and class constructs are
  outside admissible JEJ) — re-authoring the oracle's `__$ic`, loc-valued
  instead of nodePath-valued. The worker-side helper keeps a current-loc stack;
  io mocks read the top at fire time to stamp their event's `loc`, and a throw
  propagating through a wrap gets the loc stamped onto it for the halt. An
  **unwrapped** throw (a statement-level throw outside any wrapped call — a bare
  `null.foo`, a top-level `ReferenceError`) yields `loc: null`: the oracle's
  residual `Error.stack` extraction is deliberately not reproduced (brittle
  across browsers; no milestone consumer reads a throw's loc).
- **terminal error** — the throw that ends a run: a `SyntaxError` from compiling
  the program, any runtime throw, or the iteration guard's marked throw. It is
  **not** a streamed event; it is carried as the **halt** on the settlement and
  mapped by the adapter to the run's terminal `ErrorNMEvent` (or, when marked,
  to the `limit-exceeded` outcome).
- **halt** — the worker-authored record of how the program stopped on its own: a
  natural end, or a throw with its `errorName`, `message`, stamped `loc` (when
  attributable), and `iterationLimit` marker (when the iteration guard fired).
  Every halt carries the run's `iterationCount` — on natural ends too (the halt
  author fires on every worker-side stop).
- **worker logic** — the worker-side half: the injected global mocks, the
  `__$il` / `__$lc` helpers, the clone-safe args pass, and the halt author.
- **thread logic** — the thread-side half: its **call hook** serves every io
  round-trip by awaiting the consumer's io mocks; its **message hook** is a pure
  narrowing of opaque worker messages to typed events (dropping anything
  malformed). It is **io-bound** — built per run around the consumer's `IoMocks`
  — because observing the host boundary _is_ invoking the consumer's I/O.
- **handle / settlement** — the engine vocabulary this evaluator wraps: the
  handle is the lazy `AsyncIterable` + `result` + `cancel` + `fail`; the
  settlement is how the run ended (completed / errored / cancelled / failed /
  timed-out) plus its carried halt and duration. This evaluator narrows the
  stream to typed events and types the halt; the engine itself stays opaque.

## Bounded context

This evaluator **owns**: the instrumenter (iteration guards + loc stamps, the
line-preservation invariant); the global-mock injection; the uniform
call-then-emit io round-trip; the clone-safe args pass; the iteration-limit
enforcement (guard helper, marked throw, `iterationCount`); the worker logic and
its thin worker entry; the io-bound thread logic; the built generator and its
typed facade; the worker-side halt author.

It does **not** own, and explicitly excludes:

- **The embody adapter mapping.** Translating the streamed events into
  `EmitNMEvent`, the settlement into `RunInstance` / `EndReport`
  (outcome-vocabulary map — including errored-with-`iterationLimit` →
  `limit-exceeded` — the `ok`-axis, `runMetrics`, the authoritative
  deep-freeze), and reconstructing the run's terminal `ErrorNMEvent` and
  `EmbodyError` from an errored halt, belong to the embody adapter.
- **The JEJ admission gate and the _not-runnable_ short-circuit.** This
  evaluator assumes an admissible JEJ string; it parses only to splice (the
  instrumenter throws a typed boundary error on unparseable input — reachable
  only through misuse, since the adapter pre-gates). Admission lives in the
  **adapter**, not here, for a contract reason — not an arbitrary asymmetry with
  the variables tracer. The variables tracer self-gates and _throws_ because its
  consumer (`traceVariableLifecycle`) is permitted to throw. The embody
  `intercept()` member, by contrast, must **return a handle and never throw**
  (canned scenarios and non-JEJ input both return a handle). The
  not-runnable-without-throwing decision must therefore be made where the
  not-runnable shape is produced — the adapter — which self-gates on JEJ
  admission rather than trusting a create-phase status that has not yet landed.
- **Interior observation.** No variable, scope, expression, or control-flow
  events; no nodePath; no AST location index (loc is stamped at splice time,
  never looked up); no `Error.stack` extraction (the oracle's residual fallback
  for unwrapped throws is a named cut — such throws carry `loc: null`).
  Consequently `entwined` on the corresponding embody events is `null` until
  `lib/parse` supplies real entwinement.
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

| File                        | Purpose                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | The streamed-event union, handle, options, result, and typed halt; the four seams (message, call-request, worker config, helper protocol)        |
| `instrument-intercept.ts`   | The instrumenter: pure, line-preserving splices — iteration guards + loc stamps                                                                  |
| `intercept-evaluate.ts`     | Public entry: `interceptEvaluate(code, { seconds?, iterations?, io? }?)` — instrument, assemble the engine spec, return the typed handle         |
| `intercept-worker-setup.ts` | Worker logic: injects the global mocks + `__$il` / `__$lc` helpers + clone-safe args pass; authors the halt                                      |
| `intercept-worker-entry.ts` | Thin worker entry wiring the engine bootstrap to the worker logic                                                                                |
| `intercept-thread-logic.ts` | Thread logic: an io-bound factory whose call hook awaits the consumer's io mocks and whose message hook purely narrows worker messages to events |

## Navigation

- Enclosing module front door: [`../../README.md`](../../README.md) (the
  `evaluating/` module)
- The engine it consumes:
  [`../../../../../lib/engine/README.md`](../../../../../lib/engine/README.md)
- The structural template (a sibling tier that composes the engine):
  [`../../trace/variables/README.md`](../../trace/variables/README.md)
- The behavior oracles: [`../../intercept/README.md`](../../intercept/README.md)
  and [`../../shared/guard-loops/`](../../shared/guard-loops/)
- Architecture and data flow: [`./DOCS.md`](./DOCS.md)
- The contract: [`./types.ts`](./types.ts)
