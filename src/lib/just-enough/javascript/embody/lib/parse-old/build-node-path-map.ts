import type { Node } from 'acorn';

import getChildNodesWithPath from './get-child-nodes-with-path.js';

/**
 * Builds a lookup from every node in an AST to its JSONPath string,
 * rooted at the Program node.
 *
 * @remarks One generic traversal (via `getChildNodesWithPath`) records
 * each node's full Program-rooted path: the root is `'$'`, and each
 * child's path is its parent's path joined to the child's segment with
 * `'.'` (e.g. `'$.body[0].declarations[0]'`).
 *
 * Decouples path computation from violation detection: the validation
 * walkers traverse the AST their own way (allowlist checks,
 * scope-aware global checks) and look up a node's path here when they
 * need to stamp `Violation.nodePath`, rather than threading a path
 * argument through every recursive call.
 *
 * The returned map is not frozen — callers read it during a single
 * validation pass and discard it (transient, like `getChildNodes`).
 *
 * @param root - The AST root (typically a `Program` node).
 * @returns A map from each reachable node to its JSONPath string.
 */
function buildNodePathMap(root: Node): ReadonlyMap<Node, string> {
	const map = new Map<Node, string>();
	assignPaths(root, '$', map);
	// perf: skip freeze — transient; read and discarded within one validation pass
	return map;
}

/**
 * Records `node` at `path`, then recurses into each child with the
 * child's path (`parentPath` + `'.'` + segment). Mutates `map` in
 * place — the map is transient, consumed within one validation pass
 * and then discarded.
 */
function assignPaths(node: Node, path: string, map: Map<Node, string>): void {
	map.set(node, path);
	for (const { child, segment } of getChildNodesWithPath(node)) {
		assignPaths(child, `${path}.${segment}`, map);
	}
}

export default buildNodePathMap;
