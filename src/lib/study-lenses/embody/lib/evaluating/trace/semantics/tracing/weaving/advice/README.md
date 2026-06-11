# Advice Functions

Aran's flexible advice callbacks — one per hook category. These run at runtime
during instrumented code execution, updating internal state and conditionally
emitting trace events via `emitExpression` and `emitResolve`.

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
- `block-declaration.ts` —
  `(state, frame, parentType, scopeKind, segmentKind, tag) → void`. **State**:
  records variables in scope. **Events**: BindingEvent(declare/
  initialize/available). Fires BEFORE block-before (Aran's order).
- `block-before.ts` — `(state, parentType, scopeKind, segmentKind, tag) → void`.
  **State**: increments iteration counter, enforces loop guard
  (`config.maxIterations`, independent of controlFlow config). **Events**:
  ScopeEvent(enter), BranchEvent, IterationEvent, DoEvent.
- `block-teardown.ts` —
  `(state, parentType, scopeKind, segmentKind, tag) → void`. **Events**:
  ScopeEvent(leave). **State**: pops scope from stack.

## Block advice (conditionally registered)

- `block-after.ts` — `(state, ...point) → void`. Emits ScopeEvent(completion).
  Only registered when scope events are enabled.
- `block-throwing.ts` — `(state, error, ...point) → error`. **On all blocks:**
  emits ScopeEvent(interrupt) when scope events enabled. **On outermost block
  only:** emits ErrorEvent (if `config.errors !== false`) with
  `state.lastEmittedNodePath` as approximate location. **Must return error
  (re-throws).**

## Expression advice

- `expression-after.ts` — `(state, result, ...point) → result`. Dispatches
  LiteralEvent, BindingEvent(category:'variable', event:'read'),
  ConditionalEvent(test)/LoopEvent(test), ShortCircuitingOperatorEvent based on
  `point[0]` discriminant. Sets `state.lastExpressionResult`. **Must return
  result.**

## Apply advice

- `apply-around.ts` — `(state, callee, thisArg, args, ...point) → callResult`.
  Single handler for all function calls + desugared operators + property
  access + templates. Dispatches based on `point[0]`: intrinsic name,
  `'template'`, or `'call'`. Sets `state.lastExpressionResult`. **Must call
  Reflect.apply and return result.**

## Effect advice

- `effect-before.ts` — `(state, ...point) → void`. Emits AssignmentOperatorEvent
  for compound assignments (+=, -=, etc.).
- `effect-after.ts` — `(state, ...point) → void`. Emits
  BindingEvent(initialize/available/update). Fires AFTER the value
  sub-expression is evaluated, so `state.lastExpressionResult` contains the
  correct value. For TDZ variables (first write), emits initialize + available
  instead of assign.

## Statement advice

- `statement-before.ts` — `(state, ...point) → void`. Emits
  JumpEvent(kind:'break') and JumpEvent(kind:'continue').

## Shared helpers

- `gating.ts` — Pure config gate predicates. Three kinds: leaf gates (check one
  or two config flags, optionally filtered by item name), composite gates
  (OR-aggregations for pointcut-weave decisions), and internal helpers. No
  state, no side effects, never throws.
- `emit-expression.ts` — `emitExpression(state, tag, nodePath, category, data)`:
  increments `state.eventStep`, stamps `nodePath`, `type: tag.node`,
  `loc: tag.loc`, `source: tag.source` on the frozen event, pushes to
  `state.trace`, calls `state.onEvent?.(event)`. Also updates
  `state.lastEmittedNodePath` and `state.lastEmittedTag`.
- `emit-resolve.ts` — `emitResolve(state, tag, nodePath, kind, value)`: same
  mechanics, also increments `state.visitCounts[nodePath]`. Produces a
  `ResolveEvent`. Called independently by advice after the expression event.
  Two-way linking (`ASTNode.events`) is built by `link()` post-execution — NOT
  by these emitters.
- `lookup-variable.ts` — Walks scopeStack top-down to find variable info.

## Shared constants (in parent directory)

- `../aran-parameters.ts` — `ARAN_PARAMETERS` set of Aran internal parameter
  names to skip during variable processing.

## Shared utilities (in tracing root)

- `../../represent-value.ts` — Converts raw JS values to `ValueRepresentation`.
