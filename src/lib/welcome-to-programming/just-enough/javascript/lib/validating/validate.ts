/**
 * @file Validates code against the full Just Enough JavaScript level.
 *
 * @remarks Public entry of `lib/validating/`. Wraps `validateProgram`
 * (the building-block pipeline) and shapes the report as a frozen
 * {@link BaseResult}. Used directly by consumers wanting the
 * shaped/frozen result; tools needing the raw `ValidationReport`
 * (with `source`, `levelName`, nested `parseError`, `scriptMode`)
 * should call `validateProgram` instead.
 *
 * Also serves as the shared validation gate for execution wrappers
 * (`run`, `trace`, `debug`) — each calls `validate` first and
 * early-returns if `!result.ok`.
 *
 * Never throws (for string input).
 */

import type { Program } from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import justEnoughJs from './just-enough-js.js';
import validateProgram from './validate-program.js';

import type { BaseResult } from './types.js';

/**
 * Validates a program against the full Just Enough JavaScript level.
 *
 * @param code - JavaScript source to validate
 * @returns A frozen {@link BaseResult}, augmented with the parsed
 *   acorn `Program` when parsing succeeded. The `ast` field is
 *   undefined only when parse itself failed.
 */
function validate(
	code: string,
): BaseResult & { readonly ast?: Program } {
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
	//    (parse succeeded; ast is available)
	const rejections = report.violations;
	if (rejections.length > 0) {
		return deepFreezeInPlace({
			ok: false,
			rejections,
			...(report.ast ? { ast: report.ast } : {}),
		});
	}

	// 3. Valid (parse succeeded; ast is available)
	return deepFreezeInPlace({
		ok: true,
		...(report.ast ? { ast: report.ast } : {}),
	});
}

export default validate;
