# Operator Generators — Design Decisions

## Three operator categories

The split follows runtime semantics:

- **Pure**: always evaluates all operands, produces a new value, no side
  effects. The `subkind` field distinguishes arithmetic, addition, comparison,
  typeof, negation (logical/bitwise), and bitwise operators.
- **Short-circuiting**: may skip evaluating the right operand. `shortCircuited`
  flag indicates whether this happened. When true, `right` is absent.
- **Assignment**: mutates a binding. `operands` contains [currentValue, rhs] for
  compound, [rhs] for plain `=`. Logical compound assignments (??=, ||=, &&=)
  may short-circuit — the `shortCircuited` flag indicates no assignment
  occurred.

## Coercion comparison

Pure and assignment generators receive optional `coercedOperands`. The generator
compares each coerced operand with the original by checking `type` and `value`
equality. If any pair differs, the full `coercion` array is included in the
event. If all match (no coercion occurred), the field is omitted entirely.

The coerced values come from Aran's advice, which observes what the JS engine
actually used. This avoids re-implementing JS coercion rules in the generators.

## shortCircuited consistency

All three operator types, plus `PropertyAccessEvent` (optional chaining), use
the same `shortCircuited?: true` pattern. The field is present (with value
`true`) when short-circuiting occurred, absent otherwise. This is consistent
across the entire event system.

## Assignment + BindingEvent duality

Non-shortCircuited assignments also trigger a `BindingEvent(assign)` — the
assignment operator event captures the operation, the binding event captures the
state change. Shortcircuited assignments emit the operator event only (no state
changed, no binding event).
