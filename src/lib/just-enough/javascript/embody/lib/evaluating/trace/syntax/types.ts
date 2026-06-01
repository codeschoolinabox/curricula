/**
 * @file Public types for the NM syntax-level tracer. Sibling of the
 * semantic-level tracer at `../semantics/`.
 *
 * Both tracers are independently exportable — semantics is the core,
 * syntax is an abstraction layer on top that consumes the semantic
 * tracer's event stream + entwined AST and produces NM-level steps.
 *
 * @remarks
 * Phase 0.4 output. Status: PARTIAL — several sections are stubbed pending
 * Phase 0.1 decisions per PLAN.md §Handoff §What's still open:
 *
 *  - Environment / Scope / Binding / EnvDiff concrete shapes (Resolution 22)
 *  - NMConfig tree finalization (Resolution 23)
 *  - Q3b register-read decision (folded into identifier vs its own kind)
 *  - Terminal-step kind enums
 *
 * All stubs are clearly marked with TODO comments and typed as `unknown`
 * or as narrow placeholders so downstream code catches mis-assumptions at
 * compile time.
 *
 * Reference: PLAN.md Resolutions 13-23 for the load-bearing decisions
 * that shaped these types.
 */

// TODO (fresh session): confirm exact import sources for TraceConfig,
// TraceEvent, ASTNode, nodePath, SourceLocation from the sibling semantic
// tracer at ../semantics/. `TraceConfig` lives in `../semantics/config.types.ts`;
// the other types need locating + possibly re-exporting from
// `../semantics/index.ts`. Import the named types when a use site lands.
type TraceEvent = unknown;      // TODO: locate in ../semantics/
type ASTNode = unknown;         // TODO: locate in ../semantics/
type nodePath = string;         // TODO: confirm in ../semantics/
type SourceLocation = unknown;  // TODO: locate in ../semantics/

// ─── Placeholder for deferred types ───────────────────────────────────

/**
 * TODO (Resolution 22, Phase 0.1 prerequisite): finalize Environment shape.
 * Concerns: scope tree shape (Map? nested objects?), TDZ state,
 * binding versioning, active-scope-stack maintenance.
 */
type Environment = unknown;

/**
 * TODO (Resolution 22): see Environment above.
 */
type Scope = unknown;

/**
 * TODO (Resolution 22): binding record with name/kind/TDZ/value/version.
 */
type Binding = unknown;

/**
 * TODO (Resolution 22): per-step environment delta format.
 * Candidate fields: scopesEntered, scopesLeft, bindingChanges[].
 */
type EnvDiff = unknown;

// ─── Session ──────────────────────────────────────────────────────────

type CreationErrorKind = 'parse' | 'validate' | 'instrument';

type CreationError = Readonly<{
	kind: CreationErrorKind;
	message: string;
	location?: SourceLocation;
}>;

type R4bErrorName = 'ReferenceError' | 'TypeError' | 'RangeError';

type R4bError = Readonly<{
	phase: 'execution';
	name: R4bErrorName;
	message: string;
}>;

/**
 * The object returned by `nm(source, config)`. Eager properties
 * available synchronously; streaming via `steps`; resolution via
 * `complete()`.
 */
type NMSession = Readonly<{
	source: string;

	/**
	 * Construction-phase AST. Fresh NM-owned copy with `dagRole` +
	 * `dagKind` tags per node and `loc` preserved. No `events[]`,
	 * `visits`, or `stepIndices` — execution hasn't happened.
	 * Null iff `creationError` is populated.
	 */
	ast: NMASTNode | null;

	/**
	 * The initial environment (pre-execution). Null iff creationError.
	 * TODO: type as `Environment | null` once Environment is finalized.
	 */
	initialEnvironment: Environment | null;

	/**
	 * Populated on R4a failure (parse / JEJ-validate / instrument).
	 * When present, ast and initialEnvironment are null and steps is
	 * empty.
	 */
	creationError: CreationError | null;

	/**
	 * The step stream. Pull with `for await`. Each yield is a
	 * `StreamYield` carrying a LiveStep (which mutates as events
	 * arrive) + the step's envDiff.
	 */
	steps: AsyncIterable<StreamYield>;

	/**
	 * Resolves with the finalized NMTraceResult when the stream
	 * completes (or the error terminates it).
	 */
	complete(): Promise<NMTraceResult>;

	/**
	 * Auto-called when the outer iterator is broken (for-await-of
	 * calls `.return()`). Terminates tracer worker + all inner
	 * iterators.
	 */
	cancel(): void;
}>;

