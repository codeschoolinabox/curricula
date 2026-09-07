/**
 * @file The step-instrumentation contract: the widened options surface, the
 * trace-event union, ValueRepresentation, the collector contract, the deep
 * snapshot descriptors, the failure surface, and the instrument outputs.
 *
 * Two lineages, by ruling (KLVE-LEDGER § Rulings of record, 2026-09-05/06):
 * the config/event contracts ADAPT this repo's semantics tracer
 * (`src/lib/embody/lib/evaluating/trace/semantics/` — `config.types.ts` and
 * `tracing/types.ts`, read-only), widened from JEJ scope to full JavaScript;
 * the snapshot codec shapes adapt the klve tracer core by Kelley van Evert
 * (jsviz.klve.nl; the `@study-lenses/trace-js-klve` package's `record/`).
 * Every widening beyond the adopted surface is a named delta in the module
 * README § Correspondence.
 *
 * Events are WIRE-SAFE: every field is a scalar or a plain frozen object —
 * `nodePath` is a string key, never an AST reference. The expression/resolve
 * SPLIT is the adopted discipline: expression events carry context; the
 * produced value lives in exactly one place, the paired ResolveEvent.
 */

// ============================================================================
// Value Representation (adopted; + SymbolValue and DateValue, this unit's)
// ============================================================================

/** String value — typeof returns 'string'. */
export type StringValue = {
	readonly type: 'string';
	readonly value: string;
};

/**
 * Number value — typeof returns 'number'. Flags disambiguate JSON-unsafe
 * values (NaN, ±Infinity, -0).
 */
export type NumberValue = {
	readonly type: 'number';
	readonly value: number;
	readonly isNaN?: true;
	readonly isInfinity?: true;
	readonly isNegative?: true;
};

/** Boolean value — typeof returns 'boolean'. */
export type BooleanValue = {
	readonly type: 'boolean';
	readonly value: boolean;
};

/** Undefined value — no value field (undefined is not JSON-representable). */
export type UndefinedValue = {
	readonly type: 'undefined';
};

/**
 * Null value — typeof returns 'object' (the language's own quirk, preserved).
 * `isNull` is always present, disambiguating from {@link ObjectValue}.
 */
export type NullValue = {
	readonly type: 'object';
	readonly value: null;
	readonly isNull: true;
};

/**
 * Non-null object value — `className` carries the constructor name; enough
 * for a learner-facing label without deep serialization (the deep form is
 * the snapshot codec's, on `data.scopes` legs only).
 */
export type ObjectValue = {
	readonly type: 'object';
	readonly className: string;
};

/** Function value — represented by name and arity. */
export type FunctionValue = {
	readonly type: 'function';
	readonly name: string;
	readonly arity?: number;
	readonly variadic?: true;
};

/** RegExp value. */
export type RegExpValue = {
	readonly type: 'regexp';
	readonly pattern: string;
	readonly flags: string;
};

/**
 * BigInt value — typeof returns 'bigint'; carried as a DECIMAL STRING (a raw
 * bigint is not JSON-safe), preserving exact magnitude and the typeof
 * distinction.
 */
export type BigIntValue = {
	readonly type: 'bigint';
	readonly value: string;
};

/**
 * Symbol value — this unit's arm (the klve-093 north-star repair): the
 * symbol's own `description`, carried honestly — `Symbol()` represents with
 * `description: undefined`, never a parsed `'Symbol()'` string.
 */
export type SymbolValue = {
	readonly type: 'symbol';
	readonly description: string | undefined;
};

/**
 * A thrown-or-held Error, represented where it still has its prototype
 * (an adopted member the transported builder never implemented — the
 * measured Error-with-no-message mistrace this arm repairs).
 */
export type ErrorValue = {
	readonly type: 'error';
	readonly name: string;
	readonly message: string;
};

