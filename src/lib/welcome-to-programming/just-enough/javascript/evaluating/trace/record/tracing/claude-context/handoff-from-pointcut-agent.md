# Advice Implementation Handoff

Everything you need to implement the advice functions. Read this COMPLETELY
before writing any code.

---

## Table of Contents

- [What you're building](#what-youre-building)
- [Architecture overview](#architecture-overview)
- [How Aran calls your advice](#how-aran-calls-your-advice)
- [The state object](#the-state-object)
- [The point data](#the-point-data)
- [How to emit trace events](#how-to-emit-trace-events)
- [The 2D config gate rule](#the-2d-config-gate-rule)
- [Advice-by-advice implementation guide](#advice-by-advice-implementation-guide)
- [Aran intrinsics you'll encounter](#aran-intrinsics-youll-encounter)
- [Value representation](#value-representation)
- [Gotchas and traps](#gotchas-and-traps)
- [Testing strategy](#testing-strategy)
- [Files you'll modify](#files-youll-modify)
- [Files you must NOT modify](#files-you-must-not-modify)
- [Codebase conventions](#codebase-conventions)

---

## What you're building

11 advice functions (currently stubs) that:

1. Track runtime state (scope nesting, variable ownership, step counting)
2. Conditionally create trace events via the `createTraceEvent` wrapper
3. Push those events to `state.trace`
4. Always return required values (some hooks MUST return something)

The stubs already have the correct signatures and return values. Your job is to
fill in the TODOs.

---

## Architecture overview

```
JS Source → Aran transpile (with tags) → AranLang IR → Aran weave (with pointcuts)
    → Instrumented JS → Execute → Advice functions called at runtime
                                      ↓
                          state + pointData + builtinArgs
                                      ↓
                          Update state (scope tracking, step counter)
                                      ↓
                          Check config (2D gate: kind × event)
                                      ↓
                          If enabled: createTraceEvent(metadata, generatorPath, payload)
                                      ↓
                          Push frozen event to state.trace
```

**The pointcut functions (already implemented) decide WHICH nodes get
intercepted.** They run at weave time (static analysis) and return point data.

**Your advice functions run at RUNTIME.** They receive actual values (not AST
nodes). They see what the program is doing as it executes.

---

## How Aran calls your advice

Each advice function receives `(state, ...builtinArgs, ...pointData)`:

| Hook                | Signature                                                 | Must return         |
| ------------------- | --------------------------------------------------------- | ------------------- |
| `block@setup`       | `(state, parentType, scopeKind, segmentKind, tag)`        | **new state**       |
| `block@before`      | `(state, parentType, scopeKind, segmentKind, tag)`        | void                |
| `block@declaration` | `(state, frame, parentType, scopeKind, segmentKind, tag)` | void                |
| `block@after`       | `(state, parentType, scopeKind, segmentKind, tag)`        | void                |
| `block@throwing`    | `(state, error, parentType, scopeKind, segmentKind, tag)` | **the error**       |
| `block@teardown`    | `(state, parentType, scopeKind, segmentKind, tag)`        | void                |
| `expression@after`  | `(state, result, ...pointData)`                           | **the result**      |
| `apply@around`      | `(state, callee, thisArg, args, tag)`                     | **the call result** |
| `effect@before`     | `(state, ...pointData)`                                   | void                |
| `effect@after`      | `(state, ...pointData)`                                   | void                |
| `statement@before`  | `(state, ...pointData)`                                   | void                |

**CRITICAL: If a hook says "must return X", failing to do so BREAKS the
program.** `expression@after` must return `result`. `apply@around` must call
`Reflect.apply(callee, thisArg, args)` and return the result. `block@setup` must
return the state. `block@throwing` must return the error.

### What state is

`state` is the `TracerState` object. It is mutable at runtime — you modify it
directly (push to arrays, increment counters, add keys). It is NOT frozen at
runtime (only `initialState` from `createAspect` is frozen; Aran clones it via
JSON for each execution).

### What frame is (block@declaration only)

`frame` is an object mapping variable names to their initial values:

```js
// For: let x = 5; let y;
frame = { x: 5, y: Symbol('aran.deadzone') };
```

Variables initialized to `aran.deadzone_symbol` are in the Temporal Dead Zone
(TDZ) — they have been declared but not yet initialized. This corresponds to our
`BindingEvent(declare)` without a subsequent `BindingEvent(initialize)`.

If the initial value is NOT the deadzone symbol, the variable is immediately
available — emit declare + initialize + available in sequence.

---

## The state object

```ts
type TracerState = {
	trace: unknown[]; // accumulated events
	step: number; // global step counter
	scopeStack: ScopeInfo[]; // scope nesting
	variableScopes: Record<string, number>; // var name → scope creation step
	iterationCounters: Record<string, number>; // scope step → iteration index
	config: Record<string, unknown>; // user's config for conditional dispatch
};

type ScopeInfo = {
	creationStep: number;
	depth: number;
	kind: string; // 'block' | 'module' | 'script' | 'closure'
	structure: string | null;
	structureStep: number | null;
};
```

### How to use the step counter

Every trace event needs a step number. Before creating an event:

```js
state.step += 1;
const currentStep = state.step;
// use currentStep as creationStep, declarationStep, etc.
```

### How to use the scope stack

**block@setup:** Push a new scope entry:

```js
state.step += 1;
state.scopeStack.push({
  creationStep: state.step,
  depth: state.scopeStack.length,
  kind: scopeKind,       // from point data
  structure: /* derive from tag/segmentKind */,
  structureStep: /* step of enclosing control flow event, or null */,
});
```

**block@teardown:** Pop the scope:

```js
state.scopeStack.pop();
```

**Getting current scope info:**

```js
const currentScope = state.scopeStack[state.scopeStack.length - 1];
```

**Getting parent scope:**

```js
const parentScope = state.scopeStack[state.scopeStack.length - 2];
```

---

## The point data

Pointcut functions return arrays with a **discriminant string as the first
element**. The advice function checks `point[0]` to know what case it's
handling:

### expression@after point data

| Discriminant        | Shape                                | Source             |
| ------------------- | ------------------------------------ | ------------------ |
| `'test'`            | `['test', testSource, tag]`          | If/while condition |
| `'literal'`         | `['literal', tag]`                   | Literal value      |
| `'read'`            | `['read', varName, tag]`             | Variable read      |
| `'shortCircuiting'` | `['shortCircuiting', operator, tag]` | &&/\|\|/??/?:      |

### apply@around point data

Always `[tag]`. The advice dispatches based on the runtime `callee` value, not
the point data.

### block@\* point data

Always `[parentType, scopeKind, segmentKind, tag]`:

- `parentType`: AranLang parent node type (`'Program'`, `'IfStatement'`, etc.)
- `scopeKind`: `'module'` | `'script'` | `'block'` | `'closure'`
- `segmentKind`: `'bare'` | `'then'` | `'else'` | `'while'` | `'try'` |
  `'catch'` | `'finally'`
- `tag`: JejTag with source metadata

### effect@before point data

| First element   | Shape             | Source                            |
| --------------- | ----------------- | --------------------------------- |
| variable name   | `[varName, tag]`  | WriteEffect                       |
| operator string | `[operator, tag]` | ConditionalEffect (&&=/\|\|=/??=) |

### statement@before point data

| Discriminant | Shape                  | Source         |
| ------------ | ---------------------- | -------------- |
| `'jump'`     | `['jump', label, tag]` | BreakStatement |

---

## How to emit trace events

Use the `createTraceEvent` wrapper function. It:

1. Resolves the correct event generator from a dot-separated path
2. Calls the generator with your payload
3. Combines with source metadata (loc, node, source, semantics)
4. Deep freezes the result

```ts
import createTraceEvent from '../../event-generators/create-trace-event.js';

// Inside an advice function:
const metadata = {
	semantics: 'expression', // or 'statement'
	loc: tag.loc,
	node: tag.node,
	source: tag.source,
};

const event = createTraceEvent(metadata, 'literals.string', {
	kind: 'string',
	value: { type: 'string', value: 'hello' },
});

state.trace.push(event);
```

### How to determine `semantics`

- `expression@after` → always `'expression'`
- `apply@around` → always `'expression'` (function calls are expressions)
- `effect@before` → always `'expression'` (effects are expression-level)
- `block@*` advice dispatching ScopeEvent → `'statement'`
- `block@before` dispatching BranchEvent → `'statement'`
- `block@before` dispatching IterationEvent → `'statement'`
- `statement@before` dispatching JumpEvent → `'statement'`

### Generator paths (the second argument to createTraceEvent)

These match the config structure:

| Event                        | Generator path                                                      |
| ---------------------------- | ------------------------------------------------------------------- |
| LiteralEvent (string)        | `'literals.string'`                                                 |
| LiteralEvent (number)        | `'literals.number'`                                                 |
| BindingEvent (read)          | `'bindings.read'`                                                   |
| BindingEvent (declare)       | `'bindings.declare'`                                                |
| BindingEvent (assign)        | `'bindings.assign'`                                                 |
| ScopeEvent (create)          | `'scopes.create'`                                                   |
| ScopeEvent (enter)           | `'scopes.enter'`                                                    |
| PureOperatorEvent            | `'operators.pure.arithmetic'` (or `.addition`, `.comparison`, etc.) |
| ShortCircuitingOperatorEvent | `'operators.shortCircuiting'`                                       |
| AssignmentOperatorEvent      | `'operators.assignment'`                                            |
| PropertyAccessEvent (dot)    | `'propertyAccess.dot'`                                              |
| FunctionCallEvent            | `'functions.call'`                                                  |
| FunctionReturnEvent          | `'functions.return'`                                                |
| TestEvent                    | `'controlFlow.test'`                                                |
| BranchEvent                  | `'controlFlow.branch'`                                              |
| IterationEvent               | `'controlFlow.iteration'`                                           |
| JumpEvent                    | `'controlFlow.jump'`                                                |
| DoEvent                      | `'controlFlow.do'`                                                  |
| TemplateBeginEvent           | `'templates.begin'`                                                 |

### Generator payloads

Each generator expects specific fields. Check the generator source files in
`event-generators/` for exact signatures. Key examples:

```ts
// LiteralEvent
{ kind: 'string', value: { type: 'string', value: 'hello' } }

// BindingEvent (read)
{ kind: 'let', event: 'read', name: 'x', scopeCreationStep: 3,
  declarationStep: 1, value: { type: 'number', value: 42 } }

// PureOperatorEvent
{ subkind: 'arithmetic', operator: '+',
  operands: [{ type: 'number', value: 2 }, { type: 'number', value: 3 }],
  result: { type: 'number', value: 5 } }

// ScopeEvent
{ kind: 'block', event: 'create', depth: 1, creationStep: 5,
  parentCreationStep: 0, structure: 'while', structureStep: 4 }

// TestEvent
{ kind: 'while', value: { type: 'string', value: 'hello' },
  result: true, coercion: { type: 'boolean', value: true },
  scopeCreationStep: 3 }
```

---

## The 2D config gate rule

Bindings, scopes, and controlFlow configs use a 2D matrix: **kind × event**. An
event fires ONLY when BOTH gates are enabled.

### Bindings

Before emitting any BindingEvent, check:

1. `config.bindings.kind.{let|const|global}` — is this variable's kind enabled?
2. `config.bindings.events.{declare|initialize|available|assign|read}` — is this
   event type enabled?

The variable's kind (`let`/`const`) comes from:

- **declare/initialize/available**: `tag.bindingKind` on the block's tag
- **read**: looked up from `state.variableScopes[varName]` → find the scope →
  the scope's tag has the kind. OR: maintain a separate
  `state.variableKinds: Record<string, string>` map populated at declaration
  time.
- **assign**: same as read — look up kind from state

### Scopes

Before emitting any ScopeEvent, check:

1. `config.scopes.kind.{script|block|module}` — is this scope kind enabled?
2. `config.scopes.events.{create|enter|completion|interrupt|leave}` — is this
   event type enabled?

The scope kind comes from the pointcut's `scopeKind` parameter.

### ControlFlow

Before emitting controlFlow events, check:

1. `config.controlFlow.kind.conditionals` or
   `config.controlFlow.kind.loops.{while|doWhile|for|forOf}`
2. `config.controlFlow.events.{test|branch|iteration|jump|do|initialize|increment}`

The loop kind comes from `tag.loopKind` on the block's tag.

---

## Advice-by-advice implementation guide

### 1. block-setup.ts (ALWAYS RUNS)

**Purpose:** Initialize scope tracking for every new block.

**Steps:**

1. Extract point data: `const [parentType, scopeKind, segmentKind, tag] = point`
2. Increment step: `state.step += 1`
3. Push scope to stack:
   ```js
   state.scopeStack.push({
   	creationStep: state.step,
   	depth: state.scopeStack.length,
   	kind: scopeKind,
   	structure: deriveStructure(segmentKind, tag),
   	structureStep: null, // filled in later when control flow event fires
   });
   ```
4. If `config.scopes.kind.{scopeKind}` AND `config.scopes.events.create`: create
   and push ScopeEvent(create)
5. Return state (CRITICAL)

### 2. block-before.ts (ALWAYS RUNS)

**Purpose:** Scope enter + per-iteration control flow events.

**Steps:**

1. Extract: `const [parentType, scopeKind, segmentKind, tag] = point`
2. Get current scope: `state.scopeStack[state.scopeStack.length - 1]`
3. If scope event enabled: dispatch ScopeEvent(enter)
4. If `segmentKind === 'then'` or `segmentKind === 'else'`: dispatch BranchEvent
   with `branch: segmentKind === 'then' ? 'consequent' : 'alternate'`
5. If `segmentKind === 'while'`:
   - Get/create iteration counter for this scope's creationStep
   - Dispatch IterationEvent with current index
   - Increment counter
   - If `tag.loopKind === 'doWhile'`: also dispatch DoEvent
   - Loop guard: if maxIterations configured and counter exceeds it, throw new
     RangeError

### 3. block-declaration.ts (ALWAYS RUNS)

**Purpose:** Record variable ownership + emit binding lifecycle events.

**Steps:**

1. Extract: `const [parentType, scopeKind, segmentKind, tag] = point`
2. Get current scope from stack
3. For each `[varName, initialValue]` in `Object.entries(frame)`:
   - Skip Aran parameters (same set as in expression-pointcut)
   - Record: `state.variableScopes[varName] = currentScope.creationStep`
   - Record kind: `state.variableKinds[varName] = tag.bindingKind ?? 'let'`
   - If binding config enabled (2D gate):
     - Emit BindingEvent(declare) with
       `scopeCreationStep: currentScope.creationStep`
     - If `initialValue !== DEADZONE_SYMBOL`:
       - Emit BindingEvent(initialize) with the value
         - `explicit`: check `tag.explicit`
       - Emit BindingEvent(available)
     - If `initialValue === DEADZONE_SYMBOL`:
       - Only declare — initialize/available come later at the assignment

**Note:** `aran.deadzone_symbol` is a special symbol Aran uses to represent
uninitialized bindings (TDZ). You'll need to detect it. It's an intrinsic value
accessible at runtime — store a reference to it in state during the program
block's setup.

### 4. block-after.ts

**Purpose:** Scope completion event.

**Steps:**

1. If scope event enabled: dispatch ScopeEvent(completion)

### 5. block-throwing.ts

**Purpose:** Scope interrupt event on error.

**Steps:**

1. If scope event enabled: dispatch ScopeEvent(interrupt)
2. Return the error (CRITICAL)

### 6. block-teardown.ts (ALWAYS RUNS)

**Purpose:** Pop scope from stack + leave event.

**Steps:**

1. If scope event enabled: dispatch ScopeEvent(leave)
2. Pop: `state.scopeStack.pop()`

### 7. expression-after.ts

**Purpose:** Literal, read, short-circuiting, and test events.

**Steps:**

1. Check discriminant: `const discriminant = point[0]`
2. Switch on discriminant:
   - `'literal'`: extract tag, build ValueRepresentation from `result`, dispatch
     LiteralEvent
   - `'read'`: extract varName and tag, build ValueRepresentation from `result`,
     look up declarationStep and scopeCreationStep from state, dispatch
     BindingEvent(read) — check 2D gate
   - `'shortCircuiting'`: extract operator and tag, the `result` is the
     operator's return value. Determine `shortCircuited` from the execution
     context. Dispatch ShortCircuitingOperatorEvent.
   - `'test'`: extract testSource and tag, `result` is the condition value.
     Compute `Boolean(result)` for the boolean outcome. If result is not already
     boolean, create coercion ValueRepresentation. Dispatch TestEvent — check 2D
     gate (controlFlow.kind + events.test)
3. Return `result` (CRITICAL — always, even if no event was dispatched)

### 8. apply-around.ts

**Purpose:** Function calls, operators, property access, templates.

This is the most complex advice. The `callee` at runtime is the actual function
being called. For Aran-desugared operations, it's an Aran intrinsic function.

**Steps:**

1. Execute the call first:
   `const callResult = Reflect.apply(callee, thisArg, args)`
2. Extract tag from point: `const [tag] = point`
3. Identify what this call represents by checking the callee identity:
   - Compare `callee` against known Aran intrinsic references (you'll need to
     capture these during program initialization)

**Callee identification:**

| Callee is...                                               | Event to dispatch                                                                      |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `aran.performBinaryOperation`                              | PureOperatorEvent — `args[0]` is operator string, `args[1]` and `args[2]` are operands |
| `aran.performUnaryOperation`                               | PureOperatorEvent — `args[0]` is operator string, `args[1]` is operand                 |
| `aran.getValueProperty`                                    | PropertyAccessEvent — `args[0]` is object, `args[1]` is key                            |
| `String.prototype.concat` AND `tag.templateStrings` exists | TemplateEvent sequence                                                                 |
| Any other function                                         | FunctionCallEvent + FunctionReturnEvent                                                |

**For operators:**

```js
if (callee === aranIntrinsics.performBinaryOperation) {
	const operator = args[0]; // string like '+', '===', etc.
	const left = args[1];
	const right = args[2];
	// Determine subkind from operator
	// Build ValueRepresentations for left, right, callResult
	// Check config (operators.pure.{subkind})
	// Dispatch PureOperatorEvent
}
```

**For property access:**

```js
if (callee === aranIntrinsics.getValueProperty) {
	const object = args[0];
	const key = args[1];
	// Determine accessKind from tag.accessKind
	// Build ValueRepresentation for callResult
	// Check config (propertyAccess.{accessKind})
	// Dispatch PropertyAccessEvent
}
```

**For real function calls:**

```js
// Dispatch FunctionCallEvent with name and args
// The callResult is already computed
// Dispatch FunctionReturnEvent with name and result
```

4. Return `callResult` (CRITICAL)

**How to get Aran intrinsic references:** During program initialization
(block@setup for the Program block), the frame will contain Aran's intrinsic
functions. Or you can access them via the runtime's global object. You'll need
to experiment with Aran to find the exact mechanism. Store references in state:

```js
state.aranIntrinsics = {
  performBinaryOperation: /* reference */,
  performUnaryOperation: /* reference */,
  getValueProperty: /* reference */,
};
```

### 9. effect-before.ts

**Purpose:** Assignment events.

**Steps:**

1. Extract point data: `const [firstArg, tag] = point`
2. For WriteEffect (firstArg is a variable name string):
   - Look up binding kind from state
   - Check 2D gate (bindings.kind + bindings.events.assign)
   - If compound assignment (tag.operator exists and is not '='): check
     operators.assignment config Dispatch AssignmentOperatorEvent
   - Dispatch BindingEvent(assign)
3. For ConditionalEffect (firstArg is an operator like '??='):
   - Check operators.assignment config
   - Dispatch AssignmentOperatorEvent with shortCircuited info

### 10. statement-before.ts

**Purpose:** Jump events only (break/continue).

**Steps:**

1. Extract: `const [discriminant, label, tag] = point`
2. If `discriminant === 'jump'`:
   - Determine target loop kind from the current scope stack
   - Dispatch JumpEvent — check 2D gate (controlFlow.kind + events.jump)

### 11. effect-after.ts

**Purpose:** Currently deferred. May be needed later for post-assignment values.

---

## Aran intrinsics you'll encounter in apply@around

When Aran desugars JS, it replaces syntax with function calls to these
intrinsics:

| Intrinsic                     | Original JS              | args                                           |
| ----------------------------- | ------------------------ | ---------------------------------------------- |
| `aran.performBinaryOperation` | `a + b`, `a === b`, etc. | [operator, left, right]                        |
| `aran.performUnaryOperation`  | `typeof x`, `!x`, `-x`   | [operator, operand]                            |
| `aran.getValueProperty`       | `obj.prop`, `obj[key]`   | [object, key]                                  |
| `aran.toPropertyKey`          | computed property keys   | [value]                                        |
| `String.prototype.concat`     | template literals        | [string parts + expression values interleaved] |

**Operator → subkind mapping:**

| Operator string                                | PureOperatorSubkind  |
| ---------------------------------------------- | -------------------- |
| `'-'`, `'*'`, `'/'`, `'%'`, `'**'`             | `'arithmetic'`       |
| `'+'`                                          | `'addition'`         |
| `'==='`, `'!=='`, `'>'`, `'<'`, `'>='`, `'<='` | `'comparison'`       |
| `'typeof'`                                     | `'typeof'`           |
| `'!'`                                          | `'negation.logical'` |
| `'~'`                                          | `'negation.bitwise'` |
| `'&'`, `'\|'`, `'^'`, `'<<'`, `'>>'`, `'>>>'`  | `'bitwise'`          |
| unary `'+'`, unary `'-'`                       | `'arithmetic'`       |

---

## Value representation

Every value in a trace event must be a `ValueRepresentation` object. You need to
convert raw JS values:

```ts
function representValue(value: unknown): ValueRepresentation {
	if (value === null) return { type: 'object', value: null, isNull: true };
	if (value === undefined) return { type: 'undefined' };

	const type = typeof value;

	if (type === 'string') return { type: 'string', value };
	if (type === 'boolean') return { type: 'boolean', value };

	if (type === 'number') {
		const repr: any = { type: 'number', value };
		if (Number.isNaN(value)) repr.isNaN = true;
		if (!Number.isFinite(value) && !Number.isNaN(value)) repr.isInfinity = true;
		if (value < 0 || Object.is(value, -0)) repr.isNegative = true;
		return repr;
	}

	if (type === 'function') {
		return { type: 'function', name: value.name || 'anonymous' };
	}

	if (value instanceof RegExp) {
		return { type: 'regexp', pattern: value.source, flags: value.flags };
	}

	// Fallback — shouldn't happen in JEJ (primitives only)
	return { type: 'object', value: null, isNull: true };
}
```

**This function should live in its own file** (e.g.,
`advice/represent-value.ts`) and be imported by advice functions that need it.

---

## Gotchas and traps

### 1. ALWAYS return the required value

`expression@after` → return `result` `apply@around` → return
`Reflect.apply(callee, thisArg, args)` `block@setup` → return `state`
`block@throwing` → return `error`

If your code throws an error before returning, the program crashes differently
than intended. Use try/catch around your dispatch logic and always return in the
finally block.

### 2. State is shared and mutable

All advice functions in the same block share the same `state` object. Mutations
are visible to all subsequent advice calls. Push events to `state.trace`
directly — no need to clone.

### 3. State must stay Json-serializable

Aran clones `initial_state` via `JSON.parse(JSON.stringify(...))`. At runtime
the state IS mutable, but if you store non-Json values (functions, Symbols,
class instances), they will be lost on program restart or if Aran re-clones.

**Exception:** You may need to store a reference to `aran.deadzone_symbol` in
state. This is a Symbol and not Json-serializable. You'll need a workaround —
either detect it by checking `typeof value === 'symbol'`, or store it in a
module-level variable outside state.

### 4. Aran deadzone symbol

When Aran sets up bindings, uninitialized variables (like `let x;` without an
initializer) are given the value `aran.deadzone_symbol`. This is a unique
Symbol. Accessing a variable that holds this value would normally throw a
ReferenceError (TDZ). In the frame passed to `block@declaration`, you'll see
this symbol as the initial value. Check for it:

```js
const isDeadzone = typeof value === 'symbol';
// or compare to a known reference if you captured it
```

### 5. The tag is your ESTree lifeline

Aran desugars JS heavily. The `tag` on each node is the ONLY source of original
ESTree information. Use it for:

- `tag.loc` → source location
- `tag.node` → original ESTree node type
- `tag.source` → original source text
- `tag.operator` → operator string (on binary/unary/assignment)
- `tag.loopKind` → original loop type (for/for-of/do-while all become while)
- `tag.bindingKind` → 'let' or 'const'
- `tag.accessKind` → 'dot', 'bracket', or 'optionalChaining'
- `tag.literalKind` → 'string', 'number', 'boolean', 'null', 'undefined',
  'regex'

### 6. for-loop phases are not yet implementable

ForInitializeEvent and ForIncrementEvent are defined in the type system but we
don't yet know exactly how Aran desugars for-loops. These are deferred. Don't
try to implement them yet.

### 7. Coercion detection for operators

The `coercion` field on PureOperatorEvent is present only when coercion
occurred. To detect coercion, compare the original operand types with what the
operator actually used. For `'3' + 4`:

- operands: `[{type:'string',value:'3'}, {type:'number',value:4}]`
- coercedOperands: `[{type:'string',value:'3'}, {type:'string',value:'4'}]`
- `4` was coerced to `'4'` (string)

The simplest approach: after calling `Reflect.apply`, check if the operand types
match what the operator would normally expect. If not, compute what the coerced
values would be. This is complex — start without coercion and add it as a
refinement.

### 8. Short-circuiting detection

For `&&`/`||`/`??`/`?:` (ConditionalExpression in AranLang):

- `expression@after` receives the RESULT (not the test value)
- The test expression was a sub-expression that already fired its own
  `expression@after`
- You may need to track "was the right branch evaluated?" in state

This is tricky. The ConditionalExpression's result is the value of whichever
branch was taken. The `shortCircuited` field indicates whether the right side
was evaluated. You may need to use `expression@before` (currently unused) to
track when branches start, or infer from the result.

### 9. Filter arrays are not yet implemented

`bindings.filter`, `propertyAccess.filter`, `operators.filter`,
`controlFlow.filter`, `functions.filter` — these narrow which specific items are
traced. They are deferred. Don't implement them yet.

---

## Testing strategy

Per DEV.md: tests in `advice/tests/` subdirectory, `.test.ts` suffix, one
assertion per `it`, vitest explicit imports.

**Test each advice function with:**

1. A mock `TracerState` object
2. Mock point data arrays matching what the pointcuts produce
3. Mock runtime values (result, callee, frame, etc.)

**Verify:**

- State mutations (scope stack pushed/popped, variableScopes updated, step
  incremented)
- Events pushed to `state.trace` (correct generator path, correct payload)
- Config gating (disabled config → no event in trace)
- Return values (result returned for expression@after, error for block@throwing)

**Example test:**

```ts
import { describe, expect, it } from 'vitest';
import blockSetup from '../block-setup.js';

describe('blockSetup', () => {
  it('pushes scope onto scopeStack', () => {
    const state = { step: 0, scopeStack: [], variableScopes: {}, ... };
    blockSetup(state, 'Program', 'module', 'module', { loc: ..., node: ..., source: ... });
    expect(state.scopeStack).toHaveLength(1);
  });

  it('returns the state', () => {
    const state = { ... };
    const result = blockSetup(state, ...);
    expect(result).toBe(state);
  });
});
```

---

## Files you'll modify

```
pointcuts/advice/
  block-setup.ts
  block-before.ts
  block-declaration.ts
  block-after.ts
  block-throwing.ts
  block-teardown.ts
  expression-after.ts
  apply-around.ts
  effect-before.ts
  effect-after.ts
  statement-before.ts
```

You'll also create:

```
pointcuts/advice/represent-value.ts    — value representation helper
pointcuts/advice/tests/                — test files for each advice
```

---

## Files you must NOT modify

- `pointcuts/pointcut/*.ts` — pointcut functions (already tested, 41 tests)
- `pointcuts/create-aspect.ts` — aspect assembly (wires pointcuts to advice)
- `pointcuts/types.ts` — JejTag, TracerState types
- `event-generators/**/*.ts` — event generators (144 tests)
- `types.ts` — trace event type definitions

If you find a bug in these files, document it and discuss before changing.

---

## Codebase conventions

Read `DEV.md` and `AGENTS.md` at the project root. Key rules:

- One default export per file, named `function` declaration, `export default` at
  bottom
- No named exports (except types.ts files)
- No barrel files / no index.ts re-exports
- Always `.js` extension in imports
- Prefer `const`, `let` only when reassignment needed
- No `this` keyword, no mutable closures over reassigned variables
- Tests in `tests/` subdirectory, `.test.ts` suffix
- One assertion per `it` block
- `kebab-case` filenames matching the default export name
- Deep freeze all returned objects (but state is mutable at runtime — don't
  freeze state)
- Validate at boundaries only (advice functions are internal, generators
  validate)
- TDD: write failing test → implement → refactor
