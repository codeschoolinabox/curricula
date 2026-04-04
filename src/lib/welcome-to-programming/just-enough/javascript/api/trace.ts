/**
 * @file Validates and traces JeJ code, returning an Execution.
 *
 * @remarks Pipeline: parse → validate → format check → trace.
 * Returns an `Execution<TraceEvent, TraceResult>` that is both
 * `AsyncIterable` (step-through) and `PromiseLike` (batch).
 *
 * Validation or format failures return an Execution that resolves
 * immediately with the error result — no Worker is spawned.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';
import validate from './validate.js';
import { checkFormat } from './format.js';
import createTracingGenerator from '../evaluating/trace/record/tracing/index.js';
import createExecution from '../evaluating/shared/create-execution.js';
import prepareConfig from '../evaluating/trace/configuring/prepare-config.js';
import optionsSchema from '../evaluating/trace/options-schema.js';

import type { TraceResult } from './types.js';
import type { Execution, TraceConfig } from '../evaluating/shared/types.js';
import type { TraceEvent } from '../evaluating/trace/record/tracing/types.js';

/**
 * Validates code against the full JeJ level, then traces it.
 *
 * @param code - JavaScript source to validate and trace
 * @param config - Trace configuration (seconds, iterations, options)
 * @returns An Execution that yields TraceEvents and resolves to TraceResult
 *
 * @remarks
 * - `await trace(code, config)` — batch mode, resolves to TraceResult
 * - `for await (const event of trace(code, config))` — step-through
 * - Second `for await` replays from cached result (no re-execution)
 * - `.cancel()` terminates Worker immediately
 *
 * Never throws. All errors are represented in the result.
 */
function trace(
	code: string,
	config?: TraceConfig,
): Execution<TraceEvent, TraceResult> {
	const validation = validate(code);

	// Validation failure — return immediately, no Worker
	if (!validation.ok) {
		// WHY: validate() already deep-freezes its result
		const result = validation as TraceResult;
		return createExecution(
			async function* () {
				return result;
			},
			function noop() {},
		);
	}

	// Format gate — unformatted JeJ cannot execute
	const { formatted } = checkFormat(code);
	if (!formatted) {
		const result = deepFreezeInPlace({
			ok: false as const,
			error: { kind: 'formatting' as const },
			logs: [] as TraceEvent[],
		});
		return createExecution(
			async function* () {
				return result;
			},
			function noop() {},
		);
	}

	const seconds = config?.seconds ?? 5;
	const maxMs = seconds * 1000;

	// Expand shorthand, fill defaults, validate against options.schema.json.
	// WHY prepareConfig: without this, empty config `{}` produces zero events
	// because all config gates default to false. prepareConfig uses JSON Schema
	// defaults to fill all booleans to `true`, and expands boolean shorthand
	// like `{ bindings: false }` to the full object structure.
	const tracingConfig = prepareConfig(
		config?.options ?? {},
		optionsSchema,
	) as Record<string, unknown>;

	return createExecution(
		() => createTracingGenerator(code, tracingConfig, maxMs),
		function noop() {},
	);
}

export default trace;
