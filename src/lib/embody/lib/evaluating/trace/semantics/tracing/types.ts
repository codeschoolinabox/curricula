/**
 * @file JEJ semantic trace event types.
 *
 * API contract between the tracer and consuming learning environments.
 * Events are structured by the 5-layer mental model (README § The 5-layer
 * mental model): every event instance names its layer in `semantics` —
 *
 * - `resolve`    — data layer: what values flowed through the program
 * - `expression` — expression layer: which code produced those values
 * - `statement`  — statement layer: how execution was controlled
 * - `scope`      — structure layer: scope boundaries and binding declaration
 * - `error`      — the error channel: the unhandled error that ends a run
 *
 * `semantics` is fixed per event VARIANT (encoded in each type below), never
 * a free field a generator chooses at runtime. A category may span layers
 * across its variants (BindingEvent: declare → scope, initialize/available →
 * statement, read/update → expression).
 *
 * Every expression-producing event is paired with a ResolveEvent that carries
 * the resulting value. The ResolveEvent IS the result — expression events
 * carry context (operator, operands, name, etc.), not the value.
 *
 * Events are WIRE-SAFE: every field is a scalar or a plain frozen object —
 * `nodePath` is a string key into the ast record, never an ASTNode reference
 * (a direct reference could not cross the worker boundary by structured
 * clone). `ChainedTraceEvent` — the DELIVERED form on `TraceResult.events`
 * and the streamed handle items — adds only the doubly-linked `prev`/`next`
 * chain (non-enumerable, thread-built); there is no `.node` ref, and the ast
 * record is acyclic, so the whole result is `JSON.stringify`-safe.
 *
 * @see ../config.types.ts for the TraceOptions config that gates these events
 * @see ../README.md for the category table and the ubiquitous language
 */

// ============================================================================
// Value Representation
// ============================================================================

/** String value — typeof returns 'string' */
export type StringValue = {
	readonly type: 'string';
	readonly value: string;
};

/**
 * Number value — typeof returns 'number'
 * Flags disambiguate JSON-unsafe values (NaN, ±Infinity, -0)
 */
export type NumberValue = {
	readonly type: 'number';
	readonly value: number;
	readonly isNaN?: true;
	readonly isInfinity?: true;
	readonly isNegative?: true;
};

/** Boolean value — typeof returns 'boolean' */
export type BooleanValue = {
	readonly type: 'boolean';
	readonly value: boolean;
};

/** Undefined value — no value field (undefined is not representable in JSON) */
export type UndefinedValue = {
	readonly type: 'undefined';
};

/**
 * Null value — typeof returns 'object' (JS quirk, intentionally preserved)
 * isNull always present (not optional) to disambiguate from ObjectValue
 */
export type NullValue = {
	readonly type: 'object';
	readonly value: null;
	readonly isNull: true;
};

/**
 * Non-null object value — typeof returns 'object' (arrays and realm objects
 * such as `Math` included). `className` carries the constructor name
 * (`'Object'`, `'Array'`, `'Math'` falls back to `'Object'`) — enough for a
 * learner-facing label without attempting deep serialization.
 *
 * @remarks Discriminate from {@link NullValue} by the absence of `isNull`.
 * Objects are rare in JEJ (realm builtins, mostly); a representation must
 * still never lie — the former fallback that rendered every object as null
 * is exactly the mistrace this member exists to prevent.
 */
export type ObjectValue = {
	readonly type: 'object';
	readonly className: string;
};

/** Function value — represented by name and arity */
export type FunctionValue = {
	readonly type: 'function';
	readonly name: string;
	readonly arity?: number;
	readonly variadic?: true;
};

/** RegExp literal value */
export type RegExpValue = {
	readonly type: 'regexp';
	readonly pattern: string;
	readonly flags: string;
};

/**
 * BigInt value — typeof returns 'bigint', a distinct JEJ-admitted primitive
 * (`42n`). Carried as a DECIMAL STRING: a raw bigint is not JSON-safe
 * (`JSON.stringify(42n)` throws) and does not structured-clone into a plain
 * value, so the string keeps the event wire- and serialization-safe while
 * preserving the exact magnitude and the `typeof` distinction the notional
 * machine teaches (`42n + 1` → TypeError, never silently a number).
 */
export type BigIntValue = {
	readonly type: 'bigint';
	readonly value: string;
};

