# represent-value

Converts raw JavaScript runtime values to the `ValueRepresentation` union type
defined in `../types.ts`.

## Purpose

Advice functions receive raw JS values at runtime (expression results, variable
values, function arguments). Event generators expect typed `ValueRepresentation`
objects. This utility bridges the gap.

## Who uses it

- `weaving/advice/block-declaration.ts` — variable initial values
- `weaving/advice/expression-after.ts` — literal values, read values, test values
- `weaving/advice/apply-around.ts` — operator operands/results, property values,
  function args/returns
- `weaving/advice/effect-before.ts` — assignment values (via `state.lastExpressionResult`)

## Value mapping

| JS value | ValueRepresentation |
| --- | --- |
| `'hello'` | `{ type: 'string', value: 'hello' }` |
| `42` | `{ type: 'number', value: 42 }` |
| `NaN` | `{ type: 'number', value: NaN, isNaN: true }` |
| `Infinity` | `{ type: 'number', value: Infinity, isInfinity: true }` |
| `-0` | `{ type: 'number', value: -0, isNegative: true }` |
| `-Infinity` | `{ type: 'number', value: -Infinity, isInfinity: true, isNegative: true }` |
| `-5` | `{ type: 'number', value: -5, isNegative: true }` |
| `true` | `{ type: 'boolean', value: true }` |
| `undefined` | `{ type: 'undefined' }` |
| `null` | `{ type: 'object', value: null, isNull: true }` |
| `function foo(a,b){}` | `{ type: 'function', name: 'foo', arity: 2 }` |
| `/abc/gi` | `{ type: 'regexp', pattern: 'abc', flags: 'gi' }` |
| `{}` (fallback) | `{ type: 'object', value: null, isNull: true }` |

## Design notes

- Returns frozen objects (consumed by `createTraceEvent` which deep-freezes)
- Handles all JS edge cases relevant to JEJ: NaN, Infinity, -0, negative numbers
- Function representation includes `arity` (`.length`) for pedagogical value
- Unknown types fall back to NullValue — JEJ learner code only uses primitives,
  so this fallback rarely fires
