# Advice Functions

Aran's flexible advice callbacks — one per hook category. These run at runtime
during instrumented code execution, updating internal state and conditionally
emitting trace events via `createTraceEvent`.

See [DOCS.md](DOCS.md) for architecture decisions, state mutation model, and
config gating patterns.

## Block advice (always registered)

These hooks are always woven regardless of config because they maintain
`state.scopeStack` and scope-owned variables needed for variable lookup. Their
internal state updates run unconditionally; they only emit events when config
gates are open.

- `block-setup.ts` — `(state, parentType, scopeKind, segmentKind, tag) → state`.
  **State**: pushes scope onto stack. **Events**: ScopeEvent(create). **Must
  return state.**
- `block-declaration.ts` — `(state, frame, parentType, scopeKind, segmentKind, tag) → void`.
  **State**: records variables in scope. **Events**: BindingEvent(declare/
  initialize/available). Fires BEFORE block-before (Aran's order).
- `block-before.ts` — `(state, parentType, scopeKind, segmentKind, tag) → void`.
  **State**: increments iteration counter, enforces loop guard (`config.maxIterations`,
  independent of controlFlow config). **Events**: ScopeEvent(enter), BranchEvent,
  IterationEvent, DoEvent.
- `block-teardown.ts` — `(state, parentType, scopeKind, segmentKind, tag) → void`.
  **Events**: ScopeEvent(leave). **State**: pops scope from stack.

## Block advice (conditionally registered)

- `block-after.ts` — `(state, ...point) → void`.
  Emits ScopeEvent(completion). Only registered when scope events are enabled.
- `block-throwing.ts` — `(state, error, ...point) → error`.
  Emits ScopeEvent(interrupt). **Must return error.**

## Expression advice

- `expression-after.ts` — `(state, result, ...point) → result`.
  Dispatches LiteralEvent, BindingEvent(read), TestEvent, ShortCircuitingOperatorEvent
  based on `point[0]` discriminant. Sets `state.lastExpressionResult`.
  **Must return result.**

## Apply advice

- `apply-around.ts` — `(state, callee, thisArg, args, ...point) → callResult`.
  Single handler for all function calls + desugared operators + property access +
  templates. Dispatches based on `point[0]`: intrinsic name, `'template'`, or
  `'call'`. Sets `state.lastExpressionResult`. **Must call Reflect.apply and
  return result.**

## Effect advice

- `effect-before.ts` — `(state, ...point) → void`.
  Emits BindingEvent(assign) and AssignmentOperatorEvent. Reads assignment value
  from `state.lastExpressionResult`.
- `effect-after.ts` — `(state, ...point) → void`.
  Deferred — may be needed for post-assignment value capture.

## Statement advice

- `statement-before.ts` — `(state, ...point) → void`.
  Emits JumpEvent for BreakStatement.

## Shared helpers

- `config-gate.ts` — 2D config gate check functions (`isScopeGateOpen`,
  `isBindingGateOpen`, `isControlFlowGateOpen`, etc.).
- `emit-event.ts` — Wraps createTraceEvent + state.trace.push + state.step
  increment.
- `lookup-variable.ts` — Walks scopeStack top-down to find variable info.

## Shared constants (in parent directory)

- `../aran-parameters.ts` — `ARAN_PARAMETERS` set of Aran internal parameter
  names to skip during variable processing.

## Shared utilities (in tracing root)

- `../../represent-value.ts` — Converts raw JS values to `ValueRepresentation`.
