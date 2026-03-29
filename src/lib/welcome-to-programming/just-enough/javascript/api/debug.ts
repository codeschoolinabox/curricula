/**
 * @file Validates and debugs JeJ code, returning an Execution.
 *
 * @remarks Pipeline: parse → validate → format check → debug.
 * Returns an `Execution<DebugEvent, DebugResult>` that is both
 * `AsyncIterable` (step-through) and `PromiseLike` (batch).
 *
 * Validation or format failures return an Execution that resolves
 * immediately with the error result — no iframe is created.
 *
 * Debug yields 0 events on success, 1 on error. No SAB pause.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';
import validate from './validate.js';
import { checkFormat } from './format.js';
import createDebugGenerator from '../evaluating/debug/index.js';
import createExecution from '../evaluating/shared/create-execution.js';

import type { DebugResult, DebugEvent } from './types.js';
import type { Execution, EngineConfig } from '../evaluating/shared/types.js';

/**
 * Validates code against the full JeJ level, then debugs it.
 *
 * @param code - JavaScript source to validate and debug
 * @param config - Engine configuration (only `iterations` supported —
 *   `seconds` is not supported for iframe-based debug)
 * @returns An Execution that yields DebugEvents and resolves to DebugResult
 *
 * @remarks
 * - `await debug(code, config)` — batch mode, resolves to DebugResult
 * - `for await (const event of debug(code, config))` — step-through
 * - `.cancel()` is a no-op (iframe lifecycle managed by DOM)
 *
 * Never throws. All errors are represented in the result.
 */
function debug(
	code: string,
	config?: EngineConfig,
): Execution<DebugEvent, DebugResult> {
	const validation = validate(code);

	// Validation failure — return immediately, no iframe
	if (!validation.ok) {
		// WHY: validate() already deep-freezes its result
		const result = validation as DebugResult;
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

	const iterations = config?.iterations;

	return createExecution(
		() => createDebugGenerator(code, iterations),
		function noop() {},
	);
}

export default debug;
