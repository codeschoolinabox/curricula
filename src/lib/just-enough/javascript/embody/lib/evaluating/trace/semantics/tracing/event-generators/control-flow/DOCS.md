# Control Flow Generators — Design Decisions

## Seven event types from two config dimensions

The config uses a 2D matrix: `kind` (what construct) x `events` (what happened).
An event fires when both gates are enabled. The seven event types map to the
`events` dimension; the `kind` is a parameter on each.

Some events are specific to certain kinds:

- `do` only fires for `doWhile`
- `initialize` and `increment` only fire for `for`
- `branch` only fires for `conditional`
- `test`, `iteration`, and `jump` fire for multiple kinds

## do-while semantics

`DoEvent` fires before every body execution, not just the first. This makes each
iteration's entry point explicit in the trace. For regular while/for loops, the
entry point is the `test` event; for do-while, it's the `do` event.

## forOf-specific fields on IterationEvent

`for (const c of 'hello')` creates a new binding per iteration and iterates over
a string. The `IterationEvent` carries `iterable` (the string, first iteration
only), `iterationValue` (current character), and `iterationVariable` (the loop
variable name). These three fields co-occur — all present for forOf, all absent
for other loop kinds.

## JumpEvent references

`JumpEvent` carries `targetScopeCreationStep` — a reference to the scope whose
loop is being broken/continued. In JEJ without labels, this is always the
innermost enclosing loop's scope. With labels (easter egg), it may target an
outer loop.

## TestEvent coercion field

`TestEvent` has an optional `coercion?: ValueRepresentation` field. Present when
the tested value is not already a boolean — it shows the `Boolean(value)`
intermediate. Same pattern as operator coercion on `PureOperatorEvent`.

Examples:

- `if ('hello')` → `value: {type:'string', value:'hello'}`,
  `coercion: {type:'boolean', value:true}`, `result: true`
- `while (count)` where count is 3 → `value: {type:'number', value:3}`,
  `coercion: {type:'boolean', value:true}`, `result: true`
- `if (true)` → `value: {type:'boolean', value:true}`, no coercion field (value
  is already boolean), `result: true`
- `for (;i < 5;)` where `i < 5` evaluates to `true` → no coercion (comparison
  already produces a boolean)

## All events carry scopeCreationStep

Every control flow event references the scope it belongs to via
`scopeCreationStep`. This enables consumers to correlate control flow events
with their enclosing scope without relying on trace ordering.