/** Date value — this unit's arm: the time value, honestly. */
export type DateValue = {
	readonly type: 'date';
	readonly time: number;
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
	| SymbolValue
	| ErrorValue
	| DateValue;

// ============================================================================
// Source location and the stamp (constitutive on every event — ruled)
// ============================================================================

export type SourcePosition = {
	readonly line: number;
	readonly column: number;
};

/** ESTree convention: 1-based lines, 0-based columns. */
export type SourceLocation = {
	readonly start: SourcePosition;
	readonly end: SourcePosition;
};

/**
 * The whole-program stamp `instrument` returns and `createCollector`
 * consumes to mint the lifecycle-anchor family (the fix-round-2 ruling):
 * whole-program loc, the offsets `[0, code.length]`, and the source text.
 */
export type ProgramStamp = {
	readonly loc: SourceLocation;
	readonly start: 0;
	readonly end: number;
	readonly source: string;
};

// ============================================================================
// Options (the adopted 5-layer surface, widened — README § The options
// contract; boolean shorthand per layer expands at the seam)
// ============================================================================

/** A per-layer name filter: include XOR exclude (seam-enforced); an empty
 * list does not count as provided and filters nothing. */
export type NameFilter = {
	readonly include?: readonly string[];
	readonly exclude?: readonly string[];
};

export type ResolveOptions = {
	readonly dependent?: boolean;
	readonly provenance?: boolean;
	readonly kinds?: boolean | ResolveKindsOptions;
};

export type ResolveKindsOptions = {
	readonly variable?: boolean;
	readonly literal?: boolean;
	readonly operator?: boolean;
	readonly shortCircuit?: boolean;
	readonly conditional?: boolean;
	readonly assignment?: boolean;
	readonly increment?: boolean;
	readonly property?: boolean;
	readonly call?: boolean;
	readonly template?: boolean;
};

export type OperatorOptions = {
	readonly arithmetic?: boolean;
	readonly addition?: boolean;
	readonly comparison?: boolean;
	readonly typeof?: boolean;
	readonly negation?: boolean | { logical?: boolean; bitwise?: boolean };
	readonly bitwise?: boolean;
	readonly shortCircuiting?: boolean;
	readonly conditional?: boolean;
	readonly assignment?: boolean | { simple?: boolean; compound?: boolean };
	readonly increment?: boolean | { prefix?: boolean; postfix?: boolean };
	readonly in?: boolean;
	readonly void?: boolean;
	/** The sequence/comma arm — klve-007's capability; the adopted config
	 * named the gate, its types never carried the arm; both live here. */
	readonly comma?: boolean;
	readonly filter?: NameFilter;
};

export type LiteralOptions = {
	readonly string?: boolean;
	readonly number?: boolean;
	readonly bigint?: boolean;
	readonly boolean?: boolean;
	readonly null?: boolean;
	readonly undefined?: boolean;
	readonly regex?: boolean;
	/** Widened (klve-008): the grammar's own composite literal forms. */
	readonly array?: boolean;
	readonly object?: boolean;
};

export type ExpressionOptions = {
	readonly variables?:
		| boolean
		| { read?: boolean; update?: boolean; readonly filter?: NameFilter };
	readonly operators?: boolean | OperatorOptions;
	readonly literals?: boolean | LiteralOptions;
	readonly templates?:
		| boolean
		| { begin?: boolean; evaluation?: boolean; end?: boolean };
	readonly properties?:
		| boolean
		| {
				dot?: boolean;
				bracket?: boolean;
				optionalChaining?: boolean;
				readonly filter?: NameFilter;
		  };
	readonly functions?:
		| boolean
		| {
				call?: boolean;
				/** Widened (klve-009): function/arrow expressions evaluating
				 * to a function value. */
				define?: boolean;
				readonly filter?: NameFilter;
		  };
	/** Widened: `this` reads (an expression-layer moment). */
	readonly this?: boolean;
};

export type StatementsOptions = {
	readonly variables?:
		| boolean
		| {
				initialize?: boolean;
				available?: boolean;
				readonly filter?: NameFilter;
		  };
	/** Widened (klve-004). */
	readonly expressionStatement?: boolean;
	/** Widened (klve-004). */
	readonly try?: boolean;
	readonly conditionals?: boolean | { test?: boolean; branch?: boolean };
	readonly while?: boolean | { test?: boolean; iteration?: boolean };
	readonly doWhile?:
		| boolean
		| { do?: boolean; test?: boolean; iteration?: boolean };
	readonly for?:
		| boolean
		| {
				setup?: boolean;
				test?: boolean;
				increment?: boolean;
				iteration?: boolean;
		  };
	readonly forOf?: boolean | { iteration?: boolean };
	/** Widened (klve-110): the return statement inside user functions —
	 * gate layer matches event layer. */
	readonly return?: boolean;
	readonly break?: boolean;
	readonly continue?: boolean;
	readonly debugger?: boolean;
};

export type ScopeGateOptions = {
	readonly create?: boolean;
	readonly enter?: boolean;
	readonly interrupt?: boolean;
	readonly completion?: boolean;
	readonly leave?: boolean;
	readonly declare?: boolean;
};

export type ScopesOptions = {
	readonly script?: boolean | ScopeGateOptions;
	readonly block?: boolean | ScopeGateOptions;
	/** Widened: one create/enter per CALL. */
	readonly function?: boolean | ScopeGateOptions;
	/** Widened: the catch clause's environment. */
	readonly catch?: boolean | ScopeGateOptions;
};

/** A source window; events outside it are dropped at the collector's
 * residual gate. A bare number means the whole line. */
export type RangePosition = number | SourcePosition;
export type SourceRange = {
	readonly start: RangePosition;
	readonly end: RangePosition;
};

/**
 * The output-data legs (klve's capability, re-homed). `loc` is deliberately
 * NOT among them — the stamp is constitutive (ruled 2026-09-06; klve-016's
 * loc leg superseded by the adopted base shape).
 */
export type DataOptions = {
	/** The deep snapshot legs — baked at transform when on. */
	readonly scopes?: boolean;
	/** Value capture — the report call omits the argument when off. */
	readonly value?: boolean;
	readonly logs?: boolean;
	readonly dt?: boolean;
};

/**
 * The raw options surface — the seam's input. Every layer accepts boolean
 * shorthand (expanded at the seam) or its object form. Defaults: everything
 * on, no filters, whole program.
 */
export type StepInstrumentationOptions = {
	readonly resolve?: boolean | ResolveOptions;
	readonly expression?: boolean | ExpressionOptions;
	readonly statements?: boolean | StatementsOptions;
	readonly scopes?: boolean | ScopesOptions;
	readonly errors?: boolean;
	readonly range?: SourceRange;
	readonly data?: DataOptions;
};

/**
 * The seam's output — expanded, defaults-filled, validated, frozen; no
 * shorthand survives, every gate present as a boolean, every filter
 * normalized. The only options form downstream code accepts (compile-checked
 * — nothing re-validates). Deeply readonly VIEW of the expanded shape; the
 * JSON schema is the authority for the expanded structure.
 */
export type ResolvedStepInstrumentationOptions = {
	readonly resolve: Readonly<Required<ResolveOptions>> & {
		readonly kinds: Readonly<Required<ResolveKindsOptions>>;
	};
	readonly expression: DeepResolved<ExpressionOptions>;
	readonly statements: DeepResolved<StatementsOptions>;
	readonly scopes: DeepResolved<ScopesOptions>;
	readonly errors: boolean;
	readonly range: SourceRange | null;
	readonly data: Readonly<Required<DataOptions>>;
};

/** Every optional gate resolved to its boolean/object form, recursively;
 * filters normalized to a resolved mode + set-like list. */
type DeepResolved<T> = {
	readonly [K in keyof T]-?: T[K] extends boolean | infer O | undefined
		? O extends object
			? DeepResolved<O>
			: boolean
		: T[K];
};

// ============================================================================
// The event union (adopted, widened; the split kept)
// ============================================================================

/**
 * The six mental-model layers an event instance can belong to. `lifecycle`
 * is this unit's arm for the anchor family; the other five are adopted.
 */
export type EventLayer =
	| 'lifecycle'
	| 'resolve'
	| 'expression'
	| 'statement'
	| 'scope'
	| 'error';

/**
 * Fields every trace event carries — all wire-safe scalars, all REQUIRED
 * (the adopted no-empty-required-fields discipline; the anchor family
 * satisfies it at `'$'` with the whole-program stamp).
 *
 * - `step` — 1-based emission ordinal, contiguous by construction.
 * - `nodePath` — the deterministic path string (`$.body.0.test.left`).
 * - `loc` / `start` / `end` — the constitutive stamp, from the library's
 *   own parse (offsets are the cross-parser join key).
 * - `type` / `source` — the node's ESTree type and source slice, stamped at
 *   emission so events are self-contained for highlighting.
 */
export type BaseEvent = {
	readonly step: number;
	readonly semantics: EventLayer;
	readonly nodePath: string;
	readonly type: string;
	readonly loc: SourceLocation;
	readonly start: number;
	readonly end: number;
	readonly source: string;
};

// --- The lifecycle-anchor family (this unit's; the B2 ruling) ---

/** The four pre-evaluation phases of the embodiment lifecycle, embody's own
 * spelling; everything after the anchors IS the evaluation phase. */
export type LifecyclePhase = 'source' | 'tokens' | 'ast' | 'environment';

/**
 * One lifecycle anchor — asserted markers (neither observed nor inferred;
 * the README's epistemic line names the category) minted at collector
 * creation from the {@link ProgramStamp}, steps 1–4, passing every filter.
 */
export type LifecycleAnchorEvent = BaseEvent & {
	readonly semantics: 'lifecycle';
	readonly category: 'lifecycle';
	readonly phase: LifecyclePhase;
};

// --- Binding events (adopted; kinds widened per the spec) ---

/**
 * `var`/`function`/`param` are this unit's widenings (the catch binding
 * rides `param`): var declares AND initializes to undefined at environment
 * instantiation; function declarations initialize to the function object at
 * scope entry; params initialize to their argument values at call entry.
 */
export type BindingKind =
	| 'let'
	| 'const'
	| 'global'
	| 'var'
	| 'function'
	| 'param';

export type BindingEvent = BaseEvent & {
	readonly category: 'variable';
	readonly kind: BindingKind;
	readonly name: string;
	readonly scopeCreationStep?: number;
	readonly declarationStep?: number;
} & (
		| { readonly event: 'declare'; readonly semantics: 'scope' }
		| {
				readonly event: 'initialize';
				readonly semantics: 'statement';
				readonly value: ValueRepresentation;
				/** true = explicit initializer; false = the spec's implicit
				 * undefined (`let x;`, every var at instantiation). */
				readonly explicit: boolean;
		  }
		| { readonly event: 'available'; readonly semantics: 'statement' }
		| {
				readonly event: 'read';
				readonly semantics: 'expression';
				/** PROVISIONAL (D2), transported as marked: the scope-chain
				 * walk; INFERRED when built. */
				readonly scopeChainWalk?: readonly ScopeChainStep[];
		  }
		| {
				readonly event: 'update';
				readonly semantics: 'expression';
				readonly value: ValueRepresentation;
		  }
	);

/** PROVISIONAL (D2). */
export type ScopeChainStep = {
	readonly scopeCreationStep: number | null;
	readonly hit: boolean;
};

/** PROVISIONAL (D2). */
export type ProtoChainStep = {
	readonly object: ValueRepresentation;
	readonly hit: boolean;
};

// --- Property access (adopted) ---

export type PropertyAccessKind = 'dot' | 'bracket' | 'optionalChaining';

export type PropertyAccessEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'property';
	readonly kind: PropertyAccessKind;
	readonly object: ValueRepresentation;
	readonly key: string | number;
	/** PROVISIONAL (D2); INFERRED (reflective) when built. */
	readonly protoChainWalk?: readonly ProtoChainStep[];
	/** optionalChaining only: base was nullish, no lookup occurred. */
	readonly shortCircuited?: true;
};

