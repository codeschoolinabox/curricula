/**
 * @file Locates the deepest AST node at a given source line.
 *
 * @remarks Walks the full AST via `estree-walker` and tracks the
 * most specific (deepest) node whose `loc.start.line` matches
 * the target. Returns `undefined` if no node matches.
 */

import type { Node } from 'acorn';
import { walk } from 'estree-walker';

/**
 * Finds the deepest AST node starting at the given line.
 *
 * @param ast - An acorn Program node with location data
 * @param line - 1-based line number to search for
 * @returns The deepest node at that line, or `undefined`
 */
export default function findNodeAtLine(
	ast: Node,
	line: number,
): Node | undefined {
	let deepest: Node | undefined;

	// walk visits nodes depth-first — later matches are deeper
	walk(ast as any, {
		enter(node: any) {
			if (node.loc?.start.line === line) {
				deepest = node as Node;
			}
		},
	});

	return deepest;
}
