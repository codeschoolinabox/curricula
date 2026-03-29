# utils/

Pure utility functions for deep object operations. JavaScript's built-in object
tools (`Object.assign`, spread, `Object.freeze`) are all shallow — these
utilities fill that gap for immutable-style programming with nested data
structures.

## Utilities

### deep-clone

Creates a serializable deep copy of any JavaScript value. Handles nested
objects, arrays, and special types (Date, RegExp, Set, Map) while detecting
circular references.

```typescript
import deepClone from './deep-clone.js';

const original = { date: new Date(), nested: { value: 1 } };
const cloned = deepClone(original);
// cloned.date is a new Date instance
// cloned.nested is a different reference from original.nested
```

### deep-freeze

Recursively freezes a deep copy of an object. Unlike `Object.freeze` which is
shallow and mutates in-place, this creates a clone and freezes the clone — the
original is untouched.

```typescript
import deepFreeze from './deep-freeze.js';

const original = { nested: { value: 1 } };
const frozen = deepFreeze(original);

original.nested.value = 2; // still works — original not frozen
frozen.nested.value = 3; // TypeError in strict mode
```

### deep-freeze-in-place

Freezes an object and all nested objects/arrays IN PLACE — no clone, no copy.
The input reference IS the frozen result. Use for objects you just built; never
for caller-provided data.

```typescript
import deepFreezeInPlace from './deep-freeze-in-place.js';

const result = { meta: { preset: 'detailed' }, options: { limit: 100 } };
const frozen = deepFreezeInPlace(result);

console.log(frozen === result); // true — same reference
frozen.meta.preset = 'overview'; // TypeError in strict mode
```

Contrast with `deepFreeze` which clones first (for objects you don't own).

### deep-merge

Recursively merges two objects with the second (user) taking precedence. Arrays
are replaced completely — no element-by-element merging.

```typescript
import deepMerge from './deep-merge.js';

const preset = { vars: { read: false, write: true } };
const user = { vars: { read: true } };
const result = deepMerge(preset, user);
// result: { vars: { read: true, write: true } }
```

### deep-equal

Recursively compares two values for structural equality. Handles the same type
universe as `deepClone`: primitives, Date, RegExp, Array, Set, Map, and plain
objects.

```typescript
import deepEqual from './deep-equal.js';

deepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] }); // true
deepEqual(new Date('2024-01-01'), new Date('2024-01-01')); // true
deepEqual([1, 2], [1, 2, 3]); // false
```

### is-plain-object

Predicate that returns true only for `{}` literals and
`Object.create(Object.prototype)`. Class instances (Date, RegExp, Set, Map,
custom classes) and `Object.create(null)` are not plain objects.

```typescript
import isPlainObject from './is-plain-object.js';

isPlainObject({}); // true
isPlainObject(new Date()); // false
isPlainObject([]); // false
isPlainObject(null); // false
```

Used internally by `deepMerge` and `deepEqual` to distinguish plain objects from
other object types before attempting recursive structural operations.

## Design Principles

- **Pure functions**: No side effects, same input always produces same output.
  **Exception**: `deepFreezeInPlace` intentionally mutates its input. This is
  acceptable because it's only used on freshly-built objects we own — the
  mutation happens before any reference escapes
- **Browser-compatible**: No `structuredClone` — works in all modern browsers
- **Type-preserving**: Generics maintain TypeScript types through operations
- **Circular reference safety**: `deepClone` detects cycles; `deepEqual` tracks
  visited pairs to handle circular references in distinct objects