// --- Operators (adopted; + the comma arm) ---

export type PureOperatorSubkind =
	| 'arithmetic'
	| 'addition'
	| 'comparison'
	| 'typeof'
	| 'negation.logical'
	| 'negation.bitwise'
	| 'bitwise'
	| 'in'
	| 'void'
	| 'comma';

export type PureOperatorEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'operator';
	readonly kind: 'pure';
	readonly subkind: PureOperatorSubkind;
	readonly operator: string;
	readonly operands: readonly ValueRepresentation[];
	/** Present only when coercion occurred — INFERRED per the specification
	 * (the epistemic line); `P1:coercion-legs`. */
	readonly coercion?: readonly ValueRepresentation[];
};

export type ShortCircuitingOperatorEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'operator';
	readonly kind: 'shortCircuiting';
	readonly operator: '&&' | '||' | '??';
	readonly left: ValueRepresentation;
	/** Absent when short-circuited (the right side never evaluated). */
	readonly right?: ValueRepresentation;
	readonly shortCircuited?: true;
};

export type AssignmentOperatorEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'assignment';
	readonly operator: string;
	readonly target: string;
	/** [rhs] for '='; [currentValue, rhs] for compound operators. */
	readonly operands: readonly ValueRepresentation[];
	/** The value written (the assignment expression's result). */
	readonly value: ValueRepresentation;
	readonly coercion?: readonly ValueRepresentation[];
	/** ??=, ||=, &&=: right side not evaluated, no assignment occurred. */
	readonly shortCircuited?: true;
	readonly scopeCreationStep?: number;
};

