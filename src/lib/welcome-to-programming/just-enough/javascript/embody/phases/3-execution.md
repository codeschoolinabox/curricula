# Phase 3: execution

## Overview

The execution phase takes the scope tree produced by phase 2 and evaluates the
program by walking the AST in **source order**, statement by statement,
expression by expression. This is where values are computed, bindings are
resolved, and the program produces its observable effects.

The starting state is:

- The global environment, fully populated with built-in objects, functions, and
  constants
- The script scope, containing all top-level `let`/`const` bindings in `<TDZ>`
- No block scope environment objects yet — these are created lazily as blocks
  are entered

---

## Two viewing levels

The execution phase operates on two simultaneous levels:

**Visual-syntax level** — anchored to the code the learner sees. Expressions
produce values; statements control which code runs and when. This is the control
panel.

**Behind-the-scenes level** — what the engine does invisibly. Values flow
through expressions; bindings hold values in named memory slots; scopes form a
chain; coercions transform types implicitly. This is the machine.

**Resolve** is the bridge between levels: the moment an expression produces a
value, connecting which syntax produced which data.

---

## Evaluation model

Execution proceeds by **recursive descent** through the AST: to evaluate a node,
evaluate its children first (bottom-up for expressions), then combine their
results. Statements are evaluated in sequence; expressions produce values.

Two fundamental operations underlie all execution:

**Scope chain lookup** — resolving an identifier to its binding by walking the
scope chain from innermost to outermost: block → script → global. Each scope
checked is a separate observable step. If no binding is found after reaching
global: `ReferenceError` (undeclared). If a binding is found but is in `<TDZ>`:
`ReferenceError` (TDZ).

**Prototype chain lookup** — resolving a method on a value by walking the
prototype chain: value → Constructor.prototype. For JEJ primitives this is
always two steps. Parallels scope chain lookup: both are "walk a chain to find a
name."

```
scope-check:    block → script → global    (finding a variable)
proto-check:    value → Constructor.prototype    (finding a method)
```

---

## Binding lifecycle (phases 2 + 3)

| Stage          | Phase                              | Event                | Description                                     |
| -------------- | ---------------------------------- | -------------------- | ----------------------------------------------- |
| **declare**    | 2 (script scope) / 3 (block scope) | `binding:declare`    | Binding exists; value is `<TDZ>`                |
| **initialize** | 3                                  | `binding:initialize` | Binding receives first value; TDZ ends          |
| **available**  | 3                                  | `binding:available`  | Binding is safe to read; fires after initialize |
| **access**     | 3                                  | `binding:access`     | Binding's current value is read                 |
| **update**     | 3                                  | `binding:update`     | `let` binding's value changes                   |

`const` bindings have no update stage. An attempt to update a `const` binding
throws a `TypeError` at execution time.

---

## I/O channels

Two external channels through which a JEJ program communicates with the outside
world. Not part of the computation model (values, bindings, scopes) — these are
the places where the program's effects become visible to humans.

### Developer console

An append-only output stream, visible in browser devtools. Does not pause
execution. Accessed via the `console` object in the global environment.

| Event           | Description                          |
| --------------- | ------------------------------------ |
| `io:dev:log`    | `console.log(...)`                   |
| `io:dev:warn`   | `console.warn(...)`                  |
| `io:dev:error`  | `console.error(...)`                 |
| `io:dev:assert` | `console.assert(condition, message)` |
| `io:dev:count`  | `console.count(label)`               |

### User interface

A synchronous dialog channel. **Pauses execution** until the user responds.
Visible to the user as a browser dialog.

| Function       | User sees                        | Program receives | Event                               |
| -------------- | -------------------------------- | ---------------- | ----------------------------------- |
| `alert(msg)`   | message + OK                     | `undefined`      | `io:user:display`                   |
| `confirm(msg)` | message + OK/Cancel              | `boolean`        | `io:user:display` + `io:user:input` |
| `prompt(msg)`  | message + text field + OK/Cancel | `string \| null` | `io:user:display` + `io:user:input` |

`io:user:display` fires when the dialog appears; `io:user:input` fires when the
user responds. The user interface is the primary subject of Chapter 3 of the
course.

---

## Event stream

Execution fires events in source order as each AST node is evaluated. Each event
carries a `JSONPath` linking it back to the corresponding AST node.

### Event types

