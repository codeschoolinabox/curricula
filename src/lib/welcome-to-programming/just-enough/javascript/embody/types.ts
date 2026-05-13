// ─────────────────────────────────────────────────────────────────────────────
// JEJ embody — canonical types
//
// Represents a JEJ snippet through its full ECMAScript-aligned lifecycle:
//   realm → parse(tokenize → AST) → creation(script-scope) → evaluation
//
// Two surfaces:
//   1. Static NM data — frozen, fully entwined, available immediately after
//      construction. Tokens, AST, comments, realm, script scope, derived
//      analyses, validation summary, errors.
//   2. Lifecycle event streams — a-la-carte generators per phase. Static-side
//      streams (realm, parse, create) iterate pre-computed frozen data.
//      Evaluate-side streams run a Worker live.
//
// All types are immutable. Generators are the only callable surface — there
// are no methods on any embody data structure. Composite structures use
// plain objects and arrays (never Maps/Sets at the public surface, since
// Object.freeze does not freeze them and pedagogy prefers ground-truth
// shapes).
//
// Companion documents:
//   - ../notional-machine.md — prose model and spec correspondence
//   - ./README.md — peer-front-door overview
//   - ./DOCS.md — architecture sketch + data flow + tradeoffs
//
// ─────────────────────────────────────────────────────────────────────────────

import type { Node as AcornNode } from 'acorn';

// ═════════════════════════════════════════════════════════════════════════════
// 1. SOURCE LOCATION PRIMITIVES
// ═════════════════════════════════════════════════════════════════════════════

/** A JSONPath string rooted at the Program node. e.g. "$.body[0].declarations[0].init.left". */
type JSONPath = string;

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

// ═════════════════════════════════════════════════════════════════════════════
// 2. ENTWINED FROZEN GRAPH (TOKENS, COMMENTS, AST)
//
// Folded from the legacy embody/types.parsing.ts. The graph is mutable during
// construction (so cross-references can be wired up) and deep-frozen once at
// the end. Consumers see only the frozen graph.
// ═════════════════════════════════════════════════════════════════════════════

/** The grammatical role of a token (shared across all tokens of the same kind). */
interface TokenType {
	readonly label: string; // e.g. "const", "name", "num", "+/-", "=", "eof"
	readonly keyword: string | undefined; // set if this token type is a keyword
	readonly beforeExpr: boolean; // may legally precede an expression
	readonly startsExpr: boolean; // may legally begin an expression
	readonly isAssign: boolean;
	readonly binop: number | null; // operator precedence if binary; else null
	readonly prefix: boolean;
	readonly postfix: boolean;
}

/**
 * A token in the entwined frozen graph.
 * Plain object with cross-references; no methods.
 */
interface AugmentedToken {
	// ── acorn native fields ──
	readonly type: TokenType;
	readonly value: string | number | bigint | undefined; // undefined for punctuation
	readonly start: number; // char offset, inclusive
	readonly end: number; // char offset, exclusive
	readonly loc: SourceLocation;

	// ── augmented fields ──
	/** Raw source text: source.code.slice(start, end). */
	readonly text: string;
	/** Index into the parent token array (stable integer id). */
	readonly index: number;
	/** Innermost AST node whose span contains this token. null only for 'eof'. */
	readonly innermostNode: AugmentedASTNode | null;
	/** JSONPath to innermostNode — same information, serialization-safe. */
	readonly innermostPath: JSONPath | null;

	/** Tokens immediately adjacent in the flat stream. */
	readonly prevToken: AugmentedToken | null;
	readonly nextToken: AugmentedToken | null;

	/** Whitespace/gap in the source between prevToken.end and this token's start. null at index 0. */
	readonly leadingGap: string | null;
}

interface AugmentedComment {
	readonly isBlock: boolean; // true = /* */, false = //
	readonly text: string; // content without delimiters
	readonly start: number;
	readonly end: number;
	readonly loc: SourceLocation;

	/** Raw source text including delimiters: source.code.slice(start, end). */
	readonly raw: string;
	/** Innermost AST node whose span contains this comment. */
	readonly innermostNode: AugmentedASTNode | null;
	readonly innermostPath: JSONPath | null;
}

/**
 * An AST node in the entwined frozen graph.
 * Wraps the original acorn node (with type-specific fields like .name, .operator, .value, etc.)
 * via `acornNode`, so we don't re-type the full ESTree spec here.
 */