export type OperatorEvent = PureOperatorEvent | ShortCircuitingOperatorEvent;

// --- Literals (adopted; + array/object) ---

export type LiteralKind =
	| 'string'
	| 'number'
	| 'bigint'
	| 'boolean'
	| 'undefined'
	| 'null'
	| 'regex'
	| 'array'
	| 'object';

export type LiteralEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'literal';
	readonly kind: LiteralKind;
};

// --- Templates (adopted; one observation point, attached emissions) ---

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
	readonly value: ValueRepresentation;
	/** Present only when the interpolation coerced (ToString) — inferred. */
	readonly coercion?: ValueRepresentation;
	readonly beginStep: number;
};

export type TemplateEndEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'template';
	readonly event: 'end';
	readonly beginStep: number;
};

export type TemplateEvent =
	| TemplateBeginEvent
	| TemplateEvaluationEvent
	| TemplateEndEvent;

// --- Scopes (adopted; kinds widened) ---

export type LoopKind = 'while' | 'doWhile' | 'for' | 'forOf';
export type ControlFlowStructure = 'conditional' | LoopKind;

/** `function` (per call) and `catch` are this unit's widenings; `module` is
 * deliberately absent in v1 (D8 — module-scope events are withheld rather
 * than claimed as `script`). */
export type ScopeKind =
	| 'script'
	| 'block'
	| 'for'
	| 'for-of'
	| 'function'
	| 'catch';

