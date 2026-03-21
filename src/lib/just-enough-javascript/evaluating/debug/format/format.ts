/**
 * Prettier-based code formatter for learner JavaScript.
 *
 * Uses prettier/standalone for browser compatibility — no Node.js fs
 * dependency. Formats AST-generated code (e.g. after loop guard injection)
 * so the learner sees clean, readable code in the debugger.
 */

import { format } from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';

import type { Options } from 'prettier';

const LEARNER_DEFAULTS: Options = Object.freeze({
	parser: 'babel',
	useTabs: true,
	tabWidth: 4,
	printWidth: 80,
	semi: true,
	singleQuote: true,
	trailingComma: 'all',
	bracketSpacing: true,
	proseWrap: 'always',
});

/**
 * Formats JavaScript code using Prettier with learner-friendly defaults.
 *
 * Graceful degradation: returns the original code unchanged if Prettier
 * throws (formatting is cosmetic, not critical).
 *
 * @param code - JavaScript source code to format
 * @param options - Partial Prettier options to override defaults
 * @returns Formatted code string
 */
async function formatCode(
	code: string,
	options: Partial<Options> = {},
): Promise<string> {
	try {
		return await format(code, {
			...LEARNER_DEFAULTS,
			...options,
			plugins: [babelPlugin, estreePlugin],
		});
	} catch {
		return code;
	}
}

export default formatCode;
