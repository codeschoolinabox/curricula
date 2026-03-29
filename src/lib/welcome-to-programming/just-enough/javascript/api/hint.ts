/**
 * @file Full pre-execution analysis: validate + format check + warnings.
 *
 * @remarks Combines three concerns in a single synchronous call:
 *
 * 1. **Validate** — parse and check JeJ compliance. If code fails
 *    validation, returns immediately with `ok: false` and empty
 *    warnings (no point analyzing non-JeJ code).
 * 2. **Format check** — calls `checkFormat()` to report whether
 *    code matches the expected format. Included as the `formatted`
 *    boolean field — informational, not blocking.
 * 3. **Warning detection** — runs misconception and code smell
 *    detectors on valid JeJ code.
 *
 * Never throws. Result is deep-frozen before returning.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';
import validateProgram from '../validating/validate-program.js';
import parseProgram from '../validating/parse-program.js';
import justEnoughJs from '../validating/just-enough-js.js';
import collectWarnings from '../hinting/collect-warnings.js';
import checkFormat from '../formatting/check-format.js';

import type { HintResult } from './types.js';

/**
 * Full pre-execution analysis of JeJ code.
 *
 * @param code - JavaScript source code to analyze
 * @returns Frozen HintResult with warnings and format status
 */
export default function hint(code: string): HintResult {
	const report = validateProgram(code, justEnoughJs);

	// 1. Parse error — short-circuit
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
			warnings: [] as readonly [],
			formatted: false,
		});
	}

	// 2. Split violations — scope warnings (unused vars, shadowing)
	// stay in the validation report alongside rejections
	const rejections = report.violations.filter(
		(v) => v.severity === 'rejection',
	);
	const scopeWarnings = report.violations.filter(
		(v) => v.severity === 'warning',
	);

	// 3. Validation failure — short-circuit (no warnings for non-JeJ)
	if (rejections.length > 0) {
		return deepFreezeInPlace({
			ok: false,
			rejections,
			warnings: [] as readonly [],
			formatted: false,
		});
	}

	// 4. Valid JeJ — collect AST-based warnings from hinting module
	// WHY reparse: validating/ no longer runs collectWarnings. Acorn
	// parsing is ~1ms for JeJ-sized programs — acceptable tradeoff
	// for clean module boundaries.
	const ast = parseProgram(code, 'module');
	const astWarnings =
		'message' in ast ? [] : collectWarnings(ast, code);
	const warnings = [...scopeWarnings, ...astWarnings];

	// 5. Check format and return
	const { formatted } = checkFormat(code);

	return deepFreezeInPlace({
		ok: true,
		warnings,
		formatted,
	});
}
