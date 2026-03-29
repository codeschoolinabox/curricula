/**
 * @file Validates and traces JeJ code, returning an Execution.
 *
 * @remarks Pipeline: parse → validate → format check → trace.
 * Returns an `Execution<AranStep, TraceResult>` that is both
 * `AsyncIterable` (step-through) and `PromiseLike` (batch).
 *
 * Validation or format failures return an Execution that resolves
 * immediately with the error result — no Worker is spawned.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';
import validate from './validate.js';
import { checkFormat } from './format.js';
import createRecordGenerator from '../evaluating/trace/record/record.js';
import createExecution from '../evaluating/shared/create-execution.js';

import type { TraceResult } from './types.js';
import type { Execution, TraceConfig } from '../evaluating/shared/types.js';
import type { AranStep } from '../evaluating/trace/record/types.js';

/**
 * Validates code against the full JeJ level, then traces it.
 *
 * @param code - JavaScript source to validate and trace
 * @param config - Trace configuration (seconds, iterations, options)
 * @returns An Execution that yields AranSteps and resolves to TraceResult
 *
 * @remarks
 * - `await trace(code, config)` — batch mode, resolves to TraceResult
 * - `for await (const step of trace(code, config))` — step-through
 * - Second `for await` replays from cached result (no re-execution)
 * - `.cancel()` terminates Worker immediately
 *
 * Never throws. All errors are represented in the result.
 */
function trace(
	code: string,
	config?: TraceConfig,
): Execution<AranStep, TraceResult> {
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
		});
		return createExecution(
			async function* () {
				return result;
			},
			function noop() {},
		);
	}

	const seconds = config?.seconds ?? 5;
	const iterations = config?.iterations;
	// WHY: TraceConfig.options flows to the record generator which
	// passes it to filterSteps for post-trace filtering. The legacy
	// tracer captures everything; filtering is done after collection.
	const options =
		config?.options as
			| import('../evaluating/trace/record/types.js').AranFilterOptions
			| undefined;

	return createExecution(
		() => createRecordGenerator(code, seconds, options, iterations),
		function noop() {},
	);
}

export default trace;
