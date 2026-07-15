# Advice Functions — Architecture

## Dispatch architecture

One set of advice functions, conditional dispatch. Each advice call either:

- Always updates internal state (scope stack, variable maps, counters), OR
- Conditionally calls `emitExpression()` / `emitResolve()` based on config
  gates, OR
- Both

Not every hook does both. See the per-hook table below for specifics.

## Config-to-advice wiring

`create-aspect.ts` decides which advice functions are woven into the
instrumented code. Some are always present; others depend on config.

| Advice            | Woven                     | Controlled by                                                                                                                                                                                                                                                                      | Why                                            |
| ----------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| block-setup       | Always                    | —                                                                                                                                                                                                                                                                                  | Scope tracking infrastructure                  |
| block-declaration | Always                    | —                                                                                                                                                                                                                                                                                  | Scope tracking + variable ownership            |
| block-before      | Always                    | —                                                                                                                                                                                                                                                                                  | Loop guard must be active regardless of config |
| block-teardown    | Always                    | —                                                                                                                                                                                                                                                                                  | Scope cleanup                                  |
| block-after       | Conditional               | Any `config.scopes.script.*` or `config.scopes.block.*` enabled                                                                                                                                                                                                                    | Paired with block-throwing                     |
| block-throwing    | Always on outermost block | `config.errors` (ErrorEvent gate); `config.scopes.*` (ScopeEvent gate)                                                                                                                                                                                                             | Must return error (re-throw)                   |
| expression-after  | Conditional               | Any of: `config.expression.literals.*`, `config.expression.variables.read`, `config.expression.operators.shortCircuiting`, `config.statements.conditionals.test`, `config.statements.while.test`, `config.statements.for.test`, `config.statements.doWhile.test`, `config.resolve` |                                                |
| apply-around      | Conditional               | Any of: `config.expression.operators.*`, `config.expression.operators.assignment`, `config.expression.properties.*`, `config.expression.functions.*`, `config.expression.templates.*`, `config.resolve`                                                                            |                                                |
| effect-before     | Conditional               | `config.expression.operators.assignment` (compound)                                                                                                                                                                                                                                | Compound assignment operators only             |
| effect-after      | Conditional               | `config.expression.variables.update` OR `config.statements.variables.initialize`                                                                                                                                                                                                   | BindingEvent(update/initialize/available)      |
| statement-before  | Conditional               | `config.statements.break` OR `config.statements.continue`                                                                                                                                                                                                                          |                                                |

## Advice-to-event emissions

Each advice can emit specific event types, each gated by its own config path.
Internal state updates (marked with **state**) happen regardless of config.

Note on resolve gates: each `emitResolve` call is ultimately gated by
`resolve.kinds.<kind>` (per-kind suppression) AND by `resolve.dependent`
(co-gating with the expression event). The "+ `resolve.kinds.<kind>`" notation
in the table below is shorthand for that combined gate.
`resolve.dependent: true` (the default) means resolve fires only when the paired
expression gate is also open; `resolve.dependent: false` lifts that constraint
so resolves fire even when the expression gate is closed.