/**
 * A thrown Error, represented worker-side BEFORE the clone boundary strips
 * its prototype (`instanceof Error` is false after structured clone — the
 * representation must be built where the error is still an Error).
 */
export type ErrorValue = {
	readonly type: 'error';
	readonly name: string;
	readonly message: string;
};

export type ValueRepresentation =
	| StringValue
	| NumberValue
	| BigIntValue
	| BooleanValue
	| UndefinedValue
	| NullValue
	| ObjectValue
	| FunctionValue
	| RegExpValue
	| ErrorValue;

// ============================================================================
// Resolution-walk steps (the NM's "central pedagogical leverage point")
// ============================================================================
//
// PROVISIONAL SHAPES — confirm with the Aran author before locking (D1).
// The two chains have the same shape: an ordered list of checked frames from
// innermost outward, each a hit or a miss; a full miss ends resolution in a
// ReferenceError (scope chain) or `undefined` (proto chain).

/**
 * One frame checked while resolving an identifier up the scope chain.
 * `scopeCreationStep` is NAVIGABLE to that scope's create event (null when it
 * was not emitted). `hit` marks the frame that owns the binding; exactly one
 * `hit: true` on a successful resolve, none on the miss that throws.
 */
export type ScopeChainStep = {
	readonly scopeCreationStep: number | null;
	readonly hit: boolean;
};

/**
 * One object checked while resolving a member up the prototype chain.
 * `object` is the checked object's representation; `hit` marks the object
 * that owns the property. No `hit` anywhere → the access resolves `undefined`.
 */
export type ProtoChainStep = {
	readonly object: ValueRepresentation;
	readonly hit: boolean;
};

// ============================================================================
// Source Location (ESTree-style)
// ============================================================================

export type SourcePosition = {
	readonly line: number;
	readonly column: number;
};

export type SourceLocation = {
	readonly start: SourcePosition;
	readonly end: SourcePosition;
};

// ============================================================================
// Control-flow structure vocabulary (shared with JejTag)
// ============================================================================

export type LoopKind = 'while' | 'doWhile' | 'for' | 'forOf';

/**
 * The control-flow structure a block belongs to — stamped on block tags by
 * the digest so block-level advice knows which construct it is entering.
 */
export type ControlFlowStructure = 'conditional' | LoopKind;

// ============================================================================
// ASTNode — the static layer (built and frozen at instrument time; acyclic)
// ============================================================================

/**
 * An ESTree-style AST node enriched with tracing metadata.
 *
 * @remarks
 * Part of the static `ast` layer — built and FROZEN at instrument time (it is
 * a pure function of the source; nothing about it changes during or after the
 * run). `TraceResult.ast` maps every `nodePath` to its node; `ast['$']` is
 * the root Program node.
 *
 * **Acyclic by design.** The node carries NO `parent` back-reference (the one
 * cycle source in the old design) — navigate up with `parentPath`
 * (`ast[node.parentPath]`) and down via the ESTree child references. Which
 * events fired on a node, and how many times it was visited, live on the
 * result, not the node: `TraceResult.eventsByNode[node.nodePath]` (the
 * navigable `step`s) and `TraceResult.visitCounts[node.nodePath]`. So the
 * whole `ast` record is `JSON.stringify`-safe with no replacer.
 *
 * Standard ESTree children (`.body`, `.left`, `.right`, `.test`, etc.) are
 * present as ASTNode references (a tree — no cycles). Not typed statically
 * here — use `node.type` to discriminate before accessing children.
 */
export type ASTNode = {
	readonly nodePath: string;
	/** Path to the parent — null at the Program root. Navigate: `ast[parentPath]`. */
	readonly parentPath: string | null;
	readonly type: string;
	readonly loc: SourceLocation;
	readonly source: string;
} & { readonly [key: string]: unknown };

// ============================================================================
// Base Event
// ============================================================================

/** The five mental-model layers an event instance can belong to. */
export type EventLayer =
	| 'resolve'
	| 'expression'
	| 'statement'
	| 'scope'
	| 'error';

