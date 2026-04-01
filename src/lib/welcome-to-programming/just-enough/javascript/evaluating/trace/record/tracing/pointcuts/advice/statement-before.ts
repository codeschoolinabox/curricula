/**
 * @file Advice for statement@before — before statement execution.
 *
 * Dispatches JumpEvent for BreakStatement only.
 *
 * @remarks
 * IterationEvent, DoEvent, BranchEvent are handled by block-before (not here).
 * Loop guard is also in block-before.
 * statement-before is only woven when config.controlFlow.events.jump is enabled.
 */

import { isControlFlowGateOpen } from './config-gate.js';
import emitEvent from './emit-event.js';

import type { TracerState, JejTag } from '../types.js';

function statementBefore(state: TracerState, ...point: unknown[]): void {
	const discriminant = point[0] as string;

	if (discriminant !== 'jump') return;

	const label = point[1] as string | null;
	const tag = point[2] as JejTag;
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
			kind: 'break',
			target,
			targetScopeCreationStep,
			...(label !== null && { label }),
		});
	}
}

export default statementBefore;