```ts
type JSValue =
	| number
	| string
	| bigint
	| boolean
	| null
	| undefined
	| '<TDZ>'
	| '<object>' // opaque reference — used for Date instances, regex
	| '<function>'; // opaque reference — used for built-in functions

type ExitReason = 'normal' | 'break' | 'continue' | 'error';

type ExecutionEvent =
	// ── Scope events ──────────────────────────────────────────────────
	| {
			kind: 'scope:open';
			scopeType: 'block';
			astPath: JSONPath; // path to the BlockStatement node
	  }
	| {
			kind: 'scope:close';
			scopeType: 'block';
			exitReason: ExitReason;
			astPath: JSONPath;
	  }

	// ── Binding events ─────────────────────────────────────────────────
	| {
			kind: 'binding:declare';
			name: string;
			declarationKind: 'let' | 'const';
			initialState: '<TDZ>';
			astPath: JSONPath; // path to the VariableDeclarator node
	  }
	| {
			kind: 'binding:initialize';
			name: string;
			declarationKind: 'let' | 'const';
			value: JSValue; // the resolved initialiser value; never <TDZ>. For `let x;` (no initialiser), value is `undefined`
			astPath: JSONPath; // path to the VariableDeclarator node
	  }
	| {
			kind: 'binding:available';
			name: string;
			astPath: JSONPath;
	  }
	| {
			kind: 'binding:access';
			name: string;
			value: JSValue;
			astPath: JSONPath; // path to the Identifier node
	  }
	| {
			kind: 'binding:update';
			name: string;
			oldValue: JSValue;
			newValue: JSValue;
			astPath: JSONPath; // path to the AssignmentExpression or UpdateExpression
	  }

	// ── Expression / resolve events ────────────────────────────────────
	| {
			kind: 'resolve:literal';
			value: JSValue;
			astPath: JSONPath;
	  }
	| {
			kind: 'resolve:binary';
			operator: string;
			left: JSValue;
			right: JSValue;
			result: JSValue;
			astPath: JSONPath;
	  }
	| {
			kind: 'resolve:unary';
			operator: string;
			operand: JSValue;
			result: JSValue;
			astPath: JSONPath;
	  }
	| {
			kind: 'resolve:logical';
			operator: '&&' | '||' | '??';
			left: JSValue;
			shortCircuited: boolean; // true if right was not evaluated
			result: JSValue;
			astPath: JSONPath;
	  }
	| {
			kind: 'resolve:conditional';
			test: JSValue;
			branch: 'consequent' | 'alternate';
			result: JSValue;
			astPath: JSONPath;
	  }
	| {
			kind: 'resolve:template';
			parts: JSValue[]; // the evaluated expressions interpolated into the string
			result: string;
			astPath: JSONPath;
	  }
	| {
			kind: 'resolve:assignment';
			operator: string; // "=", "+=", "-=", "??=", etc.
			name: string;
			oldValue: JSValue;
			newValue: JSValue;
			astPath: JSONPath;
	  }
	| {
			kind: 'resolve:call';
			callee: string; // string representation of the callee
			args: JSValue[];
			result: JSValue;
			astPath: JSONPath;
	  }
	| {
			kind: 'resolve:member';
			object: JSValue;
			property: string;
			result: JSValue;
			astPath: JSONPath;
	  }
	| {
			kind: 'resolve:optionalChain';
			object: JSValue;
			property: string;
			shortCircuited: boolean; // true if object was null/undefined — result is undefined, chain not accessed
			result: JSValue;
			astPath: JSONPath;
	  }

	// ── Coercion events ─────────────────────────────────────────────────
	// fires BETWEEN operand resolution and operator application
	| {
			kind: 'coerce';
			from: JSValue;
			to: JSValue;
			reason:
				| 'string-concat'
				| 'numeric-op'
				| 'boolean-context'
				| 'template-interpolation'
				| 'comparison'
				| 'explicit-conversion';
			astPath: JSONPath;
	  }

	// ── Scope chain lookup events ───────────────────────────────────────
	| {
			kind: 'scope:check';
			scopeType: 'global' | 'script' | 'block';
			name: string;
			result: 'hit' | 'miss' | 'tdz';
			astPath: JSONPath;
	  }

	// ── Prototype chain lookup events ───────────────────────────────────
	| {
			kind: 'proto:check';
			value: JSValue;
			property: string;
			result: 'hit' | 'miss';
			astPath: JSONPath;
	  }

	// ── Statement events ─────────────────────────────────────────────────
	| {
			kind: 'stmt:if';
			test: JSValue;
			branch: 'consequent' | 'alternate' | 'skipped';
			astPath: JSONPath;
	  }
	| {
			kind: 'stmt:while:test';
			test: JSValue;
			continuing: boolean;
			astPath: JSONPath;
	  }
	| {
			kind: 'stmt:dowhile:test';
			test: JSValue;
			continuing: boolean;
			astPath: JSONPath;
	  }
	| {
			kind: 'stmt:for:init';
			astPath: JSONPath;
	  }
	| {
			kind: 'stmt:for:test';
			test: JSValue;
			continuing: boolean;
			astPath: JSONPath;
	  }
	| {
			kind: 'stmt:for:update';
			astPath: JSONPath;
	  }
	| {
			kind: 'stmt:forof:step';
			iterationValue: JSValue;
			astPath: JSONPath;
	  }
	| {
			kind: 'stmt:break';
			astPath: JSONPath;
	  }
	| {
			kind: 'stmt:continue';
			astPath: JSONPath;
	  }

	// ── I/O events ───────────────────────────────────────────────────────
	| {
			kind: 'io:dev:log' | 'io:dev:warn' | 'io:dev:error';
			args: JSValue[];
			astPath: JSONPath;
	  }
	| {
			kind: 'io:dev:assert';
			condition: boolean;
			message: string;
			passed: boolean;
			astPath: JSONPath;
	  }
	| {
			kind: 'io:dev:count';
			label: string;
			count: number;
			astPath: JSONPath;
	  }
	| {
			kind: 'io:user:display';
			fn: 'alert' | 'confirm' | 'prompt';
			message: string;
			astPath: JSONPath;
	  }
	| {
			kind: 'io:user:input';
			fn: 'confirm' | 'prompt';
			response: boolean | string | null;
			astPath: JSONPath;
	  }

	// ── Error events ──────────────────────────────────────────────────────
	// JEJ has no try/catch — every runtime error is unhandled and terminates execution
	| {
			kind: 'error';
			errorType: 'ReferenceError' | 'TypeError' | 'RangeError';
			message: string;
			astPath: JSONPath; // the node where the error was thrown
	  };
```