/**
 * Fields every trace event carries — all wire-safe scalars.
 *
 * @remarks
 * - `step` — 1-indexed, sequential, no gaps: assigned at the EMISSION layer
 *   (the dispatcher), AFTER the runtime gates, so only events that actually
 *   leave the sandbox consume a number. Observations that emit nothing —
 *   iteration-counter ticks, range- or filter-dropped events,
 *   weave-time-skipped nodes — never do. The delivered stream is always
 *   contiguous.
 * - `semantics` — the mental-model layer; fixed per event variant.
 * - `nodePath` — the ast-record key attributing the event to source.
 * - `type` / `loc` / `source` — stamped at emit time so consumers can
 *   highlight and display WITHOUT an ast lookup (self-contained events).
 *
 * Cross-reference fields (`scopeCreationStep`, `declarationStep`,
 * `creationStep`, `parentCreationStep`, `targetScopeCreationStep`,
 * `beginStep`) are NAVIGABLE: each carries the `step` of the event it
 * references, so a consumer can jump to it. A cross-reference is omitted
 * when the referenced event was not emitted — whether its gate was disabled
 * by config or it was dropped by a runtime gate.
 */
export type BaseEvent = {
	readonly step: number;
	readonly semantics: EventLayer;
	readonly nodePath: string;
	readonly type: string;
	readonly loc: SourceLocation;
	readonly source: string;
};

// ============================================================================
// 1. Binding / Variable Events
// ============================================================================
// Config:
//   'declare'     → scopes.script.declare / scopes.block.declare
//   'initialize'  → statements.variables.initialize
//   'available'   → statements.variables.available
//   'read'        → expression.variables.read   (+ResolveEvent kind:'variable')
//   'update'      → expression.variables.update (NO ResolveEvent — value in .value)
//
// TDZ sequence for ALL declaration forms:
//   declare → initialize (explicit: true/false) → available

export type BindingKind = 'let' | 'const' | 'global';
export type BindingEventType =
	| 'declare'
	| 'initialize'
	| 'available'
	| 'read'
	| 'update';

/**
 * Per-variant layer narrowing: declare is structure-layer, initialize and
 * available are statement-layer, read and update are expression-layer.
 * The intersection with the variant union pins `semantics` per variant —
 * a generator cannot stamp the wrong layer and still typecheck.
 */
export type BindingEvent = BaseEvent & {
	readonly category: 'variable';
	readonly kind: BindingKind;
	readonly name: string;
	/**
	 * NAVIGABLE: the `step` of the parent scope's create event. Omitted when
	 * that event was not emitted (config-disabled or gate-dropped).
	 */
	readonly scopeCreationStep?: number;
	/**
	 * NAVIGABLE: the `step` of this binding's declare event — jump there to
	 * see the declaration. Absent on 'declare' itself, on globals, and when
	 * the declare event was not emitted.
	 */
	readonly declarationStep?: number;
} & (
		| { readonly event: 'declare'; readonly semantics: 'scope' }
		| {
				readonly event: 'initialize';
				readonly semantics: 'statement';
				/** The value being written. */
				readonly value: ValueRepresentation;
				/**
				 * true  = explicit initializer (`let x = 5` / `const x = 5`)
				 * false = implicit undefined (`let x;`)
				 */
				readonly explicit: boolean;
		  }
		| { readonly event: 'available'; readonly semantics: 'statement' }
		| {
				readonly event: 'read';
				readonly semantics: 'expression';
				/**
				 * PROVISIONAL (D1 — confirm with Aran author): the scope-chain
				 * walk that resolved this read — each frame checked from
				 * innermost out, ending in the owning frame. The NM's central
				 * leverage point for shadowing; a full miss instead throws a
				 * ReferenceError (no read event fires — the walk surfaces on the
				 * error path, shape pending). Omitted when chain-walk tracing is
				 * off.
				 */
				readonly scopeChainWalk?: readonly ScopeChainStep[];
		  }
		| {
				readonly event: 'update';
				readonly semantics: 'expression';
				/** The value being written. */
				readonly value: ValueRepresentation;
		  }
	);

// ============================================================================
// 2. Property Access Events
// ============================================================================
// Config: expression.properties.{dot,bracket,optionalChaining}
// Followed by ResolveEvent (kind: 'property') carrying the accessed value.

export type PropertyAccessKind = 'dot' | 'bracket' | 'optionalChaining';

