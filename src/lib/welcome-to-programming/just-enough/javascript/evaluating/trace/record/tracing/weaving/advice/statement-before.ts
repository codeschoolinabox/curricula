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

import { isControlFlowGateOpen } from './config-gate.js';
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
	const target = tag.jumpTarget;

	if (!target) return;

	if (isControlFlowGateOpen(state.config, target, 'jump')) {
		// walk scopeStack to find the target loop scope
		let targetScopeCreationStep = 0;
		for (let i = state.scopeStack.length - 1; i >= 0; i -= 1) {
			const scope = state.scopeStack[i];
			if (scope.structure === target) {
				targetScopeCreationStep = scope.creationStep;
				break;
			}
		}

		emitEvent(state, tag, 'statement', 'controlFlow.jump', {
			kind: jumpKind,
			target,
			targetScopeCreationStep,
			...(userLabel !== null && { label: userLabel }),
		});
	}
}

export default statementBefore;
