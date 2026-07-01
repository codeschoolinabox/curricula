/**
 * @file TraceConfig, TraceOptions, and range types for the semantics tracer.
 *
 * Canonical location for all trace configuration types. The 5-layer mental
 * model (README § The 5-layer mental model):
 *
 * ```
 * ast (static)   always present on the result — the frozen program structure
 * resolve        data layer       — what values flowed through the program
 * expression     expression layer — which code produced those values
 * statements     statement layer  — how execution was controlled
 * scopes         structure layer  — scope boundaries + binding lifecycle
 * ```
 *
 * Each dynamic layer accepts `boolean` (shorthand: enable/disable everything
 * in the layer) or an object (fine-grained: enable only specific sub-events).
 * Boolean shorthand is expanded by `prepare/expand-shorthand.ts` before the
 * config is used. The default (omitting a layer) is all events enabled.
 * Alongside the layers, the top-level `errors` flag gates the error channel
 * (README § error channel).
 *
 * @example Data-only trace — what values flowed, nothing else:
 * ```ts
 * { resolve: { dependent: false }, expression: false, statements: false, scopes: false }
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

import type { DialogProviders } from './types.js';

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
 * Events outside the range are not emitted — dropped worker-side at
 * dispatch, reading the runtime gate bundle (never baked into the woven
 * code, so a highlight change never re-instruments). Primary UI use case:
 * learner highlights a code selection and traces only the events under the
 * highlight. The ast record is never range-filtered.
 *
 * Cross-field constraint `start ≤ end` is validated by the prepare
 * pipeline's cross-field checks. Normalization: a bare `number n` is treated
 * as `{ line: n, column: 0 }` for start and
 * `{ line: n, column: Number.MAX_SAFE_INTEGER }` for end.
 */
export type SourceRange = {
	readonly start: RangePosition;
	readonly end: RangePosition;
};

// ─── TraceConfig ─────────────────────────────────────────────

/**
 * Configuration for the semantics tracer.
 *
 * @remarks
 * Execution constraints control when the program stops: `seconds` is the
 * engine's time budget (the only engine-owned limit; default 5), and
 * `iterations` is the instrumentation-owned loop cap (exceeding it settles
 * as errored with the iteration-limit refinement). `options` controls which
 * events are captured. `range` filters events to a source window. `dialogs`
 * supplies the dialog provider for learner `prompt` / `confirm` / `alert`
 * calls (README § dialog round-trip) — omitted, the environment's own
 * dialogs serve; absent both, a dialog call settles the run as a call error.
 *
 * Omitting `options` defaults to a full trace (all events enabled).
 * Omitting `range` traces the entire program.
 *
 * @example
 * ```ts
 * traceSemantics(code, { seconds: 5 });
 * traceSemantics(code, { options: { expression: { variables: true } } });
 * traceSemantics(code, { range: { start: 3, end: 7 } }); // lines 3–7 only
 * traceSemantics(code, { dialogs: { prompt: () => 'scripted' } });
 * ```
 */
export type TraceConfig = {
	/** Engine time budget in seconds; the engine defaults to 5 when omitted. */
	readonly seconds?: number;
	/** Instrumentation-owned loop iteration cap. */
	readonly iterations?: number;
	readonly options?: TraceOptions;
	readonly range?: SourceRange;
	readonly dialogs?: DialogProviders;
};

// ─── TraceOptions ────────────────────────────────────────────

/**
 * Per-kind gates for ResolveEvents. `true`/`false` shorthand covers all
 * kinds; the object form gates kind-by-kind.
 */
export type ResolveKindsOptions = {
	variable?: boolean;
	literal?: boolean;
	operator?: boolean;
	shortCircuit?: boolean;
	conditional?: boolean;
	assignment?: boolean;
	increment?: boolean;
	property?: boolean;
	call?: boolean;
	template?: boolean;
};

/**
 * The data layer's three orthogonal sub-flags (README § co-gating,
 * § provenance):
 *
 * - `dependent` (default true) — ResolveEvents co-gate with their paired
 *   expression event, decided at weave time. `false` frees resolves to fire
 *   alone (a pure data trace).
 * - `provenance` (default true) — ResolveEvents carry `valueId` +
 *   `sourceValueIds` for data-flow reconstruction. Opt out to trim payload.
 * - `kinds` (default all true) — per-kind gates, orthogonal to `dependent`.
 */
export type ResolveOptions = {
	dependent?: boolean;
	provenance?: boolean;
	kinds?: boolean | ResolveKindsOptions;
};

/**
 * Options controlling trace granularity — which events appear in the output.
 *
 * @remarks
 * Structured by the 5-layer mental model. Each layer accepts `boolean`
 * (shorthand) or an object (fine-grained). Boolean shorthand is expanded by
 * `prepare/expand-shorthand.ts`. The default (omitting a layer) is all
 * events enabled.
 *
 * Layers and flags:
 * - `resolve`    — data layer: ResolveEvents carrying produced values
 * - `expression` — expression layer: which code produced those values
 * - `statements` — statement layer: how execution was controlled
 * - `scopes`     — structure layer: scope boundaries + binding lifecycle
 * - `errors`     — the error channel: the ErrorEvent on an unhandled error
 *   (top-level flag, default true; `false` suppresses the event, never the
 *   settlement's halt)
 */
export type TraceOptions = {
	resolve?: boolean | ResolveOptions;

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

	errors?: boolean;
};
