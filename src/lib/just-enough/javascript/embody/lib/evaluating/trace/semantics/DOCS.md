# evaluating/trace — Architecture & Decisions

## Why this tracer exists

Instruments JavaScript source code via Aran AST weaving to produce structured,
typed `TraceEvent` objects — one per observable moment during execution. Used by
educational tools to visualize programs step by step.

The `api/trace.ts` wrapper performs JEJ-level code validation (parse + format)
and passes the raw user config through to `createTracingGenerator`. **Config
preparation is handled inside the tracer itself** — `createTracingGenerator`
calls `prepare/prepare-for-trace.ts` as its first step, which runs the
expand-shorthand → fill-defaults → validate-config pipeline plus cross-field
semantic checks. Every caller (streaming via `api/trace.ts`, any future batch
consumer) feeds raw config through the same prep and gets identical resolved
options.

The tracer is fully self-contained — no external config-prep dependency. The
full pipeline lives in `prepare/`, including the recursive `expand-shorthand`
that handles boolean-shorthand expansion across JEJ's nested config schemas.

## Why 5 layers

The mental model separates concerns by what each layer answers:

| Layer          | Question answered                                         |
| -------------- | --------------------------------------------------------- |
| `ast` (static) | What does the program's syntax look like?                 |
| `resolve`      | What values flowed through the program?                   |
| `expression`   | Which code constructs produced those values?              |
| `statements`   | How was execution controlled?                             |
| `scopes`       | Where do variables live and how do they become available? |
| `errors`       | Which runtime errors terminated execution?                |

Learners can start with just `resolve: true` (pure data trace) and progressively
add layers as their mental model grows. Config at instrument time (pointcuts)
means disabled layers have zero runtime overhead.

## Config gating at instrumentation time

Most config gates are resolved statically in pointcuts using `JejTag` metadata
(`literalKind`, `operator`, `loopKind`, `accessKind`, `bindingKind`, `prefix`).
Pointcuts either inject advice calls or skip the node entirely.

Only three gate types stay at runtime (in the dispatcher):

- **Filter arrays** (variable names, function names, property names) — name only
  known at runtime for some patterns
- **`initialize` vs `update`** — TDZ state is runtime-only
- **Short-circuit detection** — depends on runtime evaluation results

**Why:** Zero-overhead disabled features. A learner tracing only
`expression.variables.read` incurs no instrumentation cost for operators,
literals, or control flow. Simpler dispatcher — it only handles what couldn't be
decided at weave time.

## BaseEvent is wire-safe and self-contained

Each `TraceEvent` is wire-safe and postMessage-serializable — all fields are
scalars (string, number, SourceLocation). No ASTNode refs.

```typescript
type BaseEvent = {
	readonly step: number; // 1-indexed, sequential, no gaps
	readonly semantics: 'statement' | 'expression' | 'resolve' | 'error';
	readonly nodePath: string; // e.g. '$.body.0.test.left' — AST lookup key
	readonly type: string; // ESTree node type — syntactic context
	readonly loc: SourceLocation; // source position — for editor highlighting
	readonly source: string; // source text — for display without AST lookup
};
```

**Why scalars, not ASTNode refs:** `ASTNode.parent` is circular. Circular
objects cannot be structured-cloned (postMessage), so events with ASTNode refs
would break the Worker → main-thread message. Storing a `nodePath` string keeps
events postMessage-safe. The full ASTNode is always recoverable via
`ast[event.nodePath]` (O(1)) since `TraceResult.ast` is already on the main
thread.

**Self-contained:** `loc`, `type`, and `source` are stamped on every event at
emit time. Consumers can highlight in an editor or display which code produced a
value WITHOUT looking up the AST.

**Navigation during streaming:** `ast[event.nodePath]` → the `ASTNode` for this
event (scalar lookup). After streaming completes: `event.node` → direct
`ASTNode` ref (in `TraceResult.events` only).

## Linking — internal, automatic

Two-way navigation is built internally by `link()` — an internal function called
automatically inside the generator after all Worker events are received. Not
exported.

Builds after execution:

- `ASTNode.events[]` — all `LinkedTraceEvent`s that fired on this node
- `ASTNode.visits` — populated from `TraceResult.visitCounts[nodePath]` (0 if
  absent)
- `LinkedTraceEvent.node` — direct `ASTNode` ref (not a string)

