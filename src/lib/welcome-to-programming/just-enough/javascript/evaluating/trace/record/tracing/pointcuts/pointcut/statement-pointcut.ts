/**
 * @file Statement pointcut — intercepts statements for jumps and loop guards.
 *
 * BreakStatement → JumpEvent (via advice)
 *
 * NOTE: BranchEvent and IterationEvent/DoEvent are dispatched from block@before
 * (not statement@before) because statement@before fires once per statement, not
 * per iteration. Block@before on loop body blocks fires each iteration.
 *
 * Loop guard (maxIterations) also uses block@before on loop body blocks,
 * since that's where per-iteration counting happens.
 */

import type { JejTag } from '../types.js';

type StatementNode = {
	readonly type: string;
	readonly tag: JejTag;
	readonly label?: string;
};

/**
 * Creates a statement pointcut. Only intercepts BreakStatement for JumpEvent.
 *
 * @param config - The user's trace config
 * @returns Pointcut function for statement@before hook
 */
function createStatementPointcut(config: Record<string, unknown>) {
	const controlFlow = (config.controlFlow ?? {}) as Record<string, unknown>;
	const controlFlowEvents = (controlFlow.events ?? {}) as Record<string, unknown>;

	// perf: skip freeze — consumed by Aran's weaving machinery
	function statementPointcut(
		node: StatementNode,
		_parent: unknown,
		_root: unknown,
	): unknown[] | null {
		if (node.type === 'BreakStatement' && controlFlowEvents.jump) {
			return ['jump', node.label, node.tag];
		}

		return null;
	}

	return statementPointcut;
}

export default createStatementPointcut;
