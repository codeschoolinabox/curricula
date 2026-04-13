# Tracer Architecture

Implementation architecture for the JEJ tracer. Self-contained reference for
tool developers and contributors.

See also:

- [notional-machine.md](./notional-machine.md) — the conceptual model
- [tracer.md](./tracer.md) — config, result shape, event data
- [tracer.walkthroughs.md](./tracer.walkthroughs.md) — event sequences

---

## Vocabulary

| Term                       | Definition                                                                                                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layer**                  | A horizontal band of the architecture with one phase-of-execution responsibility. Six canonical layers: Public API / Instrumentation / Execution / Dispatcher / Emitter / Generator.                                 |
| **Seam**                   | The contract between two adjacent layers — where data flows from layer N to layer N+1 and where integration tests live.                                                                                              |
| **Semantic vertical**      | A vertical feature story — one JS construct traced end-to-end through all layers (scope, variable, read+operator, resolve, control flow, error).                                                                     |
| **Semantic discriminant**  | The string a pointcut returns to tell advice WHAT to intercept: `'literal'`, `'read'`, `'shortCircuiting'`, etc. One per intercepted node type.                                                                      |
| **Co-gating discriminant** | The string a pointcut returns to tell advice HOW to emit: `'expression+resolve'`, `'expression-only'`, `'resolve-only'`, or `'skip'`. Encodes the co-gating decision at weave-time.                                  |
| **JejTag**                 | Metadata attached to every AranLang node: `{ loc, node (ESTree type string), source, operator?, loopKind?, literalKind?, ... }`. Survives Aran's desugaring. Built by the digest callback.                           |
| **nodePath**               | An Aran-assigned string like `$.body.0.test.left` that uniquely identifies a node. Keys into the `ast` record. Stable across identical programs. Also called `syntaxId` on ASTNode objects.                          |
| **Co-gating**              | When `resolve.dependent: true` (default), a ResolveEvent fires only when its paired expression event also fires — enforced at pointcut-weave time, zero runtime overhead. When `false`, resolves fire independently. |
| **Architecture axis**      | The horizontal axis — what phase of execution a transformation happens in. Tested by T1 (unit) + T3 (seam) tests.                                                                                                    |
| **Semantic axis**          | The vertical axis — which JS concepts the tracer emits events for. Tested by T4 (profile) tests.                                                                                                                     |
| **Profile**                | A named `TraceConfig` object that isolates one semantic vertical for testing. Examples: `ALL_ON`, `SCOPES_ONLY`, `RESOLVE_ONLY_INDEPENDENT`.                                                                         |
| **Dispatcher**             | Layer 4 — emit functions that apply range filter, filter arrays, TDZ check, stamp fields, freeze, push to trace, bump visitCounts, and call `onEvent`. Advice hands payloads here.                                   |
| **Aspect**                 | The Aran-compatible object containing pointcuts + advice globals + initial state. Built by `createAspect()` from user config + tagMap. Passed to Aran's `weaveFlexible()`.                                           |
| **Pointcut**               | A function that decides, for each AST node, whether to weave advice into it and what discriminants to pass. Runs at instrumentation time (static, not runtime).                                                      |
| **Advice**                 | A function that fires at runtime when an instrumented AST node executes. Reads runtime values, consults gating, emits events via the Dispatcher. 11 advice files in the tracer.                                      |
| **Intrinsic**              | Aran's built-in runtime support (object creation, property access, etc.). Embedded in standalone retropile mode — no separate setup step needed.                                                                     |
| **SAB**                    | SharedArrayBuffer — the mechanism for Worker ↔ main-thread synchronization. Used for the pause protocol (per-event blocking) and I/O traps (prompt/confirm/alert).                                                   |

---

## Two orthogonal axes

The tracer has two axes of concern, each with its own test strategy.

**Architecture axis (horizontal)** — what phase of execution:

```text
Layer 1  Public API         api/trace.ts, api/validate.ts, api/format.ts
Layer 2  Instrumentation    prepare/ + tracing/instrument.ts + tracing/weaving/
Layer 3  Execution          tracing/weaving/advice/ (11 files + helpers)
Layer 4  Dispatcher         emit-expression.ts (+ planned: emit-resolve.ts, emit-error.ts)
Layer 5  Emitter            tracing/trace-worker.ts (SAB + postMessage)
Layer 6  Generator          tracing/index.ts + tracing/link.ts
```

**Semantic axis (vertical)** — what JS concepts are traced:

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

Each cell = one test target. Architecture tests (T1/T3) cover one **row**.
Semantic profile tests (T4) cover one **column**.

---

