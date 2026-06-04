// ─────────────────────────────────────────────────────────────────────────────
// JEJ embody — canonical types
//
// Represents a JEJ snippet through its full ECMAScript-aligned lifecycle:
//   realm → parse(tokenize → AST) → creation(script-scope) → evaluation
//
// Three-layer type hierarchy (Data → Entwined → NMEvent):
//   Data     — pure per-entity data; no cross-references.
//   Entwined — per-entity data + typed cross-refs to other entwined entities.
//   NMEvent  — entwined entity + temporal context (phase/step/chain/relations).
//
// Snippet shape:
//   Phase axis  — realm, tokenize, parseAST, creation, evaluation.
//   Layer axis  — .data (L1), .entwined (L2), .events (L3).
//   Layer-first — only the .events axis has layer-first access (snippet.events.*).
//                 .data and .entwined are phase-first only.
//
// All types are immutable. Generators are the only callable surface.
// No Maps/Sets at the public surface (Object.freeze doesn't freeze them).
//
// Companion documents:
//   ../notional-machine.md — prose model and spec correspondence
//   ./README.md            — peer front-door overview and glossary
//   ./DOCS.md              — architecture sketch + data flow + tradeoffs
//
// ─────────────────────────────────────────────────────────────────────────────

import type { Node as AcornNode } from 'acorn';

// `Violation` is owned by the validating pipeline (it is what produces
// violations). Re-exported below so `Snippet.validation.violations` and
// consumers can import it from the embody-level types module.
import type { Violation } from './lib/validating/types.js';

// ═════════════════════════════════════════════════════════════════════════════
// 1. SOURCE LOCATION PRIMITIVES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Dot-delimited node-path rooted at the Program node; array indices are bare
 * segments, e.g. "$.body.0.declarations.0.init". The canonical node-identity
 * format across embody (validating, intercept, trace). NOT RFC-9535 JSONPath —
 * a lodash-style dotted path; postMessage-safe for crossing the worker boundary.
 * Injective over an AST — every node has a unique NodePath, so `byPath` holds
 * exactly one entry per node.
 */
type NodePath = string;

type SourcePosition = {
	readonly line: number; // 1-based
	readonly column: number; // 0-based
}

type SourceLocation = {
	readonly start: SourcePosition;
	readonly end: SourcePosition;
}