export type PropertyAccessEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'property';
	readonly kind: PropertyAccessKind;
	readonly object: ValueRepresentation;
	readonly key: string | number;
	/**
	 * PROVISIONAL (D1 — confirm with Aran author): the prototype-chain walk
	 * that resolved this member — each object checked from the base outward,
	 * ending in the owner or a full miss (→ `undefined`). Same shape as the
	 * scope-chain walk, the NM's "two chains, one shape" leverage point.
	 * Omitted when chain-walk tracing is off.
	 */
	readonly protoChainWalk?: readonly ProtoChainStep[];
	/** optionalChaining only: base was nullish, no lookup occurred */
	readonly shortCircuited?: true;
};

// ============================================================================
// 3. Operator Events
// ============================================================================

// --- 3a. Pure operators ---
// Config: expression.operators.{arithmetic,addition,comparison,typeof,
//                               negation.{logical,bitwise},bitwise,in,void}
// Followed by ResolveEvent (kind: 'operator').

export type PureOperatorSubkind =
	| 'arithmetic'
	| 'addition'
	| 'comparison'
	| 'typeof'
	| 'negation.logical'
	| 'negation.bitwise'
	| 'bitwise'
	| 'in'
	| 'void';

export type PureOperatorEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'operator';
	readonly kind: 'pure';
	readonly subkind: PureOperatorSubkind;
	readonly operator: string;
	readonly operands: readonly ValueRepresentation[];
	/** Present only when type coercion occurred before the operation */
	readonly coercion?: readonly ValueRepresentation[];
};

// --- 3b. Short-circuiting operators ---
// Config: expression.operators.shortCircuiting
// Followed by ResolveEvent (kind: 'shortCircuit').

export type ShortCircuitingOperatorEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'operator';
	readonly kind: 'shortCircuiting';
	readonly operator: '&&' | '||' | '??';
	readonly left: ValueRepresentation;
	/** Absent when short-circuited (right side not evaluated) */
	readonly right?: ValueRepresentation;
	readonly shortCircuited?: true;
};

// --- 3c. Assignment operators ---
// Config: expression.operators.assignment.{simple,compound}
// Followed by ResolveEvent (kind: 'assignment').
// ALSO fires BindingEvent(update) — dual-perspective intentional:
//   assignment expression (operator view) + binding lifecycle (variable view).
// Both events share the same nodePath.

export type AssignmentOperatorEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'assignment';
	readonly operator: string;
	readonly target: string;
	/** [rhs] for '=', [currentValue, rhs] for compound operators */
	readonly operands: readonly ValueRepresentation[];
	/** The value written (result of the assignment expression) */
	readonly value: ValueRepresentation;
	/** Present only when type coercion occurred */
	readonly coercion?: readonly ValueRepresentation[];
	/** For ??=, ||=, &&=: right side not evaluated, no assignment occurred */
	readonly shortCircuited?: true;
	/** NAVIGABLE: the parent scope's create-event `step`; omitted when unemitted. */
	readonly scopeCreationStep?: number;
};

export type OperatorEvent = PureOperatorEvent | ShortCircuitingOperatorEvent;

// ============================================================================
// 4. Literal Events
// ============================================================================
// Config: expression.literals.{string,boolean,number,bigint,undefined,null,regex}
// Followed by ResolveEvent (kind: 'literal') carrying the literal value.

export type LiteralKind =
	| 'string'
	| 'boolean'
	| 'number'
	| 'bigint'
	| 'undefined'
	| 'null'
	| 'regex';

export type LiteralEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'literal';
	readonly kind: LiteralKind;
};

// ============================================================================
// 5. Template Events
// ============================================================================
// Config: expression.templates.{begin,evaluation,end}
// TemplateEndEvent is followed by ResolveEvent (kind: 'template').
// Interpolated expressions inside ${} fire their own complete event chains.

export type TemplateBeginEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'template';
	readonly event: 'begin';
	readonly strings: readonly string[];
	readonly expressionCount: number;
};

export type TemplateEvaluationEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'template';
	readonly event: 'evaluation';
	readonly index: number;
	/** The interpolated expression's evaluated value */
	readonly value: ValueRepresentation;
	/**
	 * Present only when the interpolated value was not already a string — the
	 * ToString coercion that produced the concatenated text (makes template
	 * coercion visible, symmetric with operator/test coercion).
	 */
	readonly coercion?: ValueRepresentation;
	/**
	 * NAVIGABLE: the template begin event's `step`. Always present because the
	 * config co-gates begin ON whenever evaluation is ON (schema invariant).
	 */
	readonly beginStep: number;
};

