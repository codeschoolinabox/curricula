/**
 * @file JEJ Trace Event Types
 *
 * API contract between the tracer and consuming learning environments.
 * Events are structured by the 4-layer mental model:
 *
 * - `resolve`    — data layer: what values flowed through the program
 * - `expression` — expression layer: which code produced those values
 * - `statement`  — statement layer: how execution was controlled
 * - `scope`      — structure layer: scope boundaries and binding lifecycle
 *
 * Every expression-producing event is paired with a ResolveEvent that
 * carries the resulting value. The ResolveEvent IS the result — expression
 * events carry context (operator, operands, name, etc.), not the value.
 *
 * Events link to source syntax via `event.node: ASTNode`, a direct reference
 * into the frozen AST returned in TraceResult. Use `event.node.loc`,
 * `event.node.source`, `event.node.parent` for navigation.
 *
 * @see config.types.ts for the TraceOptions config that controls which events are emitted
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
 * isNull always present (not optional) to disambiguate from other objects
 */
export type NullValue = {
	readonly type: 'object';
	readonly value: null;
	readonly isNull: true;
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

export type ValueRepresentation =
	| StringValue
	| NumberValue
	| BooleanValue
	| UndefinedValue
	| NullValue
	| FunctionValue
	| RegExpValue;

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
// ASTNode — direct AST reference (static layer)
// ============================================================================

/**
 * An ESTree-style AST node enriched with tracing metadata.
 *
 * @remarks
 * Part of the static `ast` layer — built at instrument time, frozen, and
 * returned in `TraceResult.ast`. Every `TraceEvent.node` is a direct
 * reference into this frozen structure.
 *
 * **Circular reference**: `parent` forms a circular structure.
 * `JSON.stringify` will throw unless a replacer is used.
 *
 * Navigation:
 * - `node.syntaxId` — nodePath string (e.g. `'$.body.0.test.left'`)
 * - `node.parent`   — parent ASTNode, or null at the Program root
 * - `node.loc`      — source location
 * - `node.source`   — source text of this node
 * - `node.type`     — ESTree node type (`'BinaryExpression'`, etc.)
 *
 * Standard ESTree children (`.body`, `.left`, `.right`, `.test`, etc.) are
 * also present as ASTNode references. Not typed statically here — use
 * `node.type` to discriminate before accessing children.
 */
export type ASTNode = {
	readonly syntaxId: string;
	readonly parent: ASTNode | null;
	readonly type: string;
	readonly loc: SourceLocation;
	readonly source: string;
} & { readonly [key: string]: unknown };

// ============================================================================
// Base Event
// ============================================================================

/**
 * Every trace event carries a direct ASTNode reference and a semantics label.
 *
 * @remarks
 * `node` replaces the former flat `loc`, `node: string`, and `source` fields.
 * All three are still accessible via `event.node.loc`, `event.node.type`,
 * and `event.node.source` respectively.
 *
 * `semantics` classifies the event by mental-model layer:
 * - `'expression'` — value-producing (operands, reads, calls, literals)
 * - `'statement'`  — control/lifecycle (declarations, branches, loops, scopes)
 * - `'resolve'`    — data baseline (the produced value — ResolveEvent only)
 */
export type BaseEvent = {
	readonly step: number;
	readonly semantics: 'statement' | 'expression' | 'resolve';
	readonly node: ASTNode;
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
export type BindingEventType = 'declare' | 'initialize' | 'available' | 'read' | 'update';

export type BindingEvent = BaseEvent & {
	readonly category: 'variable';
	readonly kind: BindingKind;
	readonly event: BindingEventType;
	readonly name: string;
	/**
	 * On 'declare': the parent scope's creation step.
	 * On others: inherited from the declare event.
	 * Omitted when scope events are disabled by config. Opaque grouping key.
	 */
	readonly scopeCreationStep?: number;
	/** Points to this binding's declare event. Absent on 'declare' itself and on globals. */
	readonly declarationStep?: number;
	/** Present on initialize and update: the value being written. */
	readonly value?: ValueRepresentation;
	/**
	 * On 'initialize' only:
	 * true  = explicit initializer (`let x = 5` or `const x = 5`)
	 * false = implicit undefined (`let x;`)
	 */
	readonly explicit?: boolean;
};

// ============================================================================
// 2. Property Access Events
// ============================================================================
// Config: expression.properties.{dot,bracket,optionalChaining}
// Followed by ResolveEvent (kind: 'property') carrying the accessed value.

export type PropertyAccessKind = 'dot' | 'bracket' | 'optionalChaining';

export type PropertyAccessEvent = BaseEvent & {
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
// Both events share the same syntaxId.

export type AssignmentOperatorEvent = BaseEvent & {
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
	readonly scopeCreationStep?: number;
};

export type OperatorEvent = PureOperatorEvent | ShortCircuitingOperatorEvent;

// ============================================================================
// 4. Literal Events
// ============================================================================
// Config: expression.literals.{string,boolean,number,undefined,null,regex}
// Followed by ResolveEvent (kind: 'literal') carrying the literal value.

export type LiteralKind = 'string' | 'boolean' | 'number' | 'undefined' | 'null' | 'regex';

export type LiteralEvent = BaseEvent & {
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
	readonly category: 'template';
	readonly event: 'begin';
	readonly strings: readonly string[];
	readonly expressionCount: number;
};

export type TemplateEvaluationEvent = BaseEvent & {
	readonly category: 'template';
	readonly event: 'evaluation';
	readonly index: number;
	/** The interpolated expression's evaluated value */
	readonly value: ValueRepresentation;
	readonly beginStep: number;
};

export type TemplateEndEvent = BaseEvent & {
	readonly category: 'template';
	readonly event: 'end';
	readonly beginStep: number;
};

export type TemplateEvent = TemplateBeginEvent | TemplateEvaluationEvent | TemplateEndEvent;

// ============================================================================
// 6. Scope Events
// ============================================================================
// Config: scopes.{script,block}.{create,enter,interrupt,completion,leave}
// 'declare' events for variables in this scope are BindingEvent(declare),
// gated by scopes.{script,block}.declare.

export type ScopeKind = 'script' | 'block';
export type ScopeEventType = 'create' | 'enter' | 'interrupt' | 'completion' | 'leave';

export type ScopeEvent = BaseEvent & {
	readonly category: 'scope';
	readonly kind: ScopeKind;
	readonly event: ScopeEventType;
	readonly depth: number;
	/** This scope's own create event step (self-referential on create events) */
	readonly creationStep: number;
	/** Parent scope's create event step (absent on the top-level script scope) */
	readonly parentCreationStep?: number;
	readonly label?: string;
};

// ============================================================================
// 7. Conditional Events
// ============================================================================
// Config:
//   kind:'if'     → statements.conditionals.{test,branch}   (semantics: 'statement')
//   kind:'ternary'→ expression.operators.conditional         (semantics: 'expression')
//                  (ternary has no test/branch sub-gates — one boolean toggle)

export type ConditionalEvent = BaseEvent & {
	readonly category: 'conditional';
	readonly event: 'test' | 'branch';
	readonly kind: 'if' | 'ternary';
	/** The condition value (on event:'test') */
	readonly value?: ValueRepresentation;
	/** Which branch was taken (on event:'branch') */
	readonly branch?: 'consequent' | 'alternate';
};

// ============================================================================
// 8. Loop Events
// ============================================================================
// Config: statements.{while,doWhile,for,forOf}.{test,iteration,...}

export type LoopKind = 'while' | 'doWhile' | 'for' | 'forOf';

export type LoopEvent = BaseEvent & {
	readonly category: 'loop';
	readonly kind: LoopKind;
	readonly event:
		| 'test'      // condition evaluated (while, doWhile, for)
		| 'iteration' // loop body entered
		| 'do'        // doWhile only: body execution marker
		| 'setup'     // for only: initialization phase
		| 'increment'; // for only: update phase
	/** Test condition value (on 'test'), forOf element (on 'iteration' for forOf) */
	readonly value?: ValueRepresentation;
	/** 0-indexed iteration count (on 'iteration') */
	readonly iteration?: number;
};

// ============================================================================
// 9. Jump Events (break / continue)
// ============================================================================
// Config: statements.break / statements.continue

export type JumpEvent = BaseEvent & {
	readonly category: 'jump';
	readonly event: 'jump';
	readonly kind: 'break' | 'continue';
	/** Present only for labeled break/continue (rare in JEJ) */
	readonly label?: string;
};

// ============================================================================
// 9b. Debugger Event
// ============================================================================
// Config: statements.debugger

export type DebuggerEvent = BaseEvent & {
	readonly category: 'debugger';
	readonly event: 'debugger';
};

// ============================================================================
// 10. Function Events
// ============================================================================
// Config: expression.functions.call
// Sequence: FunctionCallEvent → [function body events] → ResolveEvent(kind:'call')
// FunctionReturnEvent is removed — ResolveEvent(kind:'call') carries the return value.

export type FunctionCallEvent = BaseEvent & {
	readonly category: 'function';
	readonly event: 'call';
	readonly name: string;
	readonly args: readonly ValueRepresentation[];
};

export type FunctionEvent = FunctionCallEvent;

// ============================================================================
// 11. With Event (easter egg)
// ============================================================================
// Config: with (boolean)
// When active, program runs as script (sloppy mode). Undocumented in JEJ.

export type WithEvent = BaseEvent & {
	readonly category: 'with';
	readonly event: 'enter' | 'leave';
	readonly object: ValueRepresentation;
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
	| 'variable'    // Identifier (variable read)
	| 'literal'     // Literal node (any primitive kind)
	| 'operator'    // BinaryExpression / UnaryExpression (arithmetic, comparison, typeof, negation, bitwise, in, void)
	| 'shortCircuit'// LogicalExpression (&&, ||, ??) — distinct ESTree node from BinaryExpression
	| 'conditional' // ConditionalExpression (ternary a ? b : c)
	| 'assignment'  // AssignmentExpression (=, +=, -=, etc.)
	| 'increment'   // UpdateExpression (++/--)
	| 'property'    // MemberExpression (dot / bracket / optionalChaining)
	| 'call'        // CallExpression (return value of the call)
	| 'template';   // TemplateLiteral (final assembled string)

export type ResolveEvent = BaseEvent & {
	/** Narrows BaseEvent.semantics — ResolveEvent always belongs to the data layer */
	readonly semantics: 'resolve';
	/** Union discriminant (same role as 'variable', 'operator', etc. on other events) */
	readonly category: 'resolve';
	readonly kind: ResolveKind;
	readonly value: ValueRepresentation;
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
	| WithEvent
	| ResolveEvent;
