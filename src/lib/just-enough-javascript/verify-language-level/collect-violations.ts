import type { Node } from 'acorn';

import createViolation from './create-violation.js';
import getChildNodes from './get-child-nodes.js';

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
	walk(ast, nodes, violations);
	return Object.freeze(violations);
}

/**
 * Recursive walk step. Checks the current node against the allowlist
 * and recurses into all children via {@link getChildNodes}.
 *
 * @remarks Mutates the `violations` array for performance — avoids
 * allocating intermediate arrays at each recursion level. The caller
 * ({@link collectViolations}) freezes the final array.
 */
function walk(
	node: Node,
	nodes: Readonly<Record<string, NodeRule>>,
	violations: Violation[],
): void {
	const rule = nodes[node.type];

	if (rule === undefined) {
		// node type not in allowlist — automatic violation
		violations.push(
			createViolation(
				node.type,
				`'${node.type}' is not allowed at this language level`,
				extractLocation(node),
			),
		);
	} else if (rule === false) {
		// explicitly forbidden
		violations.push(
			createViolation(
				node.type,
				`'${node.type}' is explicitly forbidden at this language level`,
				extractLocation(node),
			),
		);
	} else if (rule !== true) {
		// NodeValidator function — call it
		const result = rule(node);
		if (result !== true) {
			violations.push(result);
		}
	}

	// always recurse into children to catch nested violations
	for (const child of getChildNodes(node)) {
		walk(child, nodes, violations);
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
	const loc = node.loc;
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
