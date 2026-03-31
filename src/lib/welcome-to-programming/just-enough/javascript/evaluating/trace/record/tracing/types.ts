/**
 * @file JEJ Trace Event Types
 *
 * API contract between the tracer and consuming learning environments.
 * Every event is 1-1 linkable to the config option that enabled it.
 * Metadata fields (coercion, labels, semantics, explicit, shortCircuited)
 * ride along freely — they don't need config toggles.
 *
 * @see ../../options.schema.json for the configuration schema that controls which events are emitted
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
 * isNull is always present (not optional) to disambiguate from other objects
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
// Base Event
// ============================================================================

/**
 * Every trace event carries source metadata and a semantics label.
 * Source metadata is captured at event creation time because Aran's advice
 * layer has access to it, but downstream consumers (step tracker) do not.
 */
export type BaseEvent = {
	readonly semantics: 'statement' | 'expression';
	readonly loc: SourceLocation;
	readonly node: string;
	readonly source: string;
};

// ============================================================================
// 1. Binding Events
// ============================================================================
// Config: bindings.kind.{let,const,global} × bindings.events.{declare,initialize,available,assign,read}

export type BindingKind = 'let' | 'const' | 'global';
export type BindingEventType = 'declare' | 'initialize' | 'available' | 'assign' | 'read';

export type BindingEvent = BaseEvent & {
	readonly category: 'binding';
	readonly kind: BindingKind;
	readonly event: BindingEventType;
	readonly name: string;
	/** On 'declare': the parent scope. On others: inherited from declaration. */
	readonly scopeCreationStep: number;
	/** Points to this binding's declare event. Absent on 'declare' itself and on globals. */
	readonly declarationStep?: number;
	/** Present on initialize, available, assign, read */
	readonly value?: ValueRepresentation;
	/** On initialize only: true = `let x = undefined`, false = `let x;` */
	readonly explicit?: boolean;
};

// ============================================================================
// 2. Property Access Events
// ============================================================================
// Config: propertyAccess.{dot,bracket,optionalChaining}

export type PropertyAccessKind = 'dot' | 'bracket' | 'optionalChaining';

export type PropertyAccessEvent = BaseEvent & {
	readonly category: 'propertyAccess';
	readonly kind: PropertyAccessKind;
	readonly object: string;
	readonly key: string | number;
	readonly value: ValueRepresentation;
	/** optionalChaining only: base was nullish, no lookup occurred */
	readonly shortCircuited?: true;
};

// ============================================================================
// 3. Operator Events
// ============================================================================

// --- 3a. Pure operators ---
// Config: operators.pure.{arithmetic,addition,comparison,typeof,negation.{logical,bitwise},bitwise}

export type PureOperatorSubkind =
	| 'arithmetic'
	| 'addition'
	| 'comparison'
	| 'typeof'
	| 'negation.logical'
	| 'negation.bitwise'
	| 'bitwise';

export type PureOperatorEvent = BaseEvent & {
	readonly category: 'operator';
	readonly kind: 'pure';
	readonly subkind: PureOperatorSubkind;
	readonly operator: string;
	readonly operands: readonly ValueRepresentation[];
	readonly result: ValueRepresentation;
	/** Present only when coercion occurred */
	readonly coercion?: readonly ValueRepresentation[];
};

// --- 3b. Short-circuiting operators ---
// Config: operators.shortCircuiting

export type ShortCircuitingOperatorEvent = BaseEvent & {
	readonly category: 'operator';
	readonly kind: 'shortCircuiting';
	readonly operator: '&&' | '||' | '??' | '?:';
	readonly left: ValueRepresentation;
	/** Absent when shortCircuited */
	readonly right?: ValueRepresentation;
	readonly result: ValueRepresentation;
	readonly shortCircuited?: true;
};

// --- 3c. Assignment operators ---
// Config: operators.assignment

export type AssignmentOperatorEvent = BaseEvent & {
	readonly category: 'operator';
	readonly kind: 'assignment';
	readonly operator: string;
	readonly target: string;
	/** [rhs] for '=', [currentValue, rhs] for compound */
	readonly operands: readonly ValueRepresentation[];
	readonly result: ValueRepresentation;
	readonly coercion?: readonly ValueRepresentation[];
	/** For ??=, ||=, &&=: right side not evaluated, no assignment occurred */
	readonly shortCircuited?: true;
	readonly scopeCreationStep: number;
};

export type OperatorEvent =
	| PureOperatorEvent
	| ShortCircuitingOperatorEvent
	| AssignmentOperatorEvent;

// ============================================================================
// 4. Parenthesis Events
// ============================================================================
// Config: parenthesis.{enter,leave}

export type ParenthesisEvent = BaseEvent & {
	readonly category: 'parenthesis';
	readonly event: 'enter' | 'leave';
	readonly depth: number;
	/** Step ID of enclosing parens enter event (absent on outermost) */
	readonly parentStep?: number;
};

// ============================================================================
// 5. Literal Events
// ============================================================================
// Config: literals.{string,boolean,number,undefined,null,regex}

export type LiteralKind = 'string' | 'boolean' | 'number' | 'undefined' | 'null' | 'regex';

export type LiteralEvent = BaseEvent & {
	readonly category: 'literal';
	readonly kind: LiteralKind;
	readonly value: ValueRepresentation;
};

// ============================================================================
// 6. Template Events
// ============================================================================
// Config: templates.{begin,evaluation,end}

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
	readonly value: ValueRepresentation;
	readonly beginStep: number;
};

