import type { Node } from 'acorn';

import buildNodePathMap from '../parse-old/build-node-path-map.js';
import getChildNodes from '../parse-old/get-child-nodes.js';

import createViolation from './create-violation.js';
import type { NodeRule, Violation } from './types.js';

/**
 * Recursively walks an AST and collects all language level violations.
 *
 * @remarks For each node, looks up its type in the `nodes` allowlist
 * and applies the matching {@link NodeRule}:
 *
 * - **Missing key** → "not allowed at this language level" violation.
 *   This is the allowlist's default-deny behavior: any ESTree node
 *   type not explicitly listed is rejected.
 * - **`true`** → unconditionally allowed, no further checking.
 * - **`false`** → explicitly forbidden, produces a violation. Useful
 *   for nodes you want to call out with a specific message (vs. the
 *   generic "not allowed" for unlisted types).
 * - **`NodeValidator` function** → called with the node. Returns
 *   `true` (pass) or a `Violation` (fail).
 *
 * Crucially, the walk **always recurses into children** regardless of
 * whether the current node passed or failed. This means a disallowed
 * `FunctionDeclaration` will also report violations for any
 * disallowed syntax inside the function body — giving the learner a
 * complete picture rather than stopping at the first error.
 *
 * @param ast - The root AST node to walk (typically a `Program`).
 * @param nodes - The allowlist record from a {@link LanguageLevel}.
 * @returns A frozen array of all {@link Violation}s found.
 */
function collectViolations(
	ast: Node,
	nodes: Readonly<Record<string, NodeRule>>,
): readonly Violation[] {
	const violations: Violation[] = [];
	const nodePathMap = buildNodePathMap(ast);
	walk(ast, nodes, violations, nodePathMap);
	return Object.freeze(violations);
}

/**
 * Recursive walk step. Checks the current node against the allowlist
 * and recurses into all children via {@link getChildNodes}.
 *
 * @remarks Mutates the `violations` array for performance — avoids
 * allocating intermediate arrays at each recursion level. The caller
 * ({@link collectViolations}) freezes the final array.
 *
 * `nodePathMap` is forwarded unchanged through the recursion; each
 * node's `Violation.nodePath` is looked up from it. Threading the map
 * (a constant) rather than a computed path keeps the walk identical to
 * its pre-nodePath shape apart from the lookup.
 */
function walk(
	node: Node,
	nodes: Readonly<Record<string, NodeRule>>,
	violations: Violation[],
	nodePathMap: ReadonlyMap<Node, string>,
): void {
	// every walked node is reachable from the ast the map was built from,
	// so the lookup is always present (cf. `node.loc!` in extractLocation)
	const nodePath = nodePathMap.get(node)!;
	const rule = nodes[node.type];

	if (rule === undefined) {
		// node type not in allowlist — automatic violation
		violations.push(
			createViolation(
				node.type,
				`'${node.type}' is not allowed at this language level`,
				extractLocation(node),
				nodePath,
			),
		);
	} else if (rule === false) {
		// explicitly forbidden
		violations.push(
			createViolation(
				node.type,
				`'${node.type}' is explicitly forbidden at this language level`,
				extractLocation(node),
				nodePath,
			),
		);
	} else if (rule !== true) {
		// NodeValidator function — call it with the node's path
		const result = rule(node, nodePath);
		if (result !== true) {
			violations.push(result);
		}
	}

	// WHY: with is a portal to full JavaScript — any syntax is allowed
	// inside. The with statement itself is checked above (it's `true` in
	// the allowlist), but we deliberately skip its children.
	if (node.type === 'WithStatement') return;

	// always recurse into children to catch nested violations
	for (const child of getChildNodes(node)) {
		walk(child, nodes, violations, nodePathMap);
	}
}

/**
 * Extracts a {@link SourceRange} from an acorn node's `loc` property.
 *
 * @remarks Falls back to `{line: 1, column: 0}` if `loc` is missing,
 * which shouldn't happen when acorn is called with `locations: true`
 * but guards against unexpected edge cases.
 */
function extractLocation(node: Node) {
	const {loc} = node;
	if (loc) {
		return {
			start: { line: loc.start.line, column: loc.start.column },
			end: { line: loc.end.line, column: loc.end.column },
		};
	}
	// fallback — shouldn't happen with locations: true
	return {
		start: { line: 1, column: 0 },
		end: { line: 1, column: 0 },
	};
}

export default collectViolations;
