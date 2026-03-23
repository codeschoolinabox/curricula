# Legacy Aran Trace: Entry Format & postProcess

Vendored legacy Aran tracer, modified to be environment-agnostic. Works in
Web Workers, Node.js, and browsers. No DOM dependency.

## Architecture

```text
User Code
  -> trace.js: Aran instrumentation (globalThis + eval, no iframe)
    -> Advice callbacks (variables, operators, control-flow, functions, etc.)
      -> print()  (lib/trace-log.js)
        -> traceCollector.emit()  (lib/trace-collector.js)
        -> postMessage() when in worker context (per-step streaming)
          -> entries[]  (plain array)

index.js calls traceCollector.reset() before tracing,
  then traceCollector.getEntries() after tracing completes.
  Returns entries to record.ts -> postProcess.
```

## Entry Shape

`traceCollector.getEntries()` returns a flat array of mixed types:

### Entry objects

```typescript
{
  type: 'log' | 'groupStart',
  prefix: string | null,
  style: string,
  logs: any[],
  loc: SourceLocation | null,   // from state.node.loc (start + end)
  nodeType: string | null        // from state.node.type (ESTree node type)
}
```

### String markers

- `'>>>'` — emitted immediately after a `groupStart` entry
- `'<<<'` — emitted for group end

## What Each Advice Module Emits

### Variables (`advice/variables.js`)

| Pattern              | Operation | Example                        |
| -------------------- | --------- | ------------------------------ |
| `'x (read):'`        | read      | `logs: ['x (read):', 42]`      |
| `'x (declare, let)'` | declare   | `logs: ['x (declare, let)']`   |
| `'x (declare)'`      | declare   | bare, no kind (for-of/for-in)  |
| `'x (initialize):'`  | assign    | `logs: ['x (initialize):', 5]` |
| `'x (assign):'`      | assign    | `logs: ['x (assign):', 10]`    |

### Operators (`advice/operators.js`)

Always grouped (3 entries: groupStart, evaluates-to, groupEnd).

| Pattern                | Operation | Example                                   |
| ---------------------- | --------- | ----------------------------------------- |
| `'operation (_ + _):'` | binary    | `logs: ['operation (_ + _):', 3, '+', 4]` |
| `'operation (! _):'`   | unary     | `logs: ['operation (! _):', '!', true]`   |

### Control Flow (`advice/control-flow.js`)

| Pattern                        | Operation   | Example                        |
| ------------------------------ | ----------- | ------------------------------ |
| `'check (if, truthy):'`        | check       | grouped, with source line echo |
| `'check (for-of):'`            | check       | no truthiness for iteration    |
| `'operator (truthy && _):'`    | logical     | grouped                        |
| `'operator (falsy ?_a_:_b_):'` | conditional | grouped                        |
| prefix contains `break`        | break       | not grouped                    |
| prefix contains `continue`     | continue    | not grouped                    |

### Functions (`advice/functions.js`)

| Pattern                    | Operation | Example                       |
| -------------------------- | --------- | ----------------------------- |
| `'add (call):'`            | call      | grouped, args comma-separated |
| `'push (call, built-in):'` | call      | modifier = 'built-in'         |
| `prefix === '(returns):'`  | return    | inside group, before `<<<`    |
| `logs: ['this:', obj]`     | this      | optional, inside group        |

### Error Handling (`advice/error-handling.js`)

| Pattern                   | Operation | Notes                             |
| ------------------------- | --------- | --------------------------------- |
| prefix ends with `catch:` | catch     | loc from `state.node.handler.loc` |
| prefix ends with `throw:` | throw     | loc from `state.node.loc`         |

Note: `logs` contain the raw caught/thrown value, NOT a description string.

### Blocks (`advice/blocks.js`)

Only when `config.blockScope` is enabled:

| Pattern                   | Operation |
| ------------------------- | --------- |
| `logs: ['enter ', depth]` | enter     |
| `logs: ['leave ', depth]` | leave     |

### Hoisted Declarations (`lib/log-hoisted.js`)

| Pattern                 | Operation | Example               |
| ----------------------- | --------- | --------------------- |
| `'hoist: var x'`        | hoist     | modifier = 'var'      |
| `'hoist: function foo'` | hoist     | modifier = 'function' |

### Exceptions (`advice/exception.js`)

| Pattern                         | Operation                |
| ------------------------------- | ------------------------ |
| `prefix: '-> execution phase:'` | exception (header)       |
| `style: 'color:red;'`           | exception (error detail) |

## postProcess Output: AranStep

```typescript
type AranStep = StepCore & {
	operation: AranOperation;
	name: string | null; // variable or function name
	operator: string | null; // operator symbol (+, !, &&, ?:)
	modifier: string | null; // let/const/var/truthy/falsy/built-in/=
	values: unknown[]; // runtime values
	depth: number; // nesting depth (0 = top level)
	scopeType: string | null; // 'call' | 'control' | 'operation' | null
	nodeType: string | null; // ESTree node type from AST
};
```

### Entries excluded by postProcess

- `'>>>'` and `'<<<'` string markers (used for depth tracking only)
- Source line echoes: entries with `prefix === ''` and a single string log that
  isn't a hoist

### Step numbering

Sequential 1-indexed, assigned in a final pass after all entries are processed.

### Depth tracking

- `'>>>'` increments depth
- `'<<<'` decrements depth
- Scope type inferred from the `groupStart` entry preceding `'>>>'`:
  - `call` operation -> scope type `'call'`
  - `check` operation -> scope type `'control'`
  - binary/unary/logical/conditional -> scope type `'operation'`

## Prefix Format Reference

Controlled by `config.steps` and `config.lines`:

| Config                       | Example prefix       |
| ---------------------------- | -------------------- |
| `steps: true, lines: true`   | `' 1. line  5:3  -'` |
| `steps: true, lines: false`  | `' 1. '`             |
| `steps: false, lines: true`  | `'line  5:3  -'`     |
| `steps: false, lines: false` | `null`               |

postProcess does NOT parse prefix for location — it reads `loc` directly from
the entry object.
