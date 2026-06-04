/**
 * @file Pre-flight preparation pipeline for the JEJ trace engine.
 *
 * Called by the tracer (`createTracingGenerator`) as its first step, before
 * any Aran instrumentation runs. Validates input, expands the user's config
 * against the canonical schema, applies defaults, runs cross-field semantic
 * checks, and returns the prepared config ready for consumption by the
 * instrumentation pipeline.
 *
 * Pipeline (mirrors sl-tracing's `api/trace.ts` traceWith, self-contained):
 *
 *   1. Validate `code` is a string        → ArgumentInvalidError (plain Error)
 *   2. Validate `config` is an object     → ArgumentInvalidError (plain Error)
 *   3. prepareConfig(options, schema)     → OptionsInvalidError (plain Error)
 *   4. verifyOptions(config)              → OptionsSemanticInvalidError (plain Error)
 *   5. Return { options, range, seconds, iterations }
 *
 * All validation is synchronous. A failure anywhere throws immediately —
 * the caller (`createTracingGenerator`) catches and wraps into a failure
 * `TraceResult` with `ok: false`.
 *
 * @see ./prepare-config.ts — the three-stage AJV pipeline
 * @see ./verify-options.ts — cross-field semantic checks
 */

import optionsSchema from '../options-schema.js';
import prepareConfig from './prepare-config.js';
import verifyOptions from './verify-options.js';

import type { TraceConfig } from '../config.types.js';
import type { PreparedTraceInput } from './types.js';

/**
 * Prepares a code string and raw trace config for execution.
 *
 * @param code - Source code to trace (must be a string)
 * @param config - Optional trace config; any missing field gets its schema default
 * @returns PreparedTraceInput — validated code + resolved options + raw meta fields
 * @throws Error if `code` is not a string
 * @throws Error if `config` is provided but not an object
 * @throws Error if `config.options` fails JSON Schema validation
 * @throws Error if cross-field semantic constraints are violated (range start > end, etc.)
 */
function prepareForTrace(code: unknown, config?: unknown): PreparedTraceInput {
	// 1. Validate code type (sync)
	if (typeof code !== 'string') {
		throw new Error(
			`prepareForTrace: expected code to be a string, got ${typeof code}`,
		);
	}

	// 2. Validate config type (sync)
	if (config !== undefined && config !== null && typeof config !== 'object') {
		throw new Error(
			`prepareForTrace: expected config to be an object, got ${typeof config}`,
		);
	}

	// 3. Extract raw meta fields + options (JEJ's flat TraceConfig shape)
	const userConfig = (config ?? {}) as TraceConfig;
	const rawOptions = (userConfig.options ?? {}) as unknown;

	// 4. Prepare options via expand → fill → validate
	const options = prepareConfig(rawOptions, optionsSchema) as Record<
		string,
		unknown
	>;

	// 5. Assemble the config shape verifyOptions expects (flat TraceConfig-like)
	const verifiable: Record<string, unknown> = {};
	if (userConfig.range !== undefined) verifiable['range'] = userConfig.range;
	if (userConfig.iterations !== undefined)
		verifiable['iterations'] = userConfig.iterations;
	if (userConfig.seconds !== undefined)
		verifiable['seconds'] = userConfig.seconds;

	// 6. Cross-field semantic validation (throws on violation)
	verifyOptions(verifiable);

	// Conditional spread: under `exactOptionalPropertyTypes: true`, an optional
	// property must be absent OR match its declared type — never explicitly
	// `undefined`. Building with spreads omits the key when the source is absent.
	return {
		code,
		options,
		...(userConfig.range !== undefined && { range: userConfig.range }),
		...(userConfig.iterations !== undefined && {
			iterations: userConfig.iterations,
		}),
		...(userConfig.seconds !== undefined && { seconds: userConfig.seconds }),
	};
}

export default prepareForTrace;