---

## Example

Source:

```js
const x = 1 + 2;
let y = x;
if (y > 2) {
	const z = y * 2;
}
```

Execution event stream (phase 2 has already declared `x` and `y` as `<TDZ>` in
script scope):

```
resolve:literal       1                          $.body[0].declarations[0].init.left
resolve:literal       2                          $.body[0].declarations[0].init.right
resolve:binary        1 + 2 → 3                 $.body[0].declarations[0].init
binding:initialize    x = 3  (const)            $.body[0].declarations[0]
binding:available     x                         $.body[0].declarations[0]

scope:check           script  x  hit            $.body[1].declarations[0].init
binding:access        x → 3                     $.body[1].declarations[0].init
binding:initialize    y = 3  (let)              $.body[1].declarations[0]
binding:available     y                         $.body[1].declarations[0]

scope:check           script  y  hit            $.body[2].test.left
binding:access        y → 3                     $.body[2].test.left
resolve:literal       2                         $.body[2].test.right
resolve:binary        3 > 2 → true              $.body[2].test
stmt:if               test=true  branch=consequent   $.body[2]

scope:open            block                     $.body[2].consequent
binding:declare       z  <TDZ>  const           $.body[2].consequent.body[0].declarations[0]
scope:check           script  y  hit            $.body[2].consequent.body[0].declarations[0].init.left
binding:access        y → 3                     $.body[2].consequent.body[0].declarations[0].init.left
resolve:literal       2                         $.body[2].consequent.body[0].declarations[0].init.right
resolve:binary        3 * 2 → 6                 $.body[2].consequent.body[0].declarations[0].init
binding:initialize    z = 6  (const)            $.body[2].consequent.body[0].declarations[0]
binding:available     z                         $.body[2].consequent.body[0].declarations[0]
scope:close           block  exitReason=normal  $.body[2].consequent
```

---

## Key execution behaviours

### TDZ resolution ordering

Bindings transition out of `<TDZ>` strictly in source order, when execution
reaches the `VariableDeclarator` node. Accessing a binding before its declarator
fires an `error` event with `ReferenceError (TDZ)`. After `binding:available`,
the binding is live and accessible for the rest of its scope's lifetime.

### Block scope lifetime

A block scope environment is created at `scope:open` — this is when block-scope
`let`/`const` bindings are declared (as `<TDZ>`). It is destroyed at
`scope:close`. The same block can open and close multiple times if it is the
body of a loop: each iteration gets a fresh scope, a fresh set of `<TDZ>`
declarations, and fresh `binding:initialize` events.

### Short-circuit evaluation

`resolve:logical` events carry a `shortCircuited` flag. When `&&` short-circuits
on a falsy left operand, or `||` short-circuits on a truthy left operand, the
right-hand expression is never evaluated and no events fire for it.

### Coercion visibility

Coercion events fire between operand resolution and operator application —
making the invisible visible. For example, `'5' + 1` produces:

```
resolve:literal    '5'
resolve:literal    1
coerce             1 → '1'   reason=string-concat
resolve:binary     '5' + '1' → '51'
```

### do-while ordering

In a `do-while` loop, the block body executes before the first test. The event
order is:

```
scope:open    block
[body events]
scope:close   block
stmt:dowhile:test   test=... continuing=...
[if continuing: repeat from scope:open]
```

### break and continue

`break` fires `stmt:break` then `scope:close` with `exitReason=break`.
`continue` fires `stmt:continue` then `scope:close` with `exitReason=continue`.
The scope always closes — `scope:close` fires regardless of how a block exits.
