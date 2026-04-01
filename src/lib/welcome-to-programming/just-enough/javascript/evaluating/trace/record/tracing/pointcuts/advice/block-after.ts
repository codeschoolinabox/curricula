/**
 * @file Advice for block@after — after block completes normally.
 *
 * Conditionally registered: only when any scope event is enabled.
 * Events: emits ScopeEvent(completion) when scope gate is open.
 */

import { isScopeGateOpen } from './config-gate.js';
import emitEvent from './emit-event.js';

import type { TracerState, JejTag } from '../types.js';

function blockAfter(
	state: TracerState,
	_parentType: string,
	scopeKind: string,
	_segmentKind: string,
	tag: JejTag,
): void {
	if (isScopeGateOpen(state.config, scopeKind, 'completion')) {
		const currentScope = state.scopeStack[state.scopeStack.length - 1];
		const parentScope = state.scopeStack.length > 1
			? state.scopeStack[state.scopeStack.length - 2]
			: undefined;

		emitEvent(state, tag, 'statement', 'scopes.completion', {
			kind: scopeKind,
			event: 'completion',
			depth: currentScope.depth,
			creationStep: currentScope.creationStep,
			...(parentScope !== undefined && { parentCreationStep: parentScope.creationStep }),
			...(currentScope.structure !== null && { structure: currentScope.structure }),
			...(currentScope.structureStep !== null && { structureStep: currentScope.structureStep }),
		});
	}
}

export default blockAfter;
