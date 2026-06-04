/**
 * @file Advice for statement@before — before statement execution.
 *
 * Dispatches JumpEvent for break and continue statements.
 * Aran desugars continue to break with a mangled label. The pointcut
 * detects this and passes the original jump kind ('break' or 'continue').
 *
 * @remarks
 * IterationEvent, DoEvent, BranchEvent are handled by block-before (not here).
 * Loop guard is also in block-before.
 * statement-before is only woven when config.controlFlow.events.jump is enabled.
 */

import { isControlFlowGateOpen } from './gating.js';
import { findNearestLoop } from './scope-stack.js';
import emitEvent from './emit-event.js';

import type { TracerState, JejTag } from '../types.js';

/**
 * @param state - Tracer state
 * @param point - Point data: ['jump', jumpKind, userLabel, tag]
 */
function statementBefore(state: TracerState, ...point: unknown[]): void {
	const discriminant = point[0] as string;

	if (discriminant !== 'jump') return;

	const jumpKind = point[1] as 'break' | 'continue';
	const userLabel = point[2] as string | null;
	const tag = point[3] as JejTag;

	// Determine target loop kind. For unlabeled break/continue, walk the
	// scope stack to find the nearest enclosing loop scope.
	// WHY: ESTree BreakStatement.label is null for unlabeled breaks. The
	// tag.jumpTarget comes from the ESTree node and is null in this case.
	// We derive the target from the scope stack at runtime instead.
	const loopMatch = findNearestLoop(state, tag.jumpTarget ?? null);
	if (!loopMatch) return;

	const target = loopMatch.structure;
	const targetScopeCreationStep = loopMatch.creationStep;

	if (isControlFlowGateOpen(state.config, target, 'jump')) {
		emitEvent(state, tag, 'statement', 'controlFlow.jump', {
			kind: jumpKind,
			target,
			targetScopeCreationStep,
			...(userLabel !== null && { label: userLabel }),
		});
	}
}

export default statementBefore;
