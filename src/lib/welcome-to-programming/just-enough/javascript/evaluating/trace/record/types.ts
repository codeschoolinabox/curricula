/**
 * @file Internal types for the Aran legacy tracer's record module.
 *
 * - RawEntry: shape of entries emitted by traceCollector
 * - AranOperation: union of all operation types
 * - AranStep: StepCore extension with Aran-specific fields
 */

import type { SourceLocation, StepCore } from '@study-lenses/tracing';

/** The operation types that postProcess can produce. */
export type AranOperation =
	| 'declare'
	| 'read'
	| 'assign'
	| 'initialize'
	| 'call'
	| 'return'
	| 'binary'
	| 'unary'
	| 'logical'
	| 'conditional'
	| 'check'
	| 'break'
	| 'continue'
	| 'catch'
	| 'throw'
	| 'hoist'
	| 'evaluate'
	| 'this'
	| 'enter'
	| 'leave'
	| 'exception';

/** Raw entry shape emitted by traceCollector. */
export type RawEntry = {
	readonly type: 'log' | 'groupStart';
	readonly prefix: string | null;
	readonly style: string;
	readonly logs: readonly unknown[];
	readonly loc: SourceLocation | null;
	readonly nodeType: string | null;
};

/** A single structured step produced by postProcess. Extends StepCore. */
export type AranStep = StepCore & {
	readonly operation: AranOperation;
	/** Variable name, function name, control type (if/while/for-of), or break/continue label. */
	readonly name: string | null;
	readonly operator: string | null;
	/** Declaration kind (let/const/var), truthiness (truthy/falsy), hoist kind, or call type (built-in). */
	readonly modifier: string | null;
	readonly values: readonly unknown[];
	/** Evaluated result for operator steps (binary, unary, conditional). Folded from child evaluate entries. */
	readonly result?: unknown;
	readonly depth: number;
	readonly scopeType: string | null;
	readonly nodeType: string | null;
};

// ---------------------------------------------------------------------------
// Filter options (user-facing, partial — all fields optional)
// ---------------------------------------------------------------------------

/** List-based filters for specific categories. */
export type AranListFilters = {
	readonly operatorsList?: readonly string[];
	readonly controlFlowList?: readonly string[];
	/** Name whitelist — filters any step with a name (variables, functions, control flow, etc.). Empty = keep all. */
	readonly names?: readonly string[];
};

/** Controls which data fields appear on output steps. */
export type AranDataConfig = {
	readonly loc?: boolean;
	readonly values?: boolean;
	readonly nodeType?: boolean;
	readonly depth?: boolean;
};

/**
 * User-facing filter options for post-trace filtering.
 * All fields optional — missing fields default to "all enabled".
 * Must match options.schema.json.
 */
export type AranFilterOptions = {
	// Category toggles
	readonly variables?: boolean;
	readonly operators?: boolean;
	readonly controlFlow?: boolean;
	readonly functions?: boolean;
	readonly functionDeclarations?: boolean;
	readonly this?: boolean;
	readonly errorHandling?: boolean;
	readonly enterLeave?: boolean;

	// List filters
	readonly filter?: AranListFilters;

	// Range filter (by source line number)
	readonly range?: {
		readonly start?: number;
		readonly end?: number;
	};

	// Data field stripping
	readonly data?: AranDataConfig;
};

// ---------------------------------------------------------------------------
// Resolved config (fully resolved, all fields required)
// ---------------------------------------------------------------------------

/**
 * Resolved name filter: Set for O(1) lookup.
 * Empty set = keep all names. Non-empty = whitelist only.
 */
export type ResolvedNameFilter = ReadonlySet<string>;

/** Fully resolved filter config — no optional fields, Sets instead of arrays. */
export type ResolvedAranConfig = {
	readonly variables: boolean;
	readonly operators: boolean;
	readonly controlFlow: boolean;
	readonly functions: boolean;
	readonly functionDeclarations: boolean;
	readonly this: boolean;
	readonly errorHandling: boolean;
	readonly enterLeave: boolean;
	readonly filter: {
		readonly operatorsList: ReadonlySet<string>;
		readonly controlFlowList: ReadonlySet<string>;
		readonly names: ResolvedNameFilter;
	};
	readonly range: {
		readonly start: number;
		readonly end: number;
	};
	readonly data: {
		readonly loc: boolean;
		readonly values: boolean;
		readonly nodeType: boolean;
		readonly depth: boolean;
	};
};

/** Tracer options type. Must match options.schema.json. */
// why: TracerOptions is the public API name from @study-lenses/tracing contract,
// AranFilterOptions is the internal implementation type. The alias bridges them.
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type TracerOptions = AranFilterOptions;