export type TemplateEndEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'template';
	readonly event: 'end';
	/** NAVIGABLE: the template begin event's `step`. */
	readonly beginStep: number;
};

export type TemplateEvent =
	| TemplateBeginEvent
	| TemplateEvaluationEvent
	| TemplateEndEvent;

// ============================================================================
// 6. Scope Events
// ============================================================================
// Config: scopes.{script,block}.{create,enter,interrupt,completion,leave}
// 'declare' events for variables in this scope are BindingEvent(declare),
// gated by scopes.{script,block}.declare.

/**
 * The scope's shape. `script` and `block` are the ECMA/NM environment kinds;
 * `for` and `for-of` name the loop-head environments the NM makes observable
 * (D3 — mirrors the sibling variables tracer's synthesized loop scopes so a
 * learner using both tracers sees the same scope structure).
 *
 * A classic `for (let i …)` head env surfaces as kind `'for'`; the NM's
 * per-iteration copy surfaces as ONE create/enter per iteration (a scope
 * push per iteration), and `i`'s declare/read/update events across iterations
 * each reference the CURRENT iteration's create `step` via `scopeCreationStep`.
 * A `for-of` per-iteration binding env surfaces as kind `'for-of'`, same
 * per-iteration cardinality.
 */
export type ScopeKind = 'script' | 'block' | 'for' | 'for-of';
export type ScopeEventType =
	| 'create'
	| 'enter'
	| 'interrupt'
	| 'completion'
	| 'leave';

/**
 * Why a scope exited — the NM makes the pop reason the observable thing (the
 * learner sees the reason, never the guard throw). `'limit'` is the branded
 * iteration cap. Present on the abrupt/exit moments (interrupt, and leave when
 * abrupt); a normal completion carries `'normal'` or omits it.
 */
export type ScopePopReason =
	| 'normal'
	| 'break'
	| 'continue'
	| 'error'
	| 'limit';

export type ScopeEvent = BaseEvent & {
	readonly semantics: 'scope';
	readonly category: 'scope';
	readonly kind: ScopeKind;
	readonly event: ScopeEventType;
	readonly depth: number;
	/**
	 * NAVIGABLE: the `step` of this scope's create event (on a create event,
	 * its own step). Omitted when the create event was not emitted
	 * (config-disabled or gate-dropped).
	 */
	readonly creationStep?: number;
	/**
	 * NAVIGABLE: the parent scope's create-event `step`. Absent on the
	 * top-level script scope and when that event was not emitted.
	 */
	readonly parentCreationStep?: number;
	/** The control-flow structure this scope belongs to, when it has one. */
	readonly structure?: ControlFlowStructure;
	/**
	 * Why the scope exited (D2). Present on the exit moments (interrupt, and
	 * leave); `'break'`/`'continue'`/`'error'`/`'limit'` name the abrupt cause,
	 * `'normal'` a clean fall-through. Omitted on create/enter.
	 */
	readonly reason?: ScopePopReason;
};

// ============================================================================
// 7. Conditional Events
// ============================================================================
// Config:
//   kind:'if'      → statements.conditionals.{test,branch}  (semantics: 'statement')
//   kind:'ternary' → expression.operators.conditional        (semantics: 'expression')
//                    (ternary has no test/branch sub-gates — one boolean toggle)
//
// The test variant carries the tested value AND the boolean it coerced to —
// truthiness coercion made visible (`result` differs from `value` exactly
// when a coercion happened; `coercion` carries the coerced form).

export type ConditionalEvent = BaseEvent & {
	readonly category: 'conditional';
	/** NAVIGABLE: the parent scope's create-event `step`; omitted when unemitted. */
	readonly scopeCreationStep?: number;
} & (
		| {
				readonly event: 'test';
				/** The raw tested value. */
				readonly value: ValueRepresentation;
				/** The boolean the test coerced to — the branch decision. */
				readonly result: boolean;
				/** Present only when truthiness coercion occurred. */
				readonly coercion?: ValueRepresentation;
		  }
		| {
				readonly event: 'branch';
				/** Which path was taken; 'none' = if without else, test false. */
				readonly branch: 'consequent' | 'alternate' | 'none';
		  }
	) &
	(
		| { readonly kind: 'if'; readonly semantics: 'statement' }
		| { readonly kind: 'ternary'; readonly semantics: 'expression' }
	);

