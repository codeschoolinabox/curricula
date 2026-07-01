# evaluating/trace/semantics

A standalone **semantics tracer**: it runs a Just-Enough-JavaScript program in
the generic engine's sandbox and streams **semantic trace events** — one typed,
wire-safe event per observable moment of the notional machine: every value an
expression produces, every operator application, every binding lifecycle moment,
every control-flow step, every scope boundary, and the unhandled error that ends
a run. Events carry deterministic step numbers, node-path attribution for source
highlighting, and tagged value representations that survive the worker boundary.

It is an engine consumer
([`../../../../../lib/engine/`](../../../../../lib/engine/)): it validates code
against the JEJ gate, instruments it with **Aran AST weaving** (acorn → Aran
transpile → pointcut-gated advice weave → astring), calls the engine factory
in-module, and exports the built handle. Code in, handle out — consumers never
assemble engine parts.

Where the sibling [`../variables/`](../variables/) tracer follows one concern
(the variable lifecycle) through execution, this tracer captures the **whole
notional machine as data**, at expression granularity, with per-layer config
gates so a learner can start from a pure value trace and progressively enable
richer context as their mental model grows.

## The 5-layer mental model

```text
ast (static)   ← frozen program structure, always present on a completed trace
resolve        ← data layer:       what values flowed through the program
expression     ← expression layer: which code produced those values
statements     ← statement layer:  how execution was controlled
scopes         ← structure layer:  where variables live and become available
```

The four dynamic layers are gated by `TraceOptions` — each accepts a boolean
(whole-layer shorthand) or a nested object (fine-grained sub-gates). The static
`ast` layer is not configurable. Alongside the layers, a top-level `errors` flag
gates the **error channel**: the `ErrorEvent` emitted when a runtime error exits
the program unhandled (JEJ has no try/catch, so every runtime error is
program-ending). The ErrorEvent's location is **approximate** — the last emitted
event's node, not the throwing node (the program-level hook that observes the
error has no precise node); precise error attribution is a named deferred
concern. The settlement's halt carries the same approximate attribution.

Every event **instance** names its layer in its `semantics` field —
`'resolve' | 'expression' | 'statement' | 'scope' | 'error'` — so a consumer can
bucket a mixed stream by mental-model layer without knowing every category. A
category may span layers across its variants (`variable` declare → `scope`, read
→ `expression`; `conditional` if → `statement`, ternary → `expression`), so
`semantics` is fixed per event variant — never derivable from `category` alone,
and never a free field a generator chooses at runtime.

## Event categories

The full field-level contract is [`tracing/types.ts`](./tracing/types.ts); this
table pins the category vocabulary, the layer each category (or variant) belongs
to, and its config gate.

| Category      | Events                                                     | Layer (`semantics`)                                                                 | Config gate                                                            | Paired `ResolveEvent` kind                          |
| ------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------- |
| `resolve`     | the produced value, after every expression                 | `resolve`                                                                           | `resolve` (+ `dependent` / `provenance` / `kinds`)                     | —                                                   |
| `variable`    | declare / initialize / available / read / update           | declare → `scope`; initialize, available → `statement`; read, update → `expression` | `scopes.*.declare`, `statements.variables.*`, `expression.variables.*` | `variable` (read); update rides `assignment`        |
| `literal`     | string / number / boolean / null / undefined / regex       | `expression`                                                                        | `expression.literals.*`                                                | `literal`                                           |
| `operator`    | pure (arithmetic, comparison, typeof, …) / shortCircuiting | `expression`                                                                        | `expression.operators.*`                                               | `operator` / `shortCircuit`                         |
| `assignment`  | simple / compound assignment expressions                   | `expression`                                                                        | `expression.operators.assignment.*`                                    | `assignment`                                        |
| `property`    | dot / bracket / optionalChaining access                    | `expression`                                                                        | `expression.properties.*`                                              | `property`                                          |
| `function`    | call (name + arguments)                                    | `expression`                                                                        | `expression.functions.call`                                            | `call` (carries the return value — no return event) |
| `template`    | begin / evaluation / end                                   | `expression`                                                                        | `expression.templates.*`                                               | `template` (on end)                                 |
| `conditional` | test / branch — `if` and ternary                           | `if` → `statement`; ternary → `expression`                                          | `statements.conditionals.*`, `expression.operators.conditional`        | `conditional` (ternary)                             |
| `loop`        | setup / test / iteration / increment / do                  | `statement`                                                                         | `statements.{while,doWhile,for,forOf}.*`                               | —                                                   |
| `jump`        | break / continue                                           | `statement`                                                                         | `statements.break` / `statements.continue`                             | —                                                   |
| `debugger`    | debugger statement                                         | `statement`                                                                         | `statements.debugger`                                                  | —                                                   |
| `scope`       | create / enter / interrupt / completion / leave            | `scope`                                                                             | `scopes.{script,block}.*`                                              | —                                                   |
| `error`       | the unhandled runtime error                                | `error`                                                                             | `errors` (top-level)                                                   | —                                                   |

