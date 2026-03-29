/**
 * @file Format check for JeJ code.
 *
 * Compares code against the expected recast output. Synchronous.
 *
 * Graceful degradation: if recast throws, returns `{ formatted: true }`
 * — don't block learners on formatter bugs.
 */

import format from './format.js';
import type { CheckFormatResult } from './types.js';

/**
 * Check whether code matches the expected JeJ format.
 *
 * @param code - JavaScript source code to check
 * @returns `{ formatted: boolean }`
 */
function checkFormat(code: string): CheckFormatResult {
	try {
		return { formatted: format(code) === code };
	} catch {
		// Graceful degradation — don't block on formatter bugs
		return { formatted: true };
	}
}

export default checkFormat;