interface AugmentedASTNode {
	// ── acorn native fields (mirrored for convenience) ──
	readonly type: string; // "Identifier", "BinaryExpression", etc.
	readonly start: number;
	readonly end: number;
	readonly loc: SourceLocation;

	// ── path ──
	readonly path: JSONPath; // JSONPath from Program root

	// ── source text ──
	readonly text: string; // source.code.slice(start, end)

	// ── tree links ──
	readonly parent: AugmentedASTNode | null; // null only for Program
	readonly children: ReadonlyArray<AugmentedASTNode>; // direct children in source order

	// ── token & comment links ──
	readonly tokens: ReadonlyArray<AugmentedToken>; // all tokens within span
	readonly comments: ReadonlyArray<AugmentedComment>; // all comments within span
	readonly firstToken: AugmentedToken | null;
	readonly lastToken: AugmentedToken | null;

	/** Original acorn node with type-specific fields (Identifier.name, BinaryExpression.operator, …). */
	readonly acornNode: AcornNode;
}

/**
 * The fully entwined parse output. Tokens, comments, and AST nodes
 * cross-reference each other; offset indexes provide O(1) lookups.
 */
interface ParseGraph {
	readonly tokens: ReadonlyArray<AugmentedToken>; // includes 'eof' as the last element
	readonly comments: ReadonlyArray<AugmentedComment>;
	readonly ast: AugmentedASTNode; // Program root

