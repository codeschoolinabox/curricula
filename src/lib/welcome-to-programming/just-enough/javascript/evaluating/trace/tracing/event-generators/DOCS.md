# Event Generators — Architecture

## Why a wrapper function

Individual generators handle domain logic (binding validation, coercion
comparison, scope navigation). Source metadata (`loc`, `node`, `source`,
`semantics`) is a cross-cutting concern — every event needs it, but it comes
from Aran's advice layer, not from the domain. The wrapper attaches metadata
once, in one place, then deep freezes the combined result.

This separation means generators are testable without constructing source
locations, and the metadata contract changes in one place if it evolves.

## Why a config-mirroring namespace object

The generators namespace mirrors the config schema structure. If you know
`operators.pure.arithmetic` in the config, you know
`generators.operators.pure.arithmetic` is the factory. This enables:

- Programmatic dispatch: Aran advice passes a config path string, the wrapper
  resolves it to a generator function
- Self-documenting: the namespace IS the map of what events exist
- Parallel traversal: config and generators can be walked together

Leaf functions in the namespace are thin wrappers that pre-fill fixed fields
(like `subkind: 'arithmetic'`) and delegate to the underlying generator.

## Why generators receive ValueRepresentation (not raw values)

The prior art had generators call `representValue()` internally. We removed
DataMode — there's only one representation now. Value construction is the
caller's responsibility because:

- Generators don't need to know how values are serialized
- The same `ValueRepresentation` may be reused across multiple events (e.g., a
  binding read value becomes an operator operand)
- Simpler generator signatures and tests

## Coercion strategy

Generators that support coercion (`PureOperatorEvent`, `AssignmentOperatorEvent`)
receive an optional `coercedOperands` array alongside `operands`. The generator
compares each pair — if any differ, the full `coercion` array is included. If
all match, the field is omitted.

The coercion values come from Aran's advice, which has access to the actual
runtime coerced values. This avoids duplicating JS coercion logic in the
generators.

## Validation strategy

Each generator validates its required fields and throws descriptive errors on
invalid input. Validation happens at the generator boundary (not internal
helpers). Constraints like "shortCircuited only valid on optionalChaining" are
enforced in the generator, not the wrapper.

## Deep freeze

The wrapper — not individual generators — deep freezes the final event object.
Generators return plain objects; the wrapper combines them with metadata and
freezes the result. This avoids double-freezing and keeps generators simple.