`ASTNode` starts mutable (`events: []`, `visits: 0`) at instrument time and is
deep-frozen after `link()` completes. `events[i].node` back-references create a
cycle that the deepFreezeInPlace cycle guard handles.

`JSON.stringify` requires a replacer that omits `.parent` and `.events[i].node`
(circular). Serialization-safe alternatives: `.parentPath` (scalar) and
`.events.map(e => e.step)` (step numbers only).

**Generator type:** `AsyncGenerator<TraceEvent, TraceResult, void>`

- Yields: scalar `TraceEvent` (wire-safe, no `.node` field) — for step-by-step
  streaming
- Returns: `TraceResult` (fully linked, frozen) — for post-hoc analysis
- Yielded events and `TraceResult.events` are different objects by design
  (Worker boundary).

## ResolveEvent as the data baseline

Every expression-producing event is followed by a `ResolveEvent` carrying the
resulting value. This separates concerns cleanly:

- Expression events carry **context** (operator, operands, name, kind)
- `ResolveEvent` carries **the value** (always `ValueRepresentation`)

**Co-gating (`resolve.dependent`):** By default (`resolve.dependent: true`), a
`ResolveEvent` fires only when its paired expression event also fires — co-gated
at pointcut time. When `resolve.dependent: false`, `ResolveEvent`s fire
regardless of expression event gating. A consumer can write
`{ resolve: { dependent: false, kinds: true }, expression: false }` and receive
a pure data trace with no expression context.

**Per-kind gates:** `resolve.kinds.variable`, `resolve.kinds.operator`, etc.
control which ResolveKinds are emitted. Orthogonal to `resolve.dependent`:
`{ resolve: { dependent: false, kinds: { operator: false } } }` → all resolves
except operators, regardless of expression layer settings.

**Provenance (`resolve.provenance`):** Default `true`. Every `ResolveEvent`
gains:

- `valueId: number` — unique ID for this produced value (counter, starts at 1)
- `sourceValueIds?: number[]` — IDs of the ResolveEvents that were inputs

Provenance lives entirely in the ResolveEvent stream — no IDs on expression
events. The full provenance graph (which value came from which) is
reconstructable from `ResolveEvent`s alone. Provenance is nested under `resolve`
because it only applies to `ResolveEvent`s. Opt out with
`{ resolve: { provenance: false } }` if the payload overhead is not needed.

**Why remove `.result` from expression events:** Consumers were accessing the
same value through two paths (`.result` on the event, OR the following
ResolveEvent). Having it in one place (ResolveEvent) forces a consistent model.

## TraceResult gains `code`, `ast`, `options`, `events`, `visitCounts`

On `ok: true`, TraceResult includes:

- `events` — ordered `readonly LinkedTraceEvent[]` stream. Each event has
  `.nodePath` (string, for lookup) AND `.node` (direct `ASTNode` ref, for
  navigation).
- `code` — echoes back the source for consumers that don't store it separately.
- `ast` — flat `Record<nodePath, ASTNode>`. Built at instrument time;
  `.events[]` and `.visits` populated by `link()` after execution. `ast['$']` is
  the root Program. Circular `.parent` and `.events[i].node` — JSON
  serialization needs a replacer. Use `.parentPath` and
  `.events.map(e => e.step)` for serialization-safe alternatives.
- `options` — snapshot of the `TraceOptions` that was used, so consumers know
  which event categories were enabled without re-reading config.
- `visitCounts` — `Record<nodePath, number>` tracking how many times execution
  passed through each syntax node. Mirrors `node.visits` in `ast`. Expression
  nodes: counted once per logical evaluation in `emitResolve` (so `++i` = 1
  visit even though it generates 3 Aran sub-events). Statement/block nodes:
  counted once per execution pass. Requires `resolve` enabled for that
  `ResolveKind`; expression visit count is 0 if resolve is off.

## Dual-perspective events on assignment

On `x = 5` with both `expression.operators.assignment` and
`expression.variables.update` enabled, three events fire in order:

1. `AssignmentOperatorEvent` — operator view (operator, operands, value written)
2. `BindingEvent(update)` — variable lifecycle view (name, value written)
3. `ResolveEvent(kind:'assignment')` — data view (the produced value)

All three share the same `syntaxId`. This is intentional: a trace consumer
focused on operators gets the full picture; one focused on variables gets
theirs. The shared `syntaxId` links them for consumers that need both views.

## UpdateExpression sub-event context substitution