/** The source string + a precomputed line-offsets index for O(1) loc lookup. */
type Source = {
	readonly code: string;
	/** offsets[n] = char offset of the first char of line n+1; offsets[0] === 0. */
	readonly offsets: ReadonlyArray<number>;
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. RAW ACORN PROVENANCE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Flat Acorn output verbatim. Lives on snippet.raw. Fields are null until the
 * corresponding gate passes: tokens after tokenize, ast + comments after parse.
 */
type RawAcorn = {
	readonly tokens: ReadonlyArray<unknown> | null; // Acorn Token[]; null before tokenize
	readonly ast: AcornNode | null; // Acorn Program; null before parse
	readonly comments: ReadonlyArray<unknown> | null; // Acorn Comment[]; null before parse
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. L1 — DATA TYPES
//
// Pure per-entity data — kind, value, range, name. No cross-references.
// Every NM component has a data layer. Placeholder interfaces are filled in
// by their respective factory DDD sessions (lib/parse/, lib/scope/, etc.).
// ═════════════════════════════════════════════════════════════════════════════

/** @todo fields locked in lib/parse/ DDD — pure token data (kind, value, range, text) */
type TokenData = {}

/** @todo fields locked in lib/parse/ DDD — pure comment data (kind, range, text) */
type CommentData = {}

/** @todo fields locked in lib/parse/ DDD — pure AST node data (type, loc, acorn fields) */
type NodeData = {}

/** Pure scope identity data — no cross-references. */
type ScopeData = {
	readonly kind: 'intrinsics' | 'host' | 'script' | 'block' | 'for-iteration';
	/** Isolated data for each binding in this scope (no cross-refs). */
	readonly bindings: Readonly<Record<string, BindingData>>;
}

type BindingData = RealmBindingData | ScriptBindingData;

/** Pure data for a realm-level (intrinsic or host) binding. */
type RealmBindingData = {
	readonly category: 'intrinsic' | 'host';
	readonly name: string;
	readonly valueCategory: 'object-register' | 'function' | 'constant';
	readonly value: unknown;
}

/** Pure data for a script/block/for-iteration binding. */
type ScriptBindingData = {
	readonly category: 'script' | 'block' | 'for-iteration';
	readonly name: string;
	readonly kind: 'let' | 'const';
	readonly status: BindingStatus;
	readonly value: unknown;
}

/** Access-time visibility of a script/block binding. */
type BindingStatus = 'tdz' | 'initialized' | 'dead';

// ═════════════════════════════════════════════════════════════════════════════
// 4. L2 — ENTWINED TYPES
//
// Per-entity data + typed cross-references to other entwined entities.
// The graph is mutable during construction (so cross-refs can be wired up)
// and deep-frozen once at the end. Consumers see only the frozen graph.
// ═════════════════════════════════════════════════════════════════════════════

type TokenEntwined = {
	readonly data: TokenData;
	readonly innermostNode: NodeEntwined | null;
	readonly innermostPath: NodePath | null;
	readonly prevToken: TokenEntwined | null;
	readonly nextToken: TokenEntwined | null;
	/** Whitespace/gap in source between prevToken.end and this token's start. */
	readonly leadingGap: string | null;
}

type CommentEntwined = {
	readonly data: CommentData;
	readonly innermostNode: NodeEntwined | null;
	readonly innermostPath: NodePath | null;
	readonly prevToken: TokenEntwined | null;
	readonly nextToken: TokenEntwined | null;
}

type NodeEntwined = {
	readonly data: NodeData;
	readonly parent: NodeEntwined | null; // null only for Program
	readonly children: ReadonlyArray<NodeEntwined>;
	readonly tokens: ReadonlyArray<TokenEntwined>; // all tokens within span
	readonly firstToken: TokenEntwined | null;
	readonly lastToken: TokenEntwined | null;
	/** Semantic anchor token (e.g. `if` for IfStatement, operator for BinaryExpression). */
	readonly keyToken: TokenEntwined | null;
	readonly comments: ReadonlyArray<CommentEntwined>; // contained within span
	readonly path: NodePath;
}

type ScopeEntwined = {
	readonly data: ScopeData;
	readonly outer: ScopeEntwined | null; // null at intrinsics root
	readonly astNode: NodeEntwined | null; // null for realm scopes
	readonly bindings: Readonly<Record<string, Binding>>;
	readonly depth: number; // 0 = intrinsics, 1 = host, 2 = script, 3+ = block/for-iter
	/**
	 * ONLY present on script scope. Forest of predicted block/for-iteration
	 * scopes derived from static AST analysis (pre-evaluation).
	 */
	readonly scopeTree?: ReadonlyArray<ScopeTreeNode>;
}

type ScopeTreeNode = {
	readonly kind: 'block' | 'for-iteration';
	readonly astNode: NodeEntwined;
	readonly declaredBindings: ReadonlyArray<DeclarationInfo>;
	readonly parent: ScopeEntwined | ScopeTreeNode;
	readonly children: ReadonlyArray<ScopeTreeNode>;
}

type DeclarationInfo = {
	readonly name: string;
	readonly kind: 'let' | 'const';
	readonly declarationNode: NodeEntwined;
}

type RealmBindingEntwined = {
	readonly data: RealmBindingData;
	readonly scope: ScopeEntwined; // containing intrinsics or host scope
}

type ScriptBindingEntwined = {
	readonly data: ScriptBindingData;
	readonly declarationNode: NodeEntwined;
	readonly scope: ScopeEntwined;
	readonly declarationToken: TokenEntwined; // the `let`/`const` keyword token
}

type Binding = RealmBindingEntwined | ScriptBindingEntwined;

/**
 * Proxy-backed binding lookup on every NMEvent. Walks the current scope chain
 * at access time. The one exception to "all factory outputs are deep-frozen":
 * this is a computed view, not crystallized data. Enumeration and mutation
 * are not supported.
 */
type BindingLookup = {
	readonly [name: string]: BindingState;
}

type BindingState =
	| {
			readonly status: 'available';
			readonly value: unknown;
			readonly scope: ScopeEntwined;
			readonly binding: Binding;
	  }
	| {
			readonly status: 'tdz';
			readonly scope: ScopeEntwined;
			readonly binding: Binding;
			readonly wouldThrow: 'ReferenceError';
	  }
	| { readonly status: 'unbound'; readonly wouldThrow: 'ReferenceError' };

// ═════════════════════════════════════════════════════════════════════════════
// 5. PHASE-LEVEL DATA AGGREGATES (L1 per phase)
//
// Returned by snippet.<phase>.data. Placeholder interfaces — fields locked in
// their respective factory DDD sessions.
// ═════════════════════════════════════════════════════════════════════════════

/** @todo fields locked in lib/scope/ DDD — realm scope data (kind + binding data records) */
type RealmData = {}

/** @todo fields locked in lib/parse/ DDD — tokens: ReadonlyArray<TokenData>; comments: ReadonlyArray<CommentData> */
type TokenizeData = {}

/** @todo fields locked in lib/parse/ DDD — root: NodeData (tree root) */
type ParseASTData = {}

/** @todo fields locked in lib/scope/ DDD — scope data forest + script binding data records */
type CreationData = {}

// ═════════════════════════════════════════════════════════════════════════════
// 6. PHASE-LEVEL ENTWINED AGGREGATES (L2 per phase)
//
// Returned by snippet.<phase>.entwined. Placeholder interfaces — fields locked
// in their respective factory DDD sessions.
// ═════════════════════════════════════════════════════════════════════════════

/** @todo fields locked in lib/scope/ DDD — intrinsics ScopeEntwined + host ScopeEntwined + RealmBindingEntwined records */
type RealmEntwined = {}

/** @todo fields locked in lib/parse/ DDD — tokens: ReadonlyArray<TokenEntwined>; comments: ReadonlyArray<CommentEntwined> */
type TokenizeEntwined = {}

/**
 * @todo `root: NodeEntwined` — locked in lib/parse/ DDD (NOT this round).
 *
 * `byPath`/`byOffset` are contract-locked here; the lib/parse/ entwine pass
 * BUILDS them (single walk, same frozen node refs as the tree — no copy).
 * Both are canonical, domain-general entry-points into the ref-graph; lenses
 * still build their own pedagogy-specific groupings (out of scope here).
 */
type ParseASTEntwined = {
	/**
	 * Every node keyed by its `NodePath` — O(1) resolution from a path string
	 * (carried on a worker event, or persisted by a lens) back to its entwined
	 * node. Holds the same node references as the tree; an entry-point INTO the
	 * graph, not a copy.
	 */
	readonly byPath: Readonly<Record<NodePath, NodeEntwined>>;
	/**
	 * Indexed by source character offset; each slot is the deepest node whose
	 * span covers that offset (deepest-wins). Every offset in `[0, source.length)`
	 * resolves to at least the Program root — never a hole; an inter-token gap
	 * (whitespace/comment) resolves to its innermost enclosing node. Zero-width
	 * nodes (`start === end`) cover no offset and are unreachable here — use
	 * `byPath`. `offset === source.length` (EOF) is out of bounds. Resolve a
	 * `(line, column)` via `Source.offsets[line - 1] + column` (column 0-based),
	 * then index this array, for O(1) `(line, column) → node`.
	 */
	readonly byOffset: ReadonlyArray<NodeEntwined>;
}

/** @todo fields locked in lib/scope/ DDD — script ScopeEntwined (with .scopeTree); ScriptBindingEntwined records */
type CreationEntwined = {}

// ═════════════════════════════════════════════════════════════════════════════
// 7. PHASE INTERFACES
//
// One object per spec-grounded lifecycle phase. Phase objects on Snippet are
// nullable (null when the corresponding status gate didn't complete), except
// realm and evaluation which are always present.
// ═════════════════════════════════════════════════════════════════════════════

type RealmPhase = {
	readonly data: RealmData;
	readonly entwined: RealmEntwined;
	readonly events: () => Generator<RealmNMEvent>;
}

type TokenizePhase = {
	readonly data: TokenizeData;
	readonly entwined: TokenizeEntwined;
	readonly events: () => Generator<TokenNMEvent | CommentNMEvent>;
}

type ParseASTPhase = {
	readonly data: ParseASTData;
	readonly entwined: ParseASTEntwined;
	readonly events: () => Generator<NodeNMEvent>;
}

type CreationPhase = {
	readonly data: CreationData;
	readonly entwined: CreationEntwined;
	readonly events: () => Generator<ScopeNMEvent | BindingNMEvent>;
}

/** Evaluation has no static .data or .entwined — evaluation is fully dynamic. */
type EvaluationPhase = {
	readonly events: EvaluationEvents;
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. EVENTS VIEW + EVALUATION EVENTS
//
// EventsView is the only layer-first axis on Snippet (snippet.events.*).
// All stream functions are always safe — null/absent phases yield empty
// generators, never throw.
// ═════════════════════════════════════════════════════════════════════════════

type EventsView = {
	readonly realm: () => Generator<RealmNMEvent>;
	readonly tokenize: () => Generator<TokenNMEvent | CommentNMEvent>;
	readonly parseAST: () => Generator<NodeNMEvent>;
	readonly creation: () => Generator<ScopeNMEvent | BindingNMEvent>;
	readonly evaluation: EvaluationEvents;
}

type EvaluationEvents = {
	readonly run: (options?: EvaluateOptions) => Promise<RunInstance>;
	readonly intercept: (options?: EvaluateOptions) => EvaluateHandle;
	readonly trace: {
		readonly variables: (options?: EvaluateOptions) => EvaluateHandle;
		readonly syntax: (options?: EvaluateOptions) => EvaluateHandle;
		readonly semantics: (options?: EvaluateOptions) => EvaluateHandle;
	};
}

// ═════════════════════════════════════════════════════════════════════════════
// 9. NM EVENTS
//
// NMEvent is the base for every lifecycle event. Concrete event types extend
// NMEvent, narrowing phase/category/kind and specifying the .entwined type.
//
// prev/next are getters (frozen-emit constraint: events are emitted and frozen
// one at a time; the next event may not exist when an event is frozen).
//
// bindings is a Proxy — see BindingLookup. The one non-crystallized surface.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Phase values on NMEvent.phase. All 5 spec-grounded lifecycle phases are
 * present here (including 'realm'). 'validation' is NOT included — validation
 * is a cross-phase gate, not a spec lifecycle phase.
 */
type NMEventPhase =
	| 'realm'
	| 'parse:tokenize'
	| 'parse:ast'
	| 'creation'
	| 'evaluation';

type EventCategory =
	| 'token' // parse:tokenize — one per token
	| 'comment' // parse:tokenize — one per comment (static; not in evaluation streams)
	| 'node' // parse:ast — bookended enter/exit pairs
	| 'realm' // realm — intrinsics-created + host-created
	| 'scope' // creation + evaluation — scope push/pop
	| 'binding' // creation + evaluation — declare/initialize/access/update
	| 'script' // evaluation — script bookends
	| 'expression' // evaluation — expression results
	| 'resolve' // evaluation — identifier/member resolution (scope/proto chain walks)
	| 'statement' // evaluation — statement bookends
	| 'control-flow' // evaluation — branches, loops, break/continue
	| 'initialization' // evaluation — binding initialization
	| 'for-init' // evaluation — for-loop init
	| 'write' // evaluation — assignment
	| 'coerce' // evaluation — ToPrimitive/ToString/ToNumeric/ToBoolean
	| 'emit' // evaluation — I/O (console.*, alert, prompt, confirm)
	| 'error'; // evaluation — runtime errors

type NMEvent = {
	readonly phase: NMEventPhase;
	readonly category: EventCategory;
	readonly kind: string; // narrowed per concrete type
	readonly step: number;
	get prev(): NMEvent | null; // getter: frozen-emit constraint
	get next(): NMEvent | null; // getter: frozen-emit constraint
	readonly loc: SourceLocation | null;
	readonly entwined: unknown; // narrowed to specific entwined type per category
	readonly relations?: Readonly<Record<string, NMEvent | null>>; // narrowed per category
	readonly bindings: BindingLookup; // Proxy; computed view, not crystallized data
}

// ─── Realm events ─────────────────────────────────────────────────────────────

type IntrinsicsCreatedNMEvent = {
	readonly phase: 'realm';
	readonly category: 'realm';
	readonly kind: 'intrinsics-created';
	readonly entwined: {
		readonly scope: ScopeEntwined;
		readonly bindings: Readonly<Record<string, RealmBindingEntwined>>;
	};
} & NMEvent

type HostCreatedNMEvent = {
	readonly phase: 'realm';
	readonly category: 'realm';
	readonly kind: 'host-created';
	readonly entwined: {
		readonly scope: ScopeEntwined;
		readonly bindings: Readonly<Record<string, RealmBindingEntwined>>;
	};
} & NMEvent

type RealmNMEvent = IntrinsicsCreatedNMEvent | HostCreatedNMEvent;

// ─── Tokenize events ──────────────────────────────────────────────────────────

type TokenNMEvent = {
	readonly phase: 'parse:tokenize';
	readonly category: 'token';
	readonly kind: 'token';
	readonly entwined: TokenEntwined;
} & NMEvent

type CommentNMEvent = {
	readonly phase: 'parse:tokenize';
	readonly category: 'comment';
	readonly kind: 'line' | 'block';
	readonly entwined: CommentEntwined;
} & NMEvent

// ─── ParseAST events ──────────────────────────────────────────────────────────

type NodeEnterNMEvent = {
	readonly phase: 'parse:ast';
	readonly category: 'node';
	readonly kind: 'enter';
	readonly entwined: NodeEntwined;
	readonly relations: { get pair(): NodeExitNMEvent }; // getter: frozen-emit constraint
} & NMEvent

type NodeExitNMEvent = {
	readonly phase: 'parse:ast';
	readonly category: 'node';
	readonly kind: 'exit';
	readonly entwined: NodeEntwined;
	readonly relations: { get pair(): NodeEnterNMEvent }; // getter: frozen-emit constraint
} & NMEvent

type NodeNMEvent = NodeEnterNMEvent | NodeExitNMEvent;

// ─── Creation events ──────────────────────────────────────────────────────────

type ScopePushNMEvent = {
	readonly phase: 'creation';
	readonly category: 'scope';
	readonly kind: 'push';
	readonly entwined: { readonly scope: ScopeEntwined };
} & NMEvent

type BindingDeclareNMEvent = {
	readonly phase: 'creation';
	readonly category: 'binding';
	readonly kind: 'declare';
	readonly entwined: { readonly binding: ScriptBindingEntwined };
} & NMEvent

/** Creation-phase scope events (push only during creation). */
type ScopeNMEvent = ScopePushNMEvent;
/** Creation-phase binding events (declare only during creation). */
type BindingNMEvent = BindingDeclareNMEvent;

// ─── Evaluate-side events ─────────────────────────────────────────────────────
//
// Payload shapes carried over from the current contract. The .entwined type is
// NodeEntwined | null as a placeholder — concrete per-kind entwinement shapes
// are deferred to the evaluate-side factory DDD session.

type ScopePopReason = 'normal' | 'break' | 'continue' | 'error' | 'limit';

type RuntimeScopeNMEvent = {
	readonly phase: 'evaluation';
	readonly category: 'scope';
	readonly kind: 'push' | 'pop';
	readonly entwined: { readonly scope: ScopeEntwined } | null; // TBD per eval DDD
	readonly reason?: ScopePopReason; // required on 'pop'
} & NMEvent

type RuntimeBindingNMEvent = {
	readonly phase: 'evaluation';
	readonly category: 'binding';
	readonly kind: 'declare' | 'initialize' | 'access' | 'update';
	readonly entwined: NodeEntwined | null; // TBD per eval DDD
	readonly bindingName: string;
	readonly priorValue?: unknown;
	readonly nextValue?: unknown;
} & NMEvent

type ScriptNMEvent = {
	readonly phase: 'evaluation';
	readonly category: 'script';
	readonly kind: 'enter' | 'exit';
	readonly entwined: NodeEntwined | null;
	readonly reason?: ScopePopReason; // present on 'exit'
} & NMEvent

type ScopeChainStep = {
	readonly scope: ScopeEntwined;
	readonly hit: boolean;
}

type ProtoChainStep = {
	readonly object: unknown;
	readonly hit: boolean;
}

type ExpressionNMEvent = {
	readonly phase: 'evaluation';
	readonly category: 'expression';
	readonly kind:
		| 'literal'
		| 'identifier'
		| 'property'
		| 'operator'
		| 'call'
		| 'template'
		| 'update';
	readonly entwined: NodeEntwined | null;
	readonly result: unknown;
	/** For postfix update: the OLD value returned (per ECMA-262 §13.4.3). */
	readonly returnedValue?: unknown;
} & NMEvent

/**
 * The bridge between visual-syntax and behind-the-scenes levels.
 * scopeChainWalk and protoChainWalk make the chain-walk observable — the
 * "two chains, same shape" insight is unreachable without these.
 */
type ResolveNMEvent = {
	readonly phase: 'evaluation';
	readonly category: 'resolve';
	readonly kind:
		| 'identifier'
		| 'member'
		| 'literal'
		| 'operator'
		| 'shortCircuit'
		| 'conditional'
		| 'assignment'
		| 'increment'
		| 'call'
		| 'template';
	readonly entwined: NodeEntwined | null;
	readonly result: { readonly type: string; readonly value: unknown };
	readonly scopeChainWalk?: ReadonlyArray<ScopeChainStep>;
	readonly protoChainWalk?: ReadonlyArray<ProtoChainStep>;
} & NMEvent

/**
 * Coercion as a first-class event category. ECMA-spec-aligned:
 * ToPrimitive, ToString, ToNumeric, ToBoolean.
 *
 * `+` operator emits THREE coercion clusters in spec order (§13.15.3):
 *   ToPrimitive(lval, 'default') → ToPrimitive(rval, 'default')
 *   → ToString×2 (if either result is string) → ToNumeric×2 (otherwise).
 * Operator event fires after coercions complete.
 */
type CoerceNMEvent = {
	readonly phase: 'evaluation';
	readonly category: 'coerce';
	readonly kind: 'ToPrimitive' | 'ToString' | 'ToNumeric' | 'ToBoolean';
	readonly entwined: NodeEntwined | null;
	readonly hint?: 'default' | 'string' | 'number';
	readonly from: { readonly type: string; readonly value: unknown };
	readonly to: { readonly type: string; readonly value: unknown };
} & NMEvent

type StatementNMEvent = {
	readonly phase: 'evaluation';
	readonly category: 'statement';
	readonly kind: 'enter' | 'exit';
	readonly entwined: NodeEntwined | null;
	readonly reason?: ScopePopReason;
} & NMEvent

type ControlFlowNMEvent = {
	readonly phase: 'evaluation';
	readonly category: 'control-flow';
	readonly kind:
		| 'conditional-test'
		| 'branch-entry'
		| 'loop-iter-start'
		| 'loop-iter-end'
		| 'loop-exit'
		| 'break'
		| 'continue';
	readonly entwined: NodeEntwined | null;
} & NMEvent

type InitializationNMEvent = {
	readonly phase: 'evaluation';
	readonly category: 'initialization';
	readonly kind: 'binding';
	readonly entwined: NodeEntwined | null;
	readonly bindingName: string;
	readonly value: unknown;
} & NMEvent

type ForInitNMEvent = {
	readonly phase: 'evaluation';
	readonly category: 'for-init';
	readonly kind: 'init';
	readonly entwined: NodeEntwined | null;
} & NMEvent

type WriteNMEvent = {
	readonly phase: 'evaluation';
	readonly category: 'write';
	readonly kind: 'assignment';
	readonly entwined: NodeEntwined | null;
	readonly bindingName: string;
	readonly priorValue: unknown;
	readonly nextValue: unknown;
} & NMEvent

type EmitNMEvent = {
	readonly phase: 'evaluation';
	readonly category: 'emit';
	readonly kind: 'console' | 'alert' | 'confirm' | 'prompt';
	readonly entwined: NodeEntwined | null;
	readonly method?: string; // for console.*: 'log', 'warn', etc.
	readonly args: ReadonlyArray<unknown>;
	readonly returnValue?: unknown; // for confirm/prompt
} & NMEvent

type ErrorNMEvent = {
	readonly phase: 'evaluation';
	readonly category: 'error';
	readonly kind: 'ReferenceError' | 'TypeError' | 'RangeError' | 'SyntaxError';
	readonly entwined: NodeEntwined | null;
	readonly errorName: string;
	readonly message: string;
} & NMEvent

/** The flat NMEvent discriminated union. */
type AnyNMEvent =
	| RealmNMEvent
	| TokenNMEvent
	| CommentNMEvent
	| NodeNMEvent
	| ScopeNMEvent
	| BindingNMEvent
	| RuntimeScopeNMEvent
	| RuntimeBindingNMEvent
	| ScriptNMEvent
	| ExpressionNMEvent
	| ResolveNMEvent
	| CoerceNMEvent
	| StatementNMEvent
	| ControlFlowNMEvent
	| InitializationNMEvent
	| ForInitNMEvent
	| WriteNMEvent
	| EmitNMEvent
	| ErrorNMEvent;

// ─── Tier filter whitelists ───────────────────────────────────────────────────

/** Tiers are filter predicates over the flat AnyNMEvent universe — NOT type-narrowed subsets. */
type TierName =
	| 'run'
	| 'intercept'
	| 'trace.variables'
	| 'trace.syntax'
	| 'trace.semantics';

type TierFilters = {
	readonly run: ReadonlyArray<EventCategory>; // [] — no events
	readonly intercept: ReadonlyArray<EventCategory>; // emit, error
	readonly 'trace.variables': ReadonlyArray<EventCategory>; // intercept + binding (values)
	readonly 'trace.syntax': ReadonlyArray<EventCategory>; // intercept + script, scope, statement, control-flow, write, initialization, for-init
	readonly 'trace.semantics': ReadonlyArray<EventCategory>; // syntax + expression, resolve, coerce, binding (full universe)
}

// ═════════════════════════════════════════════════════════════════════════════
// 10. EVALUATE-SIDE INFRASTRUCTURE
// ═════════════════════════════════════════════════════════════════════════════

type EvaluateOptions = {
	readonly seconds?: number;
	readonly iterations?: number;
	readonly io?: IoMocks;
}

type IoMocks = {
	readonly alert?: (message: string) => void;
	readonly confirm?: (message: string) => boolean;
	readonly prompt?: (message: string, defaultValue?: string) => string | null;
	readonly console?: Partial<Record<string, (...arguments_: readonly unknown[]) => void>>;
}

/** Async iterable + .result Promise for live-streamed evaluate tiers. */
type EvaluateHandle = {
	readonly result: Promise<RunInstance>;
	readonly cancel: () => void;
} & AsyncIterable<AnyNMEvent>

type EndReport = {
	readonly ok: boolean;
	readonly error: EmbodyError | null;
	readonly outcome:
		| 'completed'
		| 'errored'
		| 'timed-out'
		| 'cancelled'
		| 'limit-exceeded'
		| 'not-runnable';
}

type RunMetrics = {
	readonly steps: number;
	readonly durationMs: number;
	readonly iterationCount: number;
}

/**
 * The frozen output of one evaluate.* call. Events reference the static parse
 * graph by identity (no per-run clone). Runtime errors are NOT embodied in the
 * static Snippet — they're per-call outcomes on RunInstance.endReport.
 */
type RunInstance = {
	readonly events: ReadonlyArray<AnyNMEvent>;
	readonly endReport: EndReport;
	readonly finalEnvironment: ScopeEntwined;
	readonly runMetrics: RunMetrics;
	readonly snippet: Snippet;
}

// ═════════════════════════════════════════════════════════════════════════════
// 11. STATIC ANALYSES
// ═════════════════════════════════════════════════════════════════════════════

/** Source location of a single let/const declaration. */
type BindingDeclaration = {
	readonly name: string;
	readonly kind: 'let' | 'const';
	readonly scope: 'script' | 'block' | 'for-iteration';
	readonly nodePath: NodePath;
	readonly loc: SourceLocation;
}

/** Realm-level names referenced by the snippet (alias-resolved). */
type DependencyReference = {
	readonly name: string;
	readonly callsites: ReadonlyArray<{
		readonly nodePath: NodePath;
		readonly loc: SourceLocation;
	}>;
}

/** Boolean record of language-feature usage. Drives curriculum-aware lens selection. */
type Features = {
	readonly usesShortCircuit: boolean; // && || ??
	readonly usesOptionalChaining: boolean;
	readonly usesCoercionPlus: boolean; // any `+` with mixed/string operands
	readonly usesIncrementOp: boolean;
	readonly usesForOf: boolean;
	readonly usesTemplateLiteral: boolean;
	readonly usesTernary: boolean;
	readonly usesIn: boolean;
	readonly usesTypeof: boolean;
	readonly usesRegex: boolean;
	readonly usesBigInt: boolean;
	readonly usesNewDate: boolean;
}

/** Min/max/mean/median over a sample. */
type Distribution = {
	readonly min: number;
	readonly max: number;
	readonly mean: number;
	readonly median: number;
	readonly samples: ReadonlyArray<number>;
}

type Metrics = {
	readonly source: { readonly chars: number; readonly lines: number };
	readonly tokens: number;
	readonly nodes: number;
	readonly comments: number;
	readonly statements: number;
	readonly expressions: number;

	readonly blockLengths: Distribution; // statements per block
	readonly lineLengths: Distribution; // chars per line
	readonly expressionLengths: Distribution; // operators + operands per expression
	readonly statementLengths: Distribution; // chars per statement

	readonly loops: number;
	readonly branches: number;
	readonly bindings: {
		readonly script: number;
		readonly block: number;
		readonly total: number;
	};
	readonly maxNestingDepth: number;
}

type ControlFlow = {
	readonly branches: ReadonlyArray<{
		readonly nodePath: NodePath;
		readonly kind: 'if' | 'ternary';
		readonly loc: SourceLocation;
	}>;
	readonly breaks: ReadonlyArray<{
		readonly nodePath: NodePath;
		readonly loc: SourceLocation;
	}>;
	readonly continues: ReadonlyArray<{
		readonly nodePath: NodePath;
		readonly loc: SourceLocation;
	}>;
}

type NonDeterminism = {
	readonly random: boolean; // Math.random()
	readonly clock: boolean; // Date.now(), new Date()
	readonly userInput: boolean; // prompt, confirm
	readonly locale: boolean; // toLocale*, Date.parse, localeCompare
}

type HasIo = {
	readonly user: {
		readonly total: number;
		readonly alert?: number;
		readonly confirm?: number;
		readonly prompt?: number;
	};
	readonly dev: {
		readonly total: number;
		readonly log?: number;
		readonly debug?: number;
		readonly info?: number;
		readonly warn?: number;
		readonly error?: number;
		readonly trace?: number;
		readonly dir?: number;
		readonly dirxml?: number;
		readonly group?: number;
		readonly groupCollapsed?: number;
		readonly groupEnd?: number;
		readonly table?: number;
		readonly time?: number;
		readonly timeEnd?: number;
		readonly timeLog?: number;
		readonly count?: number;
		readonly countReset?: number;
		readonly assert?: number;
		readonly clear?: number;
	};
	readonly total: number;
}

/**
 * Cross-phase derived analyses. Present from validate-fail onward (when
 * status.parsed === true). Replaces the old StaticAnalyses — realm and
 * initialScope are now accessible via snippet.realm.* (phase-based access).
 */
type Analysis = {
	readonly bindings: ReadonlyArray<BindingDeclaration>;
	readonly dependencies: ReadonlyArray<DependencyReference>;
	readonly features: Features;
	readonly metrics: Metrics;
	readonly controlFlow: ControlFlow;
	readonly nonDeterminism: NonDeterminism;
	readonly hasIo: HasIo;
}

// ═════════════════════════════════════════════════════════════════════════════
// 12. VALIDATION
// ═════════════════════════════════════════════════════════════════════════════

// `Violation` is imported from `./lib/validating/types.js` (the
// validating pipeline owns the canonical shape: nodeType / message /
// severity / location / nodePath). `Validation.violations` below uses
// it; the PUBLIC EXPORTS block re-exports it.

/**
 * Output of the validate gate. `isJeJ` is the gate criterion.
 * `isDeterministic` and `doesPause` are informational metadata — not gate
 * criteria. A non-deterministic or pausing program is still valid JEJ.
 *
 * Derivation invariants (implementations MUST honor; not type-enforceable):
 *   isJeJ            === violations.length === 0
 *   isDeterministic  === !(nonDeterminism.random || .clock || .userInput || .locale)
 *   doesPause        === hasIo.user.total > 0
 */
type Validation = {
	readonly isJeJ: boolean;
	readonly isDeterministic: boolean; // metadata, not gate
	readonly doesPause: boolean; // metadata, not gate
	readonly formatted: boolean;
	readonly violations: ReadonlyArray<Violation>;
}

// ═════════════════════════════════════════════════════════════════════════════
// 13. ERRORS & STATUS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Phase values for EmbodyError. Does NOT include 'realm' (realm never fails).
 * Includes 'validation' as a gate phase (not an NM lifecycle phase).
 * Renamed from old contract: 'validate' → 'validation', 'create' → 'creation',
 * 'evaluate' → 'evaluation'.
 */
type EmbodyPhase =
	| 'parse:tokenize'
	| 'parse:ast'
	| 'validation'
	| 'creation'
	| 'evaluation';

type EmbodyError = {
	readonly phase: EmbodyPhase;
	readonly kind: string;
	readonly message: string;
	readonly loc: SourceLocation | null;
	readonly cause?: unknown;
}

type Status = {
	readonly tokenized: boolean;
	readonly parsed: boolean;
	readonly validated: boolean;
	readonly created: boolean;
}

// ═════════════════════════════════════════════════════════════════════════════
// 14. SNIPPET — top-level type
//
// embody(code) returns a Snippet. Hard-gated staircase:
//
//   tokenize-fail:  realm + evaluation present; tokenize/parseAST/creation null
//   parse-fail:     + tokenize present; parseAST/creation null
//   validate-fail:  + parseAST present; creation null; analysis + validation present
//   create-fail:    + analysis + validation present; creation null
//   apex:           all phases present
//
// Realm always passes (precedes tokenize; no failure mode in the NM).
// Evaluation always present (events always callable; may yield nothing).
// Analysis and validation are null until the validate stage runs (requires parsed).
//
// Only the .events axis has layer-first access (snippet.events.*).
// .data and .entwined are phase-first only (snippet.<phase>.data/entwined).
// ═════════════════════════════════════════════════════════════════════════════

type Snippet = {
	// ── cross-phase flat (not on the phase×layer grid) ──
	readonly source: Source;
	readonly status: Status;
	readonly errors: EmbodyError | null;
	readonly analysis: Analysis | null; // null before validate stage runs (requires parsed)
	readonly validation: Validation | null; // null before validate stage runs (requires parsed)
	readonly raw: RawAcorn;

	// ── phase-first access ──
	readonly realm: RealmPhase; // always present
	readonly tokenize: TokenizePhase | null; // null when !status.tokenized
	readonly parseAST: ParseASTPhase | null; // null when !status.parsed
	readonly creation: CreationPhase | null; // null when !status.created
	readonly evaluation: EvaluationPhase; // always present; no .data or .entwined

	// ── layer-first events access (only .events has this axis) ──
	readonly events: EventsView;
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

export type {
	// source
	NodePath,
	SourcePosition,
	SourceLocation,
	Source,

	// raw acorn provenance
	RawAcorn,

	// L1 — data types (per-entity)
	TokenData,
	CommentData,
	NodeData,
	ScopeData,
	BindingData,
	RealmBindingData,
	ScriptBindingData,
	BindingStatus,

	// L2 — entwined types (per-entity)
	TokenEntwined,
	CommentEntwined,
	NodeEntwined,
	ScopeEntwined,
	ScopeTreeNode,
	DeclarationInfo,
	RealmBindingEntwined,
	ScriptBindingEntwined,
	Binding,
	BindingLookup,
	BindingState,

	// phase-level data aggregates
	RealmData,
	TokenizeData,
	ParseASTData,
	CreationData,

	// phase-level entwined aggregates
	RealmEntwined,
	TokenizeEntwined,
	ParseASTEntwined,
	CreationEntwined,

	// phase interfaces
	RealmPhase,
	TokenizePhase,
	ParseASTPhase,
	CreationPhase,
	EvaluationPhase,

	// events view
	EventsView,
	EvaluationEvents,

	// NM events — base
	NMEventPhase,
	EventCategory,
	NMEvent,

	// NM events — realm
	IntrinsicsCreatedNMEvent,
	HostCreatedNMEvent,
	RealmNMEvent,

	// NM events — tokenize
	TokenNMEvent,
	CommentNMEvent,

	// NM events — parseAST
	NodeEnterNMEvent,
	NodeExitNMEvent,
	NodeNMEvent,

	// NM events — creation
	ScopePushNMEvent,
	BindingDeclareNMEvent,
	ScopeNMEvent,
	BindingNMEvent,

	// NM events — evaluation
	ScopePopReason,
	RuntimeScopeNMEvent,
	RuntimeBindingNMEvent,
	ScriptNMEvent,
	ScopeChainStep,
	ProtoChainStep,
	ExpressionNMEvent,
	ResolveNMEvent,
	CoerceNMEvent,
	StatementNMEvent,
	ControlFlowNMEvent,
	InitializationNMEvent,
	ForInitNMEvent,
	WriteNMEvent,
	EmitNMEvent,
	ErrorNMEvent,
	AnyNMEvent,

	// tiers
	TierName,
	TierFilters,

	// evaluate infrastructure
	EvaluateOptions,
	IoMocks,
	EvaluateHandle,
	EndReport,
	RunMetrics,
	RunInstance,

	// analyses
	BindingDeclaration,
	DependencyReference,
	Features,
	Distribution,
	Metrics,
	ControlFlow,
	NonDeterminism,
	HasIo,
	Analysis,

	// validation
	
	Validation,

	// errors & status
	EmbodyPhase,
	EmbodyError,
	Status,

	// top-level
	Snippet,
};

export {type Violation} from './lib/validating/types.js';