| Advice            | Behavior                                                                                           | Config gate                                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| block-setup       | **state**: push ScopeInfo onto scopeStack                                                          | always                                                                                                                  |
| block-setup       | emit ScopeEvent(create)                                                                            | `scopes.{script\|block}.create`                                                                                         |
| block-declaration | **state**: record variables in scope                                                               | always                                                                                                                  |
| block-declaration | emit BindingEvent(category:'variable', event:'declare')                                            | `scopes.{script\|block}.declare`                                                                                        |
| block-before      | **state**: increment iteration counter                                                             | always (when segmentKind is 'while')                                                                                    |
| block-before      | **state**: loop guard check                                                                        | always (controlled by `config.maxIterations`, NOT statements)                                                           |
| block-before      | emit ScopeEvent(enter)                                                                             | `scopes.{script\|block}.enter`                                                                                          |
| block-before      | emit ConditionalEvent(event:'branch')                                                              | `statements.conditionals.branch`                                                                                        |
| block-before      | emit LoopEvent(event:'iteration')                                                                  | `statements.{while\|for\|doWhile\|forOf}.iteration`                                                                     |
| block-before      | emit LoopEvent(event:'do')                                                                         | `statements.doWhile.do`                                                                                                 |
| block-before      | emit LoopEvent(event:'setup')                                                                      | `statements.for.setup`                                                                                                  |
| block-after       | emit ScopeEvent(completion)                                                                        | `scopes.{script\|block}.completion`                                                                                     |
| block-throwing    | emit ScopeEvent(interrupt)                                                                         | `scopes.{script\|block}.interrupt`                                                                                      |
| block-throwing    | emit ErrorEvent (outermost block only) + re-throw                                                  | `errors` (top-level, default true)                                                                                      |
| block-teardown    | **state**: pop ScopeInfo from scopeStack                                                           | always                                                                                                                  |
| block-teardown    | emit ScopeEvent(leave)                                                                             | `scopes.{script\|block}.leave`                                                                                          |
| expression-after  | **state**: set lastExpressionResult / previousExpressionResult                                     | always                                                                                                                  |
| expression-after  | emit LiteralEvent + emitResolve(kind:'literal')                                                    | `expression.literals.{literalKind}` + `resolve.kinds.<kind>`                                                            |
| expression-after  | emit BindingEvent(category:'variable', event:'read') + emitResolve(kind:'variable')                | `expression.variables.read` + `resolve.kinds.<kind>`                                                                    |
| expression-after  | emit ConditionalEvent(event:'test') or LoopEvent(event:'test')                                     | `statements.conditionals.test` / `statements.{while\|for\|doWhile}.test`                                                |
| expression-after  | **state**: delete iteration counter on false test                                                  | always (when test is for a loop)                                                                                        |
| expression-after  | emit ShortCircuitingOperatorEvent + emitResolve(kind:'shortCircuit')                               | `expression.operators.shortCircuiting` + `resolve.kinds.<kind>`                                                         |
| apply-around      | **state**: set lastExpressionResult                                                                | always                                                                                                                  |
| apply-around      | emit PureOperatorEvent + emitResolve(kind:'operator')                                              | `expression.operators.{arithmetic\|addition\|comparison\|typeof\|negation\|bitwise\|in\|void}` + `resolve.kinds.<kind>` |
| apply-around      | emit PropertyAccessEvent + emitResolve(kind:'property')                                            | `expression.properties.{dot\|bracket\|optionalChaining}` + `resolve.kinds.<kind>`                                       |
| apply-around      | emit FunctionCallEvent + emitResolve(kind:'call')                                                  | `expression.functions.call` + `resolve.kinds.<kind>`                                                                    |
| apply-around      | emit BindingEvent(category:'variable', event:'read', kind:'global') + emitResolve(kind:'variable') | `expression.variables.read` + `resolve.kinds.<kind>`                                                                    |
| apply-around      | emit TemplateBeginEvent                                                                            | `expression.templates.begin`                                                                                            |
| apply-around      | emit TemplateEvaluationEvent                                                                       | `expression.templates.evaluation`                                                                                       |
| apply-around      | emit TemplateEndEvent + emitResolve(kind:'template')                                               | `expression.templates.end` + `resolve.kinds.<kind>`                                                                     |
| effect-before     | emit AssignmentOperatorEvent + emitResolve(kind:'assignment')                                      | `expression.operators.assignment.{simple\|compound}` + `resolve.kinds.<kind>`                                           |
| effect-after      | emit BindingEvent(category:'variable', event:'initialize')                                         | `statements.variables.initialize`                                                                                       |
| effect-after      | emit BindingEvent(category:'variable', event:'available')                                          | `statements.variables.available`                                                                                        |
| effect-after      | emit BindingEvent(category:'variable', event:'update')                                             | `expression.variables.update`                                                                                           |
| statement-before  | emit JumpEvent(kind:'break')                                                                       | `statements.break`                                                                                                      |
| statement-before  | emit JumpEvent(kind:'continue')                                                                    | `statements.continue`                                                                                                   |