type StreamYield = Readonly<{
	step: LiveStep;
	envDiff: EnvDiff;
}>;

type NMTraceResult = Readonly<{
	ok: boolean;

	/**
	 * Finalization-phase AST. Fresh copy (distinct object from
	 * `session.ast`) with events[] + visits + stepIndices populated
	 * per node. In-memory cycles OK; strip for serialization.
	 */
	ast: NMASTNode;

	steps: readonly Step[];

	/** TODO: type once Environment is finalized. */
	initialEnvironment: Environment;
	/** TODO: type once Environment is finalized. */
	finalEnvironment: Environment;

	/** Node paths where `visits > 0`. */
	coverage: ReadonlySet<nodePath>;

	error?: R4bError | 'timeout' | 'iteration-limit' | 'cancelled';
}>;

// ─── NM-owned AST ─────────────────────────────────────────────────────

type DagRole = 'source' | 'transformation' | 'destination' | 'sidecar' | null;
type DagKind = string; // TODO: enumerate per node type

/**
 * The NM-owned AST node. Fresh copy (not tracer's frozen AST). Carries
 * `dagRole` + `dagKind` tags and, in `result.ast`, entwined events +
 * visits + stepIndices.
 *
 * In-memory parent/child reference cycles are kept for convenience
 * (Resolution 19); serialization callers strip via replacer.
 */
type NMASTNode = ASTNode & Readonly<{
	dagRole: DagRole;
	dagKind?: DagKind;

	// Populated only on result.ast:
	events?: readonly TraceEvent[];
	visits?: number;
	stepIndices?: readonly number[];
}>;

// ─── Step discriminant + shared fields ────────────────────────────────

/**
 * Ten categories. Two-level discriminant: `step.category` (outer) +
 * `step.kind` (inner). See PLAN.md Resolution 18 for the full table.
 */
type StepCategory =
	| 'expression'
	| 'resolve'
	| 'statement'
	| 'scope'
	| 'control-flow'
	| 'initialization'
	| 'for-init'
	| 'write'
	| 'emit'
	| 'error';

type StepBase = Readonly<{
	category: StepCategory;
	/** AST reference: the node visited at this step. */
	dagNodePath: nodePath;
	/**
	 * Text reference: the transition-specific moment.
	 * For multi-transition steps (statement enter/exit; scope
	 * create/leave), differs per transition and is NOT equal to
	 * `ast[dagNodePath].loc`. For single-moment steps, equals the
	 * AST node's loc.
	 */
	loc: SourceLocation;
	/**
	 * Raw tracer events aggregated into this step. Populated only
	 * when `NMConfig.semanticEvents` is true; otherwise undefined.
	 */
	events?: readonly TraceEvent[];
	/**
	 * Environment delta for this step.
	 * TODO: type once EnvDiff is finalized.
	 */
	envDiff: EnvDiff;
}>;

// ─── Source / Destination refs (for ResolveStep) ──────────────────────

type SourceKind =
	| 'literal'
	| 'identifier'
	| 'property'
	| 'operator-output'
	| 'call-output'
	| 'template-output'
	| 'io-input';

type SourceRef = Readonly<{
	kind: SourceKind;
	/** AST-position loc for rendering arrows. Always populated. */
	loc: SourceLocation;
	/** The value that flowed from this source. */
	value: unknown;
	/**
	 * Step index of the expression step that produced this value.
	 * Undefined when the producer is gated off or primordial
	 * (literal, pre-hoisted global).
	 */
	stepIndex?: number;
	/** Tracer-level provenance (valueId chain). */
	valueId?: number;
}>;

type DestinationKind =
	| 'operand-input'
	| 'arg-input'
	| 'initialization'
	| 'for-init'
	| 'write'
	| 'emit'
	| 'sink';

