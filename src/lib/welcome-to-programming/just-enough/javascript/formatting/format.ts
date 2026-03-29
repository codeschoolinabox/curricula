/**
 * @file Recast-based code formatter for JeJ.
 *
 * Uses recast.prettyPrint() with a fixed configuration — no options,
 * no overrides. All JeJ code looks identical in structure.
 *
 * Works on ANY valid JavaScript, not just JeJ. Learners can format
 * code while iterating towards JeJ compliance.
 *
 * Synchronous — recast.prettyPrint() is sync, unlike Prettier/standalone.
 */

import * as recast from 'recast';

/**
 * Fixed recast print options for JeJ formatting.
 *
 * WHY these values: match the project's .editorconfig and established
 * style. No configurability — the whole point is uniformity.
 *
 * WHY tabWidth 4 (not useTabs): recast.prettyPrint() ignores
 * useTabs. We print with 4-space indent, then convert leading
 * spaces to tabs in post-processing.
 */
const JEJ_PRINT_OPTIONS: recast.Options = Object.freeze({
	tabWidth: 4,
	quote: 'single',
	wrapColumn: 80,
});

/**
 * Convert leading groups of 4 spaces to tabs on each line.
 *
 * WHY post-process: recast.prettyPrint() does not support useTabs.
 */
function spacesToTabs(code: string): string {
	return code.replace(/^( {4})+/gm, (match) => {
		return '\t'.repeat(match.length / 4);
	});
}

/**
 * Format JavaScript source code the JeJ way.
 *
 * @param code - ANY valid JavaScript source code
 * @returns Formatted code string. Graceful degradation: returns the
 *   original code unchanged if recast throws.
 */
function format(code: string): string {
	try {
		const ast = recast.parse(code);
		const printed = recast.prettyPrint(ast, JEJ_PRINT_OPTIONS).code;
		const tabbed = spacesToTabs(printed);
		// WHY: recast strips trailing newlines but POSIX convention and
		// .editorconfig both require a final newline. Empty programs stay empty.
		if (tabbed === '') return '';
		return tabbed.endsWith('\n') ? tabbed : tabbed + '\n';
	} catch {
		return code;
	}
}

export default format;