// ============================================================================
// 8. Loop Events
// ============================================================================
// Config: statements.{while,doWhile,for,forOf}.{setup,test,iteration,increment,do}

export type LoopEvent = BaseEvent & {
	readonly semantics: 'statement';
	readonly category: 'loop';
	readonly kind: LoopKind;
	/** NAVIGABLE: the parent scope's create-event `step`; omitted when unemitted. */
	readonly scopeCreationStep?: number;
} & (
		| {
				/** Condition evaluated (while, doWhile, for). */
				readonly event: 'test';
				readonly value: ValueRepresentation;
				/** The boolean the test coerced to — continue or exit. */
				readonly result: boolean;
				/** Present only when truthiness coercion occurred. */
				readonly coercion?: ValueRepresentation;
		  }
		| {
				/** Loop body entered. */
				readonly event: 'iteration';
				/** 0-indexed iteration count. */
				readonly index: number;
				/** forOf only — the three co-occur: what is being iterated… */
				readonly iterable?: ValueRepresentation;
				/** …the element this iteration binds… */
				readonly iterationValue?: ValueRepresentation;
				/** …and the name it is bound to. */
				readonly iterationVariable?: string;
		  }
		| {
				/** doWhile only: body execution marker (before the first test). */
				readonly event: 'do';
		  }
		| {
				/** for only: initialization phase. */
				readonly event: 'setup';
		  }
		| {
				/** for only: update phase. */
				readonly event: 'increment';
		  }
	);

// ============================================================================
// 9. Jump Events (break / continue)
// ============================================================================
// Config: statements.break / statements.continue

export type JumpEvent = BaseEvent & {
	readonly semantics: 'statement';
	readonly category: 'jump';
	readonly event: 'jump';
	readonly kind: 'break' | 'continue';
	/** The loop kind this jump targets. */
	readonly target: LoopKind;
	/** NAVIGABLE: the targeted loop scope's create-event `step`; omitted when unemitted. */
	readonly targetScopeCreationStep?: number;
	/** Present only on labeled break/continue. */
	readonly label?: string;
};

// ============================================================================
// 9b. Debugger Event
// ============================================================================
// Config: statements.debugger

export type DebuggerEvent = BaseEvent & {
	readonly semantics: 'statement';
	readonly category: 'debugger';
	readonly event: 'debugger';
};

// ============================================================================
// 10. Function Events
// ============================================================================
// Config: expression.functions.call
// Sequence: FunctionCallEvent → [argument/body events] → ResolveEvent(kind:'call')
// There is no function-return event — ResolveEvent(kind:'call') carries the
// return value (README § Event categories).

export type FunctionCallEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'function';
	readonly event: 'call';
	readonly name: string;
	readonly args: readonly ValueRepresentation[];
};

export type FunctionEvent = FunctionCallEvent;

// ============================================================================
// 11. Error Event — the error channel
// ============================================================================
// Config: errors (top-level boolean, default true).
//
// Emitted when a runtime error exits the program unhandled (JEJ has no
// try/catch — every runtime error is program-ending). The advice re-throws
// after emitting, so the run still settles as errored with the halt carrying
// the same attribution. `errors: false` suppresses the event, never the halt.
//
// LOCATION IS APPROXIMATE and HONESTLY LABELLED (`attribution`): the
// program-level hook that observes the error has no precise node.
//   - 'last-emitted' — nodePath/type/loc/source are the last emitted event's
//     (the throw happened at or after it).
//   - 'program' — nothing was emitted before the throw (e.g. the ERRORS_ONLY
//     profile, or an error on the very first evaluation); the event attributes
//     to the Program node ('$', whole-program loc). A program-level error IS a
//     program-level event — no empty required fields.
// Precise error attribution is a named deferred concern (README § error
// channel).

export type ErrorEvent = BaseEvent & {
	readonly semantics: 'error';
	readonly category: 'error';
	/** Error class name (e.g. 'TypeError'). */
	readonly name: string;
	readonly message: string;
	/** The thrown value, represented worker-side ({@link ErrorValue} for Errors). */
	readonly thrownValue: ValueRepresentation;
	/**
	 * How this event's location was derived — `'last-emitted'` (the base
	 * fields are the preceding event's) or `'program'` (nothing preceded the
	 * throw; attributed to the Program node). Lets a lens flag an approximate
	 * highlight honestly instead of pointing confidently at the wrong node.
	 */
	readonly attribution: 'last-emitted' | 'program';
};

