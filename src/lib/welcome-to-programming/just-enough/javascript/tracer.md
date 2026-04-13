# JEJ Tracer

How the tracer captures the [notional machine](./notional-machine.md) as data.

```
trace(code, config) → { ok, events, ast, code, options, error? }
```

The tracer instruments JavaScript via Aran AST weaving, executes it in a Web
Worker, and returns a fully-linked result: an ordered event stream + a frozen
AST with bidirectional references. Educational tools consume this data to build
any visualization, exercise, or assessment.

See also:

- [notional-machine.md](./notional-machine.md) — the conceptual model
- [tracer.walkthroughs.md](./tracer.walkthroughs.md) — event sequences for every
  JEJ construct
- [tracer.architecture.md](./tracer.architecture.md) — implementation layers,
  vocabulary, test taxonomy

---

## Design principles

**Our boundary**: `trace(code, config) → { ok, events, ast, ... }`

We provide execution traces correlated to a frozen AST. Educational tool
developers configure and consume these traces. We don't decide how to teach
programming — we provide the data foundation.

**Granularity**: smaller, more specific events are better. Each observable
moment in execution is its own event. Events can always be configured out.

**Standalone-useful categories**: each event category carries enough data to be
consumed alone. Expression events have their value even without resolves.
Binding events have their value even without expressions. Redundancy is
intentional.

**Config/trace symmetry**: config structure mirrors trace event structure. If
you know the config path, you know the event shape.

**Eventy naming**: event names describe actions happening. `enter`, `exit`,
`access`, `update` — not `current`, `value`, `state`.

---

## Config structure

Config controls which events the tracer emits. Each event type has its own gate.
Gates are nested by NM component for hierarchical control. Boolean shorthand
expands to enable/disable entire sections.