## State mutation model

Advice functions receive `state: TracerState` as first argument. State is
mutable at runtime — advice mutates it directly (push arrays, increment
counters, add keys). Aran clones `initialState` via JSON at startup; the runtime
copy is not frozen.

### Who mutates what

| Field                     | Mutated by                                                                    | When                                             |
| ------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| `step`                    | block-declaration (always, for variable tracking), any advice emitting events | before each event or variable registration       |
| `scopeStack`              | block-setup (push), block-teardown (pop)                                      | always, regardless of config                     |
| `scopeStack[n].variables` | block-declaration                                                             | always, regardless of config                     |
| `iterationCounters`       | block-before (increment), expression-after (delete on false test)             | always for loops                                 |
| `lastExpressionResult`    | expression-after, apply-around                                                | always (raw value of last expression/call)       |
| `trace`                   | emitExpression / emitResolve (push)                                           | only when config gate passes                     |
| `onEvent`                 | emitExpression / emitResolve (call)                                           | only when config gate passes AND callback is set |

### Mutation ordering within a block

Verified against Aran's `visit.mjs` (lines 327-345 for SegmentBlock, 480-514 for
RoutineBlock):

```text
block@setup       → push scope (always)
block@declaration → record variables, emit binding lifecycle events
block@before      → scope enter, branch/iteration events, loop guard
[body executes — expression/apply/effect/statement advice fire here]
block@after       → scope completion (normal exit only)
block@throwing    → scope interrupt (error exit only)
block@teardown    → scope leave, pop scope (always)
```

Note: block@declaration fires BEFORE block@before. This is Aran's order, not a
choice we made.

## Loop guard independence

The iteration counter and loop guard are **unconditionally updated** by
block-before, regardless of `config.statements.while` / `.for` / `.doWhile`
settings. Even if all loop event gates are disabled, a RangeError will still be
thrown if `config.maxIterations` is exceeded.

This is a safety mechanism, not a trace feature. It prevents infinite loops in
learner code from hanging the browser.

block-before has two independent responsibilities:

1. **Loop guard** (always active): increment counter, throw RangeError if
   `config.maxIterations` exceeded. Controlled by `config.maxIterations`, NOT by
   `config.statements.while` / `.for` / `.doWhile`.
2. **Event dispatch** (config-gated): ScopeEvent(enter),
   ConditionalEvent(branch), LoopEvent(iteration), LoopEvent(do). Each has its
   own config gate.

## Scope-owned variables

Variables are tracked per-scope in `ScopeInfo.variables`, not in a flat map on
TracerState. Each scope owns its bindings.

### Why not flat maps

A flat `Record<string, number>` for `variableScopes` breaks on shadowing:

```javascript
let x = 1; // variableScopes['x'] = scopeStep1
{
	let x = 2; // variableScopes['x'] = scopeStep2 — overwrites!
}
// x is now "lost" — scopeStep2 still in the map but scope is gone
```

### How scope-owned variables work

Each `ScopeInfo` has `variables: Record<string, VariableInfo>` where
`VariableInfo` stores `kind` ('let'/'const'/'global') and `declarationStep` (the
step when BindingEvent(declare) was emitted).

**Lookup**: Walk `scopeStack` top-down via `lookupVariable(state, name)`. First
match is the innermost binding. When inner scope pops, outer scope's variable is
naturally found again. No cleanup needed.

## Iteration counters

`TracerState.iterationCounters` is a flat `Record<string, number>` keyed by loop
source location (e.g., `"5:0"` for line 5, column 0).

- **Increment**: block-before when `segmentKind === 'while'`
- **Reset**: expression-after deletes the entry when a loop test evaluates false