For `x++`, `++x`, `x--`, `--x`, Aran desugars the UpdateExpression into three
sub-operations: read + arithmetic + assign. Each sub-operation fires its own
Aran hook. Aran assigns each a different syntaxId pointing to the desugared
sub-expression, NOT the original UpdateExpression node.

The tracer substitutes the UpdateExpression's syntaxId for all three sub-events.
After `link()`, `linked.ast[updateExpressionSyntaxId].events` contains all
three.

Gate: `expression.operators.increment.prefix` (for `++x`/`--x`) and
`expression.operators.increment.postfix` (for `x++`/`x--`). The pointcut reads
`JejTag.prefix` (set on `UpdateExpression` nodes) to decide which gate applies.

## ErrorEvent — unhandled runtime errors

When a runtime error exits the outermost program block unhandled, the
`block@throwing` Aran hook fires. JEJ has no try/catch — every runtime error is
unhandled at program level.

The advice emits an `ErrorEvent` (`semantics: 'error'`, `category: 'error'`)
with:

- `name` — error class name (e.g. `'ReferenceError'`, `'TypeError'`)
- `message` — error message string
- `thrownValue` — full `ValueRepresentation` of the thrown value (via
  `representValue()`)
- `nodePath`/`loc`/`source` — **approximate** location (last emitted event's
  nodePath).

After emitting, the advice re-throws. The Worker catch still fires and sets the
result-level `ok: false` and `error` field independently. Both `ErrorEvent` in
`events[]` and `ok: false` can coexist in the same result.

Config gate: `errors?: boolean` (top-level in `TraceOptions`, default `true`).
When `false`, the hook still re-throws but does not emit `ErrorEvent`. The
`ok: false` result is always set regardless.

**Why top-level:** Errors are structural — they end execution — and do not fit
inside the resolve/expression/statements/scopes semantic layers.

## Range filtering

`TraceConfig.range` (not inside `options`) filters events to a source range. The
dispatcher looks up `ast[event.node].loc` against the range before emitting.
Events outside the range are silently dropped. The `ast` record is NOT filtered
by range — it always contains the full program structure.

UI use case: learner highlights a code selection; the tool traces only the
events under the highlight.

---

## Vocabulary

Terms used consistently across the trace module, its tests, and this refactor.

| Term                       | Definition                                                                                                                                                                                                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Layer**                  | A horizontal band of the architecture with one phase-of-execution responsibility. Six canonical layers: Public API / Instrumentation / Execution+Data Collection / Dispatcher / Emitter / Generator.                                                                                                                           |
| **Seam**                   | The contract between two adjacent layers — where data flows from layer N to layer N+1 and where integration tests live.                                                                                                                                                                                                        |
| **Semantic vertical**      | A vertical feature story — one JS construct traced end-to-end through all layers (scope, variable, read+operator, resolve, control flow, advanced expression, error).                                                                                                                                                          |
| **Sprint**                 | A batch of work landed + committed as one unit. Prefixed by phase: **H** = helper extraction, **V** = vertical feature slice, **C** = capstone.                                                                                                                                                                                |
| **Semantic discriminant**  | The string a pointcut returns to tell advice WHAT to intercept: `'literal'`, `'read'`, `'shortCircuiting'`, etc. One per intercepted node type.                                                                                                                                                                                |
| **Co-gating discriminant** | The string a pointcut returns to tell advice HOW to emit: `'expression+resolve'`, `'expression-only'`, `'resolve-only'`, or `'skip'`. Encodes the co-gating decision at weave-time. Each node gets both a semantic and a co-gating discriminant from its pointcut. See `tracing/weaving/DOCS.md` for the full 4-valued design. |
| **JejTag**                 | Metadata attached to every AranLang node: `{ loc, node (ESTree type string), source, operator?, loopKind?, literalKind?, ... }`. Survives Aran's desugaring. Built by the digest callback and stored in `tagMap`.                                                                                                              |
| **nodePath**               | An Aran-assigned string like `$.body.0.test.left` that uniquely identifies a node. Keys into the `ast` record. Stable across identical programs.                                                                                                                                                                               |
| **Co-gating**              | The rule that when `resolve.dependent: true` (default), a ResolveEvent fires only when its paired expression event also fires — enforced at pointcut-weave time, zero runtime overhead. When `resolve.dependent: false`, resolves fire independently of expression gating.                                                     |
| **Architecture axis**      | The horizontal axis — what phase of execution a transformation happens in. Tested by architecture-layer unit tests (T1) + seam integration tests (T3).                                                                                                                                                                         |
| **Semantic axis**          | The vertical axis — which JS concepts the tracer emits events for. Tested by profile-driven integration tests (T4).                                                                                                                                                                                                            |
| **Profile**                | A named `TraceConfig` object that isolates one semantic vertical for testing. Examples: `ALL_ON`, `SCOPES_ONLY`, `RESOLVE_ONLY_INDEPENDENT`. See `trace/tests/profiles/README.md`.                                                                                                                                             |
| **Dispatcher**             | Layer 4 — the set of emit functions (`emit-expression.ts`, `emit-resolve.ts`, `emit-error.ts`) that apply range filter, stamp fields, freeze, push to trace, and call `onEvent`. Advice hands payloads here; the Dispatcher decides whether and how to record them.                                                            |