export type TemplateEndEvent = BaseEvent & {
	readonly category: 'template';
	readonly event: 'end';
	readonly value: ValueRepresentation;
	readonly beginStep: number;
};

export type TemplateEvent =
	| TemplateBeginEvent
	| TemplateEvaluationEvent
	| TemplateEndEvent;

// ============================================================================
// 7. Scope Events
// ============================================================================
// Config: scopes.kind.{script,block,module} × scopes.events.{create,enter,interrupt,completion,leave}

export type ScopeKind = 'script' | 'block' | 'module';
export type ScopeEventType = 'create' | 'enter' | 'interrupt' | 'completion' | 'leave';
export type ControlFlowStructure = 'while' | 'doWhile' | 'for' | 'forOf' | 'conditional';

export type ScopeEvent = BaseEvent & {
	readonly category: 'scope';
	readonly kind: ScopeKind;
	readonly event: ScopeEventType;
	readonly depth: number;
	/** This scope's create event (self-referential on create events) */
	readonly creationStep: number;
	/** Parent scope's create event (absent on top-level module) */
	readonly parentCreationStep?: number;
	/** Absent on bare {} blocks */
	readonly structure?: ControlFlowStructure;
	/** Step ID of the control flow structure's initial event */
	readonly structureStep?: number;
	readonly label?: string;
};

// ============================================================================
// 8. Control Flow Events
// ============================================================================
// Config: controlFlow.kind.{conditionals,loops.{while,doWhile,for,forOf}}
//       × controlFlow.events.{test,branch,iteration,jump,do,initialize,increment}

export type LoopKind = 'while' | 'doWhile' | 'for' | 'forOf';
export type ControlFlowKind = 'conditional' | LoopKind;

export type TestEvent = BaseEvent & {
	readonly category: 'controlFlow';
	readonly event: 'test';
	readonly kind: ControlFlowKind;
	readonly value: ValueRepresentation;
	/** Boolean result after truthiness coercion */
	readonly result: boolean;
	/** Boolean(value) — present when value is not already a boolean */
	readonly coercion?: ValueRepresentation;
	readonly scopeCreationStep: number;
	readonly label?: string;
};

export type BranchEvent = BaseEvent & {
	readonly category: 'controlFlow';
	readonly event: 'branch';
	readonly kind: 'conditional';
	readonly branch: 'consequent' | 'alternate' | 'none';
	readonly scopeCreationStep: number;
	readonly label?: string;
};

export type IterationEvent = BaseEvent & {
	readonly category: 'controlFlow';
	readonly event: 'iteration';
	readonly kind: LoopKind;
	readonly index: number;
	readonly scopeCreationStep: number;
	/** forOf: the iterable (first iteration only) */
	readonly iterable?: ValueRepresentation;
	/** forOf: current element value */
	readonly iterationValue?: ValueRepresentation;
	/** forOf: the loop variable name */
	readonly iterationVariable?: string;
	readonly label?: string;
};

export type JumpEvent = BaseEvent & {
	readonly category: 'controlFlow';
	readonly event: 'jump';
	readonly kind: 'break' | 'continue';
	readonly target: LoopKind;
	readonly targetScopeCreationStep: number;
	readonly label?: string;
};

/** do-while: fires before every body execution */
export type DoEvent = BaseEvent & {
	readonly category: 'controlFlow';
	readonly event: 'do';
	readonly kind: 'doWhile';
	readonly scopeCreationStep: number;
	readonly label?: string;
};

/** for-loop: initialization phase */
export type ForInitializeEvent = BaseEvent & {
	readonly category: 'controlFlow';
	readonly event: 'initialize';
	readonly kind: 'for';
	readonly scopeCreationStep: number;
	readonly label?: string;
};

/** for-loop: update/increment phase */
export type ForIncrementEvent = BaseEvent & {
	readonly category: 'controlFlow';
	readonly event: 'increment';
	readonly kind: 'for';
	readonly scopeCreationStep: number;
	readonly label?: string;
};

export type ControlFlowEvent =
	| TestEvent
	| BranchEvent
	| IterationEvent
	| JumpEvent
	| DoEvent
	| ForInitializeEvent
	| ForIncrementEvent;

// ============================================================================
// 9. Function Events
// ============================================================================
// Config: functions.{call,return}

export type FunctionCallEvent = BaseEvent & {
	readonly category: 'function';
	readonly event: 'call';
	readonly name: string;
	readonly args: readonly ValueRepresentation[];
};

export type FunctionReturnEvent = BaseEvent & {
	readonly category: 'function';
	readonly event: 'return';
	readonly name: string;
	readonly value: ValueRepresentation;
};

export type FunctionEvent = FunctionCallEvent | FunctionReturnEvent;

// ============================================================================
// 10. With Event (easter egg)
// ============================================================================
// Config: with (boolean)

export type WithEvent = BaseEvent & {
	readonly category: 'with';
	readonly event: 'enter' | 'leave';
	readonly object: ValueRepresentation;
};

// ============================================================================
// Master Union
// ============================================================================

export type TraceEvent =
	| BindingEvent
	| PropertyAccessEvent
	| OperatorEvent
	| ParenthesisEvent
	| LiteralEvent
	| TemplateEvent
	| ScopeEvent
	| ControlFlowEvent
	| FunctionEvent
	| WithEvent;
