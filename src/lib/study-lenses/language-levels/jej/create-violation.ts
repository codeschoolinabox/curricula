import cloneAndFreeze from '@utils/clone-and-freeze.js';

import type { SourceRange, Violation } from '../types.js';

/**
 * Builds a frozen {@link Violation} — one place the program steps outside the
 * level.
 *
 * @remarks
 * Reshaped generic validating machinery (not policy this level owns), colocated
 * here until a shared leaf exists. It is meant to be the one
 * site that turns a node's range and path into a violation, so a range is never
 * read two ways. `cloneAndFreeze` deep-copies before freezing, so the caller's
 * `location` object is neither retained nor frozen.
 *
 * @param nodeType - The ESTree node type that stepped outside the level.
 * @param message - The machine-worded explanation, naming the construct.
 * @param location - The offending node's source range, as character offsets.
 * @param nodePath - The offending node's dot-delimited path, rooted at the
 *   program (e.g. `'$.body.0.declarations.0'`).
 * @returns A deeply frozen violation.
 */
export default function createViolation(
	nodeType: string,
	message: string,
	location: SourceRange,
	nodePath: string,
): Violation {
	return cloneAndFreeze({ nodeType, message, location, nodePath });
}
