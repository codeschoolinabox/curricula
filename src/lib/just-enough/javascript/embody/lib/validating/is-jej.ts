/**
 * Quick boolean check: is this code ready to execute in the
 * learning environment?
 *
 * @remarks Runs the full pre-execution pipeline:
 * parse + JeJ validation + format check. Resolves `true` only
 * if ALL three pass.
 *
 * Equivalent to
 * `validate(code).ok && (await checkFormat(code)).formatted`.
 *
 * **Async** — Prettier-based format check is async.
 *
 * @param code - JavaScript source code to check
 * @returns `Promise<true>` if code parses, passes JeJ validation,
 *   AND is properly formatted
 *
 * @example
 * ```ts
 * await isJej('let x = 5;\n');          // true
 * await isJej('let x =   5;\n');        // false (unformatted)
 * await isJej('var x = 5;\n');          // false (not JeJ)
 * await isJej('console.log = 5;\n');    // false (property assignment)
 * await isJej('let x = ;');             // false (parse error)
 * ```
 */

import checkFormat from '../formatting/check-format.js';

import justEnoughJs from './just-enough-js.js';
import validateProgram from './validate-program.js';

export default async function isJej(code: string): Promise<boolean> {
	const report = validateProgram(code, justEnoughJs);

	if (!report.isValid) return false;

	const formatCheck = await checkFormat(code);
	return formatCheck.formatted;
}
