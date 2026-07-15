import { parse } from 'acorn';
import type { Program } from 'acorn';

import type { ParseError } from './types.js';

/**
 * Parses a JavaScript source string into an acorn `Program` AST.
 *
 * @remarks The low-level parse primitive owned by `lib/parse/`.
 * Used by `parse()` (the public lib/parse entry, planned Phase 1a)
 * and by `validateProgram` in `lib/validating/`. Both consumers
 * need graceful degradation for student code with syntax errors,
 * so this function never throws — parse errors are returned as
 * {@link ParseError} values instead.
 *
 * Uses acorn with `ecmaVersion: 'latest'`, `locations: true` (every
 * node carries line/column data for violation reporting), and
 * `preserveParens: true` (keeps `ParenthesizedExpression` nodes so
 * trace visualization has anchor points for grouping parens).
 *
 * @param source - The raw JavaScript source code to parse.
 * @param sourceType - Acorn's source type: `'script'` or `'module'`.
 *   Module mode enables ES module syntax and implicit strict mode.
 *   Defaults to `'script'` for backwards compatibility; the JeJ
 *   validation pipeline always passes `'module'`.
 * @returns An acorn `Program` AST on success, or a frozen
 *   {@link ParseError} on failure.
 */
export default function parseProgram(
	source: string,
	sourceType: 'script' | 'module' = 'script',
): Program | ParseError {
	try {
		return parse(source, {
			ecmaVersion: 'latest',
			sourceType,
			locations: true,
			// WHY: preserveParens keeps ParenthesizedExpression nodes in
			// the AST, giving trace visualization an anchor for grouping
			// parentheses (e.g. `(a + b) * c`). Without this, parens
			// are syntactically transparent and have no ESTree node.
			preserveParens: true,
		});
	} catch (error: unknown) {
		return createParseError(error);
	}
}

/**
 * Converts an acorn exception into a frozen {@link ParseError}.
 *
 * @remarks Acorn throws a `SyntaxError` with non-standard `loc`
 * property. This function extracts what we need and falls back to
 * safe defaults (`line: 1, column: 0`) if the error shape is
 * unexpected — defensive against acorn internals changing.
 */
function createParseError(error: unknown): ParseError {
	const acornError = error as {
		readonly message?: string;
		readonly loc?: { readonly line: number; readonly column: number };
	};

	return Object.freeze({
		message: acornError.message ?? 'Unknown parse error',
		location: Object.freeze({
			line: acornError.loc?.line ?? 1,
			column: acornError.loc?.column ?? 0,
		}),
	});
}