type DestinationRef = Readonly<{
	kind: DestinationKind;
	/** AST-position loc for rendering arrows. Always populated. */
	loc: SourceLocation;
	/**
	 * Step index of the consuming step. Undefined when the consumer
	 * is gated off or the destination is a sink.
	 */
	stepIndex?: number;
	/**
	 * Kind-specific positional metadata. E.g., operand-input carries
	 * `operandIndex`; arg-input carries `argIndex`.
	 */
	role?: Readonly<{
		operandIndex?: number;
		argIndex?: number;
		interpolationIndex?: number;
	}>;
}>;

// ─── Coercion record (Resolution 18 dual representation) ──────────────

type CoercionContext =
	| 'string-concatenation'
	| 'numeric'
	| 'boolean'
	| 'equality'
	| 'template'
	| 'explicit';

/**
 * Property on operator ExpressionStep. representCoercion-style array
 * parallel to operands carrying pre-/post-coercion values.
 * Standalone coercion events also appear in `.events[]` when
 * `semanticEvents: true`.
 */
type CoercionRecord = readonly Readonly<{
	from: unknown;
	to: unknown;
	context: CoercionContext;
}>[];

// ─── Expression steps ─────────────────────────────────────────────────

type LiteralExpressionStep = StepBase & Readonly<{
	category: 'expression';
	kind: 'literal';
	value: unknown;
}>;

type IdentifierExpressionStep = StepBase & Readonly<{
	category: 'expression';
	kind: 'identifier';
	value: unknown;
	/**
	 * Populated when the identifier resolves to a binding. Absent
	 * when the identifier resolves to a pre-hoisted global (register).
	 * TODO (Q3b, Phase 0.1): confirm this flag model vs. a separate
	 * 'register-read' kind.
	 */
	binding?: Readonly<{
		name: string;
		scopePath: nodePath;
		version: number;
	}>;
	/** True for pre-hoisted global reads (Math, prompt, etc.). */
	register?: true;
}>;

type PropertyExpressionStep = StepBase & Readonly<{
	category: 'expression';
	kind: 'property';
	object: unknown;
	propertyName: string;
	value: unknown;
	/* Proto-chain walk events in `.events[]` when semanticEvents on. */
}>;

type OperatorExpressionStep = StepBase & Readonly<{
	category: 'expression';
	kind: 'operator';
	operator: string; // '+', '<', '===', '&&', '=', '+=', '++', 'typeof', '!', 'in', ...
	operands: readonly unknown[];
	/**
	 * Dual-representation with events. Property carries representCoercion-style
	 * parallel array; standalone coercion events also in `.events[]`
	 * when semanticEvents: true.
	 */
	coercion?: CoercionRecord;
	result: unknown;
	/**
	 * For short-circuit operators (`&&`, `||`, `??`). RHS is skipped
	 * entirely; no RHS resolves/steps fire.
	 */
	shortCircuited?: Readonly<{
		skippedSide: 'rhs';
		skippedNodePath: nodePath;
	}>;
}>;

type CallExpressionStep = StepBase & Readonly<{
	category: 'expression';
	kind: 'call';
	callee: unknown;
	args: readonly unknown[];
	result: unknown;
}>;

type TemplateExpressionStep = StepBase & Readonly<{
	category: 'expression';
	kind: 'template';
	staticParts: readonly string[];
	interpolations: readonly unknown[];
	result: string;
}>;

type ExpressionStep =
	| LiteralExpressionStep
	| IdentifierExpressionStep
	| PropertyExpressionStep
	| OperatorExpressionStep
	| CallExpressionStep
	| TemplateExpressionStep;

// ─── Resolve step (edge) ──────────────────────────────────────────────

/**
 * Resolution 17: a ResolveStep is a data-flow EDGE, not a value
 * producer. Singular `.from` + `.to`; value flows along the edge.
 * AST-position locs on both ends so consumers render arrows even
 * when neighbor nodes are gated off.
 */
type ResolveStep = StepBase & Readonly<{
	category: 'resolve';
	/** Single kind; the category itself is the discriminant. */
	kind: 'resolve';
	from: SourceRef;
	to: DestinationRef;
	value: unknown;
	valueId?: number;
}>;

// ─── Terminal steps ───────────────────────────────────────────────────

/**
 * TODO: finalize kind — single kind vs `let`/`const` sub-kinds?
 */
type InitializationKind = 'initialization'; // placeholder

