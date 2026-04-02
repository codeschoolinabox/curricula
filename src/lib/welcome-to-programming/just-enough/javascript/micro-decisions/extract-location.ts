/**
 * @file Extracts a SourceRange from an acorn AST node.
 *
 * @remarks Thin wrapper around acorn's `loc` property. Returns
 * a fallback range at line 1, column 0 if the node has no
 * location info (should not happen when parsed with
 * `locations: true`, but defensive).
 */

import type { Node } from 'acorn';

import type { SourceRange } from '../validating/types.js';

/**
 * Extracts start/end source positions from an acorn node.
 *
 * @param node - An acorn AST node (parsed with `locations: true`).
 * @returns A frozen SourceRange.
 */
function extractLocation(node: Node): SourceRange {
	const loc = node.loc;
	if (loc) {
		return {
			start: { line: loc.start.line, column: loc.start.column },
			end: { line: loc.end.line, column: loc.end.column },
		};
	}
	return {
		start: { line: 1, column: 0 },
		end: { line: 1, column: 0 },
	};
}

export default extractLocation;
