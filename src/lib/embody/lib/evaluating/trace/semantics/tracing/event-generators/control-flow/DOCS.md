# Control Flow Generators — Design Decisions

## Three event categories

Control flow is traced as three event categories, each generator a pure factory
of its already-resolved kind (the advice decides the kind; these generators do
not):

- **`conditional`** — `if` and `ternary`. Events: `test` (the condition
  evaluation) and `branch` (which path an `if` took; ternaries have no branch
  sub-event, so `branch` is always kind `if`).
- **`loop`** — `while`, `doWhile`, `for`, `forOf`. Events: `test` (condition),
  `iteration` (body entry), `do` (doWhile body-before-test), `setup` and
  `increment` (for-loop init / update phases).
- **`jump`** — `break` and `continue`.

`create-test-event` is the one generator that spans two categories: it splits on
the resolved kind — if/ternary → `conditional`, any loop kind → `loop`.

## do-while semantics

`do` fires before every body execution, not just the first. This makes each
iteration's entry point explicit in the trace. For regular while/for loops, the
entry point is the `test` event; for do-while, it is the `do` event.

## forOf-specific fields on the iteration event

`for (const c of 'hello')` creates a new binding per iteration and iterates over
a string. The `iteration` event carries `iterable` (the string, first iteration
only), `iterationValue` (current character), and `iterationVariable` (the loop
variable name). These three fields co-occur — all present for forOf, all absent
for other loop kinds.

## jump references

The `jump` event carries `targetScopeCreationStep` — a reference to the scope
whose loop is being broken/continued. In JEJ without labels, this is always the
innermost enclosing loop's scope. With labels (easter egg), it may target an
outer loop. `jump` is the only control-flow event that still carries `label`.

## test coercion field

The `test` event has an optional `coercion?: ValueRepresentation` field. Present
when the tested value is not already a boolean — it shows the `Boolean(value)`
intermediate. Same pattern as operator coercion on the pure-operator event.

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
`scopeCreationStep`. This lets consumers correlate control flow events with
their enclosing scope without relying on trace ordering.