export type ScopeEventType =
	| 'create'
	| 'enter'
	| 'interrupt'
	| 'completion'
	| 'leave';

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
	readonly creationStep?: number;
	readonly parentCreationStep?: number;
	readonly structure?: ControlFlowStructure;
	/** Present on exit moments; break/continue pops are emitted before the
	 * jump (statically known); a function scope's error-leave rides the
	 * injected try/finally. */
	readonly reason?: ScopePopReason;
};

// --- Conditionals (adopted) ---

export type ConditionalEvent = BaseEvent & {
	readonly category: 'conditional';
	readonly scopeCreationStep?: number;
} & (
		| {
				readonly event: 'test';
				readonly value: ValueRepresentation;
				/** The boolean the test coerced to — the branch decision. */
				readonly result: boolean;
				/** Present only when truthiness coercion occurred — inferred. */
				readonly coercion?: ValueRepresentation;
		  }
		| {
				readonly event: 'branch';
				readonly branch: 'consequent' | 'alternate' | 'none';
		  }
	) &
	(
		| { readonly kind: 'if'; readonly semantics: 'statement' }
		| { readonly kind: 'ternary'; readonly semantics: 'expression' }
	);

// --- Loops (adopted; doWhile/forOf are klve-108's widening of the floor) ---

export type LoopEvent = BaseEvent & {
	readonly semantics: 'statement';
	readonly category: 'loop';
	readonly kind: LoopKind;
	readonly scopeCreationStep?: number;
} & (
		| {
				readonly event: 'test';
				readonly value: ValueRepresentation;
				readonly result: boolean;
				readonly coercion?: ValueRepresentation;
		  }
		| {
				readonly event: 'iteration';
				/** 0-indexed iteration count for this loop entry. */
				readonly index: number;
				readonly iterable?: ValueRepresentation;
				readonly iterationValue?: ValueRepresentation;
				readonly iterationVariable?: string;
		  }
		| { readonly event: 'do' }
		| { readonly event: 'setup' }
		| { readonly event: 'increment' }
	);

