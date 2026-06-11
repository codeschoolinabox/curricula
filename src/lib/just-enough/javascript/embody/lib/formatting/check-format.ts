/**
 * @file Format check for JeJ code.
 *
 * Compares code against the expected Prettier output. Asynchronous
 * (because `format()` is async).
 *
 * Graceful degradation: if Prettier throws, returns `{ formatted: true }`
 * — don't block learners on formatter bugs.
 */

import format from './format.js';
import type { CheckFormatResult } from './types.js';

/**
 * Check whether code matches the expected JeJ format.
 *
 * @param code - JavaScript source code to check
 * @returns `Promise<{ formatted: boolean }>`
 */
export default async function checkFormat(
	code: string,
): Promise<CheckFormatResult> {
	try {
		return { formatted: (await format(code)) === code };
	} catch {
		return { formatted: true };
	}
}
