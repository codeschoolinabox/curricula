/**
 * Quick boolean check: is this code ready to execute in the
 * learning environment?
 *
 * @remarks Runs the full pre-execution pipeline synchronously:
 * parse + JeJ validation + format check. Returns `true` only
 * if ALL three pass.
 *
 * Equivalent to `validate(code).ok && checkFormat(code).formatted`.
 *
 * **Sync** — recast format check is synchronous.
 *
 * @param code - JavaScript source code to check
 * @returns `true` if code parses, passes JeJ validation, AND
 *   is properly formatted
 *
 * @example
 * ```ts
 * isJej('let x = 5;\n');          // true
 * isJej('let x =   5;\n');        // false (unformatted)
 * isJej('var x = 5;\n');          // false (not JeJ)
 * isJej('console.log = 5;\n');    // false (property assignment)
 * isJej('let x = ;');             // false (parse error)
 * ```
 */

import validateProgram from './validate-program.js';
import justEnoughJs from './just-enough-js.js';
import checkFormat from '../formatting/check-format.js';

export default function isJej(code: string): boolean {
	const report = validateProgram(code, justEnoughJs);

	if (!report.isValid) return false;

	return checkFormat(code).formatted;
}