// --- Jumps and debugger (adopted; D6 names the target-widening path) ---

/**
 * D6 (deliberate closed union, the widening path named): `target` widens
 * beyond `LoopKind` when switch/labeled-block jumps land; consumers should
 * narrow with a default arm.
 */
export type JumpEvent = BaseEvent & {
	readonly semantics: 'statement';
	readonly category: 'jump';
	readonly event: 'jump';
	readonly kind: 'break' | 'continue';
	readonly target: LoopKind;
	readonly targetScopeCreationStep?: number;
	readonly label?: string;
};

export type DebuggerEvent = BaseEvent & {
	readonly semantics: 'statement';
	readonly category: 'debugger';
	readonly event: 'debugger';
};

// --- Statements (widened members) ---

/** klve-004's capability: the expression-statement grain toggle's event. */
export type ExpressionStatementEvent = BaseEvent & {
	readonly semantics: 'statement';
	readonly category: 'expressionStatement';
	readonly event: 'evaluate';
};

/** klve-004's try grain. */
export type TryStatementEvent = BaseEvent & {
	readonly semantics: 'statement';
	readonly category: 'try';
	readonly event: 'protect';
	readonly hasCatch: boolean;
	readonly hasFinally: boolean;
};

/**
 * The return statement inside a user function (klve-110; gates under
 * `statements.return` — a widening; the adopted no-return rule keeps
 * holding for the CALL's resolve, which still carries the returned value).
 */
export type FunctionReturnEvent = BaseEvent & {
	readonly semantics: 'statement';
	readonly category: 'function';
	readonly event: 'return';
	/** The value being returned. */
	readonly value: ValueRepresentation;
};

// --- Function-family expression events (call adopted; the rest widened) ---

export type FunctionCallEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'function';
	readonly event: 'call';
	readonly name: string;
	readonly args: readonly ValueRepresentation[];
	/** Widened: true on `new` (the construct discriminant). */
	readonly construct?: true;
};

/** Widened (klve-009): a function/arrow expression evaluating to a
 * function value. */
export type FunctionDefineEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'function';
	readonly event: 'define';
	readonly name: string | null;
	readonly arity: number;
	readonly async?: true;
	readonly generator?: true;
	readonly arrow?: true;
};

/** Widened: a `this` read (an expression-layer moment). */
export type ThisEvent = BaseEvent & {
	readonly semantics: 'expression';
	readonly category: 'this';
	readonly event: 'read';
	readonly value: ValueRepresentation;
};

// --- The error channel (adopted; v1 narrowed to uncaught — D4) ---

export type ErrorEvent = BaseEvent & {
	readonly semantics: 'error';
	readonly category: 'error';
	readonly name: string;
	readonly message: string;
	readonly thrownValue: ValueRepresentation;
	/** 'last-emitted' | 'program' — the approximate-attribution convention,
	 * honestly labelled (the adopted design's own posture). */
	readonly attribution: 'last-emitted' | 'program';
};

// --- Resolve (adopted; the data layer; the split's value carrier) ---

export type ResolveKind =
	| 'variable'
	| 'literal'
	| 'operator'
	| 'shortCircuit'
	| 'conditional'
	| 'assignment'
	| 'increment'
	| 'property'
	| 'call'
	| 'template'
	| 'this'
	| 'define';

