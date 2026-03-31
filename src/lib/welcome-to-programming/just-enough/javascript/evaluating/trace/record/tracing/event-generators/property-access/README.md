# Property Access Event Generator

Creates `PropertyAccessEvent` objects for dot, bracket, and optional chaining
property reads.

## `createPropertyAccessEvent`

**Inputs:** access kind, object name, property key, accessed value, and optional
shortCircuited flag.

**Constraints:**

- `shortCircuited` only valid when `kind === 'optionalChaining'`
- When short-circuited, the value is `undefined` (no actual property lookup
  occurred)