type InitializationStep = StepBase & Readonly<{
	category: 'initialization';
	kind: InitializationKind;
	/** Binding being initialized. */
	bindingName: string;
	bindingKind: 'let' | 'const';
	/** The initial value. Present for inline initializers; absent
	 *  for `let x;` without init. */
	value?: unknown;
	/** Back-ref to the incoming resolve when resolves are on. */
	sourceResolveIndex?: number;
}>;

type ForInitStep = StepBase & Readonly<{
	category: 'for-init';
	kind: 'for-init'; // TODO: confirm single kind
	bindingName: string;
	bindingKind: 'let' | 'const';
	value: unknown;
	sourceResolveIndex?: number;
}>;

/**
 * TODO: finalize kinds — 'simple' vs 'compound' (for `+=` etc.)?
 */
type WriteKind = 'simple' | 'compound';

type WriteStep = StepBase & Readonly<{
	category: 'write';
	kind: WriteKind;
	/** Target binding. */
	target: Readonly<{
		name: string;
		scopePath: nodePath;
		version: number;
	}>;
	value: unknown;
	sourceResolveIndex?: number;
}>;

/**
 * TODO: finalize kinds — per-method (prompt, alert, confirm,
 * console-log, ...) vs per-channel (user-channel, dev-channel)?
 */
type EmitKind = string; // placeholder

type EmitStep = StepBase & Readonly<{
	category: 'emit';
	kind: EmitKind;
	/** The emitted value. */
	payload: unknown;
	channel: 'user' | 'dev';
	method: string; // prompt / alert / confirm / console.log / ...
	sourceResolveIndex?: number;
}>;

type ErrorStep = StepBase & Readonly<{
	category: 'error';
	kind: R4bErrorName;
	error: R4bError;
}>;

// ─── Structural steps ─────────────────────────────────────────────────

type StatementStep = StepBase & Readonly<{
	category: 'statement';
	kind: 'enter' | 'exit';
	exitReason?: 'normal' | 'break' | 'continue' | 'error';
}>;

type ScopeStep = StepBase & Readonly<{
	category: 'scope';
	kind: 'create' | 'leave';
	scopeKind: 'script' | 'block';
	/**
	 * For 'create' transitions: the hoisted bindings that entered
	 * TDZ at this moment (one binding-declare event per hoisted
	 * binding).
	 */
	hoistedBindings?: readonly Readonly<{
		name: string;
		kind: 'let' | 'const';
		declaredAt: nodePath;
	}>[];
}>;

type ControlFlowKind =
	| 'conditional-test'
	| 'branch-entry'
	| 'loop-iter-start'
	| 'loop-iter-end'
	| 'loop-exit'
	| 'break'
	| 'continue';

type ControlFlowStep = StepBase & Readonly<{
	category: 'control-flow';
	kind: ControlFlowKind;
	/** For conditional-test and loop-iter-start: the test value. */
	testValue?: unknown;
	/** For conditional-test: the branch decision. */
	decision?: 'truthy' | 'falsy';
	/** For loop-iter-*: the iteration number. */
	iteration?: number;
}>;

// ─── Step union ───────────────────────────────────────────────────────

type Step =
	| ExpressionStep
	| ResolveStep
	| StatementStep
	| ScopeStep
	| ControlFlowStep
	| InitializationStep
	| ForInitStep
	| WriteStep
	| EmitStep
	| ErrorStep;

// ─── LiveStep ─────────────────────────────────────────────────────────

/**
 * A step in its streaming / mutable form. Fields fill as events
 * arrive within the step's bracket; `.done` resolves with the frozen
 * Step on close.
 *
 * Mutation contract: while `.done` is unresolved, the LiveStep
 * object is mutable and the consumer should re-read fields rather
 * than snapshot. After `.done` resolves, the step is frozen —
 * consumer holds the resolved value.
 */
type LiveStep = Step & Readonly<{
	/** Inner pull stream for raw tracer events within this step.
	 *  `events` on the Step itself is populated from this stream on
	 *  close (when semanticEvents is true). */
	events$: AsyncIterable<TraceEvent>;
	/** Resolves when the step closes, with the frozen Step. */
	done: Promise<Step>;
}>;

// ─── NMConfig ─────────────────────────────────────────────────────────

