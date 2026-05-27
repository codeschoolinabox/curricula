/**
 * @file Best-effort acorn parse that never throws.
 *
 * @remarks Tries module mode first, then script mode. Returns
 * `null` if neither succeeds. Retained as a test-fixture builder
 * for `tests/parse-best-effort.test.ts`,
 * `tests/find-node-at-line.test.ts`, and
 * `tests/extract-context.test.ts`. Production-side
 * `interpret-error.ts` reads its AST directly from
 * `embodiment.raw.ast`.
 */

import { parse, type Program } from 'acorn';

/**
 * Attempts to parse source code into an ESTree AST.
 *
 * @param source - JavaScript source code
 * @returns The parsed `Program` node, or `null` if parsing fails
 */
function parseBestEffort(source: string): Program | null {
	// 1. Try module mode (JEJ programs run as modules)
	try {
		return parse(source, {
			ecmaVersion: 'latest',
			sourceType: 'module',
			locations: true,
		});
	} catch {
		// fall through
	}

	// 2. Try script mode (some edge cases parse only in script)
	try {
		return parse(source, {
			ecmaVersion: 'latest',
			sourceType: 'script',
			locations: true,
		});
	} catch {
		return null;
	}
}

export default parseBestEffort;
