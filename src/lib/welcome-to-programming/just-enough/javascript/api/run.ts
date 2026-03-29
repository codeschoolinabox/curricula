/**
 * @file Validates and runs JeJ code, returning an Execution.
 *
 * @remarks Pipeline: parse → validate → format check → execute.
 * Returns an `Execution<RunEvent, RunResult>` that is both
 * `AsyncIterable` (step-through) and `PromiseLike` (batch).
 *
 * Validation or format failures return an Execution that resolves
 * immediately with the error result — no Worker is spawned.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';
import validate from './validate.js';
import { checkFormat } from './format.js';
import createRunGenerator from '../evaluating/run/run.js';
import createExecution from '../evaluating/shared/create-execution.js';

import type { RunResult } from './types.js';
import type { Execution, EngineConfig } from '../evaluating/shared/types.js';
import type { RunEvent } from '../evaluating/shared/types.js';

/**
 * Validates code against the full JeJ level, then runs it.
 *
 * @param code - JavaScript source to validate and execute
 * @param config - Engine configuration (seconds, iterations)
 * @returns An Execution that yields RunEvents and resolves to RunResult
 *
 * @remarks
 * - `await run(code, config)` — batch mode, resolves to RunResult
 * - `for await (const e of run(code, config))` — step-through
 * - Second `for await` replays from cached result (no re-execution)
 * - `.cancel()` terminates Worker immediately
 *
 * Never throws. All errors are represented in the result.
 */
function run(
	code: string,
	config?: EngineConfig,
): Execution<RunEvent, RunResult> {
	const validation = validate(code);

	// Validation failure — return immediately, no Worker
	if (!validation.ok) {
		// WHY: validate() already deep-freezes its result
		const result = validation as RunResult;
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

	return createExecution(
		() => createRunGenerator(code, seconds, iterations),
		// WHY: cancelFn is a no-op — the generator's finally block
		// handles Worker termination when createExecution calls
		// generator.return()
		function noop() {},
	);
}

export default run;
