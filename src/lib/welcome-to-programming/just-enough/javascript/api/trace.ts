/**
 * @file Validates and traces JeJ code, returning a unified result.
 *
 * @remarks Validates against the full JeJ language level first.
 * If valid, delegates to the raw Aran tracer and normalizes
 * the structured steps into a {@link TraceResult}.
 *
 * Exception steps (operation: 'exception') are detected and
 * classified by error name: TimeoutError → `kind: 'timeout'`,
 * others → `kind: 'javascript'`.
 */

import deepFreezeInPlace from '../../../utils/deep-freeze-in-place.js';
import validate from './validate.js';
import rawRecord from '../evaluating/trace/record/record.js';

import type { TraceResult } from './types.js';
import type {
	AranFilterOptions,
	AranStep,
} from '../evaluating/trace/record/types.js';

/**
 * Validates code against the full JeJ level, then traces it.
 *
 * @param code - JavaScript source to validate and trace
 * @param maxSeconds - timeout in seconds for execution
 * @param options - optional Aran filter options for step filtering
 * @returns A frozen {@link TraceResult}
 */
async function trace(
	code: string,
	maxSeconds: number,
	options?: AranFilterOptions,
): Promise<TraceResult> {
	const validation = validate(code);

	if (!validation.ok) {
		return validation;
	}

	const steps = await rawRecord(code, {
		meta: {
			max: {
				steps: null,
				iterations: null,
				callstack: null,
				time: maxSeconds * 1000,
			},
			range: null,
			timestamps: false,
			debug: { ast: false },
		},
		options: options ?? {},
	});

	const exceptionStep = findExceptionStep(steps);

	if (exceptionStep) {
		const errorName = extractErrorName(exceptionStep);

		if (errorName === 'TimeoutError') {
			return deepFreezeInPlace({
				ok: false as const,
				error: {
					kind: 'timeout' as const,
					name: errorName,
					message: extractErrorMessage(exceptionStep),
					...(exceptionStep.loc ? { line: exceptionStep.loc.start.line } : {}),
					phase: 'execution' as const,
					limit: maxSeconds,
				},
				...(validation.warnings ? { warnings: validation.warnings } : {}),
				steps,
			});
		}

		return deepFreezeInPlace({
			ok: false as const,
			error: {
				kind: 'javascript' as const,
				name: errorName,
				message: extractErrorMessage(exceptionStep),
				...(exceptionStep.loc ? { line: exceptionStep.loc.start.line } : {}),
				phase: 'execution' as const,
			},
			...(validation.warnings ? { warnings: validation.warnings } : {}),
			steps,
		});
	}

	return deepFreezeInPlace({
		ok: true as const,
		...(validation.warnings ? { warnings: validation.warnings } : {}),
		steps,
	});
}

/**
 * Finds the last exception step in the trace output.
 */
function findExceptionStep(steps: readonly AranStep[]): AranStep | undefined {
	for (let i = steps.length - 1; i >= 0; i--) {
		if (steps[i].operation === 'exception') {
			return steps[i];
		}
	}
	return undefined;
}

/**
 * Extracts the error name from an exception step's values.
 *
 * @remarks Red-style exceptions have [errorName, ...messageParts].
 * Phase errors have [errorMessage]. Falls back to 'Error'.
 */
function extractErrorName(step: AranStep): string {
	const first = step.values[0];
	if (typeof first === 'string' && first.endsWith('Error')) {
		return first;
	}
	return 'Error';
}

/**
 * Extracts the error message from an exception step's values.
 *
 * @remarks Red-style: values[1..] joined. Phase errors: values[0].
 */
function extractErrorMessage(step: AranStep): string {
	if (step.values.length > 1) {
		const first = step.values[0];
		if (typeof first === 'string' && first.endsWith('Error')) {
			return step.values.slice(1).map(String).join(' ');
		}
	}
	return step.values.map(String).join(' ') || 'Unknown error';
}

export default trace;