export type ResolveEvent = BaseEvent & {
	readonly semantics: 'resolve';
	readonly category: 'resolve';
	readonly kind: ResolveKind;
	readonly value: ValueRepresentation;
	/** D1 (contract-only): provenance ids — assigned at emission when built;
	 * `sourceValueIds` only ever names emitted ids. */
	readonly valueId?: number;
	readonly sourceValueIds?: readonly number[];
	/** The optional deep snapshot leg (`data.scopes`): the visible binding
	 * environment at this moment, innermost first, in DESCRIBED form on the
	 * wire (`undescribeSteps` finishes it thread-side). */
	readonly scopes?: readonly DescribedScope[];
	/** The parked console lines riding this emission (`data.logs`). */
	readonly logs?: readonly (readonly ValueRepresentation[])[];
	/** Milliseconds since the collector's clock zero (`data.dt`). */
	readonly dt?: number;
};

// --- The union ---

export type TraceEvent =
	| LifecycleAnchorEvent
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
	| ExpressionStatementEvent
	| TryStatementEvent
	| FunctionReturnEvent
	| FunctionCallEvent
	| FunctionDefineEvent
	| ThisEvent
	| ErrorEvent
	| ResolveEvent;

// ============================================================================
// The deep snapshot codec (klve's, repaired — `data.scopes` legs only)
// ============================================================================

/** A snapshot binding entry: a described value, or a structural
 * unreadability mark (the TDZ/exotic re-adjudications — never a fabricated
 * undefined). */
export type SnapshotEntry =
	| { readonly described: DescribedValue }
	| { readonly unreadable: 'tdz' | 'exotic' };

/** One visible scope's bindings at a moment, name → entry. */
export type DescribedScope = Readonly<Record<string, SnapshotEntry>>;

export type PrimitiveDescriptor =
	| {
			readonly category: 'primitive';
			readonly type: 'string';
			readonly value: string;
	  }
	| {
			readonly category: 'primitive';
			readonly type: 'boolean';
			readonly value: boolean;
	  }
	| {
			readonly category: 'primitive';
			readonly type: 'number';
			readonly value: number;
	  }
	| {
			readonly category: 'primitive';
			readonly type: 'null';
			readonly value: null;
	  }
	| {
			readonly category: 'primitive';
			readonly type: 'undefined';
			readonly value: undefined;
	  }
	| {
			readonly category: 'primitive';
			readonly type: 'symbol';
			readonly description: string | undefined;
	  }
	| {
			readonly category: 'primitive';
			readonly type: 'bigint';
			readonly value: string;
	  };

export type CompoundDescriptor = {
	readonly category: 'compound';
	readonly at: number;
};

export type ValueDescriptor = PrimitiveDescriptor | CompoundDescriptor;

/**
 * A heap object in a described value. The walk reads own enumerable
 * string-keyed DATA properties via descriptors — getters never invoked
 * (r8 vi repaired); built-ins carry honest minimum arms (`name`/`message`
 * for errors, `time` for dates, `size` for maps/sets) rather than `{}`.
 */
export type HeapObject = {
	readonly type:
		| 'object'
		| 'function'
		| 'promise'
		| 'array'
		| 'error'
		| 'date'
		| 'map'
		| 'set';
	readonly entries: readonly (readonly [string, ValueDescriptor])[];
	readonly length?: number;
	readonly cname?: string;
	readonly name?: string;
	readonly message?: string;
	readonly time?: number;
	readonly size?: number;
};

/** [descriptor, heap] — identity preserved WITHIN one described value
 * (cycles and shared references via the heap map), severed across values. */
export type DescribedValue = readonly [ValueDescriptor, readonly HeapObject[]];

/** A finished snapshot entry — the thread-side pass's output: the
 * undescribed (re-minted) value, or the structural mark untouched. */
export type FinishedSnapshotEntry =
	| { readonly value: unknown }
	| { readonly unreadable: 'tdz' | 'exotic' };

