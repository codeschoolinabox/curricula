<!-- CLAUDE, notes on this plan
  yes, emit each event as they're generated in the advice. AND resolve to the final array of all trace events
  you are obliged to keep no conventions from the legacy tracer, it was monkeyhacked from an entirely different trace paradigm.  the one we're building should be clean, new, better and simpler

-->

# Plan: Advice Function Implementation

## Context

We need to implement the advice functions that Aran's flexible weave calls at
runtime. These stubs currently exist but do nothing. The goal is to understand
how they fit into the execution pipeline and what they need to do to produce
trace events.

This plan was developed by studying:

- `/evaluating/run/` — sandboxed execution via Web Worker + SAB/Atomics
- `/evaluating/trace/` — the trace pipeline wrapper
- `/evaluating/trace/record/` — legacy Aran trace orchestration
- `/evaluating/trace/record/tracing/` — our new type system + event generators +
  pointcuts
- The Aran flexible weave codebase (`visit.mjs`, `trap.mjs`, `aspect.d.ts`,
  `syntax.d.ts`)

---

## How the current (legacy) execution pipeline works

### `/evaluating/run/` — the run engine

Executes user code in an isolated **Web Worker** with trapped globals. Uses
**SharedArrayBuffer + Atomics** for:

- Synchronous I/O (prompt/confirm/alert block the worker via `Atomics.wait`)
- Pause/resume control between execution steps

**Flow:**

```
main thread                          worker
    │                                   │
    ├─── setup msg (SAB) ──────────────►│
    ├─── execute msg (code) ───────────►│
    │                                   ├── trap globals (prompt/confirm/alert)
    │                                   ├── execute code
    │◄── event msgs (console.log etc) ──┤  (blocks on SAB between events)
    │◄── io-request msgs ──────────────┤
    ├─── io responses via SAB ─────────►│
    │◄── complete msg ─────────────────┤
    │                                   │
    └── terminate worker                │
```

### `/evaluating/trace/record/` — the legacy trace pipeline

**trace.ts** (main thread orchestrator):

1. Spawns fresh Web Worker via blob URL (classic worker, NOT module worker)
2. Sends SAB for I/O traps, then code to execute
3. Receives raw trace entries via `postMessage` queue
4. Pauses timeout during I/O, resumes after
5. Yields entries as async generator
6. Returns collected entries array

**trace-worker.ts** (worker side):

1. Defines I/O traps on globalThis BEFORE Aran setup (captures builtins)
2. Applies CAPTURE_ALL config to legacy Aran tracer
3. Calls `trace(code)` — legacy Aran instruments + evaluates
4. Legacy tracer streams entries via `postMessage({ type: 'entry', entry })`
5. Intercepts `postMessage` to add pause protocol (`checkPause()` after each
   entry)
6. Sends `{ type: 'complete' }` when done

**record.ts** (pipeline orchestrator):

1. Collects raw entries from worker
2. Counts loop iterations at raw-entry level (loop guard)
3. Transforms via `postProcess()` (raw entries → structured AranStep[])
4. Filters via `filterSteps()` based on user options
5. Yields filtered steps, returns TraceResult (ok/error/logs)

**Key design: CAPTURE_ALL then filter.** The legacy worker always captures
everything. Filtering happens post-trace on main thread.

### How run/ and trace/ compare

Both use the same Web Worker + SAB/Atomics pattern for I/O. The difference:

- **run/**: Executes code directly, streams RunEvents (console, alert, etc.)
- **trace/**: Instruments code with Aran first, then executes, streams trace
  entries

Both share the worker-protocol.ts for SAB layout and I/O handling.

---

## How the NEW tracing system should work

### Aran standalone mode

The user noted we should use Aran's **standalone build** which copies all
globals so learner code can't mess with Aran internals. This is the
`mode: "standalone"` option in Aran's instrument/weave API.

### New pipeline architecture

```
main thread                               worker
    │                                        │
    ├─── setup msg (SAB + config) ──────────►│
    ├─── execute msg (instrumented code) ───►│
    │                                        │
    │   Worker setup:                        │
    │   1. Define I/O traps on globalThis    │
    │   2. Register advice globals           │
    │   3. Execute instrumented code         │
    │                                        │
    │   During execution:                    │
    │   - Aran calls advice functions        │
    │   - Advice updates TracerState         │
    │   - Advice pushes events to state.trace│
    │   - Periodically stream events back    │
    │                                        │
    │◄── event msgs ────────────────────────┤
    │◄── io-request msgs ──────────────────┤
    ├─── io responses via SAB ─────────────►│
    │◄── complete msg (+ final state) ─────┤
    │                                        │
    └── terminate worker                     │
```

### Key difference from legacy: config at weave time, not filter time

The legacy system captures everything then filters. The new system uses
**config-conditional pointcuts**: only enabled features are intercepted. This
means:

1. `createAspect(config)` runs on the **main thread** before the worker starts
2. It produces: pointcut config for Aran + advice globals + initial state
3. The main thread calls `aran.instrument(code, { pointcut, ... })` to produce
   instrumented code
4. The instrumented code + advice globals are sent to the worker
5. The worker registers advice globals and evaluates the instrumented code
6. Advice functions fire at runtime, update TracerState, dispatch events

### Instrumentation happens on main thread, execution in worker

This is important: Aran's `instrument()` (transpile + weave) is a **static
transformation** — it rewrites code at parse time. This runs on the main thread.
The resulting instrumented code string is sent to the worker for execution.

Advice functions must be registered as globals in the worker environment (Aran
references them by variable name in the generated code).

---

## What advice functions need to do

Each advice function runs in the worker during code execution. It receives:

1. **state** (TracerState) — accumulated trace data, scope stack, config
2. **built-in args** — hook-specific (result value, frame, error, callee, etc.)
3. **...point** — static data from the pointcut (tag, discriminant, var name,
   etc.)

### Responsibilities per hook:

**block@setup** (`advice/block-setup.ts`):

- Push new scope onto `state.scopeStack`
- Increment `state.step`
- Conditionally dispatch `ScopeEvent(create)` via `createTraceEvent`
- MUST return the new state

**block@before** (`advice/block-before.ts`):

- Conditionally dispatch `ScopeEvent(enter)`
- Dispatch `BranchEvent` when segmentKind is 'then'/'else'
- Dispatch `IterationEvent` when segmentKind is 'while' (fires each iteration)
- Dispatch `DoEvent` when loopKind is 'doWhile'

**block@declaration** (`advice/block-declaration.ts`):

- Record variable→scope mappings in `state.variableScopes`
- For each variable in frame:
  - Conditionally dispatch `BindingEvent(declare)`
  - Conditionally dispatch `BindingEvent(initialize)` (with value from frame)
  - Conditionally dispatch `BindingEvent(available)`

**block@after** (`advice/block-after.ts`):

- Conditionally dispatch `ScopeEvent(completion)`

**block@throwing** (`advice/block-throwing.ts`):

- Conditionally dispatch `ScopeEvent(interrupt)`
- MUST return error value

**block@teardown** (`advice/block-teardown.ts`):

- Pop scope from `state.scopeStack`
- Conditionally dispatch `ScopeEvent(leave)`

**expression@after** (`advice/expression-after.ts`):

- Check `point[0]` discriminant:
  - `'literal'` → dispatch `LiteralEvent`
  - `'read'` → dispatch `BindingEvent(read)` (result = the read value)
  - `'shortCircuiting'` → dispatch `ShortCircuitingOperatorEvent`
  - `'test'` → dispatch `TestEvent` (with coercion if value isn't boolean)
- MUST return `result` (value transformer!)

**apply@around** (`advice/apply-around.ts`):

- Determine callee type at runtime:
  - Is callee `aran.performBinaryOperation`? → dispatch `PureOperatorEvent`
  - Is callee `aran.performUnaryOperation`? → dispatch `PureOperatorEvent`
  - Is callee `aran.getValueProperty`? → dispatch `PropertyAccessEvent`
  - Is callee `String.prototype.concat` from template? → dispatch
    `TemplateEvent`
  - Otherwise → dispatch `FunctionCallEvent` + `FunctionReturnEvent`
- MUST call `Reflect.apply(callee, thisArg, args)` and return result

**effect@before** (`advice/effect-before.ts`):

- Check point data for WriteEffect or ConditionalEffect
- Dispatch `BindingEvent(assign)` and/or `AssignmentOperatorEvent`

**statement@before** (`advice/statement-before.ts`):

- Dispatch `JumpEvent` for BreakStatement
- Loop guard: increment iteration counter, throw RangeError if exceeded

---

## How advice dispatches events

Each advice function that wants to emit an event:

```ts
// 1. Extract metadata from point data (tag has loc, node, source)
const tag = point[lastIndex]; // tag is always last in point array
const metadata = {
	semantics: 'expression', // or 'statement' — determined by hook type
	loc: tag.loc,
	node: tag.node,
	source: tag.source,
};

// 2. Call createTraceEvent(metadata, generatorPath, payload)
const event = createTraceEvent(metadata, 'literals.string', {
	kind: 'string',
	value: { type: 'string', value: result },
});

// 3. Push to state
state.trace.push(event);
state.step += 1;
```

### Event streaming from worker

Events accumulate in `state.trace[]`. The worker will stream each event to the
main thread via `postMessage({ type: 'entry', entry })`. On completion, the
final state with all events is sent.

Alternatively, each advice call could immediately post the event. This matches
the legacy pattern where each trace entry is streamed as it's produced, enabling
the main-thread pause protocol.

**Recommendation:** Stream immediately (like legacy). Each advice call that
produces an event posts it via `postMessage`. This enables:

- Per-event pausing (SAB protocol)
- Partial traces on timeout
- Progressive UI rendering

---

## Value representation

Advice functions receive raw JS values at runtime. They need to convert these to
`ValueRepresentation` objects for the event generators. A helper function:

```ts
function representValue(value: unknown): ValueRepresentation {
	const type = typeof value;
	if (type === 'string') return { type: 'string', value };
	if (type === 'number') {
		const rep: NumberValue = { type: 'number', value };
		if (Number.isNaN(value)) return { ...rep, isNaN: true };
		if (!Number.isFinite(value))
			return {
				...rep,
				isInfinity: true,
				...(value < 0 ? { isNegative: true } : {}),
			};
		if (value < 0) return { ...rep, isNegative: true };
		return rep;
	}
	if (type === 'boolean') return { type: 'boolean', value };
	if (type === 'undefined') return { type: 'undefined' };
	if (value === null) return { type: 'object', value: null, isNull: true };
	if (type === 'function')
		return { type: 'function', name: value.name || 'anonymous' };
	if (value instanceof RegExp)
		return { type: 'regexp', pattern: value.source, flags: value.flags };
	// fallback
	return { type: 'object', value: null, isNull: true };
}
```

This helper lives in a shared utility, used by all advice functions.

---

## Aran intrinsic detection in apply@around

The key challenge: `apply@around` receives the callee as a runtime value. To
distinguish Aran intrinsics from real function calls, we need to compare the
callee against known intrinsic function references.

**Strategy:** At setup time (in the worker, before execution), capture
references to Aran's intrinsic functions:

```ts
// In worker setup, before code execution:
const aranIntrinsics = {
	performBinaryOperation: globalThis['aran.performBinaryOperation'],
	performUnaryOperation: globalThis['aran.performUnaryOperation'],
	getValueProperty: globalThis['aran.getValueProperty'],
	// etc.
};
```

Then in `apply@around`, compare callee identity:

```ts
if (callee === aranIntrinsics.performBinaryOperation) {
	// args[0] = operator string, args[1] = left, args[2] = right
	// → PureOperatorEvent
}
```

**Note:** In standalone mode, Aran copies globals. The intrinsic references must
be captured AFTER Aran's setup runs. The exact mechanism depends on how Aran
exposes intrinsics in standalone mode — this needs investigation.

---

## createAspect return shape

Per the adversarial review fix, `createAspect` should return:

```ts
type AspectResult = {
	pointcut: Record<string, { kind: string; pointcut: Function }>;
	adviceGlobals: Record<string, Function>;
	initialState: TracerState;
};
```

The caller (main thread):

1. Passes `{ initial_state: result.initialState, pointcut: result.pointcut }` to
   `aran.instrument()`
2. Sends instrumented code to worker
3. Worker registers `result.adviceGlobals` on its globalThis
4. Worker evaluates the instrumented code

---

## Implementation phases

### Phase 0: Documentation (this file)

### Phase 1: Value representation helper

- `represent-value.ts` — converts raw JS values to ValueRepresentation
- Tests for all value types including NaN, Infinity, -0, null, regex, functions

### Phase 2: Block advice (scope tracking)

- `block-setup.ts` — scope stack push, ScopeEvent(create)
- `block-teardown.ts` — scope stack pop, ScopeEvent(leave)
- `block-declaration.ts` — variable→scope mapping, BindingEvents
- `block-before.ts` — ScopeEvent(enter), BranchEvent, IterationEvent, DoEvent
- `block-after.ts` — ScopeEvent(completion)
- `block-throwing.ts` — ScopeEvent(interrupt)

### Phase 3: Expression advice

- `expression-after.ts` — LiteralEvent, BindingEvent(read), ShortCircuiting,
  TestEvent

### Phase 4: Apply advice

- `apply-around.ts` — PureOperatorEvent, PropertyAccessEvent, FunctionEvent,
  TemplateEvent
- Requires intrinsic detection mechanism

### Phase 5: Effect advice

- `effect-before.ts` — BindingEvent(assign), AssignmentOperatorEvent

### Phase 6: Statement advice

- `statement-before.ts` — JumpEvent, loop guard

### Phase 7: Worker integration

- New trace-worker that uses Aran's flexible weave instead of legacy
- SAB/Atomics I/O protocol (reuse from run/)
- Event streaming via postMessage

### Phase 8: Pipeline integration

- New record function that uses the new worker
- Replace or parallel-path with legacy pipeline

---

## Open questions for discussion

1. **Aran standalone mode:** How exactly does standalone mode expose intrinsics?
   Do we get a reference to `aran.performBinaryOperation` as a global, or does
   it work differently?
   - response: I give you the lead on this, please propose a few alternatives
     and we will discuss.

2. **Instrumentation location:** Should `aran.instrument()` run on the main
   thread or in the worker? Main thread means we send instrumented code to the
   worker. Worker means we send raw code + aspect config.
   - response: I think it should take place in the main thread. discuss

3. **Event streaming granularity:** Stream every event immediately (matching
   legacy pause protocol), or batch events and stream periodically?
   - stream each event immediately. they should be on-demand with the generator
     pattern, or all at once if the function is awaited to resolve into an
     array.

4. **State mutability in advice:** Aran passes state by value (JSON cloned at
   block boundaries via block@setup). State mutations in advice DON'T propagate
   to sibling blocks — only to child blocks via the returned state from
   block@setup. This means `state.trace.push(event)` inside `expression@after`
   modifies the current block's state, but the pushed event is only visible to
   subsequent advice calls within the SAME block scope. Events need to be
   streamed out via postMessage, not just accumulated in state.
   - what's the question here?

5. **Aran's state propagation model:** The state returned from `block@setup` is
   the state used for ALL hooks within that block. But if `expression@after`
   modifies `state.trace`, does that modification persist for the next
   `expression@after` in the same block? YES — within a block, state is shared
   by reference. Block@setup creates a new state for each block boundary. This
   means we need to be careful about what's in state vs what's streamed out.
   - ok. please share more?

---

## Files referenced

- `/evaluating/run/run.ts` — run engine (Web Worker spawning)
- `/evaluating/run/run-worker.ts` — run worker (sandboxed execution)
- `/evaluating/run/worker-protocol.ts` — SAB/Atomics I/O protocol
- `/evaluating/trace/record/trace.ts` — legacy trace orchestrator
- `/evaluating/trace/record/trace-worker.ts` — legacy trace worker
- `/evaluating/trace/record/record.ts` — legacy pipeline
- `/evaluating/trace/record/tracing/types.ts` — our event types
- `/evaluating/trace/record/tracing/event-generators/` — event factories
- `/evaluating/trace/record/tracing/pointcuts/` — pointcuts + advice stubs
- `/evaluating/trace/record/tracing/pointcuts/create-aspect.ts` — aspect
  assembly
- Aran: `lib/weave/flexible/visit.mjs` — core instrumentation
- Aran: `lib/weave/flexible/aspect.d.ts` — API types
- Aran: `lib/lang/syntax.d.ts` — AranLang node types