// ============================================================================
// 12. Resolve Event — data layer baseline
// ============================================================================
// Config: resolve (default true — nearly always on)
//
// Emitted after every expression-producing event to carry the resulting value.
// This IS the value — expression events provide context, not results.
//
// Dual emission path (two Aran hook types emit ResolveEvents):
//   - expression@after: literals, variable reads, short-circuit operators
//   - apply@around:     binary/unary ops, property access, calls, templates

export type ResolveKind =
	| 'variable' // Identifier (variable read)
	| 'literal' // Literal node (any primitive kind)
	| 'operator' // BinaryExpression / UnaryExpression (arithmetic, comparison, typeof, negation, bitwise, in, void)
	| 'shortCircuit' // LogicalExpression (&&, ||, ??) — distinct ESTree node from BinaryExpression
	| 'conditional' // ConditionalExpression (ternary a ? b : c)
	| 'assignment' // AssignmentExpression (=, +=, -=, etc.)
	| 'increment' // UpdateExpression (++/--)
	| 'property' // MemberExpression (dot / bracket / optionalChaining)
	| 'call' // CallExpression (return value of the call)
	| 'template'; // TemplateLiteral (final assembled string)

export type ResolveEvent = BaseEvent & {
	/** ResolveEvent always belongs to the data layer. */
	readonly semantics: 'resolve';
	/** Union discriminant (same role as 'variable', 'operator', etc. on other events) */
	readonly category: 'resolve';
	readonly kind: ResolveKind;
	readonly value: ValueRepresentation;
	/**
	 * Provenance (gated by `resolve.provenance`, default true): a unique id
	 * for this produced value. The full data-flow graph is reconstructable
	 * from the resolve stream alone. Assigned at the emission layer with the
	 * step, so a gate-dropped resolve consumes no id and no live event
	 * references it (`sourceValueIds` only ever names ids that were emitted).
	 */
	readonly valueId?: number;
	/** Provenance: the valueIds of the ResolveEvents this value was computed from. */
	readonly sourceValueIds?: readonly number[];
};

// ============================================================================
// Master Union
// ============================================================================

/**
 * The wire-safe event union — every field a scalar or plain frozen object,
 * so an event crosses the worker boundary by structured clone. This is what
 * the worker emits and what the thread narrows.
 */
export type TraceEvent =
	| BindingEvent
	| PropertyAccessEvent
	| OperatorEvent
	| AssignmentOperatorEvent
	| LiteralEvent
	| TemplateEvent
	| ScopeEvent
	| ConditionalEvent
	| LoopEvent
	| JumpEvent
	| DebuggerEvent
	| FunctionEvent
	| ErrorEvent
	| ResolveEvent;

/**
 * The DELIVERED form of a trace event: the same wire-safe data, plus the
 * doubly-linked `prev`/`next` chain so any single event can traverse the whole
 * stream. Both the streamed handle items and `TraceResult.events` are
 * `ChainedTraceEvent`s.
 *
 * @remarks
 * The chain is built THREAD-side in the narrow phase, never worker-side: the
 * getters do not survive structured clone, so the wire event stays scalar.
 * `prev`/`next` are NON-ENUMERABLE (so `JSON.stringify` skips them — no
 * circular-chain serialization) and `next` is an accessor over a thread-side
 * pointer, `null` until the successor is wrapped (re-read it later on a
 * retained event and the successor is there). No event is ever mutated: each
 * is frozen once at yield, and the accessor closing over a mutable pointer is
 * a NAMED exception to the no-mutable-closure rule (DEV.md), scoped to the
 * narrow phase.
 *
 * There is no `.node` reference — attribute via `event.nodePath` into
 * `TraceResult.ast`, and find a node's events via
 * `TraceResult.eventsByNode[nodePath]`. Keeping the link as `prev`/`next`
 * `step`-navigable data (not object refs) is what keeps events immutable and
 * the whole result JSON-safe.
 */
export type ChainedTraceEvent = TraceEvent & {
	readonly prev: ChainedTraceEvent | null;
	readonly next: ChainedTraceEvent | null;
};
