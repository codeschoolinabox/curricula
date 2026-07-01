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
 * (`ASTNode.parent` is circular; a direct reference cannot cross the worker
 * boundary by structured clone). `LinkedTraceEvent` — the post-settlement
 * form on `TraceResult.events` — adds the direct `.node` reference.
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
	| BooleanValue
	| UndefinedValue
	| NullValue
	| ObjectValue
	| FunctionValue
	| RegExpValue
	| ErrorValue;

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
// ASTNode — the static layer (built at instrument time, linked after)
// ============================================================================

/**
 * An ESTree-style AST node enriched with tracing metadata.
 *
 * @remarks
 * Part of the static `ast` layer — built mutable at instrument time
 * (`events: []`, `visits: 0`), populated and deep-frozen by linking after
 * the run settles. `TraceResult.ast` maps every `nodePath` to its node;
 * `ast['$']` is the root Program node.
 *
 * **Circular references**: `parent` and `events[i].node` form cycles.
 * `JSON.stringify` throws without a replacer — `parentPath` and
 * `events.map((e) => e.step)` are the serialization-safe alternatives.
 *
 * Standard ESTree children (`.body`, `.left`, `.right`, `.test`, etc.) are
 * also present as ASTNode references. Not typed statically here — use
 * `node.type` to discriminate before accessing children.
 */
export type ASTNode = {
	readonly nodePath: string;
	readonly parent: ASTNode | null;
	/** Scalar twin of `parent` — null at the Program root. */
	readonly parentPath: string | null;
	readonly type: string;
	readonly loc: SourceLocation;
	readonly source: string;
	/** Every linked event that fired on this node, in step order. */
	readonly events: readonly LinkedTraceEvent[];
	/** How many times execution passed through this node (0 if never). */
	readonly visits: number;
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
	/** Present on initialize and update: the value being written. */
	readonly value?: ValueRepresentation;
	/**
	 * On 'initialize' only:
	 * true  = explicit initializer (`let x = 5` or `const x = 5`)
	 * false = implicit undefined (`let x;`)
	 */
	readonly explicit?: boolean;
} & (
		| { readonly event: 'declare'; readonly semantics: 'scope' }
		| {
				readonly event: 'initialize' | 'available';
				readonly semantics: 'statement';
		  }
		| { readonly event: 'read' | 'update'; readonly semantics: 'expression' }
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
// Config: expression.literals.{string,boolean,number,undefined,null,regex}
// Followed by ResolveEvent (kind: 'literal') carrying the literal value.

export type LiteralKind =
	| 'string'
	| 'boolean'
	| 'number'
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
	/** NAVIGABLE: the template begin event's `step` (begin gates the sub-events, so it is always emitted when this one is). */
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

export type ScopeKind = 'script' | 'block';
export type ScopeEventType =
	| 'create'
	| 'enter'
	| 'interrupt'
	| 'completion'
	| 'leave';

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
// LOCATION IS APPROXIMATE: the program-level hook that observes the error has
// no precise node; nodePath/type/loc/source are the LAST EMITTED event's.
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
	 * from the resolve stream alone.
	 */
	readonly valueId?: number;
	/** Provenance: the valueIds of the ResolveEvents this value was computed from. */
	readonly sourceValueIds?: readonly number[];
};

// ============================================================================
// Master Union
// ============================================================================

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
 * A trace event after linking: the same wire-safe data plus a direct `.node`
 * reference into the frozen ast record. Only `TraceResult.events` carries
 * linked events; the streamed events are wire-safe {@link TraceEvent}s.
 */
export type LinkedTraceEvent = TraceEvent & {
	readonly node: ASTNode;
};
