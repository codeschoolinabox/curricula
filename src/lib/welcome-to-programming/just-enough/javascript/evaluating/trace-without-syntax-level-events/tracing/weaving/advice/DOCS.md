# Advice Functions — Architecture

## Dispatch architecture

One set of advice functions, conditional dispatch. Each advice call either:

- Always updates internal state (scope stack, variable maps, counters), OR
- Conditionally calls `createTraceEvent()` based on config gates, OR
- Both

Not every hook does both. See the per-hook table below for specifics.

## Config-to-advice wiring

`create-aspect.ts` decides which advice functions are woven into the
instrumented code. Some are always present; others depend on config.

| Advice | Woven | Controlled by | Why |
| --- | --- | --- | --- |
| block-setup | Always | — | Scope tracking infrastructure |
| block-declaration | Always | — | Scope tracking + variable ownership |
| block-before | Always | — | Loop guard must be active regardless of config |
| block-teardown | Always | — | Scope cleanup |
| block-after | Conditional | Any `config.scopes.events.*` enabled | Paired with block-throwing |
| block-throwing | Conditional | Any `config.scopes.events.*` enabled | Paired with block-after |
| expression-after | Conditional | Any of: `config.literals.*`, `config.bindings.events.read`, `config.operators.shortCircuiting`, `config.controlFlow.events.test` | |
| apply-around | Conditional | Any of: `config.operators.pure.*`, `config.operators.shortCircuiting`, `config.operators.assignment`, `config.propertyAccess.*`, `config.functions.*`, `config.templates.*`, `config.bindings.kind.global` | |
| effect-before | Conditional | `config.operators.assignment` | Compound assignment operators only |
| effect-after | Conditional | `config.bindings.events.assign` OR `config.bindings.events.initialize` | BindingEvent(assign/initialize/available) |
| statement-before | Conditional | `config.controlFlow.events.jump` | |

## Advice-to-event emissions

Each advice can emit specific event types, each gated by its own config path.
Internal state updates (marked with **state**) happen regardless of config.

| Advice | Behavior | Config gate |
| --- | --- | --- |
| block-setup | **state**: push ScopeInfo onto scopeStack | always |
| block-setup | emit ScopeEvent(create) | `scopes.kind.{kind}` AND `scopes.events.create` |
| block-declaration | **state**: record variables in scope | always |
| block-declaration | emit BindingEvent(declare) | `bindings.kind.{kind}` AND `bindings.events.declare` |
| block-declaration | emit BindingEvent(initialize) | `bindings.kind.{kind}` AND `bindings.events.initialize` |
| block-declaration | emit BindingEvent(available) | `bindings.kind.{kind}` AND `bindings.events.available` |
| block-before | **state**: increment iteration counter | always (when segmentKind is 'while') |
| block-before | **state**: loop guard check | always (controlled by `config.maxIterations`, NOT controlFlow) |
| block-before | emit ScopeEvent(enter) | `scopes.kind.{kind}` AND `scopes.events.enter` |
| block-before | emit BranchEvent | `controlFlow.kind.conditionals` AND `controlFlow.events.branch` |
| block-before | emit IterationEvent | `controlFlow.kind.loops.{loopKind}` AND `controlFlow.events.iteration` |
| block-before | emit DoEvent | `controlFlow.kind.loops.doWhile` AND `controlFlow.events.do` |
| block-after | emit ScopeEvent(completion) | `scopes.kind.{kind}` AND `scopes.events.completion` |
| block-throwing | emit ScopeEvent(interrupt) | `scopes.kind.{kind}` AND `scopes.events.interrupt` |
| block-teardown | **state**: pop ScopeInfo from scopeStack | always |
| block-teardown | emit ScopeEvent(leave) | `scopes.kind.{kind}` AND `scopes.events.leave` |
| expression-after | **state**: set lastExpressionResult | always |
| expression-after | emit LiteralEvent | `literals.{literalKind}` |
| expression-after | emit BindingEvent(read) | `bindings.kind.{kind}` AND `bindings.events.read` |
| expression-after | emit TestEvent | `controlFlow.kind.{kind}` AND `controlFlow.events.test` |
| expression-after | **state**: delete iteration counter on false test | always (when test is for a loop) |
| expression-after | emit ShortCircuitingOperatorEvent | `operators.shortCircuiting` (deferred to Phase 7) |
| apply-around | **state**: set lastExpressionResult | always |
| apply-around | emit PureOperatorEvent | `operators.pure.{subkind}` |
| apply-around | emit PropertyAccessEvent | `propertyAccess.{accessKind}` |
| apply-around | emit FunctionCallEvent | `functions.call` |
| apply-around | emit FunctionReturnEvent | `functions.return` |
| apply-around | emit BindingEvent(read, kind='global') | `bindings.kind.global` AND `bindings.events.read` |
| apply-around | emit BindingEvent(assign, kind='global') | `bindings.kind.global` AND `bindings.events.assign` |
| apply-around | emit PureOperatorEvent (typeof global) | `operators.pure.typeof` |
| apply-around | emit TemplateBeginEvent | `templates.begin` |
| apply-around | emit TemplateEvaluationEvent | `templates.evaluation` |
| apply-around | emit TemplateEndEvent | `templates.end` |
| effect-before | emit AssignmentOperatorEvent | `operators.assignment` |
| effect-after | emit BindingEvent(initialize) | `bindings.kind.{kind}` AND `bindings.events.initialize` |
| effect-after | emit BindingEvent(available) | `bindings.kind.{kind}` AND `bindings.events.available` |
| effect-after | emit BindingEvent(assign) | `bindings.kind.{kind}` AND `bindings.events.assign` |
| statement-before | emit JumpEvent | `controlFlow.kind.{target}` AND `controlFlow.events.jump` |

