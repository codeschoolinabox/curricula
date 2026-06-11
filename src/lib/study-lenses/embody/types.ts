// ─────────────────────────────────────────────────────────────────────────────
// JEJ embody — canonical types
//
// Represents a JavaScript snippet through its ECMAScript-aligned lifecycle,
// branched by source type (SnippetType):
//   module (default): realm → parse(tokenize → AST) → creation(script-scope) → evaluation
//   script:           tokenize → parse (JS-generic core only; no language level)
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
//   ../embody/language-levels/just-enough-javascript/notional-machine.md — prose model and spec correspondence
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

interface SourcePosition {
	readonly line: number; // 1-based
	readonly column: number; // 0-based
}

interface SourceLocation {
	readonly start: SourcePosition;
	readonly end: SourcePosition;
}

/** The source string + a precomputed line-offsets index for O(1) loc lookup. */
interface Source {
	readonly code: string;
	/** offsets[n] = char offset of the first char of line n+1; offsets[0] === 0. */
	readonly offsets: ReadonlyArray<number>;
}

/**
 * The snippet's program-type posture — the second axis of `embody`'s input,
 * carried on `Snippet.type`. Selects the spec parse goal (acorn `sourceType`)
 * and the execution semantics at run. `'module'` (the default) is the
 * NM-study posture: the language level's admission gate can run. `'script'`
 * is the validator-free posture: no language level is active and every
 * language-level phase on the Snippet (realm, creation, evaluation's NM
 * tiers) is null or gated off.
 */
type SnippetType = 'script' | 'module';

/**
 * Options for `embody(code, options?)`. `type` defaults to `'module'`.
 *
 * On the scenario-dispatch branch the option is ignored — scenarios are
 * canned module-shape fixtures (see ./README.md § Named scenarios).
 */