Four vocabulary rules the table encodes:

- **The ResolveEvent IS the value.** Expression events carry _context_
  (operator, operands, name, kind); the paired `ResolveEvent` carries the
  produced value. No expression event carries a result field.
- **Dual perspective is intentional.** `x = 5` with all gates on fires
  `AssignmentOperatorEvent` (operator view) + `BindingEvent(update)` (variable
  view) + `ResolveEvent(assignment)` (data view), all sharing one `nodePath`.
- **No function-return event.** `ResolveEvent(kind: 'call')` carries the return
  value; a separate return event would duplicate it.
- **Increment is a substitution, not a category.** `x++` / `++x` desugar into
  read + arithmetic + write sub-events; the tracer re-stamps all three with the
  UpdateExpression's own `nodePath` (gated by
  `expression.operators.increment.prefix` / `.postfix`), and the paired resolve
  carries `kind: 'increment'` — one logical evaluation, one visit.

## Glossary (ubiquitous language)

These terms propagate into types, JSDoc, DOCS.md, tests, and commit messages.
Using a different name in code is a bug, not a stylistic choice.

- **tracer** — this module: a self-contained pipeline that turns a JEJ source
  string into a stream of semantic trace events plus a settlement.
- **trace event** — one typed, wire-safe record of an observable moment. Always
  scalar-only fields (`nodePath` string, never an AST reference) so it crosses
  the worker boundary by structured clone.
- **linked event** — a trace event after linking: the same data plus a direct
  `.node` reference into the frozen ast record. Only `TraceResult.events`
  carries linked events; the stream yields wire-safe ones.
- **nodePath** — the Aran-assigned path string (e.g. `$.body.0.test.left`)
  uniquely identifying a syntax node. The key into the ast record; stable across
  identical programs. (The former synonym `syntaxId` is retired **in this
  tracer**; the sibling intercept tracer's `ASTNode.syntaxId` is a separate,
  pre-existing surface — a known cross-tracer naming inconsistency, out of scope
  here.)
- **provided globals** — the realm names a JEJ program may reference without
  declaring (the dialog names, console, and the JEJ-documented globals). Their
  one invariant is runtime truth: every provided name actually exists in the
  sandbox (the dialog traps are installed at setup), and every OTHER identifier
  read behaves exactly as raw JS says — `ReferenceError` at the moment of
  evaluation, never a substituted value.
- **ast record** — the flat `Record<nodePath, ASTNode>` built at instrument
  time. `ast['$']` is the root Program node. Mutable (`events: []`, `visits: 0`)
  until linking freezes it.
- **linking** — the post-settlement pass that attaches `.node` to each event,
  back-fills `ASTNode.events[]`, populates `ASTNode.visits` from the visit
  counts, and deep-freezes the record (cycle-guarded: `.parent` and
  `.events[i].node` are circular).
- **layer** — one band of the 5-layer mental model. Every event names its layer
  in `semantics`; config gates are organized by layer.
