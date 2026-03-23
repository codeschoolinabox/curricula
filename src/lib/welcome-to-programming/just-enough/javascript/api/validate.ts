/**
 * @file Validates code against the full JeJ language level.
 *
 * @remarks Public API for validation-only use (e.g. real-time
 * feedback in a study environment). Also serves as the shared
 * preamble for run, trace, and debug — each calls {@link validate}
 * first and early-returns if `!result.ok`.
 */

import deepFreezeInPlace from '../../../utils/deep-freeze-in-place.js';
import validateProgram from '../verify-language-level/validate-program.js';
import justEnoughJs from '../verify-language-level/just-enough-js.js';

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

	// 2. Split violations by severity
	const rejections = report.violations.filter(
		(v) => v.severity === 'rejection',
	);
	const warnings = report.violations.filter((v) => v.severity === 'warning');

	// 3. Rejections — code has language-level violations
	if (rejections.length > 0) {
		return deepFreezeInPlace({
			ok: false,
			rejections,
			warnings,
		});
	}

	// 4. Valid — possibly with warnings
	return deepFreezeInPlace({
		ok: true,
		warnings,
	});
}

export default validate;
