/**
 * @file TraceOptions, TraceConfig, and range types for the trace engine.
 *
 * These types are trace-specific — not shared with run or debug.
 * Canonical location for all trace configuration types.
 *
 * The 5-layer mental model:
 *
 * ```
 * ast (static)         always present on ok:true — the frozen program structure
 * resolve              data layer    — what values flowed through the program
 * expression           expression layer — which code produced those values
 * statements           statement layer  — how execution was controlled
 * scopes               structure layer  — scope boundaries + binding lifecycle
 * ```
 *
 * Each dynamic layer accepts `boolean` (shorthand: enable/disable everything in
 * the layer) or an object (fine-grained: enable only specific sub-events).
 * Boolean shorthand is expanded by `configuring/expand-shorthand.ts` before
 * the config is used. The default (omitting a layer) is all events enabled.
 *
 * @example Data-only trace — what values flowed, nothing else:
 * ```ts
 * { resolve: true, expression: false, statements: false, scopes: false }
 * ```
 *
 * @example Full expression trace — data + all expression context:
 * ```ts
 * { resolve: true, expression: true }
 * ```
 *
 * @example Variable reads only:
 * ```ts
 * { expression: { variables: { read: true } } }
 * // resolve defaults to true, so ResolveEvents still fire for those reads
 * ```
 *
 * @see options.schema.json for the JSON Schema version (used for default-filling)
 * @see tracing/types.ts for the event types these options gate
 */

import type { EngineConfig } from '../../shared/types.js';

// ─── Range types ─────────────────────────────────────────────

/**
 * A position in source code — either a whole line or a precise character offset.
 *
 * @remarks Used in {@link SourceRange} to define range boundaries.
 * A bare number means the entire line; an object gives column-level precision.
 */
export type RangePosition =
	| number
	| { readonly line: number; readonly column: number };

/**
 * A source range for filtering trace events.
 *
 * @remarks
 * Events whose `node.loc` falls outside the range are not emitted.
 * Primary UI use case: learner highlights a code selection and traces only
 * the events under the highlight.
 *
 * Cross-field constraint `start ≤ end` is validated by `verifyOptions`.
 * Normalization: a bare `number n` is treated as `{ line: n, column: 0 }`
 * for start and `{ line: n, column: Number.MAX_SAFE_INTEGER }` for end.
 */
export type SourceRange = {
	readonly start: RangePosition;
	readonly end: RangePosition;
};

// ─── TraceConfig ─────────────────────────────────────────────

/**
 * Configuration for the trace engine.
 *
 * @remarks
 * Execution constraints (`seconds`, `iterations`) control when the program
 * stops. `options` controls which events are captured. `range` filters events
 * to a source range — useful for tracing only a highlighted selection.
 *
 * Omitting `options` defaults to full trace (all events enabled).
 * Omitting `range` traces the entire program.
 *
 * @example
 * ```ts
 * trace(code, { seconds: 5 });
 * trace(code, { seconds: 5, options: { expression: { variables: true } } });
 * trace(code, { range: { start: 3, end: 7 } }); // lines 3–7 only
 * trace(code, { range: { start: { line: 3, column: 4 }, end: { line: 5, column: 12 } } });
 * ```
 */
export type TraceConfig = EngineConfig & {
	readonly options?: TraceOptions;
	readonly range?: SourceRange;
};

// ─── TraceOptions ────────────────────────────────────────────

/**
 * Options controlling trace granularity — which events appear in the output.
 *
 * @remarks
 * Structured by the 4-layer mental model. Full definition with design
 * rationale is in `trace/config.types.ts` (this file).
 *
 * Each layer accepts `boolean` (shorthand: enable/disable everything in the
 * layer) or an object (fine-grained: enable only specific sub-events).
 * Boolean shorthand is expanded by `configuring/expand-shorthand.ts`.
 * The default (omitting a layer) is all events enabled.
 *
 * Layers:
 * - `resolve`    — data layer: ResolveEvents carrying produced values (default true)
 * - `expression` — expression layer: which code produced those values
 * - `statements` — statement layer: how execution was controlled
 * - `scopes`     — structure layer: scope boundaries + binding lifecycle
 * - `with`       — easter egg: `with` statement support (sloppy mode)
 */
export type TraceOptions = {
	resolve?: boolean;

	expression?:
		| boolean
		| {
				variables?:
					| boolean
					| {
							read?: boolean;
							update?: boolean;
							filter?: string[];
					  };
				operators?:
					| boolean
					| {
							arithmetic?: boolean;
							addition?: boolean;
							comparison?: boolean;
							typeof?: boolean;
							negation?:
								| boolean
								| {
										logical?: boolean;
										bitwise?: boolean;
								  };
							bitwise?: boolean;
							shortCircuiting?: boolean;
							conditional?: boolean;
							assignment?:
								| boolean
								| {
										simple?: boolean;
										compound?: boolean;
										filter?: string[];
								  };
							increment?:
								| boolean
								| {
										prefix?: boolean;
										postfix?: boolean;
								  };
							in?: boolean;
							void?: boolean;
							comma?: boolean;
							filter?: string[];
					  };
				literals?:
					| boolean
					| {
							string?: boolean;
							number?: boolean;
							boolean?: boolean;
							null?: boolean;
							undefined?: boolean;
							regex?: boolean;
					  };
				templates?:
					| boolean
					| {
							begin?: boolean;
							evaluation?: boolean;
							end?: boolean;
					  };
				properties?:
					| boolean
					| {
							dot?: boolean;
							bracket?: boolean;
							optionalChaining?: boolean;
							filter?: string[];
					  };
				functions?:
					| boolean
					| {
							call?: boolean;
							filter?: string[];
					  };
		  };

	statements?:
		| boolean
		| {
				variables?:
					| boolean
					| {
							initialize?: boolean;
							available?: boolean;
							filter?: string[];
					  };
				conditionals?:
					| boolean
					| {
							test?: boolean;
							branch?: boolean;
					  };
				while?:
					| boolean
					| {
							test?: boolean;
							iteration?: boolean;
					  };
				doWhile?:
					| boolean
					| {
							do?: boolean;
							test?: boolean;
							iteration?: boolean;
					  };
				for?:
					| boolean
					| {
							setup?: boolean;
							test?: boolean;
							increment?: boolean;
							iteration?: boolean;
					  };
				forOf?:
					| boolean
					| {
							iteration?: boolean;
					  };
				break?: boolean;
				continue?: boolean;
				debugger?: boolean;
		  };

	scopes?:
		| boolean
		| {
				script?:
					| boolean
					| {
							create?: boolean;
							enter?: boolean;
							interrupt?: boolean;
							completion?: boolean;
							leave?: boolean;
							declare?: boolean;
					  };
				block?:
					| boolean
					| {
							create?: boolean;
							enter?: boolean;
							interrupt?: boolean;
							completion?: boolean;
							leave?: boolean;
							declare?: boolean;
					  };
		  };

	with?: boolean;
};
