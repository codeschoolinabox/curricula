/**
 * @file Validates code against the full JeJ language level.
 *
 * @remarks Public API for validation-only use (e.g. real-time
 * feedback in a study environment). Also serves as the shared
 * preamble for run, trace, and debug — each calls {@link validate}
 * first and early-returns if `!result.ok`.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';
import validateProgram from '../validating/validate-program.js';
import justEnoughJs from '../validating/just-enough-js.js';

import type { BaseResult } from './types.js';

/**
 * Validates a program against the full Just Enough JavaScript level.
 *
 * @param code - JavaScript source to validate
 * @returns A frozen {@link BaseResult}
 */
function validate(code: string): BaseResult {
	const report = validateProgram(code, justEnoughJs);

	// 1. Parse error — code is not valid syntax
	if (report.parseError) {
		return deepFreezeInPlace({
			ok: false,
			error: {
				kind: 'parse' as const,
				name: 'SyntaxError',
				message: report.parseError.message,
				line: report.parseError.location.line,
				column: report.parseError.location.column,
			},
		});
	}

	// 2. Rejections — code has language-level violations
	const rejections = report.violations;
	if (rejections.length > 0) {
		return deepFreezeInPlace({
			ok: false,
			rejections,
		});
	}

	// 4. Valid
	return deepFreezeInPlace({
		ok: true,
	});
}

export default validate;