/**
 * TODO (Resolution 23, Phase 0.1 prerequisite): finalize NMConfig
 * tree. Draft below captures the category gates + resolves co-gating
 * + semanticEvents + I/O mocks + timeout/iteration limits.
 *
 * Per Resolution 23: AST-aware vocabulary (teaches AST by exposure
 * per syllabus "twinning"). Align naming with tracer's TraceConfig.options.
 */
type NMConfig = Readonly<{
	/** Expression-step category gate. Nested for finer control. */
	expressions?: boolean | Readonly<{
		literals?: boolean;
		identifiers?: boolean;
		properties?: boolean;
		operators?: boolean;
		calls?: boolean;
		templates?: boolean;
	}>;

	/** Resolve-edge gate with co-gating behavior. */
	resolves?: boolean | Readonly<{
		/** Default true: resolves co-emit with their transformation.
		 *  False: resolves emit standalone (pure data-flow trace). */
		dependent?: boolean;
	}>;

	statementSteps?: boolean;
	scopeSteps?: boolean;
	controlFlowSteps?: boolean;
	initializationSteps?: boolean;
	forInitSteps?: boolean;
	writeSteps?: boolean;
	emitSteps?: boolean;
	/** Errors essentially always on — gate retained for symmetry. */
	errorSteps?: boolean;

	/**
	 * When false, `step.events[]` is undefined; tracer emits only
	 * minimum events for top-layer step fields.
	 */
	semanticEvents?: boolean;

	/** Passthrough to tracer. Seconds timeout; default 5. */
	seconds?: number;
	/** Passthrough to tracer. Loop iteration limit. */
	iterations?: number;
	/** TODO (Resolution 4): range filtering, Phase 1+ extension. */
	range?: Readonly<{ start: SourceLocation; end: SourceLocation }>;

	/**
	 * Consumer-supplied I/O functions passed through to tracer.
	 * The NM layer doesn't implement these; it just forwards.
	 * See PLAN.md §Phase 0-A for the tracer contract.
	 */
	io?: Readonly<{
		prompt?: (message: string, placeholder?: string) => Promise<string | null>;
		alert?: (message: string) => Promise<void>;
		confirm?: (message: string) => Promise<boolean>;
		console?: Readonly<{
			log?: (...args: unknown[]) => Promise<void>;
			warn?: (...args: unknown[]) => Promise<void>;
			error?: (...args: unknown[]) => Promise<void>;
			info?: (...args: unknown[]) => Promise<void>;
			debug?: (...args: unknown[]) => Promise<void>;
			assert?: (condition: boolean, ...args: unknown[]) => Promise<void>;
			count?: (label?: string) => Promise<void>;
			countReset?: (label?: string) => Promise<void>;
			group?: (label?: string) => Promise<void>;
			groupCollapsed?: (label?: string) => Promise<void>;
			groupEnd?: () => Promise<void>;
			time?: (label?: string) => Promise<void>;
			timeLog?: (label?: string, ...args: unknown[]) => Promise<void>;
			timeEnd?: (label?: string) => Promise<void>;
			clear?: () => Promise<void>;
		}>;
	}>;
}>;

// ─── Exports ──────────────────────────────────────────────────────────

export type {
	// Session
	NMSession,
	NMTraceResult,
	StreamYield,
	NMConfig,
	CreationError,
	R4bError,

	// AST
	NMASTNode,
	DagRole,
	DagKind,

	// Step union
	Step,
	LiveStep,
	StepCategory,
	StepBase,

	// Expression variants
	ExpressionStep,
	LiteralExpressionStep,
	IdentifierExpressionStep,
	PropertyExpressionStep,
	OperatorExpressionStep,
	CallExpressionStep,
	TemplateExpressionStep,

	// Resolve edge
	ResolveStep,
	SourceRef,
	DestinationRef,
	SourceKind,
	DestinationKind,

	// Terminals
	InitializationStep,
	ForInitStep,
	WriteStep,
	EmitStep,
	ErrorStep,

	// Structural
	StatementStep,
	ScopeStep,
	ControlFlowStep,
	ControlFlowKind,

	// Coercion
	CoercionRecord,
	CoercionContext,

	// Deferred (stubs)
	Environment,
	Scope,
	Binding,
	EnvDiff,
};