```typescript
type TraceConfig = {
	// execution constraints (outside options)
	seconds?: number; // timeout in seconds (default 5)
	iterations?: number; // max loop iterations before RangeError
	range?: {
		// source range filter (only events within range)
		start: number | { line: number; column: number };
		end: number | { line: number; column: number };
	};

	// event gates (the options)
	options?: {
		// --- BEHIND-THE-SCENES LEVEL ---

		resolve?:
			| boolean
			| {
					dependent?: boolean; // co-gate with expression events (default true)
					provenance?: boolean; // valueId + sourceValueIds (default true)
					kinds?:
						| boolean
						| {
								variable?: boolean; // resolves from identifier reads (scope-chain lookups)
								literal?: boolean; // literal values
								operator?: boolean; // binary/unary operator results
								shortCircuit?: boolean; // &&, ||, ?? results
								conditional?: boolean; // ternary results
								assignment?: boolean; // assignment expression results
								increment?: boolean; // ++/-- results
								property?: boolean; // property access results
								call?: boolean; // function call return values
								template?: boolean; // template literal results
						  };
			  };

		bindings?:
			| boolean
			| {
					kind?: { let?: boolean; const?: boolean; global?: boolean };
					events?:
						| boolean
						| {
								declare?: boolean; // binding created (hoisted, TDZ starts)
								initialize?: boolean; // first value assigned (TDZ ends)
								available?: boolean; // safe to read
								access?: boolean; // binding read (behind-the-scenes perspective)
								update?: boolean; // binding value changed
						  };
					filter?: string[]; // only trace these variable names
			  };

		scopes?:
			| boolean
			| {
					script?:
						| boolean
						| {
								create?: boolean;
								enter?: boolean;
								interrupt?: boolean;
								completion?: boolean;
								leave?: boolean;
						  };
					block?:
						| boolean
						| {
								create?: boolean;
								enter?: boolean;
								interrupt?: boolean;
								completion?: boolean;
								leave?: boolean;
						  };
					lookup?: boolean; // scope chain walk events (per-scope-check)
					with?: boolean; // easter egg (with statement creates dynamic scope)
			  };

		// --- VISUAL-SYNTAX LEVEL ---

		expression?:
			| boolean
			| {
					identifiers?:
						| boolean
						| {
								read?: boolean; // identifier node evaluated — fires for ALL identifiers:
								// scope-chain (x, Math, prompt) AND property-key (.max, .length)
								// Visual-syntax: "I see this identifier in the code"
								// Behind-the-scenes counterparts: bindings.access (scope chain),
								//   register-check / proto-check (property resolution)
								filter?: string[];
						  };
					operators?:
						| boolean
						| {
								arithmetic?: boolean;
								addition?: boolean;
								comparison?: boolean;
								typeof?: boolean;
								negation?: boolean | { logical?: boolean; bitwise?: boolean };
								bitwise?: boolean;
								shortCircuiting?: boolean;
								conditional?: boolean; // ternary operator
								assignment?:
									| boolean
									| {
											simple?: boolean; // =
											compound?: boolean; // +=, -=, *=, etc.
											logicalCompound?: boolean; // &&=, ||=, ??= (may short-circuit)
											filter?: string[];
									  };
								increment?: boolean | { prefix?: boolean; postfix?: boolean };
								in?: boolean;
								void?: boolean; // easter egg
								comma?: boolean; // easter egg (sequence operator)
								filter?: string[];
						  };
					literals?:
						| boolean
						| {
								string?: boolean;
								number?: boolean;
								boolean?: boolean;
								null?: boolean;
								undefined?: boolean;
								bigint?: boolean;
								regex?: boolean;
						  };
					templates?:
						| boolean
						| { begin?: boolean; evaluation?: boolean; end?: boolean };
					properties?:
						| boolean
						| {
								dot?: boolean;
								bracket?: boolean;
								optionalChaining?: boolean;
								filter?: string[];
						  };
					functions?: boolean | { call?: boolean; filter?: string[] };
			  };

		statements?:
			| boolean
			| {
					conditionals?: boolean | { test?: boolean; branch?: boolean };
					while?: boolean | { test?: boolean; iteration?: boolean };
					doWhile?:
						| boolean
						| { do?: boolean; test?: boolean; iteration?: boolean };
					for?:
						| boolean
						| {
								setup?: boolean;
								test?: boolean;
								increment?: boolean;
								iteration?: boolean;
						  };
					forOf?: boolean | { iteration?: boolean };
					break?: boolean;
					continue?: boolean;
			  };

		// --- STANDALONE ---

		coercion?: boolean; // implicit type transformation events
		prototype?: boolean; // prototype chain walk events
		errors?: boolean; // error events (each carries phase: creation | execution)

	};
};
```

### Config examples

```typescript
// Data flow only — just value production events
{ options: { resolve: true } }

// Variable lifecycle only — declare/init/avail/access/update
{ options: { bindings: true } }

// Control flow only — conditionals + loops + jumps
{ options: { statements: true } }

// Scope visualization — scope structure + what's in each scope
{ options: { scopes: true, bindings: true } }

// Coercion focus — operators + when coercion happens + resulting values
{ options: { expression: { operators: true }, coercion: true, resolve: true } }

// Full trace (all defaults to true)
{}

// Pure data trace — values flow without expression context
{ options: { resolve: { dependent: false, kinds: true }, expression: false } }

// Specific variable tracking
{ options: { bindings: { filter: ['x', 'total'] } } }
```

---

## TraceResult shape

On `ok: true`:

```typescript
{
  ok: true,
  events:      readonly TraceEvent[],           // ordered event stream
  ast:         Readonly<Record<string, ASTNode>>, // nodePath → ASTNode (O(1))
  code:        string,                          // original source (echoed back)
  options:     TraceOptions,                    // config snapshot
}
```

On `ok: false`:

```typescript
{
  ok: false,
  error: {
    kind: 'javascript' | 'timeout' | 'iteration-limit' | 'cancelled',
    name: string,
    message: string,
    phase: 'creation' | 'execution',
  },
  events: readonly TraceEvent[],  // partial events collected before failure
}
```

---

## Event shape

Every event carries:

```typescript
{
  step: number,          // 1-indexed, sequential, no gaps
  semantics: string,     // NM component: 'expression' | 'statement' | 'resolve'
                         //   | 'binding' | 'scope' | 'coercion' | 'error'
                         //   | 'lookup' | 'prototype'
  nodePath: string,      // AST lookup key: '$.body.0.expression.right'
  loc: SourceLocation,   // { start: {line, column}, end: {line, column} }
  type: string,          // ESTree node type: 'BinaryExpression', 'Identifier', ...
  source: string,        // source text of the node
  node: ASTNode,         // direct AST node reference (with children, parent)
}
```

Scalar fields (`nodePath`, `loc`, `type`, `source`) mirror data on the ASTNode.
Present on every event so consumers can work without touching the AST graph —
each event is self-contained for display purposes.

The `node` reference enables AST navigation (parent, children, sibling events on
the same node).

### Event model

- **Flat stream** — events don't nest structurally. Nesting derived from
  `nodePath` + AST relationships.
- **Enter/exit brackets** — compound expressions and statements get enter/exit
  pairs. Exit carries a value (expressions) or reason (statements: `normal`,
  `break`, `continue`, or `error`).
- **Resolve after exit** — resolve fires after exit-expr, carrying the value.
- **Coercion between operands and operator** — fires as its own event.
- **Scope chain per-step** — each scope checked is a separate event.
- **Prototype chain per-step** — each prototype checked is a separate event.
- **Standalone-useful** — values appear on both expression events AND resolve
  events (redundant but each category is useful alone).

---

## The entwined result: events + AST

After execution, the tracer returns two bidirectionally-linked structures:
events point to AST nodes, AST nodes point back to events.

### ASTNode structure

```typescript
{
  syntaxId: string,         // the nodePath key ('$.body.0.test')
  type: string,             // ESTree node type ('BinaryExpression')
  loc: SourceLocation,      // source position
  source: string,           // source text
  parent: ASTNode | null,   // parent node (null at Program root)
  events: TraceEvent[],     // all events that fired on this node (chronological)
  visits: number,           // how many times execution VISITED this node
                            // (NOT events.length — one visit may trigger
                            // many semantic events. visits = how many times
                            // a learner would point at this syntax)
  [children]: ASTNode,      // ESTree children: .left, .right, .body, .test, etc.
}
```

### Bidirectional links

```text
events[0]  ──.node──→  ast['$.body.0']
events[1]  ──.node──→  ast['$.body.0.init']
events[2]  ──.node──→  ast['$.body.0.init']
                              │
                              ├── .events[] ──→ [events[1], events[2]]
                              ├── .visits ──→ 1
                              └── .parent ──→ ast['$.body.0']
```

### Navigation patterns

**From event → AST**:

```typescript
event.node; // the syntax node this event fired on
event.node.type; // 'BinaryExpression'
event.node.loc; // source position for highlighting
event.node.source; // '1 + 2 * 3' for display
event.node.parent; // the containing syntax node
event.node.left; // ESTree child: left operand node
```

**From AST → events**:

```typescript
ast['$.body.0.init'].events; // all events on the initializer
ast['$.body.0.init'].visits; // how many times this node was visited

// find what value an expression produced:
ast['$.body.0.init'].events.filter((e) => e.semantics === 'resolve');
// → the resolve events with .value
```

**Cross-referencing**:

```typescript
// events on the same node share .node identity (===)
events[3].node === events[7].node; // both fired on same syntax

// find the paired binding-update for an assignment:
event.node.events.filter((e) => e.semantics === 'binding');
```

### Circularity

Bidirectional links create cycles:

```text
event.node.events[i].node === event.node  // cycle
node.parent.body[0] === node               // cycle
```

`JSON.stringify` will throw without a replacer. Serialization-safe alternatives:

- `node.syntaxId` instead of circular `node.parent`
- `event.step` instead of circular `node.events[i]`
- `event.nodePath` for lookup instead of `event.node` navigation

### Worked example: `let x = 1 + 2;`