- **co-gating** — the default coupling (`resolve.dependent: true`) under which a
  `ResolveEvent` fires only when its paired expression event fires — decided at
  weave time, zero runtime cost. `dependent: false` frees resolves to fire alone
  (a pure data trace).
- **provenance** — the optional value-flow identity on ResolveEvents: `valueId`
  (unique per produced value) and `sourceValueIds` (the inputs it was computed
  from). The full data-flow graph is reconstructable from the resolve stream
  alone. Gated by `resolve.provenance` (default true).
- **visit counts** — `Record<nodePath, number>`: how many times a TRACED node
  was evaluated. Expressions count once per logical evaluation (`++i` is one
  visit, not three Aran sub-events). Counted in the dispatcher BEFORE the
  runtime gates, so counts are range- and filter-independent — but a node whose
  advice was weave-time-skipped (its layer gate disabled) is not counted at all:
  visits mean "traced evaluations", not "all evaluations under any config". Ride
  the halt payload to the thread, mirrored onto `ASTNode.visits` by linking.
- **JejTag** — the per-node metadata bundle (loc, ESTree type, source text,
  operator, literalKind, …) built by the digest at instrument time, embedded
  into the woven code, and handed to advice at runtime. JSON-safe by
  construction (an Aran constraint).
- **pointcut** — the weave-time gate: decides per node whether advice is
  injected at all, and returns the point data (JejTag + discriminants) the
  advice will receive. Disabled gates cost nothing at runtime.
- **semantic discriminant** — the pointcut's "what is this" answer (`'literal'`,
  `'read'`, `'shortCircuiting'`, …), telling advice which event to build.
- **co-gating discriminant** — the pointcut's "how to emit" answer:
  `'expression+resolve' | 'expression-only' | 'resolve-only' | 'skip'`, encoding
  the co-gating decision at weave time.
- **advice** — the worker-side functions Aran hooks call during execution.
  Advice updates run state, builds events via the event generators, and hands
  them to the dispatcher.
- **dispatcher** — the worker-side emit layer (`emit-expression` /
  `emit-resolve` / `emit-error`): applies the range filter and runtime filter
  arrays, stamps the wire-safe base fields, assigns the step, freezes the event,
  records it, and emits it thread-ward.
- **runtime gate bundle** — the resolved runtime-checked gates (range window,
  filter arrays, iteration cap) delivered to the worker via the engine spec's
  `workerConfig`, not baked into the woven code. Weave-time decisions
  (pointcuts, tags, initial state) are code-generated by Aran and must ride the
  code; runtime gates deliberately are not, so the instrumented code is
  range-independent and a highlight change never re-instruments.
- **range filter** — the `TraceConfig.range` source window; events outside it
  are dropped at dispatch, worker-side, reading the runtime gate bundle. The ast
  record is never range-filtered.
- **iteration limit** — the instrumentation-owned loop cap
  (`TraceConfig.iterations`, delivered in the runtime gate bundle). Exceeding it
  throws a **branded** limit error the halt author classifies structurally —
  never by matching message text. It surfaces as `outcome: 'errored'` plus the
  typed `refinement` — there is no `'iteration-limit'` outcome value; consumers
  check the refinement, not the outcome.
- **value representation** — the tagged, clone-safe rendering of a runtime value
  (`{ type: 'number', value, isNaN? }`, `{ type: 'undefined' }`, …) that
  disambiguates what JSON cannot (NaN, ±Infinity, -0, null-vs-object,
  functions). Built worker-side by `represent-value`.
- **worker logic** — the worker-side half: registers the advice globals, wires
  the dispatcher's emit to the engine, installs the dialog traps, and authors
  the halt.
- **thread logic** — the thread-side half: narrows opaque worker messages to
  typed trace events (dropping malformed ones), services dialog round-trips, and
  types the iteration-limit refinement.