## The 6-layer stack

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
└─────────────────────────────────────────────────────────────────────────────┘
             │  (advice hands event payload to Dispatcher)
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 4 — DISPATCHER                   called BY advice, synchronous      │
│    emit-expression.ts (+ planned: emit-resolve.ts, emit-error.ts)           │
│      • range filter (drop events outside config.range)                      │
│      • filter arrays (variable/function/property names)                     │
│      • TDZ check (initialize vs update)                                     │
│      • state.eventStep++ → stamp event fields via tag                      │
│      • Object.freeze(event) → push to state.trace                          │
│      • bump visitCounts[nodePath] (resolve only)                            │
│      • call state.onEvent?.(event)   ← hands to Emitter                    │
└─────────────────────────────────────────────────────────────────────────────┘
             │  (frozen TraceEvent ready to cross Worker boundary)
             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 5 — EMITTER                      Worker ↔ main thread                │
│    trace-worker.ts onEvent:                                                 │
│      postMessage({ type:'entry', entry }) → Atomics.store(PAUSED) → wait   │
│    worker-protocol.ts: SAB layout, control indices, response message types  │
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
│      • events + ast + visitCounts → entwined result                         │
│      • push event to ast[nodePath].events[]                                 │
│      • ast[nodePath].visits = visitCounts[nodePath] ?? 0                    │
│      • freezeInPlace(ast) with visited-Set cycle guard                      │
└─────────────────────────────────────────────────────────────────────────────┘
             │  (TraceResult returned from generator)
             ▼
        user code awaits result or iterates events
