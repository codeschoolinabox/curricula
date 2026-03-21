import { parse } from 'acorn';
import type { Program } from 'acorn';

import type { ParseError } from './types.js';

/**
 * Parses a JavaScript source string into an ESTree `Program` node.
 *
 * @remarks Uses acorn with `ecmaVersion: 'latest'` and `locations:
 * true` so every node carries line/column data for violation
 * reporting.
 *
 * Returns a {@link ParseError} on syntax errors instead of throwing.
 * This is a deliberate design choice: `validateProgram` must never
 * throw because educational tools need graceful degradation for
 * student code with syntax errors. A parse error still means
 * `isValid: false` — it just arrives in the report rather than as
 * an exception.
 *
 * @param source - The raw JavaScript source code to parse.
 * @param sourceType - Acorn's source type: `'script'` or `'module'`.
 *   Module mode enables ES module syntax and implicit strict mode.
 *   Defaults to `'script'` for backwards compatibility, but the JeJ
 *   level always passes `'module'`.
 * @returns An acorn `Program` AST on success, or a frozen
 *   {@link ParseError} on failure.
 */
function parseProgram(
	source: string,
	sourceType: 'script' | 'module' = 'script',
): Program | ParseError {
	try {
		return parse(source, {
			ecmaVersion: 'latest',
			sourceType,
			locations: true,
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
		message?: string;
		loc?: { line: number; column: number };
	};

	return Object.freeze({
		message: acornError.message ?? 'Unknown parse error',
		location: Object.freeze({
			line: acornError.loc?.line ?? 1,
			column: acornError.loc?.column ?? 0,
		}),
	});
}

export default parseProgram;
