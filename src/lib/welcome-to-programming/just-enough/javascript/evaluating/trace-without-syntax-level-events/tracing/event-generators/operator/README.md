# Operator Event Generators

Three generators for the three operator categories: pure, short-circuiting, and
assignment. See [DOCS.md](./DOCS.md) for coercion and short-circuit semantics.

## Files

- `create-pure-operator-event.ts` — arithmetic, addition, comparison, typeof,
  negation, bitwise
- `create-short-circuiting-operator-event.ts` — &&, ||, ??, ?:
- `create-assignment-operator-event.ts` — =, +=, -=, and all compound/logical
  assignments