export type FinishedScope = Readonly<Record<string, FinishedSnapshotEntry>>;

/**
 * The final emitted form — the north-star's surface: every event unchanged
 * except resolve snapshot legs, finished thread-side by `undescribeSteps`.
 */
export type FinalTraceEvent =
	| Exclude<TraceEvent, ResolveEvent>
	| (Omit<ResolveEvent, 'scopes'> & {
			readonly scopes?: readonly FinishedScope[];
	  });

// ============================================================================
// The instrument outputs
// ============================================================================

/** One roster-declined site — stated incompleteness, checkable. */
export type DeclinedSite = {
	readonly nodePath: string;
	readonly reason:
		| 'typeof-operand'
		| 'delete-operand'
		| 'direct-eval-callee'
		| 'super-spine'
		| 'suspension-position'
		| 'optional-chain-interior'
		| 'lval';
};

/**
 * `instrument`'s answer: the instrumented text, the namespace it baked, the
 * declines manifest, and the program stamp `createCollector` consumes — the
 * pairing-by-construction discipline (the fix-round-2 ruling).
 */
export type InstrumentedProgram = {
	readonly code: string;
	readonly namespace: string;
	readonly declines: readonly DeclinedSite[];
	readonly programStamp: ProgramStamp;
};

export type InstrumentInput = {
	readonly code: string;
	/** The snippet's own parse goal — explicit, never inferred (klve-075). */
	readonly sourceType: 'script' | 'module';
	readonly options: ResolvedStepInstrumentationOptions;
	/** Settable (klve-046, r4); `'__V__'` when omitted; RETURNED either way. */
	readonly namespace?: string;
};

// ============================================================================
// The collector contract
// ============================================================================

export type CollectorInput = {
	readonly namespace: string;
	readonly programStamp: ProgramStamp;
	/** The residual runtime half: dt/logs shaping + name/range gates. */
	readonly data: Readonly<Required<DataOptions>>;
	readonly range: SourceRange | null;
	/** The site cap — observation points, anchor-family-inclusive (the B1
	 * ruling; klve's `_steps.length` basis). null = unlimited. */
	readonly maxSites: number | null;
	/** klve's own wall-clock at the collector (r2). null = unlimited. */
	readonly maxTime: number | null;
	/** Per-loop-entry cap at the loop-test meta-control site (klve-119).
	 * null = unlimited. */
	readonly maxIterations: number | null;
};

/**
 * One run's collector. `global` is what the host injects under the
 * namespace; its inner protocol (report/count/invoke/cache members) is the
 * transform's own baked coupling, deliberately untyped here — the injected
 * surface is machinery, not consumer API.
 */
export type Collector = {
	readonly global: Readonly<Record<string, unknown>>;
	/** The recorded events — a stable snapshot at call time (mid-run, a
	 * prefix; after the run, the whole record). */
	readonly events: () => readonly TraceEvent[];
	/** Per-nodePath traced evaluations — once per EVALUATION at the node's
	 * entry point, pre-residual-gate. */
	readonly visitCounts: () => Readonly<Record<string, number>>;
};

/** A cap trip's payload, read by reference via `readCapTrip` — in-realm
 * only (the marker does not survive a structured clone). */
export type CapTrip = {
	readonly kind: 'sites' | 'time' | 'iterations';
	/** The measured fact at the trip: sites counted / elapsed ms / the
	 * loop entry's count. */
	readonly measured: number;
	readonly cap: number;
};

// ============================================================================
// The failure surface (the library's own — transform-side; everything past
// the transform is the host's)
// ============================================================================

/**
 * The typed instrument failure: a real parse/codegen failure (Babel's own
 * position carried) or the `with` refusal. Thrown at the boundary; empty
 * code is NOT here — a legal Program traces to the anchor family (klve-078
 * re-adjudicated).
 */
export type InstrumentFailure = {
	readonly instrumentFailure: true;
	readonly reason: 'parse' | 'codegen' | 'with-statement';
	readonly message: string;
	readonly loc: SourcePosition | null;
};
