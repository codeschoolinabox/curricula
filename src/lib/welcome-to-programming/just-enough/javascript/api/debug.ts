/**
 * @file Validates and debugs JeJ code, returning a unified result.
 *
 * @remarks Validates against the full JeJ language level first.
 * If valid, delegates to the raw debug engine (iframe +
 * debugger statements) and normalizes the outcome into a
 * {@link DebugResult}.
 *
 * Catches rejections from the raw debug engine and classifies
 * by error name: RangeError → `kind: 'iteration-limit'`,
 * others → `kind: 'javascript'`.
 */

import deepFreezeInPlace from '../../../utils/deep-freeze-in-place.js';
import validate from './validate.js';
import rawDebug from '../evaluating/debug/index.js';

import type { DebugResult } from './types.js';

/**
 * Validates code against the full JeJ level, then debugs it.
 *
 * @param code - JavaScript source to validate and debug
 * @param maxIterations - maximum loop iterations before RangeError
 * @returns A frozen {@link DebugResult}
 */
async function debug(
	code: string,
	maxIterations: number,
): Promise<DebugResult> {
	const validation = validate(code);

	if (!validation.ok) {
		return validation;
	}

	try {
		await rawDebug(code, maxIterations);
	} catch (err: unknown) {
		const error = err instanceof Error ? err : new Error(String(err));

		if (error.name === 'RangeError') {
			return deepFreezeInPlace({
				ok: false as const,
				error: {
					kind: 'iteration-limit' as const,
					name: error.name,
					message: error.message,
					phase: 'execution' as const,
					limit: maxIterations,
				},
				...(validation.warnings ? { warnings: validation.warnings } : {}),
			});
		}

		return deepFreezeInPlace({
			ok: false as const,
			error: {
				kind: 'javascript' as const,
				name: error.name,
				message: error.message,
				phase: 'creation' as const,
			},
			...(validation.warnings ? { warnings: validation.warnings } : {}),
		});
	}

	return deepFreezeInPlace({
		ok: true as const,
		...(validation.warnings ? { warnings: validation.warnings } : {}),
	});
}

export default debug;
