import type { Node, Program } from 'acorn';

import getChildNodes from '../../../lib/parse-old/get-child-nodes.js';

/**
 * Whole-program size metrics, shared between the conformance gate (which checks a
 * candidate against a bound) and `vary`'s seed measurement (which reads a held
 * seed's size off the SAME functions). Extracted from `conform` so the two never
 * drift. Pure over their args — no module state.
 */

/** Physical line count — `Metrics.source.lines` semantics (a trailing newline counts). */
function countLines(code: string): number {
	return code.split('\n').length;
}

/**
 * Maximum control-flow nesting depth: the most control-flow bodies enclosing
 * any node. Each of the five block-bearing constructs (`if`, `while`,
 * `do-while`, `for`, `for-of`) adds one level to its body. A ternary adds
 * nothing (a decision point, not block nesting), and an `else if` is flat — a
 * chained `IfStatement` in the `alternate` shares the chain's depth rather than
 * nesting. (The level stubs `Metrics.maxNestingDepth` to 0, so conform owns this.)
 */
function maxNestingDepth(ast: Program): number {
	return deepest(ast, 0);
}

const LOOP_TYPES: ReadonlySet<string> = new Set([
	'WhileStatement',
	'DoWhileStatement',
	'ForStatement',
	'ForOfStatement',
]);

function deepest(node: Node, depth: number): number {
	const bodies = controlFlowBodies(node);
	const childDepths = getChildNodes(node).map((child) =>
		deepest(child, bodies.has(child) ? depth + 1 : depth),
	);
	return Math.max(depth, ...childDepths);
}

/**
 * The child nodes that constitute a deeper nesting level: a loop's body, an
 * if's consequent, and a real `else` block — but never a chained else-if.
 */
function controlFlowBodies(node: Node): ReadonlySet<Node> {
	const shaped = node as unknown as {
		readonly type: string;
		readonly body?: Node;
		readonly consequent?: Node;
		readonly alternate?: Node | null;
	};
	if (LOOP_TYPES.has(shaped.type)) {
		return new Set<Node>(shaped.body ? [shaped.body] : []);
	}
	if (shaped.type === 'IfStatement') {
		const alternate = shaped.alternate ?? undefined;
		const elseBody = alternate?.type === 'IfStatement' ? undefined : alternate;
		return new Set<Node>(
			[shaped.consequent, elseBody].filter(
				(child): child is Node => child !== undefined,
			),
		);
	}
	return new Set<Node>();
}

const metrics = Object.freeze({ countLines, maxNestingDepth });

export default metrics;
