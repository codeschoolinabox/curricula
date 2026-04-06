/**
 * @file Statement pointcut — intercepts statements for jumps.
 *
 * BreakStatement → JumpEvent (via advice)
 *
 * Aran desugars `continue` into `break` with a mangled label. We detect
 * the original jump kind from the label prefix:
 * - "continue" / "continue.*" → was a continue statement
 * - "break.*" → was a break statement
 *
 * NOTE: BranchEvent and IterationEvent/DoEvent are dispatched from block@before.
 * Loop guard also uses block@before.
 */

import type { JejTag } from '../types.js';

type StatementNode = {
	readonly type: string;
	readonly tag: JejTag;
	readonly label?: string;
};

/**
 * Determines if a mangled AranLang label represents a continue statement.
 * Continue labels: "continue", "continue.{name}", "continue.loop.{meta}"
 * Break labels: "break.{name}", "break.loop.{meta}", "break.return"
 */
function isContinueLabel(label: string | undefined): boolean {
	if (!label) return false;
	return label === 'continue' || label.startsWith('continue.');
}

/**
 * Extracts the user-facing label from a mangled AranLang label, if present.
 * "break.myLabel" → "myLabel"
 * "continue.myLabel" → "myLabel"
 * "break.loop.42" → null (synthetic, not user-written)
 * "continue" → null (unlabeled)
 * "break.return" → null (not a user label)
 */
function extractUserLabel(label: string | undefined): string | null {
	if (!label) return null;

	// skip synthetic labels: break.loop.*, continue.loop.*, break.return, bare "continue"
	if (label === 'continue') return null;
	if (label === 'break.return') return null;
	if (label.includes('.loop.')) return null;

	// "break.myLabel" → "myLabel", "continue.myLabel" → "myLabel"
	const dotIndex = label.indexOf('.');
	if (dotIndex === -1) return null;
	return label.slice(dotIndex + 1);
}

/**
 * Creates a statement pointcut. Intercepts BreakStatement for JumpEvent.
 * Point data: ['jump', jumpKind, userLabel, tag]
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
			const jumpKind = isContinueLabel(node.label) ? 'continue' : 'break';
			const userLabel = extractUserLabel(node.label);
			return ['jump', jumpKind, userLabel, node.tag];
		}

		return null;
	}

	return statementPointcut;
}

export default createStatementPointcut;
