/**
 * @file Validates and runs JeJ code, returning a unified result.
 *
 * @remarks Validates against the full JeJ language level first.
 * If valid, delegates to the raw run engine (Web Worker +
 * SharedArrayBuffer) and normalizes the event log into a
 * structured {@link RunResult}.
 */

import deepFreezeInPlace from '../../../utils/deep-freeze-in-place.js';
import validate from './validate.js';
import rawRun from '../evaluating/run/run.js';

import type { RunResult } from './types.js';
import type {
	RunEvent,
	ErrorEvent as RunErrorEvent,
} from '../evaluating/shared/types.js';

/**
 * Validates code against the full JeJ level, then runs it.
 *
 * @param code - JavaScript source to validate and execute
 * @param maxSeconds - timeout in seconds for execution
 * @returns A frozen {@link RunResult}
 */
async function run(code: string, maxSeconds: number): Promise<RunResult> {
	const validation = validate(code);

	if (!validation.ok) {
		return validation;
	}

	const logs = await rawRun(code, maxSeconds);

	const errorEvent = findErrorEvent(logs);

	if (errorEvent) {
		if (errorEvent.name === 'TimeoutError') {
			return deepFreezeInPlace({
				ok: false as const,
				error: {
					kind: 'timeout' as const,
					name: errorEvent.name,
					message: errorEvent.message,
					...(errorEvent.line !== undefined ? { line: errorEvent.line } : {}),
					phase: errorEvent.phase,
					limit: maxSeconds,
				},
				...(validation.warnings ? { warnings: validation.warnings } : {}),
				logs,
			});
		}

		return deepFreezeInPlace({
			ok: false as const,
			error: {
				kind: 'javascript' as const,
				name: errorEvent.name,
				message: errorEvent.message,
				...(errorEvent.line !== undefined ? { line: errorEvent.line } : {}),
				phase: errorEvent.phase,
			},
			...(validation.warnings ? { warnings: validation.warnings } : {}),
			logs,
		});
	}

	return deepFreezeInPlace({
		ok: true as const,
		...(validation.warnings ? { warnings: validation.warnings } : {}),
		logs,
	});
}

/**
 * Finds the last error event in the log array.
 */
function findErrorEvent(logs: readonly RunEvent[]): RunErrorEvent | undefined {
	for (let i = logs.length - 1; i >= 0; i--) {
		const entry = logs[i];
		if (entry.event === 'error') {
			return entry;
		}
	}
	return undefined;
}

export default run;
