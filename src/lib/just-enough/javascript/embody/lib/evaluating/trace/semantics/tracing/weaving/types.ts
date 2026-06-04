/**
 * @file Types for the pointcut/advice layer.
 *
 * JejTag: metadata embedded into every AranLang node via the tag field.
 * TracerState: runtime state shared between advice functions.
 *
 * Both must be Json-serializable (Aran requirement).
 */

import type {
	SourceLocation,
	ControlFlowStructure,
	LoopKind,
} from '../types.js';

// ============================================================================
// JejTag — ESTree metadata surviving Aran's desugaring
// ============================================================================

/**
 * Metadata embedded into every AranLang node via the tag field.
 * Carries ESTree information lost during Aran's desugaring.
 *
 * Why one type instead of per-node subtypes: Aran's Atom.Tag is a single
 * type parameter applied to ALL AST nodes. We cannot have different tag
 * types for different node kinds at the TypeScript level. The `node` field
 * (ESTree type name) serves as runtime discriminant. Optional fields are
 * sparse — each ESTree node type only populates the fields relevant to it.
 *
 * Optional fields by ESTree node type:
 * - `operator`                — BinaryExpression, UnaryExpression, LogicalExpression, AssignmentExpression, UpdateExpression
 * - `loopKind`                — WhileStatement, DoWhileStatement, ForStatement, ForOfStatement
 * - `bindingKind`             — VariableDeclaration (`let` or `const`)
 * - `explicit`                — VariableDeclarator (true = has initializer, false = implicit undefined)
 * - `accessKind`              — MemberExpression (`dot`, `bracket`, `optionalChaining`)
 * - `literalKind`             — Literal (`string`, `number`, `boolean`, `null`, `undefined`, `regex`)
 * - `jumpTarget`              — BreakStatement, ContinueStatement (loop kind of target)
 * - `structure`               — blocks with associated control-flow structure
 * - `templateStrings`         — TemplateLiteral (cooked string parts)
 * - `templateExpressionCount` — TemplateLiteral (number of `${}` expressions)
 * - `prefix`                  — UpdateExpression: `true` = prefix (`++x`/`--x`), `false` = postfix (`x++`/`x--`)
 */
export type JejTag = {
	readonly loc: SourceLocation;
	readonly node: string;
	readonly source: string;

	readonly operator?: string;
	readonly loopKind?: LoopKind;
	readonly bindingKind?: 'let' | 'const';
	readonly explicit?: boolean;
	readonly accessKind?: 'dot' | 'bracket' | 'optionalChaining';
	readonly literalKind?:
		| 'string'
		| 'number'
		| 'boolean'
		| 'null'
		| 'undefined'
		| 'regex';
	readonly jumpTarget?: LoopKind;
	readonly structure?: ControlFlowStructure;
	readonly templateStrings?: readonly string[];
	readonly templateExpressionCount?: number;
	/** Present only on UpdateExpression nodes.
	 *  `true` = prefix form (`++x` / `--x`), `false` = postfix form (`x++` / `x--`).
	 *  Used by the pointcut to gate `expression.operators.increment.prefix` / `.postfix`. */
	readonly prefix?: boolean;
};

// ============================================================================
// TracerState — runtime state for advice functions
// ============================================================================

/**
 * Metadata for a variable declared in a scope.
 * Stored per-scope in ScopeInfo.variables, not in a flat map.
 * This solves variable shadowing naturally — walk scopeStack top-down.
 */
export type VariableInfo = {
	kind: 'let' | 'const' | 'global';
	declarationStep: number;
	/** False when variable is in TDZ (declared but not yet initialized).
	 *  Set to true after the first WriteEffect assigns the initial value. */
	initialized: boolean;
};

/**
 * Scope info tracked in the scope stack.
 * Each scope owns its variable bindings in the `variables` map.
 */
export type ScopeInfo = {
	creationStep: number;
	depth: number;
	kind: string;
	structure: string | null;
	structureStep: number | null;
	variables: Record<string, VariableInfo>;
};

/**
 * Runtime state passed between advice functions.
 * Must be Json-serializable (Aran clones initial_state via JSON).
 *
 * Tracks scope nesting, variable ownership, and step counting.
 * The config is embedded so advice functions can check it for conditional dispatch.
 *
 * iterationCounters: keyed by loop source location (e.g., "5:0").
 *   Reset by expression-after when a loop test evaluates false.
 *
 * lastExpressionResult: raw value from the most recent expression@after or
 *   apply@around. Read by effect-before for assignment values.
 *
 * onEvent: optional callback for streaming events to the main thread.
 *   Set by worker setup to postMessage. Not set in tests — events just
 *   accumulate in trace[]. Not Json-serializable (function), but safe
 *   because Aran only clones initialState at startup.
 */
export type TracerState = {
	trace: unknown[];
	/** Internal step counter for scope/variable cross-references.
	 *  Incremented by block-setup (scope creation) and block-declaration
	 *  (variable registration). Not visible on events. */
	step: number;
	/** Contiguous event counter. Only incremented by emitEvent().
	 *  Appears as the `step` field on every TraceEvent. */
	eventStep: number;
	scopeStack: ScopeInfo[];
	iterationCounters: Record<string, number>;
	lastExpressionResult: unknown;
	/** Holds the previous lastExpressionResult before it was overwritten.
	 *  Used by short-circuiting detection to recover the left operand. */
	previousExpressionResult: unknown;
	/** Maps variable name → last read value. Used by effect-before to get the
	 *  current value for compound assignment operands (x += 5 needs [currentX, 5]). */
	lastReadValues: Record<string, unknown>;
	onEvent?: (event: unknown) => void;
	config: Record<string, unknown>;
	/** Variable name → binding kind ('let'/'const'). Built during instrument()
	 *  pre-walk. Used by block-declaration to emit correct kind on declare events
	 *  because the block tag (Program/Block) has no bindingKind. */
	variableKinds: Record<string, 'let' | 'const'>;

	/** nodePath of the most recently emitted TraceEvent (expression or resolve).
	 *  Updated by emitExpression and emitResolve after every event.
	 *  Used by block@throwing as the approximate ErrorEvent location.
	 *  Initialized to '' before the first event. */
	lastEmittedNodePath: string;

	/** JejTag of the most recently emitted TraceEvent.
	 *  Provides type/loc/source for ErrorEvent — uses the last expression's tag
	 *  rather than the program block's tag (Option A: accurate-ish location).
	 *  Updated alongside lastEmittedNodePath. Null before the first event. */
	lastEmittedTag: JejTag | null;

	/** nodePath → visit count. Incremented by emitResolve on every ResolveEvent.
	 *  Returned in TraceResult.visitCounts. Used by link() to populate ASTNode.visits.
	 *  Initialized to {} before execution. */
	visitCounts: Record<string, number>;
};