## Architecture — two axes

The tracer has two orthogonal axes of concern, each with its own test strategy.

**Architecture axis (horizontal)** — what phase of execution:

```text
Layer 1  Public API         api/trace.ts, lib/validating/validate.ts, lib/formatting/format.ts
Layer 2  Instrumentation    prepare/ + tracing/instrument.ts + tracing/weaving/
Layer 3  Execution          tracing/weaving/advice/ (11 files + 4 helpers)
Layer 4  Dispatcher         emit-expression.ts, emit-resolve.ts, emit-error.ts
Layer 5  Emitter            tracing/trace-worker.ts (SAB + postMessage)
Layer 6  Generator          tracing/index.ts + tracing/link.ts
```

**Semantic axis (vertical)** — what JS concepts are traced (left =
foundational):

```text
scopes → expressions → resolves → statements (control flow) → errors
```

```text
                         SEMANTIC AXIS (what we trace)
                         scopes   exprs   resolves  statements  errors
                         ──────   ─────   ────────  ──────────  ──────
    Layer 1  Public API    ─┬─     ─┬─      ─┬─        ─┬─       ─┬─
    Layer 2  Instrument     │       │         │           │         │
    Layer 3  Execution      │       │         │           │         │
    Layer 4  Dispatcher     │       │         │           │         │
    Layer 5  Emitter        │       │         │           │         │
    Layer 6  Generator     ─┴─     ─┴─       ─┴─        ─┴─      ─┴─
```

Each cell is one test target. Architecture tests (T1/T3) cover one **row** — one
layer with other layers mocked. Semantic profile tests (T4) cover one **column**
— one named profile, full pipeline.

