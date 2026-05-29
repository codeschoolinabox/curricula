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
 * @param nodePath - NodePath rooted at the Program node identifying
 *   the offending node (e.g. `'$.body.0.declarations.0'`). Required:
 *   the collecting walkers look it up from `buildNodePathMap` and pass
 *   it here (validators receive it as their second argument and
 *   forward it). No default — a missing path is a programming error,
 *   not a degraded-but-valid state.
 * @param severity - Always `'rejection'`. All violations block execution.
 * @returns A deeply frozen {@link Violation}.
 */
function createViolation(
	nodeType: string,
	message: string,
	location: SourceRange,
	nodePath: string,
	severity: 'rejection' = 'rejection',
): Violation {
	return Object.freeze({
		nodeType,
		message,
		severity,
		location: Object.freeze({
			start: Object.freeze({ ...location.start }),
			end: Object.freeze({ ...location.end }),
		}),
		nodePath,
	});
}

export default createViolation;
