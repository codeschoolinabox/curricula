import type { SourceRange, Violation } from './types.js';

/**
 * Creates a frozen {@link Violation} object.
 *
 * @remarks Factory function that builds a violation with every
 * nested object (location, start, end) individually frozen. This
 * guarantees immutability throughout — consumers cannot accidentally
 * mutate a violation after it's created.
 *
 * All validators and violation producers in the codebase should use
 * this factory rather than constructing `Violation` objects directly,
 * to ensure consistent freezing.
 *
 * @param nodeType - The ESTree node type string that caused the
 *   violation (e.g. `'VariableDeclaration'`, `'BinaryExpression'`).
 * @param message - Human-readable explanation written for learners.
 *   Should name the disallowed construct and suggest what to use
 *   instead (e.g. `"'var' declarations are not allowed — use 'let'"`).
 * @param location - Source range where the violation was found.
 *   Copied and frozen — the caller's object is not retained.
 * @param severity - `'error'` (default) or `'warning'`. Errors make
 *   the program invalid; warnings don't.
 * @returns A deeply frozen {@link Violation}.
 */
function createViolation(
	nodeType: string,
	message: string,
	location: SourceRange,
	severity: 'error' | 'warning' = 'error',
): Violation {
	return Object.freeze({
		nodeType,
		message,
		severity,
		location: Object.freeze({
			start: Object.freeze({ ...location.start }),
			end: Object.freeze({ ...location.end }),
		}),
	});
}

export default createViolation;
