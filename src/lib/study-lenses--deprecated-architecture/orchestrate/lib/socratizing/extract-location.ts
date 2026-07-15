/**
 * @file Extracts a SourceRange from an acorn AST node.
 *
 * @remarks Thin wrapper around acorn's `loc` property. Returns
 * a fallback range at line 1, column 0 if the node has no
 * location info (should not happen when parsed with
 * `locations: true`, but defensive).
 */

import type { Node } from 'acorn';

import type { SourceRange } from '../../../../embody/lib/validating/types.js';

/**
 * Extracts start/end source positions from an acorn node.
 *
 * @param node - An acorn AST node (parsed with `locations: true`).
 * @returns A frozen SourceRange.
 */
export default function extractLocation(node: Node): SourceRange {
	const { loc } = node;
	if (loc) {
		return Object.freeze({
			start: Object.freeze({ line: loc.start.line, column: loc.start.column }),
			end: Object.freeze({ line: loc.end.line, column: loc.end.column }),
		});
	}
	return Object.freeze({
		start: Object.freeze({ line: 1, column: 0 }),
		end: Object.freeze({ line: 1, column: 0 }),
	});
}
