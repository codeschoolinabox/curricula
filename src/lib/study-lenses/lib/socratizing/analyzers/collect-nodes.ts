/**
 * @file Collects all AST nodes matching a set of node types.
 *
 * @remarks Walks the full AST tree in pre-order (a node before its
 * descendants) and returns a flat array of every node whose `type` appears in
 * the given set. Used by program-level analyzers that need to query the AST by
 * type. Restructured from the source's imperative push-walk into this leaf's
 * functional idiom (see `get-child-nodes.ts`) — behaviourally identical.
 */

import type { Node } from 'acorn';

import getChildNodes from '../get-child-nodes.js';

export default function collectNodes(
	ast: Node,
	types: ReadonlySet<string>,
): Node[] {
	const self = types.has(ast.type) ? [ast] : [];
	const fromChildren = getChildNodes(ast).flatMap((child) =>
		collectNodes(child, types),
	);
	return [...self, ...fromChildren];
}