```text
AST:
  Program ($)
    └─ VariableDeclaration ($.body.0)
         └─ VariableDeclarator ($.body.0.declarations.0)
              ├─ Identifier ($.body.0.declarations.0.id)           "x"
              └─ BinaryExpression ($.body.0.declarations.0.init)   "1 + 2"
                   ├─ Literal ($.body.0.declarations.0.init.left)  "1"
                   └─ Literal ($.body.0.declarations.0.init.right) "2"

Events:
  step 1:  scope-create(script)               → node: Program
  step 2:  binding-declare(x, let)            → node: VariableDeclarator
  step 3:  scope-enter(script)                → node: Program
  step 4:  enter-stmt(VariableDeclaration)    → node: VariableDeclaration
  step 5:  enter-expr(BinaryExpression, +)    → node: BinaryExpression
  step 6:  resolve(1)                         → node: Literal (left)
  step 7:  resolve(2)                         → node: Literal (right)
  step 8:  operator(+, [1,2])                 → node: BinaryExpression
  step 9:  exit-expr(+, value: 3)             → node: BinaryExpression
  step 10: resolve(3)                         → node: BinaryExpression
  step 11: binding-initialize(x, 3)           → node: VariableDeclarator
  step 12: binding-available(x)               → node: VariableDeclarator
  step 13: exit-stmt(VariableDeclaration)     → node: VariableDeclaration
  step 14: scope-completion(script)           → node: Program
  step 15: scope-leave(script)                → node: Program

After linking:
  ast['$.body.0.declarations.0.init'].events = [step5, step8, step9, step10]
  ast['$.body.0.declarations.0.init'].visits = 1
  ast['$.body.0.declarations.0.init.left'].events = [step6]
  ast['$.body.0.declarations.0.init.right'].events = [step7]
  ast['$.body.0.declarations.0'].events = [step2, step11, step12]
  ast['$'].events = [step1, step3, step14, step15]

Consumer queries:
  "What value did 1 + 2 produce?"
    → ast['$.body.0.declarations.0.init'].events
        .filter(e => e.semantics === 'resolve')
        → [step10] → value = 3

  "What binding events happened for x?"
    → ast['$.body.0.declarations.0'].events
        .filter(e => e.semantics === 'binding')
        → [step2, step11, step12] → declare, initialize(3), available

  "How many times was + evaluated?"
    → ast['$.body.0.declarations.0.init'].visits → 1
```

---

## Resolve as the data baseline

Every expression-producing event is followed by a `ResolveEvent`. This separates
concerns:

- Expression events carry **context** (operator, operands, name, kind)
- Resolve events carry **the value** (always `ValueRepresentation`)

**Co-gating (`resolve.dependent`)**: by default, a ResolveEvent fires only when
its paired expression event also fires (co-gated at instrumentation time). When
`dependent: false`, resolves fire independently — enabling pure data traces.

**Provenance (`resolve.provenance`)**: default `true`. Every ResolveEvent gains
`valueId` (unique counter) and `sourceValueIds` (which prior values were
inputs). The full provenance graph is reconstructable from ResolveEvents alone.

**Per-kind gates** (`resolve.kinds.*`): control which resolve kinds emit.
Orthogonal to `dependent`.

---

## Scope chain lookup

When an identifier is evaluated, the tracer emits per-scope-check events showing
the chain walk. Gated by `scopes.lookup`.

```text
scope-check(block, miss)
scope-check(script, hit: x)
binding-access(x, value: 5)
resolve(5)
```

Failed lookup = chain of misses → error.

## Prototype chain lookup

When a method is accessed on a value, the tracer emits per-prototype-check
events. Gated by `prototype`.

```text
proto-check(value: 'hello', miss)
proto-check(String.prototype, hit: toUpperCase)
resolve(function toUpperCase)
```

## Coercion events

Implicit type transformations fire as standalone events between operand
resolution and operator application. Gated by `coercion`.

```text
resolve('5')                  ← left operand
resolve(1)                    ← right operand
coerce(1 → '1', context: string-concatenation)
operator(+, ['5', '1'])       ← now string concat
```