- **dialog round-trip** — a learner `prompt` / `confirm` / `alert` call,
  serviced synchronously across the boundary via the engine's call channel so
  the real dialog value flows back into the traced program. (Deviation from the
  variables tracer's inert stubs — deliberate: this tracer's concern IS the
  values, so a faked `null` would falsify the data layer.) The response value
  comes from the **dialog provider**: `TraceConfig.dialogs` handlers when given,
  else the environment's own dialogs (`globalThis.prompt` / `confirm` / `alert`
  — present on a browser main thread). When a dialog fires and no provider
  exists (a headless or Node run without `dialogs`), the run settles as a call
  error — never a fabricated value. Test suites always inject scripted handlers.
- **halt / settlement / refinement** — the engine vocabulary this tracer wraps:
  the halt is the worker-authored stop payload (natural end and throw alike;
  carries the visit counts and error attribution); the settlement is how the run
  ended (`completed / errored / cancelled / failed / timed-out` plus carried
  data); the refinement is this tracer's typed annotation on an errored
  settlement identifying an instrumentation-owned iteration limit.
- **handle** — the lazy `AsyncIterable` of trace events plus `result`, `cancel`,
  `fail`. Nothing runs until the first pull or `result` access; breaking out of
  a `for await` cancels.
- **trace result** — what `result` resolves with: the linked `events`, the
  frozen `ast` record, the echoed `code`, the resolved `options` snapshot, the
  `visitCounts`, and the settlement. (The former synonym `logs` is retired.)

## Bounded context

This tracer **owns**: the admission gate at its boundary — the JEJ gate (throws
on non-JEJ or unparseable input, `with` included: there is no sloppy-mode path);
**runtime error fidelity** — anything raw JavaScript would throw at runtime
throws the same error at the same evaluation moment inside the trace; config
preparation (shorthand expansion → default filling → schema validation →
cross-field checks, in [`prepare/`](./prepare/)); the Aran instrumentation
pipeline and its weave-time gating; the worker logic, thin worker entry, and
thread logic; the iteration limit and its branded classification; the dialog
round-trips; the linking pass; the built handle and its typed facade.

Two gate decisions are deliberate, named commitments:

- **The gate never pre-empts runtime errors — ECMA-faithful throw fidelity.**
  The gate rejects only language-level violations (parse failures, non-JEJ
  constructs); a program that would merely THROW in a raw JS run is admitted,
  and the error happens where raw JS would produce it: an undeclared identifier
  read throws `ReferenceError` at the moment of evaluation (never before — an
  undeclared read in a never-taken branch never throws), a TDZ access and a
  const reassignment throw at their access moments. The error appears in the
  event stream where it occurs (the error channel) and the settlement carries
  the halt. The instrumentation MUST reproduce these errors faithfully —
  resolving an undeclared read into any value is a mistrace, full stop.
- **`with` is rejected, full stop.** The former `with` easter egg is dropped:
  supporting it forks the instrumentation into a second sloppy-mode Aran
  configuration and weakens the gate for a construct JEJ deliberately excludes.
  The program always runs strict. (A deliberate `with` demonstration can be a
  future feature; it will not arrive as a gate-weakening config flag.)

It does **not** own, and explicitly excludes:

- **The sandbox.** Worker lifecycle, the transport, the pause protocol, the time
  budget, cancellation, and settlement classification are the engine's
  ([`../../../../../lib/engine/README.md`](../../../../../lib/engine/README.md)).
  This tracer authors payloads and interprets them; it never touches a Worker or
  a SharedArrayBuffer directly.
- **The embody adapter mapping.** Translating trace events into embody's NM
  events / `RunInstance` / `EndReport`, and the not-runnable short-circuit,
  belong to the embody adapter. `snippet.evaluation.events.trace.semantics`
  wiring is embodiment territory.
- **Lenses and rendering.** Step-through UIs, editors, and quizzes consume the
  stream and the linked result; none of their concerns live here.
- **Console interception.** `console.*` calls pass through to the worker's
  native console; pairing console output with a trace is intercept/embody
  territory. Dialogs are traced-through (real round-trips), not evented — a
  dialog is visible in the data layer as the value it returns.
- **Caching.** Each call is a fresh instrument + fresh run; memoizing
  instrumented code or results is the caller's concern.
