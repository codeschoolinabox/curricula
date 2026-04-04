# Literal Event Generator

Creates `LiteralEvent` objects for when a value is created from a literal
expression: string, boolean, number, undefined, null, or regex.

## `createLiteralEvent`

**Inputs:** literal kind, value representation.

**Constraints:**

- `kind: 'regex'` requires a `RegExpValue` representation
- Other kinds require matching `PrimitiveValue` types