	/** Index: JSONPath → AugmentedASTNode. Primary path-based lookup. */
	readonly nodesByPath: Readonly<Record<JSONPath, AugmentedASTNode>>;
	/** Index: char offset → token starting at that offset (sparse). */
	readonly tokensByOffset: Readonly<Record<number, AugmentedToken>>;
	/** Index: char offset → innermost AST node starting at that offset (sparse). */
	readonly nodesByOffset: Readonly<Record<number, AugmentedASTNode>>;
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. REALM, SCOPES, BINDINGS (STATIC SIDE)
// ═════════════════════════════════════════════════════════════════════════════

type DeclarationKind = 'let' | 'const' | 'global';

/** Access-time visibility of a binding.
 *  Per spec, "TDZ" is the access-time consequence of an *uninitialized* binding;
 *  we name the queryable state directly for learner clarity. */
type BindingStatus = 'tdz' | 'initialized' | 'dead';

/** A binding in any scope (script/block/global). */
interface Binding {
	readonly name: string;
	readonly kind: DeclarationKind;
	readonly status: BindingStatus;
	/** undefined while 'tdz' or 'dead'. */
	readonly value: unknown;
	/** Path to the AST node that declared this binding. null for realm/global builtins. */
	readonly declarationPath: JSONPath | null;
}

/** Categorization of a realm-level (host or intrinsic) binding for visualization. */
interface BuiltinBinding {
	readonly name: string;
	/** 'object-register' = methods + prototype (Math, String, Number, Date, console).
	 *  'function'        = callable (alert, prompt, parseInt, parseFloat, Boolean).
	 *  'constant'        = bare value (Infinity, NaN, undefined). */
	readonly category: 'object-register' | 'function' | 'constant';
	/** Whether this binding came from ECMA-262 (`SetDefaultGlobalBindings`)
	 *  or from the HTML host hook inside `InitializeHostDefinedRealm`. */
	readonly origin: 'ecma' | 'host';
}

interface Scope {
	readonly kind: 'global' | 'script' | 'block';
	readonly bindings: ReadonlyArray<Binding>;
	readonly outer: Scope | null;
	/** Path to the AST node that introduces this scope. null for global; "$" for script. */
	readonly nodePath: JSONPath | null;
}

/**
 * The realm — "the world your script is born into."
 * ECMA-262 intrinsics (§9.3.4 SetDefaultGlobalBindings) and host-installed
 * properties (HTML host hook inside §9.6 InitializeHostDefinedRealm) are
 * spec-distinct, so we keep them separated.
 */
interface Realm {
	readonly intrinsics: Readonly<Record<string, BuiltinBinding>>; // Math, Date, Number, String, Boolean, parseInt, parseFloat, Infinity, NaN, undefined
	readonly host: Readonly<Record<string, BuiltinBinding>>; // console, alert, prompt, confirm
}

/**
 * The script scope after `GlobalDeclarationInstantiation` (§16.1.7), before
 * the first statement runs. All script-level let/const are declared as 'tdz'.
 * Block scopes are NOT created here — they are pushed lazily during evaluation.
 */
interface InitialScope extends Scope {
	readonly kind: 'script';
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. STATIC ANALYSES
// ═════════════════════════════════════════════════════════════════════════════

/** Source location of a single declaration. */
interface BindingDeclaration {
	readonly name: string;
	readonly kind: DeclarationKind;
	readonly scope: 'script' | 'block';
	readonly nodePath: JSONPath;
	readonly loc: SourceLocation;
}

/** Realm-level names referenced by the snippet (alias-resolved). */
interface DependencyReference {
	readonly name: string; // resolved canonical name (e.g. 'console.log' even if aliased)
	readonly callsites: ReadonlyArray<{ readonly nodePath: JSONPath; readonly loc: SourceLocation }>;
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
	readonly samples: ReadonlyArray<number>; // raw values for lenses that want them
}

/**
 * Pure structural counts. Length is a primary understandability signal
 * (per the comprehension-study reference), so distributions are first-class.
 */
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
	readonly bindings: { readonly script: number; readonly block: number; readonly total: number };
	readonly maxNestingDepth: number;
}

/** Locations of branches, breaks, continues — useful for trace visualizations. */
interface ControlFlow {
	readonly branches: ReadonlyArray<{ readonly nodePath: JSONPath; readonly kind: 'if' | 'ternary'; readonly loc: SourceLocation }>;
	readonly breaks: ReadonlyArray<{ readonly nodePath: JSONPath; readonly loc: SourceLocation }>;
	readonly continues: ReadonlyArray<{ readonly nodePath: JSONPath; readonly loc: SourceLocation }>;
}

/**
 * Sources of nondeterminism. `isDeterministic` (on Validation) is derived as
 * the negation of any source being true.
 *
 * Definition: "observable values are a pure function of source."
 */
interface NonDeterminism {
	readonly random: boolean; // Math.random()
	readonly clock: boolean; // Date.now(), new Date() (no args)
	readonly userInput: boolean; // prompt, confirm
	readonly locale: boolean; // toLocale*, Date.parse, new Date(string), localeCompare
}

/**
 * Per-method I/O counts (alias-resolved). `total` at each level for
 * ergonomic lens checks. Zero-count methods omitted.
 */
interface HasIo {
	readonly user: {
		readonly total: number;
		readonly alert?: number;
		readonly confirm?: number;
		readonly prompt?: number;
	};
	readonly dev: {
		readonly total: number;
		// 19 console methods; all optional, omitted when count is 0
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

/** Bundle of static analyses derived from parse + realm. */
interface StaticAnalyses {
	readonly realm: Realm;
	readonly initialScope: InitialScope;
	readonly bindings: ReadonlyArray<BindingDeclaration>;
	readonly dependencies: ReadonlyArray<DependencyReference>;
	readonly features: Features;
	readonly metrics: Metrics;
	readonly controlFlow: ControlFlow;
	readonly nonDeterminism: NonDeterminism;
	readonly hasIo: HasIo;
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. VALIDATION SUMMARY
// ═════════════════════════════════════════════════════════════════════════════

/** A reason the snippet is outside the JEJ subset. */
interface Violation {
	readonly kind: string; // e.g. "FunctionDeclaration", "ArrayExpression", "VarDeclaration"
	readonly message: string;
	readonly nodePath: JSONPath;
	readonly loc: SourceLocation;
}

/** Output of the validate gate.
 *  `isJeJ` is the gate criterion: `isJeJ === violations.length === 0`.
 *  `isDeterministic` and `doesPause` are informational metadata for
 *  consumers, NOT gate criteria — a non-deterministic or pausing program
 *  still passes validation if it's a valid JEJ subset.
 *
 *  Derivation invariants (implementations MUST honor; not type-enforceable):
 *  - `isJeJ === (violations.length === 0)`
 *  - `isDeterministic === !(static.nonDeterminism.random || .clock || .userInput || .locale)`
 *  - `doesPause === (static.hasIo.user.total > 0)`
 *  Implementations MUST NOT write a value that contradicts the source. */
interface Validation {
	readonly isJeJ: boolean;
	readonly isDeterministic: boolean; // = !any(nonDeterminism); metadata, not gate
	readonly doesPause: boolean; // = hasIo.user.total > 0; metadata, not gate
	readonly formatted: boolean;
	readonly violations: ReadonlyArray<Violation>;
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. ERRORS
// ═════════════════════════════════════════════════════════════════════════════

type EmbodyPhase = 'parse:tokenize' | 'parse:ast' | 'validate' | 'create' | 'evaluate';

/** First-fail-wins error from any pre-evaluation gate. null when all gates passed. */
interface EmbodyError {
	readonly phase: EmbodyPhase;
	readonly kind: string; // e.g. 'SyntaxError', 'ReferenceError', 'TypeError', 'RangeError'
	readonly message: string;
	readonly loc: SourceLocation | null;
	readonly cause?: unknown; // optional underlying error reference
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. STATUS BOOLEANS
//
// Independent gates — lenses guard by checking the relevant boolean before
// reaching for fields. Not a discriminated union (each gate is independent).
// ═════════════════════════════════════════════════════════════════════════════

interface Status {
	readonly tokenized: boolean; // tokenize succeeded
	readonly parsed: boolean; // AST built (requires tokenized)
	readonly validated: boolean; // JEJ validate passed — isJeJ === true (requires parsed)
	readonly created: boolean; // script-scope creation passed (requires validated)
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. EVENT UNION
//
// One flat discriminated `Event` union across the whole system. Tier
// membership is a FILTER PREDICATE over event tags, not a type-narrowed
// subset. Every event carries entwinement refs (node, loc, prev/next) as
// plain object cross-references.
// ═════════════════════════════════════════════════════════════════════════════

/** Phase discriminator. (No 'realm' phase — realm is data on static.realm.) */
type EventPhase = 'parse:tokenize' | 'parse:ast' | 'create' | 'evaluate' | 'realm';

/** Category discriminator within a phase. */
type EventCategory =
	// parse-side
	| 'token'
	| 'node'
	// create-side & evaluate-side
	| 'realm' // streams.realm: realm-binding events (alphabetical iteration)
	| 'scope'
	| 'binding'
	// evaluate-side only
	| 'script'
	| 'expression'
	| 'resolve'
	| 'statement'
	| 'control-flow'
	| 'initialization'
	| 'for-init'
	| 'write'
	| 'coerce'
	| 'emit'
	| 'error';

/** Common shape of every Event. */
interface EventBase {
	readonly phase: EventPhase;
	readonly category: EventCategory;
	readonly kind: string; // category-specific discriminator (e.g. 'push'|'pop' for scope)
	/** Direct reference to the static AST node, or null pre-AST (tokenize events). */
	readonly node: AugmentedASTNode | null;
	readonly loc: SourceLocation | null;
	/** Monotonic step counter; non-null only for evaluate-side events. */
	readonly step: number | null;
	/** Doubly-linked plain object refs to neighboring events. */
	readonly prev: Event | null;
	readonly next: Event | null;
}

// ─── Parse-side events ──────────────────────────────────────────────────────

interface TokenEvent extends EventBase {
	readonly phase: 'parse:tokenize';
	readonly category: 'token';
	readonly kind: 'token';
	readonly token: AugmentedToken;
	readonly node: null; // tokens precede AST construction
}

interface NodeEvent extends EventBase {
	readonly phase: 'parse:ast';
	readonly category: 'node';
	readonly kind: 'enter' | 'exit';
	readonly node: AugmentedASTNode;
}

// ─── Realm-stream events (alphabetical realm-binding iteration) ─────────────

interface RealmBindingEvent extends EventBase {
	readonly phase: 'realm';
	readonly category: 'realm';
	readonly kind: 'binding';
	readonly binding: BuiltinBinding;
	readonly node: null;
}

// ─── Create-side events (script-scope GlobalDeclarationInstantiation §16.1.7) ─

type ScopePopReason = 'normal' | 'break' | 'continue' | 'error' | 'limit';

interface ScopeEvent extends EventBase {
	readonly category: 'scope';
	readonly kind: 'push' | 'pop';
	readonly scope: Scope;
	/** Required on 'pop'. */
	readonly reason?: ScopePopReason;
	// Note: per ECMA-262 §14.2.2, blocks with no lexical declarations don't
	// push an env — and JEJ honors this: no scope:push/pop events fire for
	// elided blocks. Spec-faithful, surfaces "syntax-vs-semantics" as a
	// teaching moment in curriculum.
}

interface BindingEvent extends EventBase {
	readonly category: 'binding';
	readonly kind: 'declare' | 'initialize' | 'access' | 'update';
	readonly bindingName: string;
	/** Value before this event's effect (for declare: undefined; for access: the value being read; for update: the prior value). */
	readonly priorValue?: unknown;
	/** Value after this event's effect (for initialize/update: the new value; for access: same as priorValue). */
	readonly nextValue?: unknown;
}

// ─── Evaluate-side: script bookends ──────────────────────────────────────────

interface ScriptEvent extends EventBase {
	readonly phase: 'evaluate';
	readonly category: 'script';
	readonly kind: 'enter' | 'exit';
	readonly reason?: ScopePopReason; // present on 'exit'
}

// ─── Evaluate-side: expressions, resolves, coercions ─────────────────────────

interface ExpressionEvent extends EventBase {
	readonly phase: 'evaluate';
	readonly category: 'expression';
	readonly kind: 'literal' | 'identifier' | 'property' | 'operator' | 'call' | 'template' | 'update';
	readonly result: unknown;
	/** For postfix update: the OLD value returned (per ECMA-262 §13.4.3). */
	readonly returnedValue?: unknown;
}

interface ScopeChainStep {
	readonly scope: Scope;
	readonly hit: boolean;
}

interface ProtoChainStep {
	readonly object: unknown;
	readonly hit: boolean;
}

/**
 * The bridge between visual-syntax and behind-the-scenes levels.
 * `scopeChainWalk` (for identifiers) and `protoChainWalk` (for member access)
 * make the chain-walk observable — the central "two chains, same shape"
 * insight is unreachable without these.
 */
interface ResolveEvent extends EventBase {
	readonly phase: 'evaluate';
	readonly category: 'resolve';
	readonly kind: 'identifier' | 'member' | 'literal' | 'operator' | 'shortCircuit' | 'conditional' | 'assignment' | 'increment' | 'call' | 'template';
	readonly result: { readonly type: string; readonly value: unknown };
	readonly scopeChainWalk?: ReadonlyArray<ScopeChainStep>; // present for identifiers
	readonly protoChainWalk?: ReadonlyArray<ProtoChainStep>; // present for member access
}

/**
 * Coercion as a first-class event category. ECMA-spec-aligned:
 *   ToPrimitive, ToString, ToNumeric, ToBoolean.
 *
 * `+` operator emits THREE coercion clusters in spec order (§13.15.3):
 *   ToPrimitive(lval, 'default') → ToPrimitive(rval, 'default')
 *   → ToString×2  (if either result is a string)
 *   → ToNumeric×2 (otherwise).
 *
 * Operator event fires after coercions complete.
 */
interface CoerceEvent extends EventBase {
	readonly phase: 'evaluate';
	readonly category: 'coerce';
	readonly kind: 'ToPrimitive' | 'ToString' | 'ToNumeric' | 'ToBoolean';
	readonly hint?: 'default' | 'string' | 'number';
	readonly from: { readonly type: string; readonly value: unknown };
	readonly to: { readonly type: string; readonly value: unknown };
}

// ─── Evaluate-side: statements & control flow ────────────────────────────────

interface StatementEvent extends EventBase {
	readonly phase: 'evaluate';
	readonly category: 'statement';
	readonly kind: 'enter' | 'exit';
	readonly reason?: ScopePopReason;
}

interface ControlFlowEvent extends EventBase {
	readonly phase: 'evaluate';
	readonly category: 'control-flow';
	readonly kind:
		| 'conditional-test'
		| 'branch-entry'
		| 'loop-iter-start'
		| 'loop-iter-end'
		| 'loop-exit'
		| 'break'
		| 'continue';
}

interface InitializationEvent extends EventBase {
	readonly phase: 'evaluate';
	readonly category: 'initialization';
	readonly kind: 'binding';
	readonly bindingName: string;
	readonly value: unknown;
}

interface ForInitEvent extends EventBase {
	readonly phase: 'evaluate';
	readonly category: 'for-init';
	readonly kind: 'init';
}

interface WriteEvent extends EventBase {
	readonly phase: 'evaluate';
	readonly category: 'write';
	readonly kind: 'assignment';
	readonly bindingName: string;
	readonly priorValue: unknown;
	readonly nextValue: unknown;
}

// ─── Evaluate-side: I/O & errors ─────────────────────────────────────────────

interface EmitEvent extends EventBase {
	readonly phase: 'evaluate';
	readonly category: 'emit';
	readonly kind: 'console' | 'alert' | 'confirm' | 'prompt';
	readonly method?: string; // for console.*: 'log', 'warn', etc.
	readonly args: ReadonlyArray<unknown>;
	readonly returnValue?: unknown; // for confirm/prompt
}

interface ErrorEvent extends EventBase {
	readonly phase: 'evaluate';
	readonly category: 'error';
	readonly kind: 'ReferenceError' | 'TypeError' | 'RangeError' | 'SyntaxError';
	readonly errorName: string;
	readonly message: string;
}

/** The flat Event union. */
type Event =
	| TokenEvent
	| NodeEvent
	| RealmBindingEvent
	| ScopeEvent
	| BindingEvent
	| ScriptEvent
	| ExpressionEvent
	| ResolveEvent
	| CoerceEvent
	| StatementEvent
	| ControlFlowEvent
	| InitializationEvent
	| ForInitEvent
	| WriteEvent
	| EmitEvent
	| ErrorEvent;

// ═════════════════════════════════════════════════════════════════════════════
// 9. TIER FILTER WHITELISTS
//
// Tiers are filter predicates over the flat Event universe — NOT type-narrowed
// subsets. Every higher tier strictly includes lower-tier categories.
//
// `run` returns a RunInstance with events: [] (no event tier).
// ═════════════════════════════════════════════════════════════════════════════

type TierName = 'run' | 'intercept' | 'trace.syntax' | 'trace.semantics';

/** Documented as data — a category whitelist per tier. */
interface TierFilters {
	readonly run: ReadonlyArray<EventCategory>; // [] — no events
	readonly intercept: ReadonlyArray<EventCategory>; // emit, error
	readonly 'trace.syntax': ReadonlyArray<EventCategory>; // intercept + script, scope, statement, control-flow, write, initialization, for-init
	readonly 'trace.semantics': ReadonlyArray<EventCategory>; // syntax + expression, resolve, coerce, binding
}

// ═════════════════════════════════════════════════════════════════════════════
// 10. RUN INSTANCE
//
// One evaluation of a snippet. The exact entwinement of events, node refs,
// and prev/next links is intentionally open in the contract — see
// embody/DOCS.md § Open holes in the contract for the rationale.
// ═════════════════════════════════════════════════════════════════════════════

interface EndReport {
	readonly ok: boolean;
	readonly error: EmbodyError | null;
	readonly outcome: 'completed' | 'errored' | 'timed-out' | 'cancelled' | 'limit-exceeded';
}

interface RunMetrics {
	readonly steps: number;
	readonly durationMs: number;
	readonly iterationCount: number;
}

/**
 * The frozen output of one evaluate.* call. Events reference the static AST
 * graph (snippet.parse.ast) by identity; no per-run AST clone.
 */
interface RunInstance {
	readonly events: ReadonlyArray<Event>;
	readonly endReport: EndReport;
	/** Post-evaluation environment state (frozen). Includes any block scopes that ended in 'dead'. */
	readonly finalEnvironment: Scope;
	readonly runMetrics: RunMetrics;
	/** Back-reference to the snippet for static data. */
	readonly snippet: Snippet;
}

// ═════════════════════════════════════════════════════════════════════════════
// 11. STREAMS — generator type signatures
//
// The only callable surface on a Snippet. Static-side streams are sync
// generators iterating pre-computed frozen data. Evaluate-side streams run a
// Worker live; intercept and trace tiers stream events as the worker emits
// them.
// ═════════════════════════════════════════════════════════════════════════════

/** Per-evaluation-call options. Each call is independent; no caching across calls. */
interface EvaluateOptions {
	readonly seconds?: number;
	readonly iterations?: number;
	/** Mocks for prompt/confirm/alert/console. Non-deterministic programs may
	 *  pin their behavior with mocks for stable replay. */
	readonly io?: IoMocks;
}

interface IoMocks {
	readonly alert?: (message: string) => void;
	readonly confirm?: (message: string) => boolean;
	readonly prompt?: (message: string, defaultValue?: string) => string | null;
	readonly console?: Partial<Record<string, (...args: unknown[]) => void>>;
}

/** Async iterable + .result Promise. Mirrors lib/evaluating/intercept's InterceptHandle. */
interface EvaluateHandle extends AsyncIterable<Event> {
	readonly result: Promise<RunInstance>;
	readonly cancel: () => void;
}

interface Streams {
	/** Iterates realm bindings alphabetically — useful for "what's available in the world?" lenses. */
	readonly realm: () => Generator<RealmBindingEvent>;

	readonly parse: {
		readonly tokenize: () => Generator<TokenEvent>;
		readonly parse: () => Generator<NodeEvent>;
	};

	readonly create: () => Generator<ScopeEvent | BindingEvent>;

	readonly evaluate: {
		/** No event stream; returns RunInstance with events: []. */
		readonly run: (options?: EvaluateOptions) => Promise<RunInstance>;
		/** Intercept tier: emit + error events. */
		readonly intercept: (options?: EvaluateOptions) => EvaluateHandle;
		readonly trace: {
			/** Trace.syntax tier: intercept + script/scope/statement/control-flow/write/initialization/for-init. */
			readonly syntax: (options?: EvaluateOptions) => EvaluateHandle;
			/** Trace.semantics tier: syntax + expression/resolve/coerce/binding (full event universe). */
			readonly semantics: (options?: EvaluateOptions) => EvaluateHandle;
		};
	};
}

// ═════════════════════════════════════════════════════════════════════════════
// 12. SNIPPET — top-level type
//
// `embody(code)` returns a Snippet. Field availability follows `status`,
// which is a hard-gated staircase: each gate's failure produces a structurally
// distinct shape leaf with downstream surfaces absent.
//   !tokenized → only source, parse.tokens (partial), errors, streams.realm, streams.parse.tokenize
//   !parsed    → + streams.parse.parse
//   !validated → + parse.ast, parse.comments, static, validation
//   !created   → + streams.create
//    created   → + streams.evaluate
//
// Validation is a hard gate: failure means no streams.create and no
// streams.evaluate (programs that aren't valid JEJ don't run). The five
// gate-determined shape leaves are tokenize-fail, parse-fail,
// validate-fail, create-fail, and apex.
//
// Lenses guard by checking status booleans before reaching for optional fields.
// ═════════════════════════════════════════════════════════════════════════════

interface Snippet {
	readonly status: Status;
	readonly source: Source;

	/** Parse outputs. Always present (at least partially) since tokens accumulate
	 *  before any error; ast/comments/indexes only meaningful when status.parsed. */
	readonly parse: Partial<ParseGraph>;

	/** Static analyses. Present when status.parsed === true. */
	readonly static?: StaticAnalyses;

	/** Validation summary. Present when status.validated has been computed
	 *  (i.e., parse succeeded — at validate-fail or beyond on the staircase). */
	readonly validation?: Validation;

	/** First-fail-wins error from any pre-evaluation gate. null when all gates passed. */
	readonly errors: EmbodyError | null;

	/** A-la-carte event streams. Each property's presence follows the staircase. */
	readonly streams: Partial<Streams> & { readonly realm: Streams['realm'] };
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC EXPORTS
// ═════════════════════════════════════════════════════════════════════════════

export type {
	// source
	JSONPath,
	SourcePosition,
	SourceLocation,
	Source,

	// parse graph
	TokenType,
	AugmentedToken,
	AugmentedComment,
	AugmentedASTNode,
	ParseGraph,

	// realm / scope / binding
	DeclarationKind,
	BindingStatus,
	Binding,
	BuiltinBinding,
	Scope,
	Realm,
	InitialScope,

	// static analyses
	BindingDeclaration,
	DependencyReference,
	Features,
	Distribution,
	Metrics,
	ControlFlow,
	NonDeterminism,
	HasIo,
	StaticAnalyses,

	// validation & errors
	Violation,
	Validation,
	EmbodyPhase,
	EmbodyError,

	// status
	Status,

	// events
	EventPhase,
	EventCategory,
	EventBase,
	TokenEvent,
	NodeEvent,
	RealmBindingEvent,
	ScopeEvent,
	ScopePopReason,
	BindingEvent,
	ScriptEvent,
	ExpressionEvent,
	ScopeChainStep,
	ProtoChainStep,
	ResolveEvent,
	CoerceEvent,
	StatementEvent,
	ControlFlowEvent,
	InitializationEvent,
	ForInitEvent,
	WriteEvent,
	EmitEvent,
	ErrorEvent,
	Event,

	// tiers
	TierName,
	TierFilters,

	// run instance
	EndReport,
	RunMetrics,
	RunInstance,

	// streams
	EvaluateOptions,
	IoMocks,
	EvaluateHandle,
	Streams,

	// snippet (top-level)
	Snippet,
};
