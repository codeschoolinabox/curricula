# tracing — Architecture

## Architectural Sketch

### Execution phases

0. **Prepare config** (sync, pure, throws on invalid input) — entry point
   `createTracingGenerator(code, config, maxMs)` first calls
   `prepareForTrace(code, config)` from `../prepare/prepare-for-trace.ts`. This
   runs the three-stage config pipeline (expand-shorthand → fill-defaults →
   validate-config) plus cross-field semantic checks (range, iterations,
   seconds). Raw user config enters here; a fully-resolved, validated config
   exits. Every caller of `createTracingGenerator` feeds raw config through this
   single gate, so prep is never duplicated. Throws on invalid code type,
   invalid config type, schema violations, or semantic violations — wrapped into
   a failure
   `TraceResult { ok: false, error: { kind: 'javascript', phase: 'creation' } }`
   by `createTracingGenerator`'s try/catch.

1. **Pre-walk** (sync, pure) — walk the parsed ESTree AST to build parent
   metadata (e.g. VariableDeclarator → parent VariableDeclaration's `kind`).
   Needed because Aran's digest visits nodes bottom-up. Input: parsed AST.
   Output: parent info map.

2. **Transpile with digest** (sync, side-effectful) — Aran's `transpile()`
   transforms ESTree → AranLang IR. A custom digest callback builds a
   `Map<string, JejTag>` as a side effect, capturing ESTree metadata that Aran's
   desugaring erases. Also collects `ASTNode` objects and sets `.parent` by
   looking up the pre-built parent info map. Input: ESTree AST + parent info
   map. Output: AranLang AST + tag map + ASTNode collection.

3. **Build ast** (sync) — build `ast: Record<nodePath, ASTNode>` from the
   ASTNode collection. ASTNodes start MUTABLE with `events: []` and `visits: 0`.
   NOT frozen yet — freezing happens after execution + linking (step 10).
   Output: mutable `ast`.

4. **Aspect assembly** (sync, pure) — `createAspect()` reads user config and the
   tag map to build pointcuts and advice globals. Each pointcut is wrapped to
   resolve hash-string tags → JejTag objects before the original pointcut logic
   runs. Config gating happens here — most gates resolved statically from JejTag
   metadata. Input: config + tag map + ast. Output: Aran-compatible aspect.

5. **Weave** (sync, pure) — Aran's `weaveFlexible()` injects advice calls into
   the AranLang IR based on the pointcuts. Input: AranLang AST + aspect. Output:
   woven AranLang AST.

6. **Retropile + generate** (sync, pure) — Aran's `retropile()` converts woven
   AranLang → ESTree (standalone mode embeds intrinsic setup). `astring`
   generates the JavaScript string. Input: woven AST. Output: instrumented code.

7. **Execute** (async, Worker) — the instrumented code is sent to a disposable
   Web Worker (or executed via `new Function()` in Node tests). Advice functions
   fire during execution, pushing scalar TraceEvents to `state.trace` via
   `emitExpression()` / `emitResolve()`. Each event carries `nodePath: string`
   (not an ASTNode). `block@throwing` fires `emitError()` on unhandled errors
   then re-throws. Input: instrumented code. Output: stream of scalar
   TraceEvents.

8. **Link** (sync, main thread) — after Worker completes: for each scalar event,
   create `LinkedTraceEvent = { ...event, node: ast[event.nodePath] }`. Push to
   `ast[event.nodePath].events[]`. Set `ast[nodePath].visits` from visitCounts.
   `deepFreezeInPlace(ast)` — cycle guard for `.parent` and `.events[i].node`.
   Return `TraceResult` (generator return value).

### Structural constraints

- **Tag map built during transpile**: the digest callback mutates the map as a
  side effect. The map must be fully populated before `createAspect()` is
  called. Temporal dependency: transpile → createAspect → weave.
- **ASTNode freeze after linking** (not after digest): `.parent` is set during
  digest; `.events[]` and `.visits` are populated during linking. Freezing must
  happen after both complete. Cycle guard required — `JSON.stringify` on ASTNode
  will throw without a replacer for `.parent` and `.events[i].node`.
- **eval + strict mode**: Aran's `kind: 'eval'` with
  `situ: { type: 'local', mode: 'strict' }` produces code executable via
  `new Function()`. Unifies Worker and Node test paths.
- **Standalone retropile**: embeds the intrinsic record directly — no separate
  setup step needed. Learner code cannot break Aran internals.
- **Events structured at runtime**: no post-processing or regex parsing. Config
  controls what's instrumented at pointcut time; advice emits structured frozen
  events.

### Out of scope

- Caching instrumented code (caller responsibility)
- Worker lifecycle management (handled by `index.ts` async generator)

Config expansion/validation is in scope as Phase 0 via
`../prepare/prepare-for-trace.ts`, called by `createTracingGenerator` before
instrumentation begins.

### Worker pause protocol (trace-worker.ts)

The Worker uses a two-flag SAB handshake after each event:

1. `postMessage({ type: 'entry', entry: event })` — queue event data
2. `Atomics.store(PAUSE_INDEX, PAUSED)` — signal paused
3. `Atomics.store(EVENT_READY_INDEX, 1)` + `Atomics.notify` — signal event ready
4. `Atomics.wait(PAUSE_INDEX, PAUSED)` — block until main thread resumes

The EVENT_READY flag lets the main thread's timeout handler distinguish "Worker
paused with pending event" from "Worker stuck in infinite loop." See
`evaluating/shared/DOCS.md` for the full SAB layout and protocol details.

## Key design decisions

### BaseEvent is wire-safe and self-contained

```typescript
type BaseEvent = {
	readonly step: number; // 1-indexed, sequential, no gaps
	readonly semantics: 'statement' | 'expression' | 'resolve' | 'error';
	readonly nodePath: string; // e.g. '$.body.0.test' — AST lookup key
	readonly type: string; // ESTree node type — syntactic context
	readonly loc: SourceLocation; // source position — for editor highlighting
	readonly source: string; // source text — display without AST lookup
};
```

The previous design had `node: ASTNode` (a direct ref). The final design uses
`nodePath: string` plus `type`, `loc`, `source` stamped at emit time.

**Why scalars, not ASTNode ref:** `ASTNode.parent` is circular —
structured-clone (postMessage) throws on circular objects. Events with ASTNode
refs cannot cross the Worker boundary. The `nodePath` string is
postMessage-safe. The full ASTNode is recoverable via `ast[event.nodePath]`
(O(1)) since `TraceResult.ast` is already built on the main thread before
postMessage.

**Self-contained:** `loc`, `type`, and `source` are stamped on every event at
emit time from `tag.loc`, `tag.node` (ESTree type), and `tag.source`. Consumers
can highlight in an editor or display which code produced a value WITHOUT
looking up the AST.

**emitExpression and emitResolve:**

```typescript
emitExpression(state: TracerState, tag: JejTag, nodePath: string, category: string, data: object): void
emitResolve(state: TracerState, tag: JejTag, nodePath: string, kind: ResolveKind, value: ValueRepresentation): void
```

`tag` provides `type = tag.node`, `loc = tag.loc`, `source = tag.source`.
`nodePath` is passed separately from tag — this enables UpdateExpression context
substitution (same tag, different nodePath for all three `x++` sub-events).

Each: increments `state.eventStep`, stamps `{ nodePath, type, loc, source }`,
creates a frozen event, pushes to `state.trace`, calls `state.onEvent?.(event)`.
`emitResolve` additionally increments `state.visitCounts[nodePath]` as a side
effect, and assigns `valueId` when `resolve.provenance` is enabled.
`emitResolve` is called independently — advice authors decide when each fires.

### ResolveEvent extends BaseEvent

`ResolveEvent` shares `step`, `semantics`, and `node` with every other event.
Making it extend `BaseEvent` (rather than a separate minimal type) means
consumers can treat it uniformly with all other events when they need step or
node context.

`semantics: 'resolve'` narrows the BaseEvent union. `category: 'resolve'` serves
as the TypeScript union discriminant (same pattern as `category: 'variable'`
etc.). Both happen to be the string `'resolve'` — coincidence of naming, not
confusion: `category` is for `switch` discrimination, `semantics` is the
mental-model layer indicator.

### ControlFlow split into three granular types

The old `ControlFlowEvent` was a union of seven sub-types all sharing
`category: 'controlFlow'`. The new design uses three separate top-level types:

- `ConditionalEvent` (`category: 'conditional'`) — if/else and ternary
- `LoopEvent` (`category: 'loop'`) — while, doWhile, for, forOf
- `JumpEvent` (`category: 'jump'`) — break/continue

**Why:** Each has distinct config gates, distinct `semantics` (ternary is
`'expression'`, if is `'statement'`), and distinct consumer handling. Grouping
them under one category made switch discrimination awkward. `'jump'` is more
precise than `'controlFlow'` — break/continue are unconditional jumps, not
conditional tests or iterations.

### FunctionReturnEvent removed

The old design had `FunctionCallEvent` (before the call) and
`FunctionReturnEvent` (after, with return value). The return value is now
carried by `ResolveEvent(kind: 'call')` — which fires after the call expression
resolves.

**Why:** `FunctionReturnEvent` was designed before `ResolveEvent` existed. Once
every expression-producing event gets a `ResolveEvent` carrying the value, a
separate return event is redundant. Sequence: `FunctionCallEvent` (context:
name, args) → `[function body events]` →
`ResolveEvent(kind:'call', value: returnValue)`.

### visitCounts — expression visits counted per logical evaluation

`TracerState.visitCounts: Record<string, number>` accumulates how many times
each nodePath was "visited" during execution.

- **Expression nodes** — incremented inside `emitResolve`. Since `emitResolve`
  fires exactly once per logical evaluation, `++i` (which generates 3 Aran
  sub-events) contributes 1 visit, not 3. Requires `resolve` enabled for that
  `ResolveKind`; if resolve is off, the expression visit count stays 0.
- **Statement/block nodes** — incremented in statement/block advice, once per
  execution pass. Not dependent on resolve config.

`visitCounts` is returned in `TraceResult` alongside `events`. The internal
`link()` uses it to populate `ASTNode.visits` for every node in the ast record.

**Why count in emitResolve for expressions:** The goal is visits per
learner-visible syntax node, not per Aran semantic event. `emitResolve` is the
natural bottleneck — it fires once per logical expression evaluation, mapping
directly to what learners see on the page.

### nodePath as syntaxId (not a counter)

`syntaxId` is Aran's `nodePath` string (e.g. `$.body.0.test.left`).

**Why over a sequential counter:** nodePath is stable (same program = same
paths), hierarchical (path encodes parent-child structure), and static (assigned
at digest time with no runtime state). A sequential counter would be opaque;
nodePath is self-documenting and directly maps to the AST structure.

### Comma/SequenceExpression as easter egg

`operators.comma` is a pointcut context gate — it controls whether
sub-expression events fire when they occur inside a `SequenceExpression`. No
dedicated `CommaEvent` type. The sub-expressions fire their own complete event
chains normally. The final expression's `ResolveEvent` uses that expression's
own kind, not `'comma'`.

**Why:** Identical pattern to `with` (another easter egg). Sequence expressions
are not in standard JEJ documentation. A context gate is enough to enable them
for curious learners without adding a new event type.

### Dual-perspective events on assignment

On `x = 5` with both gates enabled:

1. `AssignmentOperatorEvent` fires — operator perspective (what operator, what
   operands, what was written)
2. `BindingEvent(update)` fires — variable lifecycle perspective (which
   variable, what value)
3. `ResolveEvent(kind:'assignment')` fires — data perspective (the produced
   value)

All three share the same `syntaxId`. The dual eventing is intentional — a trace
consumer focused on operators sees the full assignment picture; a consumer
focused on variables sees the full lifecycle picture. `syntaxId` links them.

## Subsystem docs

- `weaving/DOCS.md` — tag strategy, tag resolution, pointcut gating
- `event-generators/DOCS.md` — event factory design
- `../DOCS.md` — full 6-layer architecture diagram, layer table, and control
  enforcement table (lives in `/trace` because the full stack includes the
  Public API layer in `api/`)

---

## Key constraints

### tagMap cannot be in `initialState`

`initialState` must be expressible as generated JavaScript code. Aran
reconstructs it at weave time using code generation — it generates expressions
like `Array.of(...)` or `aran.createObject(...)` to rebuild the state object at
runtime. A JavaScript `Map` cannot be expressed this way.

**Consequence**: `tagMap` must live in the generator's closure — captured after
`instrument()` completes and passed directly to `link()` at completion. Never
embed it in `TracerState`.

**Note:** An earlier version of this doc described Aran as using
`JSON.parse(JSON.stringify)` for `initialState`. The actual mechanism is code
generation, not JSON round-trip. The conclusion is the same (Maps can't be in
`initialState`), but the mechanism matters for understanding why.

### Freeze with cycles in `link()`

`link()` deep-freezes the `ast` record. Two circular refs form after linking:

- `ASTNode.parent` — set during digest, points to parent ASTNode
- `ASTNode.events[i].node` — set by `link()`, points back to the containing
  ASTNode

`freezeInPlace` handles cycles via a `visited: Set<object>`. `link()` must not
be called twice on the same output — double-populating `events[]` is not
idempotent.

### `representValue` must run on the Worker side

`block@throwing` fires inside the Worker. Call `representValue(error)` there —
before `postMessage`. After `structuredClone` (the Worker→main thread message
boundary), `instanceof Error` is `false` on the main thread because the
prototype is stripped. Calling `representValue` after postMessage produces
`{ type: 'object' }` instead of `{ type: 'error', name, message }`.

See `tracing/represent-value/` for the `ErrorValue` type and `instanceof Error`
branch.
