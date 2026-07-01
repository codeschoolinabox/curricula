/**
 * @file Types for the pointcut/advice layer.
 *
 * JejTag: metadata embedded into every AranLang node via the tag field.
 * TracerState: runtime state shared between advice functions.
 *
 * Both must be Json-serializable (Aran requirement): pointcut return arrays
 * and the initial state are CODE-GENERATED into the woven output. No
 * functions, Maps, Sets, or class instances — plain JSON shapes only.
 *
 * Config does NOT live here: weave-time gating reads the resolved options on
 * the main thread (in aspect assembly), and the runtime-checked gates (range,
 * filter arrays, iteration cap) reach the worker via the engine spec's
 * `workerConfig` as the runtime gate bundle (`../../types.ts` seam 2) — never
 * baked into the woven code.
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
 * `nodePath` is stamped onto every resolved tag at weave time (the tag
 * resolution seam) — advice reads `tag.nodePath` to attribute events; it is
 * the same string that keys the ast record.
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
	/** Stamped at tag resolution; keys the ast record. */
	readonly nodePath: string;

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
	/** The emitted `step` of this binding's declare event, or null when that
	 *  event was not emitted (config-disabled or gate-dropped). Read by advice
	 *  to stamp navigable `declarationStep` cross-references. */
	declarationStep: number | null;
	/** False when variable is in TDZ (declared but not yet initialized).
	 *  Set to true after the first WriteEffect assigns the initial value. */
	initialized: boolean;
};

/**
 * Scope info tracked in the scope stack.
 * Each scope owns its variable bindings in the `variables` map.
 */
export type ScopeInfo = {
	/** The emitted `step` of this scope's create event, or null when that
	 *  event was not emitted. Read by advice to stamp navigable
	 *  `creationStep` / `scopeCreationStep` cross-references. */
	creationStep: number | null;
	depth: number;
	kind: string;
	structure: ControlFlowStructure | null;
	structureStep: number | null;
	variables: Record<string, VariableInfo>;
};

/**
 * Runtime state passed between advice functions.
 * Must be Json-serializable (Aran code-generates the initial state).
 *
 * Tracks scope nesting, variable ownership, step counting, and provenance.
 *
 * iterationCounters: keyed by loop source location (e.g., "5:0").
 *   Reset when a loop test evaluates false; the CAP the counters are checked
 *   against arrives in the runtime gate bundle, not in state.
 *
 * lastExpressionResult: raw value from the most recent expression@after or
 *   apply@around. Read by effect-before for assignment values.
 *
 * onEvent: optional callback for streaming events to the engine
 *   (`api.emit`). Set by the worker logic at setup — never part of the
 *   code-generated initial state (functions aren't Json). Not set in Node
 *   unit tests — events just accumulate in trace[].
 */
export type TracerState = {
	/**
	 * Every emitted event, retained worker-side so engine-less Node unit
	 * tests can execute woven output and inspect the stream directly.
	 * Deliberate duplication with the engine's items array — acceptable at
	 * JEJ program scale, not a leak to "fix".
	 */
	trace: unknown[];
	/** The one step counter: contiguous, 1-indexed, incremented by the
	 *  dispatcher AFTER the runtime gates pass — only emitted events consume
	 *  a number. Appears as the `step` field on every TraceEvent.
	 *  Cross-references carry emitted steps recorded on ScopeInfo /
	 *  VariableInfo; there is no second counter. */
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
	/** Variable name → binding kind ('let'/'const'). Built during instrument()
	 *  pre-walk. Used by block-declaration to emit correct kind on declare events
	 *  because the block tag (Program/Block) has no bindingKind. */
	variableKinds: Record<string, 'let' | 'const'>;

	/** nodePath of the most recently emitted TraceEvent (expression or resolve).
	 *  Updated by the dispatcher after every event. Used by block@throwing as
	 *  the ErrorEvent's APPROXIMATE location. Initialized to '' before the
	 *  first event. */
	lastEmittedNodePath: string;

	/** JejTag of the most recently emitted TraceEvent — type/loc/source for
	 *  the ErrorEvent's approximate location. Null before the first event. */
	lastEmittedTag: JejTag | null;

	/** nodePath → visit count. Incremented by the resolve dispatcher on every
	 *  ResolveEvent (once per logical evaluation). Rides the halt payload to
	 *  the thread; linking mirrors it onto ASTNode.visits. */
	visitCounts: Record<string, number>;

	/** Monotonic provenance counter — the next ResolveEvent's valueId.
	 *  Starts at 1; only advances when `resolve.provenance` is enabled. */
	valueIdCounter: number;
};