This handles nested loops: when the inner loop's test is false, its counter
resets. Next time the outer loop re-enters the inner loop, the counter starts
fresh at 0.

## lastExpressionResult

`effect@after` needs the assignment value for BindingEvent(assign/initialize),
but its Aran signature is `(state, ...point)` — no value parameter. The value
was computed by expression@after or apply@around, which set
`state.lastExpressionResult = result` (the raw JS value).

WHY effect@after not effect@before: Aran fires `effect@before` BEFORE the value
sub-expression is evaluated. For `let x = 5`, the order is: `effect@before(x)` →
`expression@after(5)` → `effect@after(x)`. Only at `effect@after` is
`lastExpressionResult` populated with the correct value.

`lastExpressionResult` holds non-Json values at runtime (functions, RegExps).
This is safe because Aran only clones state via JSON at startup — runtime state
is never re-serialized.

## Event streaming via onEvent

`emitExpression` and `emitResolve` are the two bottlenecks for all event
creation. Both push to `state.trace` and call `state.onEvent?.(event)` — an
optional callback.

- **Worker setup** sets `state.onEvent = (event) => postMessage(...)` to stream
  each event to the main thread as it occurs.
- **Tests** don't set it — events just accumulate in `state.trace`.
- **Main thread** consumes the stream via an AsyncGenerator (yield each) and
  resolves to the full `state.trace` array at the end.

`onEvent` is a function, not Json-serializable. Same safety note as
`lastExpressionResult` — Aran only clones state at startup.

## Helpers layer

Four standalone helper modules, each with a distinct bounded context:

| File                        | Bounded context                                   | Mutates                           |
| --------------------------- | ------------------------------------------------- | --------------------------------- |
| `gating.ts`                 | Pure config predicates — is this gate open?       | nothing (stateless)               |
| `scope-stack.ts`            | Scope lifecycle — push/pop/lookup scopes by frame | TracerState scope fields by ref   |
| `iteration-counters.ts`     | Per-loop counters — increment, check limit, reset | TracerState counter fields by ref |
| `template-decomposition.ts` | Aran template concat → begin/eval/end structure   | nothing (stateless)               |

Helpers are called BY advice files. Advice files own state; helpers are
stateless except `scope-stack` and `iteration-counters` which receive state
fields by reference.

### gating.ts bounded context

`gating.ts` is a pure predicate module. It owns exactly one thing: the answer to
"is this config gate open?" Takes a config object + context parameters, returns
`boolean`. No side effects. No state. No mutations.

Three gate kinds:

- **Leaf gates** (`isScopeGateOpen`, `isBindingGateOpen`,
  `isControlFlowGateOpen`, `isLiteralEnabled`, `isOperatorEnabled`,
  `isPropertyAccessEnabled`, `isFunctionEnabled`, `isTemplateEnabled`): check
  one or two config flags, optionally filtered by item name. Always return
  boolean, never throw.
- **Composite gates** (`isAnyExpressionEnabled`, `isAnyApplyEnabled`,
  `isAnyEffectEnabled`, `isAnyStatementEnabled`, `isAnyScopeDispatchEnabled`):
  OR-aggregations used at pointcut-weave time to decide whether to weave a hook
  at all.
- **Internal helpers** (`asRecord`, `passesFilter`): safe config access and
  filter checking. Not exported.

**Schema note**: `gating.ts` currently uses pre-migration config paths (e.g.
`config.resolve.independent`). The canonical schema uses `resolve.kinds.*` and
`resolve.dependent`. When the config paths are migrated, `gating.ts` is the
single change point — all advice files delegate gating decisions here.

## Config gating pattern

### Hierarchical flat toggles

All config paths in the 4-layer schema are simple booleans in a nested object.
An event fires when its specific leaf key is `true`:

```text
expression.literals.string          → emit LiteralEvent
expression.literals.number          → emit LiteralEvent
expression.variables.read           → emit BindingEvent(read)
expression.variables.update         → emit BindingEvent(update)
expression.operators.arithmetic     → emit PureOperatorEvent
expression.operators.addition       → emit PureOperatorEvent
expression.operators.comparison     → emit PureOperatorEvent
expression.operators.shortCircuiting → emit ShortCircuitingOperatorEvent
expression.operators.assignment.simple   → emit AssignmentOperatorEvent
expression.operators.assignment.compound → emit AssignmentOperatorEvent
expression.operators.increment.prefix   → emit IncrementOperatorEvent
expression.operators.increment.postfix  → emit IncrementOperatorEvent
expression.properties.dot           → emit PropertyAccessEvent
expression.properties.bracket       → emit PropertyAccessEvent
expression.properties.optionalChaining → emit PropertyAccessEvent
expression.functions.call           → emit FunctionCallEvent
expression.templates.begin          → emit TemplateBeginEvent
expression.templates.evaluation     → emit TemplateEvaluationEvent
expression.templates.end            → emit TemplateEndEvent
statements.conditionals.test        → emit ConditionalEvent(test)
statements.conditionals.branch      → emit ConditionalEvent(branch)
statements.while.test               → emit LoopEvent(test)
statements.while.iteration          → emit LoopEvent(iteration)
statements.for.test                 → emit LoopEvent(test)
statements.for.iteration            → emit LoopEvent(iteration)
statements.doWhile.test             → emit LoopEvent(test)
statements.doWhile.iteration        → emit LoopEvent(iteration)
statements.break                    → emit JumpEvent(break)
statements.continue                 → emit JumpEvent(continue)
statements.variables.initialize     → emit BindingEvent(initialize)
statements.variables.available      → emit BindingEvent(available)
scopes.script.create                → emit ScopeEvent(create)
scopes.script.enter                 → emit ScopeEvent(enter)
scopes.script.completion            → emit ScopeEvent(completion)
scopes.script.interrupt             → emit ScopeEvent(interrupt)
scopes.script.leave                 → emit ScopeEvent(leave)
scopes.script.declare               → emit BindingEvent(declare)
scopes.block.create                 → emit ScopeEvent(create)
scopes.block.enter                  → emit ScopeEvent(enter)
scopes.block.completion             → emit ScopeEvent(completion)
scopes.block.interrupt              → emit ScopeEvent(interrupt)
scopes.block.leave                  → emit ScopeEvent(leave)
scopes.block.declare                → emit BindingEvent(declare)
resolve.kinds.<kind>                → emit ResolveEvent (per-kind gate)
resolve.dependent                   → co-gating flag (default true = resolve fires
                                      only when expression gate is also open)
resolve.provenance                  → adds valueId/sourceValueIds to ResolveEvent
                                      (default true)
```

### resolve.dependent — co-gating at pointcut time

By default (`resolve.dependent: true`), the pointcut for a given expression kind
weaves resolve advice ONLY if the expression gate is also open. If
`expression.operators.assignment` is off, no advice is woven for that node, so
`ResolveEvent(kind: 'assignment')` is also suppressed — co-gated.

When `resolve.dependent: false`, the pointcut weaves resolve-only advice even
when the expression gate is closed. The advice calls only `emitResolve`, not
`emitExpression`. This enables a pure data trace:
`{ resolve: { dependent: false, kinds: true }, expression: false }`.

Per-kind gates (`resolve.kinds.operator: false`) still suppress the
corresponding `ResolveEvent` absolutely — `resolve.dependent` only controls the
co-gating constraint, it does NOT override per-kind suppression.

### Scope and variable events share the same leaf structure