```

### Layer summary

| #   | Layer           | One-sentence job                                              | State mutations                                                                    | Files                                                                                 |
| --- | --------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | Public API      | parse + validate + format; early-return on failure            | none                                                                               | `api/trace.ts`, `api/validate.ts`, `api/format.ts`                                    |
| 2   | Instrumentation | parse → ast + tagMap → weave → retropile → JS string          | none (static)                                                                      | `prepare/`, `tracing/instrument.ts`, `tracing/weaving/`                               |
| 3   | Execution       | advice fires per Aran hook; reads values; enforces loop guard | scopeStack, iterationCounters, lastExpressionResult, lastEmittedTag, variableKinds | `tracing/weaving/advice/*`, `tracing/event-generators/**`, `tracing/represent-value/` |
| 4   | Dispatcher      | range filter + stamp + freeze + push + visitCount + onEvent   | state.trace, state.eventStep, state.visitCounts                                    | `tracing/weaving/advice/emit-*.ts`                                                    |
| 5   | Emitter         | SAB protocol, postMessage, pause/resume, I/O traps            | SAB views, Worker-side state                                                       | `tracing/trace-worker.ts`, `run/worker-protocol.ts`                                   |
| 6   | Generator       | spawn→yield→link→return; enforce `seconds` + `.cancel()`      | iterator state, timer, worker ref                                                  | `tracing/index.ts`, `tracing/link.ts`                                                 |

---

## Control enforcement

| Control      | Configured via                       | Enforced in layer | Notes                                                                        |
| ------------ | ------------------------------------ | ----------------- | ---------------------------------------------------------------------------- |
| `seconds`    | `TraceConfig.seconds` (default 5)    | L6 Generator      | `setTimeout` on main thread; cumulative across SAB pauses                    |
| `iterations` | `TraceConfig.iterations`             | L3 Execution      | `block-before.ts` increments per-loop counter; throws `RangeError` on exceed |
| `range`      | `TraceConfig.range = { start, end }` | L4 Dispatcher     | drops events whose `tag.loc` falls outside range; applied before stamping    |
| `.cancel()`  | method on Execution wrapper          | L6 Generator      | `worker.terminate()`; pending promise resolves `{ kind: 'cancelled' }`       |

**`ast` is NOT range-filtered.** Only runtime events are filtered. `ast` always
reflects the full program structure.

---

## Execution phases

0. **Prepare config** (sync, pure) — `createTracingGenerator` calls
   `prepareForTrace`. Expands shorthand → fills defaults → validates →
   cross-field semantic checks. Throws on invalid input → wrapped into
   `{ ok: false, error: { phase: 'creation' } }`.

1. **Pre-walk** (sync, pure) — walk ESTree AST to build parent metadata. Needed
   because Aran's digest visits nodes bottom-up.

2. **Transpile with digest** (sync, side-effectful) — Aran `transpile()`
   transforms ESTree → AranLang IR. Digest callback builds `tagMap` and
   `ASTNode` collection.

3. **Build ast** (sync) — build `ast: Record<nodePath, ASTNode>` from the
   collection. ASTNodes start MUTABLE with `events: []` and `visits: 0`.

4. **Aspect assembly** (sync) — `createAspect()` reads config + tagMap to build
   pointcuts and advice globals. Most gates resolved statically from JejTag
   metadata.

5. **Weave** (sync) — Aran `weaveFlexible()` injects advice calls into the
   AranLang IR based on pointcuts.

6. **Retropile + generate** (sync) — Aran `retropile()` converts woven AranLang
   → ESTree (standalone mode). `astring` generates the JS string.

7. **Execute** (async, Worker) — instrumented code runs in a disposable Worker.
   Advice functions fire, emitting events to `state.trace` via the Dispatcher.

8. **Link** (sync, main thread) — after Worker completes: entwine events with
   AST. Populate `ast[nodePath].events[]` and `.visits`. Deep-freeze with cycle
   guard. Return `TraceResult`.

### Key constraints

- **tagMap lifecycle**: `Map<string, JejTag>` built during digest. Can't be in
  `initialState` (Aran's code generator can't serialize Maps). Held in the
  generator's closure, passed to `link()` at completion.
- **ASTNode freeze after linking**: `.parent` set during digest; `.events[]` and
  `.visits` populated during linking. Freezing must happen after both.
- **Execution mode**: `eval + local-strict` — Aran's `kind: 'eval'` with
  `situ: { type: 'local', mode: 'strict' }`. Routes top-level `let`/`const`
  through `block@declaration` (correct binding lifecycle events).
- **Standalone retropile**: embeds the intrinsic record directly — no separate
  setup step.
- **Events structured at runtime**: no post-processing or regex parsing. Config
  controls what's instrumented at pointcut time.
- **Co-gating**: when `resolve.dependent: true` (default), the pointcut decides
  at weave-time whether to emit both expression + resolve, expression-only,
  resolve-only, or skip. This is a static decision — zero runtime overhead for
  disabled co-gating modes.
- **Range filter does NOT affect AST**: `config.range` drops events outside the
  source range, but `ast` always contains the full program structure regardless.

### Worker pause protocol

The Worker uses a two-flag SAB handshake after each event:

1. `postMessage({ type: 'entry', entry: event })` — queue event data
2. `Atomics.store(PAUSE_INDEX, PAUSED)` — signal paused
3. `Atomics.store(EVENT_READY_INDEX, 1)` + `Atomics.notify` — signal ready
4. `Atomics.wait(PAUSE_INDEX, PAUSED)` — block until main thread resumes

The EVENT_READY flag lets the main thread's timeout handler distinguish "Worker
paused with pending event" from "Worker stuck in infinite loop."

---

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
│     two adjacent layers, others mocked  │  (e.g. advice passes wrong nodePath)
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

### Test file locations

- **T1** → co-located `tests/` next to each source file
- **T2** → `tracing/tests/worker-protocol-contract.test.ts`
- **T3** → `tracing/tests/*-integration.test.ts`
- **T4** → `trace/tests/profiles/profile-*.test.ts`
- **T5** → `trace/tests/schema-conformance.test.ts`
- **T6** → `trace/tests/semantic-equivalence.test.ts`
- **T7** → `api/tests/trace-e2e.browser.test.ts` (browser) +
  `api/tests/smoke.test.ts` (Node)

---

## Config gating at instrumentation time

Most config gates are resolved statically in pointcuts using `JejTag` metadata
(`literalKind`, `operator`, `loopKind`, `accessKind`, `bindingKind`, `prefix`).
Pointcuts either inject advice calls or skip the node entirely — zero runtime
overhead for disabled features.

Only three gate types stay at runtime (in the Dispatcher):

- **Filter arrays** (variable/function/property names) — name only known at
  runtime for some patterns
- **`initialize` vs `update`** — TDZ state is runtime-only
- **Short-circuit detection** — depends on runtime evaluation results

---

## NM component mapping to architecture

| NM component | Architecture layers involved                                                        | Key files                                                                                                                                              |
| ------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Values       | L3 (represent-value), L4 (stamp)                                                    | `represent-value/represent-value.ts`                                                                                                                   |
| Bindings     | L2 (pointcut), L3 (block-declaration, effect-after), L4 (emit)                      | `advice/block-declaration.ts`, `advice/effect-after.ts`                                                                                                |
| Scopes       | L2 (block-pointcut), L3 (block-setup/teardown/before/after), L4                     | `advice/block-*.ts`, `scope-stack.ts`                                                                                                                  |
| Expressions  | L2 (expression-pointcut), L3 (expression-after, apply-around), L4                   | `advice/expression-after.ts`, `advice/apply-around.ts`                                                                                                 |
| Statements   | L2 (statement-pointcut), L3 (statement-before, block-before), L4                    | `advice/statement-before.ts`, `advice/block-before.ts`                                                                                                 |
| Resolve      | L2 (co-gating in pointcut), L3 (advice), L4 (emit-resolve)                          | `advice/emit-resolve.ts` (planned — not yet implemented)                                                                                               |
| Coercion     | L3 (advice detects type mismatch), L4 (emit)                                        | In advice files (planned — not yet implemented)                                                                                                        |
| Errors       | L3 (block-throwing), L4 (emit-error), L6 (classify)                                 | `advice/block-throwing.ts`                                                                                                                             |
| Scope lookup | L3 (advice walks scopeStack)                                                        | `advice/lookup-variable.ts`, `scope-stack.ts`                                                                                                          |
| Proto lookup | L3 (advice, apply-around for property access)                                       | `advice/apply-around.ts` (future)                                                                                                                      |
| Global env   | L2 (instrument builds ast), L3 (scope-check events fire when globals are looked up) | Static structure — not event-emitting itself, but scope-check + register-check events fire during identifier resolution through the global environment |
