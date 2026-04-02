/**
 * @file Types for the pointcut/advice layer.
 *
 * JejTag: metadata embedded into every AranLang node via the tag field.
 * TracerState: runtime state shared between advice functions.
 *
 * Both must be Json-serializable (Aran requirement).
 */

import type { SourceLocation, ControlFlowStructure, LoopKind } from '../types.js';

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
	step: number;
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
};