- **User-defined functions.** JEJ has no function declarations or arrows;
  `FunctionCallEvent` covers calls to provided globals. Non-JEJ input dies at
  the gate.

## TraceResult shape

On a settled run:

```text
events       readonly LinkedTraceEvent[]         ordered stream; each has .node into ast
code         string                              original source, echoed back
ast          Readonly<Record<nodePath, ASTNode>> frozen; ast['$'] = root Program
options      TraceOptions                        resolved config snapshot
visitCounts  Readonly<Record<nodePath, number>>  mirrors node.visits
settlement   TraceSettlement                     outcome · halt · refinement? · engineError? · durationMs
```

Every field is present on every settled run: the gate and instrumentation run
eagerly (so `code`, `ast`, and `options` exist for every handle), and linking
runs after ANY settlement — the ast record and the streamed events both live
thread-side, so even a cancelled or timed-out run returns its events linked.
`visitCounts` ride the halt: a stop without a halt leaves them empty and every
`node.visits` 0. An errored run keeps every event up to the throw. Serialization
note: `node.parent` and `node.events[i].node` are circular — `JSON.stringify`
needs a replacer; `node.parentPath` and `event.step` are the serialization-safe
alternatives.

The six settlement shapes (the T7 matrix mirrors this table):

| `outcome`   | `halt`          | `refinement`      | `engineError`                                | meaning                                                                         |
| ----------- | --------------- | ----------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| `completed` | natural         | —                 | —                                            | the program ran out                                                             |
| `errored`   | present (throw) | iff branded limit | —                                            | the program threw (learner error or iteration limit)                            |
| `errored`   | `null`          | —                 | `worker-error` / `call-error` / `hook-error` | the engine ended the run — `call-error` is the dialog-without-provider terminal |
| `cancelled` | `null`          | —                 | —                                            | consumer cancel (or a broken-out `for await`)                                   |
| `failed`    | `null`          | —                 | — (`failReason` present)                     | consumer `fail(reason)`                                                         |
| `timed-out` | `null`          | —                 | `timeout`                                    | the time budget exhausted                                                       |

## Structure

| File / directory            | Purpose                                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `trace-semantics.ts`        | Public entry: `traceSemantics(code, config?)` — gate, prepare, instrument, build the engine generator, wrap the typed handle  |
| `types.ts`                  | The public contract: result, settlement, handle, halt, refinement                                                             |
| `config.types.ts`           | `TraceConfig` / `TraceOptions` — the layer-gate contract                                                                      |
| `options.schema.json`       | JSON Schema for `TraceOptions`; drives default-filling in `prepare/`                                                          |
| `semantics-worker-entry.ts` | Thin worker entry wiring the engine bootstrap to this tracer's worker logic                                                   |
| `semantics-worker-setup.ts` | Worker logic: advice registration, dispatcher wiring, dialog traps, halt author                                               |
| `semantics-thread-logic.ts` | Thread logic: message narrowing, dialog servicing, iteration-limit refinement                                                 |
| `prepare/`                  | Config pipeline: expand shorthand → fill defaults → validate → cross-field checks                                             |
| `tracing/`                  | The Aran instrumentation pipeline: digest/tags, weaving (pointcuts + advice), event generators, value representation, linking |
| `tests/`                    | Tracer-level suites: profiles, schema conformance, semantic equivalence, browser fidelity                                     |

## Navigation

- Architecture and data flow: [`DOCS.md`](./DOCS.md)
- The event contract: [`tracing/types.ts`](./tracing/types.ts)
- Instrumentation internals: [`tracing/README.md`](./tracing/README.md) and
  [`tracing/weaving/DOCS.md`](./tracing/weaving/DOCS.md)
- The engine it consumes:
  [`../../../../../lib/engine/README.md`](../../../../../lib/engine/README.md)
- The sibling pattern: [`../variables/README.md`](../variables/README.md)
- Scope/binding vocabulary correspondence:
  [`../../../../language-levels/just-enough-javascript/notional-machine.md`](../../../../language-levels/just-enough-javascript/notional-machine.md)