`scopes.script.*` and `scopes.block.*` mirror each other — same lifecycle keys
(`create`, `enter`, `completion`, `interrupt`, `leave`, `declare`), different
scope kind. The advice checks which kind the current block is (from the
block-pointcut's `scopeKind` point data) and routes to the correct config
subtree.

### Config access pattern

Config is nested with optional keys. Safe access uses `??` fallbacks:

```typescript
const scopeConfig = (config.scopes?.[scopeKind] ?? {}) as Record<
	string,
	boolean
>;
return !!scopeConfig[eventType];
```

This pattern is factored into `gating.ts` helper functions.

## apply@around dispatch

apply@around is the most complex advice. It handles ALL function calls — both
Aran-desugared operations and real user-called functions.

### Intrinsic detection via pointcut

The apply-pointcut inspects `node.callee.type` at weave time:

- `IntrinsicExpression` callee → point[0] is the intrinsic name (e.g.,
  `'aran.performBinaryOperation'`)
- `tag.templateStrings` exists → point[0] is `'template'`
- Otherwise → point[0] is `'call'`

The advice dispatches on `point[0]`, same pattern as expression-after.

### Operator classification

Binary/unary operators are desugared by Aran into intrinsic function calls. The
`args[0]` is the operator string. A lookup map classifies it:

```text
'+' (binary) → 'addition'
'-', '*', '/' → 'arithmetic'
'===', '!==' → 'comparison'
'typeof'     → 'typeof'
'!'          → 'negation.logical'
'~'          → 'negation.bitwise'
'&', '|'     → 'bitwise'
```

### Coercion detection

For binary and unary operators, apply-around computes what JS would coerce the
operands to and passes `coercedOperands` to the event generator. The generator's
`hasCoercion` function compares original vs coerced — if they differ, the
`coercion` field appears on the event.

Rules:

- `===`, `!==`: never coerce (strict)
- `+`: if either operand is a string, both coerce to string; else to number
- Arithmetic/bitwise: coerce to number
- Comparison: both strings → no coercion; otherwise coerce to number
- `!`: coerce to boolean
- Unary `+`, `-`, `~`: coerce to number

### Short-circuiting detection

For `&&`, `||`, `??` (ConditionalExpression in AranLang), expression-after
infers whether short-circuiting occurred from the result value and operator:

- `&&`: short-circuited if `!Boolean(result)` (left was falsy)
- `||`: short-circuited if `Boolean(result)` (left was truthy)
- `??`: short-circuited if result is not null/undefined

When short-circuited, `left = result` (the left value was returned as-is). When
not short-circuited, `left = state.previousExpressionResult` (the test
sub-expression's value, captured before the branch sub-expression overwrote
`lastExpressionResult`).

### Template decomposition

Aran desugars template literals to `String.prototype.concat`. The tag carries
`templateStrings` and `templateExpressionCount`. The advice reconstructs
begin/evaluation/end events from a single apply@around call by parsing the
interleaved args array.

### UpdateExpression sub-event context substitution

For `x++`, `++x`, `x--`, `--x`, Aran desugars the UpdateExpression into three
sub-operations: read + arithmetic + assign. Each sub-operation fires its own
Aran hook (expression@after for read, apply@around for arithmetic, effect@before
for assign). Aran assigns each a different syntaxId pointing to the desugared
sub-expression node — NOT the original UpdateExpression node.

The advice substitutes the UpdateExpression's own syntaxId for all three
sub-events. All three calls to `emitExpression()` and `emitResolve()` use the
UpdateExpression syntaxId instead of the desugared sub-expression syntaxId.

After indexing, `eventsByNode[updateExpressionNodePath]` contains all three
sub-events' `step`s, grouped under the original source node.

**Detection**: the pointcut reads `JejTag.prefix` (present on UpdateExpression
nodes, absent on other nodes). `prefix: true` = `++x`/`--x` (prefix form),
`prefix: false` = `x++`/`x--` (postfix form). Config gates:

- `expression.operators.increment.prefix` — for `++x`/`--x`
- `expression.operators.increment.postfix` — for `x++`/`x--`

## Critical return values

Four hooks MUST return values or the program breaks:

| Hook               | Must return                            | What happens if not                             |
| ------------------ | -------------------------------------- | ----------------------------------------------- |
| `block@setup`      | `state`                                | Aran loses state for all hooks in this block    |
| `block@throwing`   | `error`                                | Error is swallowed, program continues silently  |
| `expression@after` | `result`                               | Expression evaluates to undefined, logic breaks |
| `apply@around`     | `Reflect.apply(callee, thisArg, args)` | Function call never executes, program crashes   |

## Error safety — representValue must run on the Worker side

`block@throwing` fires inside the Worker with the caught error object. Call
`representValue(error)` **before** `postMessage` — not after.

After `structuredClone` (the Worker→main thread boundary), `instanceof Error` is
`false` on the main thread because the prototype chain is stripped by the
structured clone algorithm. Calling `representValue` after postMessage produces
`{ type: 'object' }` instead of `{ type: 'error', name, message }`.

The 4 critical hooks wrap dispatch logic in try/catch with return in finally:

```typescript
function expressionAfter(state, result, ...point) {
	try {
		// dispatch logic
	} catch {
		// swallow advice errors — don't crash learner code
	}
	return result;
}
```

Void hooks do NOT use try/catch. If they throw, the error is visible and
debuggable during development.

## Global bindings

Aran distinguishes global variable access from property access with separate
intrinsics: `aran.readGlobalVariable`, `aran.writeGlobalVariableStrict`,
`aran.writeGlobalVariableSloppy`, `aran.typeofGlobalVariable`.

We follow this distinction. When a learner writes `Math`, Aran transpiles it to
`aran.readGlobalVariable("Math")`. apply-around intercepts this and emits
`BindingEvent(read)` with `kind: 'global'`. The config gate is
`expression.variables.read`.

This means `Math.floor(x)` produces:

1. `BindingEvent(read, kind='global', name='Math')` — the global identifier
2. `PropertyAccessEvent(kind='dot', key='floor')` — the dot access

The semantic distinction matters: `Math` is a global identifier resolution
(scope chain), `.floor` is a property access (prototype chain). Aran models them
differently, and so do we.

Global bindings have `scopeCreationStep: 0` (sentinel — no explicit scope
declaration) and no `declarationStep`.

## Deadzone detection

Aran uses `aran.deadzone_symbol` (a unique Symbol) for uninitialized bindings in
the TDZ. In block-declaration, variables with this value get
`BindingEvent(declare)` only — no initialize/available.

Detection: `typeof value === 'symbol'`. This only works because JEJ never
introduces real Symbols to learners (reference.md confirms no Symbol in the
language). If the curriculum adds Symbols, this must be replaced with a captured
reference to `aran.deadzone_symbol`.

## Scope kinds and closures

The block-pointcut returns `scopeKind`: `'module'`, `'script'`, `'block'`, or
`'closure'`. The config only has gates for `script`, `block`, `module`. Since
JEJ has no user-defined functions (reference.md), `'closure'` never appears in
practice. If it did, advice would skip scope event dispatch (no config key).

## Deferred features

These are defined in the type system and/or schema but not yet implemented:

- **ForInitializeEvent / ForIncrementEvent**: Aran desugars for-loops into a
  complex structure with outer blocks, a `first` flag, and ConditionalEffects
  for the update phase. Requires deep transpiler-level changes. All loops
  (while/doWhile/for/forOf) already fire IterationEvent; only for-specific
  init/increment phases are missing.

- **WithEvent**: `with` statements are desugared away by Aran at the transpiler
  level — no `WithStatement` node exists in AranLang. Implementing WithEvent
  would require changes to the ESTree→AranLang transpilation/tagging layer, not
  the advice layer.

- **effect-after.ts**: Now registered and handles
  BindingEvent(assign/initialize/ available). Moved from effect-before because
  Aran fires effect@before BEFORE the value expression is evaluated — only at
  effect@after is the value available via `state.lastExpressionResult`.

- **Global scope[0]**: Built-in globals (Math, Number, String, console) are
  accessed via `aran.getValueProperty` (property access events), not
  `ReadExpression` (binding read events). So `lookupVariable` never needs to
  find them. No practical impact.
