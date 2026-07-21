import type { Node, Program } from 'acorn';

import getChildNodesWithPath from './get-child-nodes-with-path.js';

/**
 * Every node reachable from a parsed program, mapped to its Program-rooted
 * node path.
 *
 * @remarks
 * One traversal (via `getChildNodesWithPath`) records each node's full path:
 * the root is `'$'`, and each child's path is its parent's path joined to the
 * child's `segment` with `'.'` (e.g. `'$.body.0.declarations.0'`) — the
 * package's canonical node identity, the shape `Violation.nodePath` carries.
 *
 * Decouples path computation from violation detection: the level's walks
 * traverse the tree their own way and look a node's path up here when they
 * stamp a violation, rather than threading a path argument through every
 * recursive call.
 *
 * The returned map is transient internal computation — keyed by node identity
 * (which a `Record` cannot do), read within one pass, then discarded — so it
 * is a `Map` and is not frozen; it never crosses a freeze or serialization
 * boundary.
 *
 * The functional recursion copies each subtree's entries into its parent's,
 * trading the quarry's O(n) in-place build for O(n log n)–O(n²) worst case —
 * accepted because a JEJ program is a bounded learner snippet.
 *
 * @param root - The parsed program whose nodes are mapped.
 * @returns A map from every reachable node to its node path.
 */
export default function buildNodePathMap(
	root: Program,
): ReadonlyMap<Node, string> {
	// perf: skip freeze — transient; read and discarded within one validation pass
	return new Map(collectPathEntries(root, '$'));
}

/**
 * The subtree's entries: this node at its path, then every descendant at the
 * parent's path joined to the segment that reaches it.
 */
function collectPathEntries(
	node: Node,
	path: string,
): readonly (readonly [Node, string])[] {
	const descendantEntries = getChildNodesWithPath(node).flatMap(
		({ child, segment }) => collectPathEntries(child, `${path}.${segment}`),
	);

	return [[node, path], ...descendantEntries];
}
