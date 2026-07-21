import type { Node, Program } from 'acorn';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { Violation } from '../types.js';

import createViolation from './create-violation.js';
import getChildNodesWithPath from './get-child-nodes-with-path.js';
import type { NodeRule, SyntaxAllowlist } from './types.js';

/**
 * Screens every node of a program's syntax tree against an allowlist's node
 * rules and collects one {@link Violation} per place the grammar leaves the
 * level.
 *
 * @remarks
 * Reshaped generic validating machinery (not policy this level owns), colocated
 * here per the Wave-0 plan until a shared leaf exists: the walk is
 * level-agnostic and reads only the node-rule table it is handed. Default-deny
 * — a node type the table does not name is outside the level; `true` admits
 * outright; a constraint check answers legality only, and its message becomes a
 * violation here, the one place a node's range and path are read. The walk is
 * complete, never first-hit: a parent's violation never suppresses its
 * children's, and collection order is depth-first source order.
 *
 * @param root - The program's syntax tree, as the caller parsed it.
 * @param nodes - The allowlist's node-rule table the walk dispatches on.
 * @returns A frozen array of violations, in depth-first source order.
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
 * still screened, so the learner sees the complete picture.
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
	const verdict = applyRule(nodes[node.type], node);
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
 * Legality only — what is wrong, never where. Absence is refusal: a node type
 * the table does not name answers with the not-allowed message.
 */
function applyRule(rule: NodeRule | undefined, node: Node): true | string {
	if (rule === undefined) {
		return `'${node.type}' is not allowed at this language level`;
	}
	if (rule === true) return true;

	return rule(node);
}
