/**
 * @file Collects all AST nodes matching a set of node types.
 *
 * @remarks Walks the full AST tree and returns a flat array of
 * every node whose `type` appears in the given set. Used by
 * program-level analyzers that need to query the AST by type.
 */

import type { Node } from 'acorn';

import getChildNodes from '../../../../embody/lib/parse-old/get-child-nodes.js';

export default function collectNodes(
	ast: Node,
	types: ReadonlySet<string>,
): Node[] {
	const results: Node[] = [];

	function walk(node: Node): void {
		if (types.has(node.type)) {
			results.push(node);
		}
		for (const child of getChildNodes(node)) {
			walk(child);
		}
	}

	walk(ast);
	return results;
}
