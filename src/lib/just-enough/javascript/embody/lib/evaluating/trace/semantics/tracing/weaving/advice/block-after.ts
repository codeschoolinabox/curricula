/**
 * @file Advice for block@after — after block completes normally.
 *
 * Conditionally registered: only when any scope event is enabled.
 * Events: emits ScopeEvent(completion) when scope gate is open.
 */

import { isScopeGateOpen } from './gating.js';
import { currentScope, parentScope } from './scope-stack.js';
import emitEvent from './emit-event.js';

import type { TracerState, JejTag } from '../types.js';

function blockAfter(
	state: TracerState,
	_parentType: string,
	scopeKind: string,
	_segmentKind: string,
	tag: JejTag,
	_label: string | null,
): void {
	if (isScopeGateOpen(state.config, scopeKind, 'completion')) {
		const current = currentScope(state)!;
		const parent = parentScope(state);

		emitEvent(state, tag, 'statement', 'scopes.completion', {
			kind: scopeKind,
			event: 'completion',
			depth: current.depth,
			creationStep: current.creationStep,
			...(parent !== undefined && { parentCreationStep: parent.creationStep }),
			...(current.structure !== null && { structure: current.structure }),
			...(current.structureStep !== null && {
				structureStep: current.structureStep,
			}),
		});
	}
}

export default blockAfter;