## State mutation model

Advice functions receive `state: TracerState` as first argument. State is mutable
at runtime — advice mutates it directly (push arrays, increment counters, add
keys). Aran clones `initialState` via JSON at startup; the runtime copy is not
frozen.

### Who mutates what

| Field | Mutated by | When |
| --- | --- | --- |
| `step` | block-declaration (always, for variable tracking), any advice emitting events | before each event or variable registration |
| `scopeStack` | block-setup (push), block-teardown (pop) | always, regardless of config |
| `scopeStack[n].variables` | block-declaration | always, regardless of config |
| `iterationCounters` | block-before (increment), expression-after (delete on false test) | always for loops |
| `lastExpressionResult` | expression-after, apply-around | always (raw value of last expression/call) |
| `trace` | emitEvent (push) | only when config gate passes |
| `onEvent` | emitEvent (call) | only when config gate passes AND callback is set |

### Mutation ordering within a block

Verified against Aran's `visit.mjs` (lines 327-345 for SegmentBlock,
480-514 for RoutineBlock):

```
block@setup       → push scope (always)
block@declaration → record variables, emit binding lifecycle events
block@before      → scope enter, branch/iteration events, loop guard
[body executes — expression/apply/effect/statement advice fire here]
block@after       → scope completion (normal exit only)
block@throwing    → scope interrupt (error exit only)
block@teardown    → scope leave, pop scope (always)
```

Note: block@declaration fires BEFORE block@before. This is Aran's order, not
a choice we made.

## Loop guard independence

The iteration counter and loop guard are **unconditionally updated** by
block-before, regardless of `config.controlFlow` settings. Even if all
controlFlow events are disabled, a RangeError will still be thrown if
`config.maxIterations` is exceeded.

This is a safety mechanism, not a trace feature. It prevents infinite loops in
learner code from hanging the browser.

block-before has two independent responsibilities:

1. **Loop guard** (always active): increment counter, throw RangeError if
   `config.maxIterations` exceeded. Controlled by `config.maxIterations`, NOT
   by `config.controlFlow`.
2. **Event dispatch** (config-gated): ScopeEvent(enter), BranchEvent,
   IterationEvent, DoEvent. Each has its own config gate.

## Scope-owned variables

Variables are tracked per-scope in `ScopeInfo.variables`, not in a flat map on
TracerState. Each scope owns its bindings.

### Why not flat maps

A flat `Record<string, number>` for `variableScopes` breaks on shadowing:

```javascript
let x = 1;        // variableScopes['x'] = scopeStep1
{
  let x = 2;      // variableScopes['x'] = scopeStep2 — overwrites!
}
// x is now "lost" — scopeStep2 still in the map but scope is gone
```

### How scope-owned variables work

Each `ScopeInfo` has `variables: Record<string, VariableInfo>` where
`VariableInfo` stores `kind` ('let'/'const'/'global') and `declarationStep`
(the step when BindingEvent(declare) was emitted).

**Lookup**: Walk `scopeStack` top-down via `lookupVariable(state, name)`. First
match is the innermost binding. When inner scope pops, outer scope's variable
is naturally found again. No cleanup needed.

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
sub-expression is evaluated. For `let x = 5`, the order is:
`effect@before(x)` → `expression@after(5)` → `effect@after(x)`. Only at
`effect@after` is `lastExpressionResult` populated with the correct value.

`lastExpressionResult` holds non-Json values at runtime (functions, RegExps).
This is safe because Aran only clones state via JSON at startup — runtime state
is never re-serialized.

## Event streaming via onEvent

`emitEvent` is the single bottleneck for all event creation. After pushing to
`state.trace`, it calls `state.onEvent?.(event)` — an optional callback.

- **Worker setup** sets `state.onEvent = (event) => postMessage(...)` to stream
  each event to the main thread as it occurs.
- **Tests** don't set it — events just accumulate in `state.trace`.
- **Main thread** consumes the stream via an AsyncGenerator (yield each) and
  resolves to the full `state.trace` array at the end.

`onEvent` is a function, not Json-serializable. Same safety note as
`lastExpressionResult` — Aran only clones state at startup.

## Config gating pattern

### 2D gates (kind x event)

Bindings, scopes, and controlFlow use a 2D matrix. An event fires only when
BOTH gates are enabled:

```
config.bindings.kind.let   AND  config.bindings.events.declare   → emit
config.scopes.kind.block   AND  config.scopes.events.create      → emit
config.controlFlow.kind.loops.while  AND  config.controlFlow.events.iteration → emit
```

### Flat toggles

All other config paths are simple booleans:

```
config.literals.string              → emit LiteralEvent
config.operators.pure.arithmetic    → emit PureOperatorEvent
config.operators.shortCircuiting    → emit ShortCircuitingOperatorEvent
config.operators.assignment         → emit AssignmentOperatorEvent
config.propertyAccess.dot           → emit PropertyAccessEvent
config.templates.begin              → emit TemplateBeginEvent
config.functions.call               → emit FunctionCallEvent
```

### Why 2D gates for some config paths

Config paths with 2D gates represent domains where both kind filtering and
event lifecycle filtering are independently useful:

- **Bindings**: trace only `let` bindings, and only their `declare` events
- **Scopes**: trace only `block` scopes, and only `enter`/`leave` events
- **ControlFlow**: trace only `while` loops, and only `iteration` events

Flat toggles cover domains where a single on/off is sufficient.

### Config access pattern

Config is nested with optional keys. Safe access uses `??` fallbacks:

```typescript
const bindings = (config.bindings ?? {}) as Record<string, unknown>;
const kind = (bindings.kind ?? {}) as Record<string, unknown>;
const events = (bindings.events ?? {}) as Record<string, unknown>;
return !!(kind[bindingKind] && events[eventType]);
```

This pattern is factored into `config-gate.ts` helper functions.

## apply@around dispatch

apply@around is the most complex advice. It handles ALL function calls — both
Aran-desugared operations and real user-called functions.

### Intrinsic detection via pointcut

The apply-pointcut inspects `node.callee.type` at weave time:

- `IntrinsicExpression` callee → point[0] is the intrinsic name
  (e.g., `'aran.performBinaryOperation'`)
- `tag.templateStrings` exists → point[0] is `'template'`
- Otherwise → point[0] is `'call'`

The advice dispatches on `point[0]`, same pattern as expression-after.

### Operator classification

Binary/unary operators are desugared by Aran into intrinsic function calls.
The `args[0]` is the operator string. A lookup map classifies it:

```
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

When short-circuited, `left = result` (the left value was returned as-is).
When not short-circuited, `left = state.previousExpressionResult` (the test
sub-expression's value, captured before the branch sub-expression overwrote
`lastExpressionResult`).

### Template decomposition

Aran desugars template literals to `String.prototype.concat`. The tag carries
`templateStrings` and `templateExpressionCount`. The advice reconstructs
begin/evaluation/end events from a single apply@around call by parsing the
interleaved args array.

## Critical return values

Four hooks MUST return values or the program breaks:

| Hook | Must return | What happens if not |
| --- | --- | --- |
| `block@setup` | `state` | Aran loses state for all hooks in this block |
| `block@throwing` | `error` | Error is swallowed, program continues silently |
| `expression@after` | `result` | Expression evaluates to undefined, logic breaks |
| `apply@around` | `Reflect.apply(callee, thisArg, args)` | Function call never executes, program crashes |

## Error safety

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

We follow this distinction. When a learner writes `Math`, Aran transpiles it
to `aran.readGlobalVariable("Math")`. apply-around intercepts this and emits
`BindingEvent(read)` with `kind: 'global'`. The config gate is
`bindings.kind.global` AND `bindings.events.read`.

This means `Math.floor(x)` produces:
1. `BindingEvent(read, kind='global', name='Math')` — the global identifier
2. `PropertyAccessEvent(kind='dot', key='floor')` — the dot access

The semantic distinction matters: `Math` is a global identifier resolution
(scope chain), `.floor` is a property access (prototype chain). Aran models
them differently, and so do we.

Global bindings have `scopeCreationStep: 0` (sentinel — no explicit scope
declaration) and no `declarationStep`.

## Deadzone detection

Aran uses `aran.deadzone_symbol` (a unique Symbol) for uninitialized bindings
in the TDZ. In block-declaration, variables with this value get
`BindingEvent(declare)` only — no initialize/available.

Detection: `typeof value === 'symbol'`. This only works because JEJ never
introduces real Symbols to learners (reference.md confirms no Symbol in the
language). If the curriculum adds Symbols, this must be replaced with a
captured reference to `aran.deadzone_symbol`.

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
  would require changes to the ESTree→AranLang transpilation/tagging layer,
  not the advice layer.

- **effect-after.ts**: Now registered and handles BindingEvent(assign/initialize/
  available). Moved from effect-before because Aran fires effect@before BEFORE
  the value expression is evaluated — only at effect@after is the value available
  via `state.lastExpressionResult`.

- **Global scope[0]**: Built-in globals (Math, Number, String, console) are
  accessed via `aran.getValueProperty` (property access events), not
  `ReadExpression` (binding read events). So `lookupVariable` never needs
  to find them. No practical impact.