interface EmbodyOptions {
	readonly type?: SnippetType;
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. RAW ACORN PROVENANCE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Flat Acorn output verbatim. Lives on snippet.raw. Fields are null until the
 * corresponding gate passes: tokens after tokenize, ast + comments after parse.
 */
interface RawAcorn {
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
interface TokenData {}

/** @todo fields locked in lib/parse/ DDD — pure comment data (kind, range, text) */
interface CommentData {}

/** @todo fields locked in lib/parse/ DDD — pure AST node data (type, loc, acorn fields) */
interface NodeData {}

/** Pure scope identity data — no cross-references. */
interface ScopeData {
	readonly kind: 'intrinsics' | 'host' | 'script' | 'block' | 'for-iteration';
	/** Isolated data for each binding in this scope (no cross-refs). */
	readonly bindings: Readonly<Record<string, BindingData>>;
}

type BindingData = RealmBindingData | ScriptBindingData;

/** Pure data for a realm-level (intrinsic or host) binding. */
interface RealmBindingData {
	readonly category: 'intrinsic' | 'host';
	readonly name: string;
	readonly valueCategory: 'object-register' | 'function' | 'constant';
	readonly value: unknown;
}

/** Pure data for a script/block/for-iteration binding. */
interface ScriptBindingData {
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

interface TokenEntwined {
	readonly data: TokenData;
	readonly innermostNode: NodeEntwined | null;
	readonly innermostPath: NodePath | null;
	readonly prevToken: TokenEntwined | null;
	readonly nextToken: TokenEntwined | null;
	/** Whitespace/gap in source between prevToken.end and this token's start. */
	readonly leadingGap: string | null;
}

interface CommentEntwined {
	readonly data: CommentData;
	readonly innermostNode: NodeEntwined | null;
	readonly innermostPath: NodePath | null;
	readonly prevToken: TokenEntwined | null;
	readonly nextToken: TokenEntwined | null;
}

interface NodeEntwined {
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

interface ScopeEntwined {
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

interface ScopeTreeNode {
	readonly kind: 'block' | 'for-iteration';
	readonly astNode: NodeEntwined;
	readonly declaredBindings: ReadonlyArray<DeclarationInfo>;
	readonly parent: ScopeEntwined | ScopeTreeNode;
	readonly children: ReadonlyArray<ScopeTreeNode>;
}

interface DeclarationInfo {
	readonly name: string;
	readonly kind: 'let' | 'const';
	readonly declarationNode: NodeEntwined;
}

interface RealmBindingEntwined {
	readonly data: RealmBindingData;
	readonly scope: ScopeEntwined; // containing intrinsics or host scope
}

interface ScriptBindingEntwined {
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
interface BindingLookup {
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
interface RealmData {}

/** @todo fields locked in lib/parse/ DDD — tokens: ReadonlyArray<TokenData>; comments: ReadonlyArray<CommentData> */
interface TokenizeData {}

/** @todo fields locked in lib/parse/ DDD — root: NodeData (tree root) */
interface ParseASTData {}

/** @todo fields locked in lib/scope/ DDD — scope data forest + script binding data records */
interface CreationData {}

// ═════════════════════════════════════════════════════════════════════════════
// 6. PHASE-LEVEL ENTWINED AGGREGATES (L2 per phase)
//
// Returned by snippet.<phase>.entwined. Placeholder interfaces — fields locked
// in their respective factory DDD sessions.
// ═════════════════════════════════════════════════════════════════════════════

/** @todo fields locked in lib/scope/ DDD — intrinsics ScopeEntwined + host ScopeEntwined + RealmBindingEntwined records */
interface RealmEntwined {}

/** @todo fields locked in lib/parse/ DDD — tokens: ReadonlyArray<TokenEntwined>; comments: ReadonlyArray<CommentEntwined> */
interface TokenizeEntwined {}

/**
 * @todo `root: NodeEntwined` — locked in lib/parse/ DDD (NOT this round).
 *
 * `byPath`/`byOffset` are contract-locked here; the lib/parse/ entwine pass
 * BUILDS them (single walk, same frozen node refs as the tree — no copy).
 * Both are canonical, domain-general entry-points into the ref-graph; lenses
 * still build their own pedagogy-specific groupings (out of scope here).
 */
interface ParseASTEntwined {
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
interface CreationEntwined {}

// ═════════════════════════════════════════════════════════════════════════════
// 7. PHASE INTERFACES
//
// One object per spec-grounded lifecycle phase. Phase objects on Snippet are
// nullable (null when the corresponding status gate didn't complete), except
// evaluation which is always present. Realm — a language-level model — is
// additionally null when no language level is active (script type).
// ═════════════════════════════════════════════════════════════════════════════

interface RealmPhase {
	readonly data: RealmData;
	readonly entwined: RealmEntwined;
	readonly events: () => Generator<RealmNMEvent>;
}

interface TokenizePhase {
	readonly data: TokenizeData;
	readonly entwined: TokenizeEntwined;
	readonly events: () => Generator<TokenNMEvent | CommentNMEvent>;
}

interface ParseASTPhase {
	readonly data: ParseASTData;
	readonly entwined: ParseASTEntwined;
	readonly events: () => Generator<NodeNMEvent>;
}

interface CreationPhase {
	readonly data: CreationData;
	readonly entwined: CreationEntwined;
	readonly events: () => Generator<ScopeNMEvent | BindingNMEvent>;
}

/** Evaluation has no static .data or .entwined — evaluation is fully dynamic. */
interface EvaluationPhase {
	readonly events: EvaluationEvents;
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. EVENTS VIEW + EVALUATION EVENTS
//
// EventsView is the only layer-first axis on Snippet (snippet.events.*).
// All stream functions are always safe — null/absent phases yield empty
// generators, never throw (including realm under script type).
// ═════════════════════════════════════════════════════════════════════════════

interface EventsView {
	readonly realm: () => Generator<RealmNMEvent>;
	readonly tokenize: () => Generator<TokenNMEvent | CommentNMEvent>;
	readonly parseAST: () => Generator<NodeNMEvent>;
	readonly creation: () => Generator<ScopeNMEvent | BindingNMEvent>;
	readonly evaluation: EvaluationEvents;
}

interface EvaluationEvents {
	readonly run: (opts?: EvaluateOptions) => Promise<RunInstance>;
	readonly intercept: (opts?: EvaluateOptions) => EvaluateHandle;
	readonly trace: {
		readonly variables: (opts?: EvaluateOptions) => EvaluateHandle;
		readonly syntax: (opts?: EvaluateOptions) => EvaluateHandle;
		readonly semantics: (opts?: EvaluateOptions) => EvaluateHandle;
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

interface NMEvent {
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

interface IntrinsicsCreatedNMEvent extends NMEvent {
	readonly phase: 'realm';
	readonly category: 'realm';
	readonly kind: 'intrinsics-created';
	readonly entwined: {
		readonly scope: ScopeEntwined;
		readonly bindings: Readonly<Record<string, RealmBindingEntwined>>;
	};
}

interface HostCreatedNMEvent extends NMEvent {
	readonly phase: 'realm';
	readonly category: 'realm';
	readonly kind: 'host-created';
	readonly entwined: {
		readonly scope: ScopeEntwined;
		readonly bindings: Readonly<Record<string, RealmBindingEntwined>>;
	};
}

type RealmNMEvent = IntrinsicsCreatedNMEvent | HostCreatedNMEvent;

// ─── Tokenize events ──────────────────────────────────────────────────────────

interface TokenNMEvent extends NMEvent {
	readonly phase: 'parse:tokenize';
	readonly category: 'token';
	readonly kind: 'token';
	readonly entwined: TokenEntwined;
}

interface CommentNMEvent extends NMEvent {
	readonly phase: 'parse:tokenize';
	readonly category: 'comment';
	readonly kind: 'line' | 'block';
	readonly entwined: CommentEntwined;
}

// ─── ParseAST events ──────────────────────────────────────────────────────────

interface NodeEnterNMEvent extends NMEvent {
	readonly phase: 'parse:ast';
	readonly category: 'node';
	readonly kind: 'enter';
	readonly entwined: NodeEntwined;
	readonly relations: { get pair(): NodeExitNMEvent }; // getter: frozen-emit constraint
}

interface NodeExitNMEvent extends NMEvent {
	readonly phase: 'parse:ast';
	readonly category: 'node';
	readonly kind: 'exit';
	readonly entwined: NodeEntwined;
	readonly relations: { get pair(): NodeEnterNMEvent }; // getter: frozen-emit constraint
}

type NodeNMEvent = NodeEnterNMEvent | NodeExitNMEvent;

// ─── Creation events ──────────────────────────────────────────────────────────

interface ScopePushNMEvent extends NMEvent {
	readonly phase: 'creation';
	readonly category: 'scope';
	readonly kind: 'push';
	readonly entwined: { readonly scope: ScopeEntwined };
}

interface BindingDeclareNMEvent extends NMEvent {
	readonly phase: 'creation';
	readonly category: 'binding';
	readonly kind: 'declare';
	readonly entwined: { readonly binding: ScriptBindingEntwined };
}

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

interface RuntimeScopeNMEvent extends NMEvent {
	readonly phase: 'evaluation';
	readonly category: 'scope';
	readonly kind: 'push' | 'pop';
	readonly entwined: { readonly scope: ScopeEntwined } | null; // TBD per eval DDD
	readonly reason?: ScopePopReason; // required on 'pop'
}

interface RuntimeBindingNMEvent extends NMEvent {
	readonly phase: 'evaluation';
	readonly category: 'binding';
	readonly kind: 'declare' | 'initialize' | 'access' | 'update';
	readonly entwined: NodeEntwined | null; // TBD per eval DDD
	readonly bindingName: string;
	readonly priorValue?: unknown;
	readonly nextValue?: unknown;
}

interface ScriptNMEvent extends NMEvent {
	readonly phase: 'evaluation';
	readonly category: 'script';
	readonly kind: 'enter' | 'exit';
	readonly entwined: NodeEntwined | null;
	readonly reason?: ScopePopReason; // present on 'exit'
}

interface ScopeChainStep {
	readonly scope: ScopeEntwined;
	readonly hit: boolean;
}

interface ProtoChainStep {
	readonly object: unknown;
	readonly hit: boolean;
}

interface ExpressionNMEvent extends NMEvent {
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
}

/**
 * The bridge between visual-syntax and behind-the-scenes levels.
 * scopeChainWalk and protoChainWalk make the chain-walk observable — the
 * "two chains, same shape" insight is unreachable without these.
 */
interface ResolveNMEvent extends NMEvent {
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
}

/**
 * Coercion as a first-class event category. ECMA-spec-aligned:
 * ToPrimitive, ToString, ToNumeric, ToBoolean.
 *
 * `+` operator emits THREE coercion clusters in spec order (§13.15.3):
 *   ToPrimitive(lval, 'default') → ToPrimitive(rval, 'default')
 *   → ToString×2 (if either result is string) → ToNumeric×2 (otherwise).
 * Operator event fires after coercions complete.
 */
interface CoerceNMEvent extends NMEvent {
	readonly phase: 'evaluation';
	readonly category: 'coerce';
	readonly kind: 'ToPrimitive' | 'ToString' | 'ToNumeric' | 'ToBoolean';
	readonly entwined: NodeEntwined | null;
	readonly hint?: 'default' | 'string' | 'number';
	readonly from: { readonly type: string; readonly value: unknown };
	readonly to: { readonly type: string; readonly value: unknown };
}

interface StatementNMEvent extends NMEvent {
	readonly phase: 'evaluation';
	readonly category: 'statement';
	readonly kind: 'enter' | 'exit';
	readonly entwined: NodeEntwined | null;
	readonly reason?: ScopePopReason;
}

interface ControlFlowNMEvent extends NMEvent {
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
}

interface InitializationNMEvent extends NMEvent {
	readonly phase: 'evaluation';
	readonly category: 'initialization';
	readonly kind: 'binding';
	readonly entwined: NodeEntwined | null;
	readonly bindingName: string;
	readonly value: unknown;
}

interface ForInitNMEvent extends NMEvent {
	readonly phase: 'evaluation';
	readonly category: 'for-init';
	readonly kind: 'init';
	readonly entwined: NodeEntwined | null;
}

interface WriteNMEvent extends NMEvent {
	readonly phase: 'evaluation';
	readonly category: 'write';
	readonly kind: 'assignment';
	readonly entwined: NodeEntwined | null;
	readonly bindingName: string;
	readonly priorValue: unknown;
	readonly nextValue: unknown;
}

interface EmitNMEvent extends NMEvent {
	readonly phase: 'evaluation';
	readonly category: 'emit';
	readonly kind: 'console' | 'alert' | 'confirm' | 'prompt';
	readonly entwined: NodeEntwined | null;
	readonly method?: string; // for console.*: 'log', 'warn', etc.
	readonly args: ReadonlyArray<unknown>;
	readonly returnValue?: unknown; // for confirm/prompt
}

interface ErrorNMEvent extends NMEvent {
	readonly phase: 'evaluation';
	readonly category: 'error';
	/**
	 * Coarse lens-facing discriminator. INVARIANT: `kind === 'Error'` iff
	 * `errorName` is not one of the four named kinds; `errorName` carries
	 * the engine-classified error name (the constructor name for Error
	 * instances; engine-classified for non-Error throws like
	 * `throw 'oops'`) and equals `kind` for the named four. Engine-level
	 * failures (timeout, worker crash, io-mock throw) are NEVER error
	 * events — they surface only on `EndReport.error`.
	 */
	readonly kind:
		| 'ReferenceError'
		| 'TypeError'
		| 'RangeError'
		| 'SyntaxError'
		| 'Error';
	readonly entwined: NodeEntwined | null;
	readonly errorName: string;
	readonly message: string;
}

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

interface TierFilters {
	readonly run: ReadonlyArray<EventCategory>; // [] — no events
	readonly intercept: ReadonlyArray<EventCategory>; // emit, error
	readonly 'trace.variables': ReadonlyArray<EventCategory>; // intercept + binding (values)
	readonly 'trace.syntax': ReadonlyArray<EventCategory>; // intercept + script, scope, statement, control-flow, write, initialization, for-init
	readonly 'trace.semantics': ReadonlyArray<EventCategory>; // syntax + expression, resolve, coerce, binding (full universe)
}

// ═════════════════════════════════════════════════════════════════════════════
// 10. EVALUATE-SIDE INFRASTRUCTURE
// ═════════════════════════════════════════════════════════════════════════════

interface EvaluateOptions {
	readonly seconds?: number;
	readonly iterations?: number;
	readonly io?: IoMocks;
}

/**
 * Per-hook IO mocks. Every mock is awaited by the engine — learner code
 * holds until the callback settles (sync returns are valid and cost one
 * microtask; async returns let styled dialogs and slow consumers finish
 * without the learner's script noticing).
 *
 * WHY both return shapes: embody's earlier sync-only signatures were a
 * drift from the intercept engine, which has always awaited async mocks.
 * This realigns the contract with the engine it specifies.
 */
interface IoMocks {
	readonly alert?: (message: string) => void | Promise<void>;
	readonly confirm?: (message: string) => boolean | Promise<boolean>;
	readonly prompt?: (
		message: string,
		defaultValue?: string,
	) => string | null | Promise<string | null>;
	readonly console?: Partial<
		Record<string, (...arguments_: unknown[]) => void | Promise<void>>
	>;
}

/**
 * Async iterable + .result Promise for live-streamed evaluate tiers.
 *
 * `result` resolves with THIS call's RunInstance. Identity-equality with
 * another call's RunInstance (e.g. the one `run()` resolves) is never a
 * contract guarantee — each evaluate call is a fresh run. (The canned
 * scenario stubs share one RunInstance; that is a stub coincidence, not
 * contract.)
 *
 * `cancel()` stops the run; `result` resolves with outcome `'cancelled'`.
 *
 * `fail(reason?)` is the consumer-driven STRUCTURED stop — for teaching
 * harnesses that must record WHY a run was stopped (e.g. a learner's
 * prediction was wrong). `result` resolves with outcome `'failed'` and
 * `endReport.failReason === reason` — the same reference, frozen in place
 * by the RunInstance deep-freeze (pass a clone if the original must stay
 * mutable). Unavailable on `run()`: a bare Promise offers no mid-stream
 * surface from which to decide a failure.
 *
 * Both stops are idempotent and first-write-wins — against each other,
 * timeout, runtime error, and the run's natural completion. A stop
 * requested after `result` settles is a no-op.
 */
interface EvaluateHandle extends AsyncIterable<AnyNMEvent> {
	readonly result: Promise<RunInstance>;
	readonly cancel: () => void;
	readonly fail: (reason?: unknown) => void;
}

/**
 * How one evaluate call ended. Three independent axes:
 *
 * - `ok` — did the program run to its natural end? `true` iff
 *   `outcome === 'completed'`.
 * - `error` — did the program or its enforcement misbehave? Non-null iff
 *   outcome is `'errored' | 'timed-out' | 'limit-exceeded'`.
 *   Consumer-driven stops (`'cancelled'`, `'failed'`) and the gate
 *   short-circuit (`'not-runnable'`, whose failure lives on
 *   `snippet.errors`) carry `error: null`.
 * - `outcome` — exhaustive classification of how the run ended.
 *
 * | outcome                              | ok    | error    |
 * | ------------------------------------ | ----- | -------- |
 * | completed                            | true  | null     |
 * | errored / timed-out / limit-exceeded | false | non-null |
 * | cancelled / failed / not-runnable    | false | null     |
 *
 * `failReason` is present iff `outcome === 'failed'`: the payload passed
 * to `EvaluateHandle.fail(reason)`, stored by reference and frozen in
 * place by the RunInstance deep-freeze. (Named `failReason`, not `reason`
 * — `reason` on scope/script/statement events is the `ScopePopReason`
 * enum; a different concept.)
 */
interface EndReport {
	readonly ok: boolean;
	readonly error: EmbodyError | null;
	readonly outcome:
		| 'completed'
		| 'errored'
		| 'timed-out'
		| 'cancelled'
		| 'failed'
		| 'limit-exceeded'
		| 'not-runnable';
	readonly failReason?: unknown;
}

interface RunMetrics {
	readonly steps: number;
	readonly durationMs: number;
	readonly iterationCount: number;
}

/**
 * The frozen output of one evaluate.* call. Events reference the static parse
 * graph by identity (no per-run clone). Runtime errors are NOT embodied in the
 * static Snippet — they're per-call outcomes on RunInstance.endReport.
 */
interface RunInstance {
	readonly events: ReadonlyArray<AnyNMEvent>;
	readonly endReport: EndReport;
	/**
	 * Null until a tier provides runtime scope tracking (trace.variables
	 * and up). As typed, ScopeEntwined is static — per DOCS § Static/
	 * runtime asymmetry, static entities never carry runtime values — so
	 * the eventual non-null shape is expected to be revisited in the
	 * trace.variables DDD. See DOCS § Open holes.
	 */
	readonly finalEnvironment: ScopeEntwined | null;
	readonly runMetrics: RunMetrics;
	readonly snippet: Snippet;
}

// ═════════════════════════════════════════════════════════════════════════════
// 11. STATIC ANALYSES
// ═════════════════════════════════════════════════════════════════════════════

/** Source location of a single let/const declaration. */
interface BindingDeclaration {
	readonly name: string;
	readonly kind: 'let' | 'const';
	readonly scope: 'script' | 'block' | 'for-iteration';
	readonly nodePath: NodePath;
	readonly loc: SourceLocation;
}

/** Realm-level names referenced by the snippet (alias-resolved). */
interface DependencyReference {
	readonly name: string;
	readonly callsites: ReadonlyArray<{
		readonly nodePath: NodePath;
		readonly loc: SourceLocation;
	}>;
}

/** Boolean record of language-feature usage. Drives curriculum-aware lens selection. */
interface Features {
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
interface Distribution {
	readonly min: number;
	readonly max: number;
	readonly mean: number;
	readonly median: number;
	readonly samples: ReadonlyArray<number>;
}

interface Metrics {
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

interface ControlFlow {
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

interface NonDeterminism {
	readonly random: boolean; // Math.random()
	readonly clock: boolean; // Date.now(), new Date()
	readonly userInput: boolean; // prompt, confirm
	readonly locale: boolean; // toLocale*, Date.parse, localeCompare
}

interface HasIo {
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
 * Cross-phase derived analyses. Present from validate-fail onward on
 * module-type snippets (the validate stage requires parsed AND a language
 * level); always null under script type. Replaces the old StaticAnalyses —
 * realm and initialScope are now accessible via snippet.realm.* (phase-based
 * access).
 */
interface Analysis {
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
 * Output of the validate gate — the language level's ADMISSION GATE. Runs iff
 * `type === 'module'` and the snippet parsed; `Snippet.validation` is always
 * null under script type. `isJeJ` is the gate criterion. `isDeterministic`
 * and `doesPause` are informational metadata — not gate criteria. A
 * non-deterministic or pausing program is still valid JEJ.
 *
 * Derivation invariants (implementations MUST honor; not type-enforceable):
 *   isJeJ            === violations.length === 0
 *   isDeterministic  === !(nonDeterminism.random || .clock || .userInput || .locale)
 *   doesPause        === hasIo.user.total > 0
 */
interface Validation {
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

interface EmbodyError {
	readonly phase: EmbodyPhase;
	readonly kind: string;
	readonly message: string;
	readonly loc: SourceLocation | null;
	readonly cause?: unknown;
}

/**
 * Hard-gate booleans, monotonic by construction (created ⇒ validated ⇒
 * parsed ⇒ tokenized). Under script type, `validated` and `created` are
 * STRUCTURALLY false — the admission gate never runs without a language
 * level (the script-parsed leaf) — not failed.
 */
interface Status {
	readonly tokenized: boolean;
	readonly parsed: boolean;
	readonly validated: boolean;
	readonly created: boolean;
}

// ═════════════════════════════════════════════════════════════════════════════
// 14. SNIPPET — top-level type
//
// embody(code, { type }) returns a Snippet. Hard-gated staircase, branched by
// source type.
//
// Module (the default): realm → tokenize → parse → validate → create
//   tokenize-fail:  realm + evaluation present; tokenize/parseAST/creation null
//   parse-fail:     + tokenize present; parseAST/creation null
//   validate-fail:  + parseAST present; creation null; analysis + validation present
//   create-fail:    + analysis + validation present; creation null
//   apex:           all phases present
//
// Script: tokenize → parse (JS-generic core only; no language level)
//   tokenize-fail / parse-fail: as above but realm null
//   script-parsed:  tokenize + parseAST + evaluation present; realm/creation
//                   null; analysis/validation null; validated/created
//                   structurally false (terminal — the script staircase is
//                   complete at parse)
//
// Realm is a language-level model: present on every module-type leaf (it
// precedes tokenize and never fails — no failure mode in the NM); null under
// script type, where no language level is active.
// Evaluation always present (events always callable; may yield nothing —
// runnability is tiered: plain run gates on parsed, NM tiers on created).
// Analysis and validation are null until the validate stage runs (module
// type + parsed) — and always null under script type.
//
// Only the .events axis has layer-first access (snippet.events.*).
// .data and .entwined are phase-first only (snippet.<phase>.data/entwined).
// ═════════════════════════════════════════════════════════════════════════════

interface Snippet {
	// ── cross-phase flat (not on the phase×layer grid) ──
	readonly type: SnippetType; // the source type this snippet was embodied as
	readonly source: Source;
	readonly status: Status;
	readonly errors: EmbodyError | null;
	readonly analysis: Analysis | null; // null before the validate stage runs (module + parsed); always null under script
	readonly validation: Validation | null; // null before the validate stage runs (module + parsed); always null under script
	readonly raw: RawAcorn;

	// ── phase-first access ──
	readonly realm: RealmPhase | null; // language-level model; null when no language level is active (script type)
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

	// input posture
	SnippetType,
	EmbodyOptions,

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
	Violation,
	Validation,

	// errors & status
	EmbodyPhase,
	EmbodyError,
	Status,

	// top-level
	Snippet,
};