### The stack, layer by layer

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — PUBLIC API                          api/*                        │
│    • parse check • JEJ-subset validate • format check                       │
│    • early-return on gate failure (no tracer invocation)                    │
│    • wraps generator with createExecution (PromiseLike + AsyncIterable)     │
└─────────────────────────────────────────────────────────────────────────────┘
             │  (raw user config + valid JEJ code)
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 2 — INSTRUMENTATION              STATIC, main thread, once           │
│    prepare/: expand shorthand → fill defaults → validate schema             │
│              → cross-field semantic checks (range/iterations/seconds)       │
│    instrument.ts: acorn parse → buildParentInfoMap → Aran digest + tagMap   │
│                   → build ast record → createAspect → weaveFlexible         │
│                   → retropile → astring → instrumentedCode string           │
│    State at exit: ast built (events:[], visits:0), state.trace = []         │
│    [all in tracing/]                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
             │  (instrumentedCode + initialState + ast + tagMap)
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 3 — EXECUTION + DATA COLLECTION  DYNAMIC, Worker, per-event         │
│    trace-worker.ts: register adviceGlobals → new Function(instrumentedCode) │
│    advice/*.ts (11 files, called by Aran hooks):                            │
│      block@setup/declaration/before/after/throwing/teardown                 │
│      expression@after, apply@around, effect@before/after, statement@before  │
│    helpers (called BY advice):                                              │
│      gating.ts, scope-stack.ts, iteration-counters.ts,                      │
│      template-decomposition.ts, event-generators/**, represent-value/       │
│    State mutations: scopeStack, iterationCounters, lastExpressionResult,    │
│                     lastEmittedTag, variableKinds                           │
│    [all in tracing/]                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
             │  (advice hands event payload to Dispatcher)
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 4 — DISPATCHER                   called BY advice, synchronous      │
│    emit-expression.ts, emit-resolve.ts, emit-error.ts                       │
│      • range filter (drop events outside config.range)                      │
│      • filter arrays (variable/function/property names)                     │
│      • TDZ check (initialize vs update)                                     │
│      • state.eventStep++ → stamp { nodePath, type, loc, source } via tag   │
│      • Object.freeze(event) → push to state.trace                          │
│      • bump visitCounts[nodePath] (resolve only)                            │
│      • call state.onEvent?.(event)   ← hands to Emitter                    │
│    [in tracing/weaving/advice/]                                             │
└─────────────────────────────────────────────────────────────────────────────┘
             │  (frozen TraceEvent ready to cross Worker boundary)
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 5 — EMITTER                      Worker ↔ main thread                │
│    trace-worker.ts onEvent:                                                 │
│      postMessage({ type:'entry', entry }) → Atomics.store(PAUSED) → wait   │
│    worker-protocol.ts: SAB layout, control indices, response message types  │
│    [in tracing/ and shared/]                                                │
└─────────────────────────────────────────────────────────────────────────────┘
             │  (events arrive on main thread one at a time)
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 6 — GENERATOR                   main thread, orchestrates            │
│    tracing/index.ts — createTracingGenerator                                │
│      • spawn Worker → post setup + execute → pump messages → yield events   │
│      • `seconds` timeout (setTimeout, cumulative across SAB pauses)         │
│      • `.cancel()` — worker.terminate(), pending promise resolves cancelled │
│      • classify errors: RangeError → iteration-limit, others → javascript   │
│      • on 'complete': run link() → freeze ast + events → return TraceResult │
│    tracing/link.ts (internal, never exported)                               │
│      • scalar TraceEvent[] + ast + visitCounts → LinkedTraceEvent[] + ast   │
│      • push linked event to ast[nodePath].events[]                          │
│      • ast[nodePath].visits = visitCounts[nodePath] ?? 0                    │
│      • freezeInPlace(ast) with visited-Set cycle guard                      │
│    [in tracing/]                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
             │  (TraceResult returned from generator)
             ▼
        user code awaits result or iterates events
```

| #   | Layer                       | One-sentence job                                                                                                                        | State mutations                                                                    | File locations                                                                        |
| --- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | Public API                  | parse-check + JEJ-subset validate + format check; early-return on failure                                                               | none                                                                               | `api/trace.ts`, `lib/validating/validate.ts`, `lib/formatting/format.ts`              |
| 2   | Instrumentation             | parse → ast + tagMap → pointcut config gating → weave → retropile → instrumented JS string                                              | none (static)                                                                      | `prepare/`, `tracing/instrument.ts`, `tracing/weaving/`                               |
| 3   | Execution + Data Collection | advice fires per Aran hook; reads runtime values; calls event factories; enforces `iterations` loop guard; hands payloads to Dispatcher | scopeStack, iterationCounters, lastExpressionResult, lastEmittedTag, variableKinds | `tracing/weaving/advice/*`, `tracing/event-generators/**`, `tracing/represent-value/` |
| 4   | Dispatcher                  | range filter + filter arrays + TDZ check + step++ + stamp + freeze + push + visitCount bump + onEvent call                              | state.trace, state.eventStep, state.visitCounts                                    | `tracing/weaving/advice/emit-expression.ts`, `emit-resolve.ts`, `emit-error.ts`       |
| 5   | Emitter                     | SAB protocol, postMessage, pause/resume, I/O traps (prompt/confirm/alert)                                                               | SAB views, Worker-side state                                                       | `tracing/trace-worker.ts`, `run/worker-protocol.ts`                                   |
| 6   | Generator                   | orchestrate spawn→post→yield→link→return; enforce `seconds` + `.cancel()`; classify errors; run `link()` at completion                  | iterator state, timer handle, worker reference                                     | `tracing/index.ts`, `tracing/link.ts`                                                 |

### Control enforcement

Where each execution control is enforced:

| Control      | Configured via                       | Enforced in layer | Notes                                                                                                                   |
| ------------ | ------------------------------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `seconds`    | `TraceConfig.seconds` (default 5)    | L6 Generator      | `setTimeout` on main thread; cumulative across SAB pauses                                                               |
| `iterations` | `TraceConfig.iterations`             | L3 Execution      | `block-before.ts` increments per-loop counter; throws `RangeError` on exceed; Generator classifies as `iteration-limit` |
| `range`      | `TraceConfig.range = { start, end }` | L4 Dispatcher     | drops events whose `tag.loc` falls outside range; applied before stamping                                               |
| `.cancel()`  | method on Execution wrapper          | L6 Generator      | `worker.terminate()`; pending promise resolves with `{ kind: 'cancelled' }`                                             |

**`ast` is NOT range-filtered.** Only runtime events are range-filtered. `ast`
always reflects the full program structure, regardless of `config.range`.

## Test taxonomy — 7 tiers

```text
                                              catches what no other tier catches
                                              ──────────────────────────────────
┌─────────────────────────────────────────┐
│ T1  UNIT (architecture-layer)           │  internal logic bugs in one layer
│     one layer, everything else mocked   │  (e.g. gating returns wrong boolean)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T2  CONTRACT (protocol surface)         │  wire-format drift between layers
│     message shapes + SAB byte layout    │  (e.g. Worker changes message shape)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T3  ARCHITECTURE-SEAM INTEGRATION       │  seam bugs between two layers
│     two adjacent layers, others mocked  │  (e.g. advice passes wrong nodePath
│                                         │   to dispatcher)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T4  SEMANTIC-VERTICAL INTEGRATION       │  config-gate regressions
│     one named config profile,           │  (e.g. disabling expression layer
│     full architecture, Node-level       │   doesn't actually suppress events)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T5  SCHEMA CONFORMANCE                  │  event-shape drift
│     every emitted event validates       │  (e.g. factory adds field not in
│     against its category schema         │   the schema)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T6  SEMANTIC EQUIVALENCE                │  subtle gating drift
│     pairs of equivalent configs produce │  (e.g. shorthand expansion produces
│     identical event streams             │   different stream than explicit form)
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ T7  END-TO-END (smoke + browser)        │  integration bugs no mock catches
│     full stack through api/trace.ts +   │  (e.g. real Worker crashes on new
│     real Worker                         │   Aran version)
└─────────────────────────────────────────┘
```

Test file locations:

- **T1** → co-located `tests/` next to each source file
- **T2** → `tracing/tests/worker-protocol-contract.test.ts`
- **T3** → `tracing/tests/*-integration.test.ts`
- **T4** → `trace/tests/profiles/profile-*.test.ts`
- **T5** → `trace/tests/schema-conformance.test.ts`
- **T6** → `trace/tests/semantic-equivalence.test.ts`
- **T7** → `api/tests/trace-e2e.browser.test.ts` (browser) +
  `api/tests/smoke.test.ts` (Node)

See `tracing/tests/README.md` for the full file inventory with sprint status.
See `trace/tests/profiles/README.md` for the full profile catalog.

## Key design decisions

### Resolve schema — `resolve.dependent` / `resolve.provenance` / `resolve.kinds`

Three orthogonal sub-flags under `resolve`:

| Flag         | Default    | Meaning                                                                                                                                                                    |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dependent`  | `true`     | When `true`, ResolveEvents co-gate with their paired expression event (enforced at pointcut-weave time). When `false`, resolves fire independently of expression gating.   |
| `provenance` | `true`     | When `true`, every ResolveEvent carries `valueId` + `sourceValueIds` for tracing data flow. Opt out with `false` to reduce payload.                                        |
| `kinds`      | all `true` | Per-kind booleans: `variable`, `literal`, `operator`, `shortCircuit`, `conditional`, `assignment`, `increment`, `property`, `call`, `template`. Orthogonal to `dependent`. |

`dependent: true` is the default — learners starting with `{ resolve: true }`
get co-gated resolves alongside expression events. `dependent: false` is the
"pure data trace" mode for advanced consumers who only want value flow.

### tagMap cannot be in `initialState`

Aran requires `initialState` to be expressible as generated JavaScript code —
Aran reconstructs it at weave time using code generation (`Array.of(...)`,
`aran.createObject(...)` patterns). A JavaScript `Map` cannot be represented
this way.

**Rule**: `tagMap` must live in the generator's closure (captured after
`instrument()` completes), passed directly to `link()` at completion. Never
embed it in `TracerState`.

### `nodePath` delivery via `resolveTag` extension

The `resolveTag` helper in `create-aspect.ts` extends each JejTag with the
Aran-assigned `nodePath` string (stripped of the `learner.js#` hash prefix).
Advice functions access `tag.nodePath` with no signature change. No changes to
the `JejTag` type definition.
