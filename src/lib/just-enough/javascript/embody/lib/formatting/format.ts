/**
 * @file Prettier-based code formatter for JeJ.
 *
 * Uses prettier (standalone build) with a fixed configuration — no
 * options, no overrides. All JeJ code looks identical in structure.
 *
 * Works on ANY valid JavaScript, not just JeJ. Learners can format
 * code while iterating towards JeJ compliance.
 *
 * Asynchronous — prettier.format is async. Blank lines between
 * statements are preserved (1+ in source → exactly 1 in output),
 * which is the reason for choosing Prettier over recast.
 */

import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';
import { format as prettierFormat } from 'prettier/standalone';

/**
 * Format JavaScript source code the JeJ way.
 *
 * @param code - ANY valid JavaScript source code
 * @returns Promise resolving to formatted code. Graceful degradation:
 *   resolves to the original code unchanged if Prettier throws
 *   (e.g. on a parse error).
 */
export default async function format(code: string): Promise<string> {
	try {
		return await prettierFormat(code, JEJ_PRETTIER_OPTIONS);
	} catch {
		return code;
	}
}

/**
 * Fixed Prettier options for JeJ formatting.
 *
 * WHY these values: match the project's .editorconfig and established
 * style. No configurability — the whole point is uniformity.
 *
 * `parser: 'babel'` covers all valid JS the learners may write while
 * iterating toward JeJ compliance (no JSX/decorators/Flow needed).
 */
const JEJ_PRETTIER_OPTIONS = Object.freeze({
	parser: 'babel',
	plugins: [estreePlugin, babelPlugin],
	useTabs: true,
	tabWidth: 4,
	printWidth: 80,
	singleQuote: true,
	semi: true,
});
