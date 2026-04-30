# Phase 2: creation

## Overview

The creation phase runs after phase 1 (parse and validate) and before any code
executes. It walks the AST once, top-down, and registers all **script-scope**
`let`/`const` bindings. Every binding registered during this phase starts in the
**Temporal Dead Zone (TDZ)**: known by name, but inaccessible until the
execution phase reaches the declaration line.

No values are computed during the creation phase. No expressions are evaluated.
Block scopes are not instantiated — those are created lazily by the execution
phase when a block is actually entered.

The only output of this phase is: the script scope populated with TDZ bindings,
ready to be handed to phase 3.

---

## Scope layers

```
Global environment     ← populated at realm setup, before phase 0
  └── Script scope     ← top-level let/const TDZs registered HERE, in phase 2
        └── Block scopes (created lazily in phase 3, not here)
```

### Global environment

The outermost scope. Created once by the engine before your code is parsed —
before phase 0, before anything. It is the top of the scope chain. Everything
JavaScript provides that you didn't create lives here: built-in objects,
functions, and constants.

In JEJ, the global environment contains:

**Object registers** (boxes holding methods and constants, accessed by
reference): `Math`, `String`, `Number`, `Date`, `console`

**Standalone functions**: `alert`, `confirm`, `prompt`, `parseInt`,
`parseFloat`, `Boolean`

**Constants**: `Infinity`, `NaN`, `undefined`

This scope is **read-only from your code's perspective**. `let`/`const`
declarations never attach here. It is represented in the event stream as a
single `scope:open global` event carrying its pre-populated bindings.

### Script scope

The outermost scope owned by your script. Top-level `let`/`const` declarations —
those at the root of the `Program` node, not inside any block — register their
bindings here during phase 2. This scope is **not** the global environment:
bindings here are not properties of the global object and are not visible to
other scripts.

### Block scopes

Every `BlockStatement` in the AST — including the bodies of `if`/`else`,
`while`, `do-while`, `for`, `for-of`, and explicit `{}` blocks — will eventually
create a block scope. But block scope **environment objects are not created
during phase 2**. They are instantiated lazily by phase 3 when execution
actually enters the block. If a block is never entered (e.g. `if (false) {}`),
its bindings never exist.

---

## Binding lifecycle

A binding is a named memory slot. In JEJ, every binding is either `let` or
`const`. The lifecycle has five stages:

1. **declare** — the binding exists but is in the Temporal Dead Zone (TDZ). The
   name is known; the value is not yet accessible. In phase 2, all script-scope
   bindings are declared. In phase 3, block-scope bindings are declared when
   their scope is opened.
2. **initialize** — the binding receives its first value. TDZ ends. (`let x = 5`
   → `5`; `let x;` → `undefined`)
3. **available** — the binding is safe to read. Fires immediately after
   initialize.
4. **access** — the binding's current value is read.
5. **update** — the binding's value changes. `const` bindings have no update
   stage — an attempt throws a `TypeError` at execution time.

Phase 2 handles stage 1 only for script-scope bindings. Stages 2–5 all happen in
phase 3.

---

## Bindings registered in phase 2

Only **script-scope** bindings are declared during phase 2. Block-scope bindings
are declared by phase 3 at `scope:open` time.

| Declaration location             | Declared in phase                     | Initial state |
| -------------------------------- | ------------------------------------- | ------------- |
| Top-level `let` (script scope)   | Phase 2 — creation                    | `<TDZ>`       |
| Top-level `const` (script scope) | Phase 2 — creation                    | `<TDZ>`       |
| `let`/`const` inside a block     | Phase 3 — execution (at `scope:open`) | `<TDZ>`       |

TDZ means the binding is known to exist — attempting to access it before its
declaration line throws a `ReferenceError` at execution time, not an "undeclared
variable" error. The engine distinguishes "name exists but is in TDZ" from "name
does not exist in any scope".

---

## Event stream

The phase 2 event stream is short: global environment open, script open,
script-scope bindings declared in source order, script close. Block scope events
are phase 3 events.

### Event types

```ts
type BuiltinBinding = {
	name: string;
	value: 'builtin'; // opaque — exact value provided by the engine
};

type CreationEvent =
	| {
			kind: 'scope:open';
			scopeType: 'global';
			bindings: BuiltinBinding[]; // pre-populated, not TDZ
			astPath: null; // global environment has no corresponding AST node
	  }
	| {
			kind: 'scope:open';
			scopeType: 'script';
			astPath: JSONPath; // always "$"
	  }
	| {
			kind: 'scope:close';
			scopeType: 'script';
			astPath: JSONPath; // always "$"
	  }
	| {
			kind: 'binding:declare';
			name: string;
			declarationKind: 'let' | 'const';
			initialState: '<TDZ>';
			astPath: JSONPath; // path to the VariableDeclarator node
	  };
```

### Event ordering rules

1. `scope:open global` is always the first event — no corresponding
   `scope:close`
2. `scope:open script` fires immediately after
3. `binding:declare` events fire in source order for top-level declarations only
4. A `VariableDeclaration` with multiple declarators (`let a, b`) fires one
   `binding:declare` event per declarator, left to right
5. `scope:close script` is always the last phase 2 event

---

## Example

Source:

```js
const x = 1 + 2;
let y = x;

if (true) {
	const z = y * 2;
	let w = 4;
}
```

Phase 2 event stream:

```
scope:open    global   (bindings: Math, String, Number, Date, console, alert, ...)
scope:open    script   (astPath: "$")
binding:declare   x    <TDZ>  const   (astPath: "$.body[0].declarations[0]")
binding:declare   y    <TDZ>  let     (astPath: "$.body[1].declarations[0]")
scope:close   script   (astPath: "$")
```

The `if` block's bindings (`z`, `w`) are not declared here. They will be
declared when phase 3 enters that block — or never, if the condition is false.

---

## Resulting scope tree handed to phase 3

```
global environment
  Math     → builtin
  String   → builtin
  Number   → builtin
  Date     → builtin
  console  → builtin
  alert    → builtin
  confirm  → builtin
  prompt   → builtin
  parseInt → builtin
  parseFloat → builtin
  Boolean  → builtin
  Infinity → builtin
  NaN      → builtin
  undefined → builtin

script scope
  x        → <TDZ>  (const)
  y        → <TDZ>  (let)
```

Block scopes will be opened dynamically as phase 3 proceeds.

---

## What phase 2 does NOT do

- Evaluate any expressions (the `= 1 + 2` in `const x = 1 + 2` is not touched)
- Resolve any identifier references
- Execute any code
- Declare bindings for `let`/`const` inside blocks — those are declared lazily
  in phase 3
- Instantiate block scope environment objects — those are created when phase 3
  enters each block
