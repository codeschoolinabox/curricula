import type { Node, Program } from 'acorn';

import freezeInPlace from '@utils/freeze-in-place.js';

import createViolation from './create-violation.js';
import getChildNodesWithPath from './get-child-nodes-with-path.js';
import type { NodeRule, SyntaxAllowlist, Violation } from './types.js';

/**
 * Screens every node of a program's syntax tree against an allowlist's node
 * rules and collects one {@link Violation} per place the grammar leaves the
 * curated slice.
 *
 * @remarks
 * The module's principal export: one pure pass over a parsed tree, reading only
 * the node-rule table it is handed. Default-deny — a node type the table does
 * not name is outside the slice; `true` admits outright; a constraint check
 * answers legality only, and its message becomes a violation here, the one
 * place a node's range and path are read. The walk is complete, never
 * first-hit: a parent's violation never suppresses its children's.
 *
 * Collection order is depth-first, and deterministic — but it is not source
 * order in general. A node precedes its children and array-valued children
 * follow their source-array positions, yet sibling *properties* follow the
 * parser's own property order, which diverges for some node shapes (a template
 * literal's interpolated expressions enumerate before its text chunks). A
 * consumer needing strict source order sorts by `location.start` itself.
 *
 * @param root - The program's syntax tree, as the caller parsed it.
 * @param nodes - The allowlist's node-rule table the walk dispatches on.
 * @returns A frozen array of violations, in depth-first traversal order.
 */
export default function collectViolations(
	root: Program,
	nodes: SyntaxAllowlist['nodes'],
): ReadonlyArray<Violation> {
	return freezeInPlace(walk(root, '$', nodes));
}

/**
 * One walk step: the node's own screening, then every child's, depth-first.
 * Recursion never stops at a violation — a refused parent's children are
 * still screened, so a consumer sees the complete picture.
 */
function walk(
	node: Node,
	path: string,
	nodes: SyntaxAllowlist['nodes'],
): Violation[] {
	const own = screenNode(node, path, nodes);
	const nested = getChildNodesWithPath(node).flatMap(({ child, segment }) =>
		walk(child, `${path}.${segment}`, nodes),
	);
	return [...own, ...nested];
}

/**
 * The node's own screening: applies its rule's verdict, and turns a refusal
 * message into a violation — the one place a node's range and path are read.
 */
function screenNode(
	node: Node,
	path: string,
	nodes: SyntaxAllowlist['nodes'],
): readonly Violation[] {
	const verdict = applyRule(ruleFor(node.type, nodes), node);
	if (verdict === true) return [];

	return [
		createViolation(
			node.type,
			verdict,
			{ start: node.start, end: node.end },
			path,
		),
	];
}

/**
 * The table's own rule for a node type, or nothing.
 *
 * WHY the own-property check: a caller's table is a plain object, so a bare
 * lookup also finds `Object.prototype`'s members. A node typed `toString` would
 * then be screened by `Object.prototype.toString` — called as though it were a
 * constraint check — and a node typed `constructor` would produce a violation
 * whose message is an object. Most of the twelve are worse still: called on a
 * node they throw, aborting the whole walk rather than refusing one node, so
 * the caller gets no answer at all. Default-deny means absence is refusal, and
 * a name the caller never wrote is absent.
 */
function ruleFor(
	nodeType: string,
	nodes: SyntaxAllowlist['nodes'],
): NodeRule | undefined {
	return Object.hasOwn(nodes, nodeType) ? nodes[nodeType] : undefined;
}

/**
 * Legality only — what is wrong, never where. Absence is refusal: a node type
 * the table does not name answers with the default-deny message.
 */
function applyRule(rule: NodeRule | undefined, node: Node): true | string {
	if (rule === undefined) {
		return `'${node.type}' isn't in the admitted syntax`;
	}
	if (rule === true) return true;

	return rule(node);
}
