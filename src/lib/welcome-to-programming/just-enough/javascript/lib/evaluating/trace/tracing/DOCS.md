# tracing — Architecture

> All features described here are the target design. See implementation status
> in each subsystem's docs.

## Architectural Sketch

> Written Phase 0, before implementation of syntax-aligned events and ASTNode.
> The Refactor step is held against this document.

### Execution phases

1. **Pre-walk** (sync, pure) — walk the parsed ESTree AST to build parent
   metadata (e.g. VariableDeclarator → parent VariableDeclaration's `kind`).
   Needed because Aran's digest visits nodes bottom-up. Input: parsed AST.
   Output: parent info map.

2. **Transpile with digest** (sync, side-effectful) — Aran's `transpile()`
   transforms ESTree → AranLang IR. A custom digest callback builds a
   `Map<string, JejTag>` as a side effect, capturing ESTree metadata that
   Aran's desugaring erases. Also collects `ASTNode` objects and sets `.parent`
   by looking up the pre-built parent info map. Input: ESTree AST + parent info
   map. Output: AranLang AST + tag map + ASTNode collection.

3. **Aspect assembly** (sync, pure) — `createAspect()` reads user config and
   the tag map to build pointcuts and advice globals. Each pointcut is wrapped
   to resolve hash-string tags → JejTag objects before the original pointcut
   logic runs. Config gating happens here — most gates resolved statically from
   JejTag metadata. Input: config + tag map. Output: Aran-compatible aspect.

4. **Weave** (sync, pure) — Aran's `weaveFlexible()` injects advice calls into
   the AranLang IR based on the pointcuts. Input: AranLang AST + aspect.
   Output: woven AranLang AST.

5. **Retropile + generate** (sync, pure) — Aran's `retropile()` converts woven
   AranLang → ESTree (standalone mode embeds intrinsic setup). `astring`
   generates the JavaScript string. Input: woven AST. Output: instrumented code.

6. **Freeze AST** (sync) — deep-freeze all ASTNode objects collected in phase 2.
   Requires a cycle guard (visited Set) because `ASTNode.parent` is circular.
   Build the flat `ast: Record<syntaxId, ASTNode>` map. Input: ASTNode collection.
   Output: frozen `ast` record.

7. **Execute** (async, Worker) — the instrumented code is sent to a disposable
   Web Worker (or executed via `new Function()` in Node tests). Advice functions
   fire during execution, emitting frozen TraceEvents via `state.onEvent`.
   Input: instrumented code + `ast` record. Output: stream of TraceEvents + TraceResult.

### Structural constraints

- **Tag map built during transpile**: the digest callback mutates the map as a
  side effect. The map must be fully populated before `createAspect()` is called.
  Temporal dependency: transpile → createAspect → weave.
- **ASTNode freeze after digest**: `.parent` is set during the digest callback.
  Freezing must happen after the digest completes (all parents set), not during.
  Cycle guard required — `JSON.stringify` on ASTNode will throw without a replacer.
- **eval + strict mode**: Aran's `kind: 'eval'` with `situ: { type: 'local', mode: 'strict' }`
  produces code executable via `new Function()`. Unifies Worker and Node test paths.
- **Standalone retropile**: embeds the intrinsic record directly — no separate
  setup step needed. Learner code cannot break Aran internals.
- **Events structured at runtime**: no post-processing or regex parsing. Config
  controls what's instrumented at pointcut time; advice emits structured frozen events.

### Out of scope

- Caching instrumented code (caller responsibility)
- Config expansion/validation (handled by `../configuring/` pipeline)
- Worker lifecycle management (handled by `index.ts` async generator)

### Worker pause protocol (trace-worker.ts)

The Worker uses a two-flag SAB handshake after each event:

1. `postMessage({ type: 'entry', entry: event })` — queue event data
2. `Atomics.store(PAUSE_INDEX, PAUSED)` — signal paused
3. `Atomics.store(EVENT_READY_INDEX, 1)` + `Atomics.notify` — signal event ready
4. `Atomics.wait(PAUSE_INDEX, PAUSED)` — block until main thread resumes

The EVENT_READY flag lets the main thread's timeout handler distinguish
"Worker paused with pending event" from "Worker stuck in infinite loop."
See `evaluating/shared/DOCS.md` for the full SAB layout and protocol details.

## Key design decisions

### BaseEvent uses `node: ASTNode` instead of flat fields

The previous design had `loc: SourceLocation`, `node: string` (ESTree type),
and `source: string` as flat fields on BaseEvent. The new design replaces all
three with `node: ASTNode` — a direct reference into the frozen AST.

**Why:** `ASTNode` gives everything the flat fields gave, plus `syntaxId`,
`parent` navigation, and access to ESTree children. It eliminates the need to
pass loc/source down through every advice call. The tradeoff is a circular
structure (`parent` refs) — accepted, with the cycle guard in `deepFreezeInPlace`
and a JSON serialization warning in the type definition.

### ResolveEvent extends BaseEvent

`ResolveEvent` shares `step`, `semantics`, and `node` with every other event.
Making it extend `BaseEvent` (rather than a separate minimal type) means
consumers can treat it uniformly with all other events when they need step or
node context.

`semantics: 'resolve'` narrows the BaseEvent union. `category: 'resolve'`
serves as the TypeScript union discriminant (same pattern as `category: 'variable'`
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

The old design had `FunctionCallEvent` (before the call) and `FunctionReturnEvent`
(after, with return value). The return value is now carried by
`ResolveEvent(kind: 'call')` — which fires after the call expression resolves.

**Why:** `FunctionReturnEvent` was designed before `ResolveEvent` existed. Once
every expression-producing event gets a `ResolveEvent` carrying the value, a
separate return event is redundant. Sequence: `FunctionCallEvent` (context: name,
args) → `[function body events]` → `ResolveEvent(kind:'call', value: returnValue)`.

### nodePath as syntaxId (not a counter)

`syntaxId` is Aran's `nodePath` string (e.g. `$.body.0.test.left`).

**Why over a sequential counter:** nodePath is stable (same program = same
paths), hierarchical (path encodes parent-child structure), and static (assigned
at digest time with no runtime state). A sequential counter would be opaque;
nodePath is self-documenting and directly maps to the AST structure.

### Comma/SequenceExpression as easter egg

`operators.comma` is a pointcut context gate — it controls whether sub-expression
events fire when they occur inside a `SequenceExpression`. No dedicated
`CommaEvent` type. The sub-expressions fire their own complete event chains
normally. The final expression's `ResolveEvent` uses that expression's own kind,
not `'comma'`.

**Why:** Identical pattern to `with` (another easter egg). Sequence expressions
are not in standard JEJ documentation. A context gate is enough to enable them
for curious learners without adding a new event type.

### Dual-perspective events on assignment

On `x = 5` with both gates enabled:

1. `AssignmentOperatorEvent` fires — operator perspective (what operator, what operands, what was written)
2. `BindingEvent(update)` fires — variable lifecycle perspective (which variable, what value)
3. `ResolveEvent(kind:'assignment')` fires — data perspective (the produced value)

All three share the same `syntaxId`. The dual eventing is intentional — a trace
consumer focused on operators sees the full assignment picture; a consumer
focused on variables sees the full lifecycle picture. `syntaxId` links them.

## Subsystem docs

- `weaving/DOCS.md` — tag strategy, tag resolution, pointcut gating
- `event-generators/DOCS.md` — event factory design
