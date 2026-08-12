/**
 * @file Collects all AST nodes matching a set of node types.
 *
 * @remarks Walks the full AST tree in pre-order (a node before its
 * descendants) and returns a flat array of every node whose `type` appears in
 * the given set. Used by program-level analyzers that need to query the AST by
 * type.
 *
 * One shared accumulator, appended to as the walk descends: every node is
 * visited once, so the flatten is O(n) in the node count. The per-level
 * `[...self, ...children]` merge this replaces re-copied every ancestor's
 * partial result on the way back up — the sum of depths over the matched
 * nodes, O(n²) on a deep, densely-matching tree. Same idiom and same reason as
 * `collectAnalysis` (`../analyze-micro-decisions.ts`): a private accumulator
 * that only leaves as the returned array. `DOCS.md` § Execution phases
 * describes that sibling's accumulator and is silent on this helper.
 */

import type { Node } from 'acorn';

import getChildNodes from '../get-child-nodes.js';

export default function collectNodes(
	ast: Node,
	types: ReadonlySet<string>,
): Node[] {
	const found: Node[] = [];

	function walk(node: Node): void {
		if (types.has(node.type)) {
			found.push(node);
		}
		for (const child of getChildNodes(node)) {
			walk(child);
		}
	}
	walk(ast);

	return found;
}
