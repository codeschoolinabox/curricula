/**
 * @file Advice for block@teardown — always, right before leaving block.
 *
 * Always runs: pops scope from stack.
 * Events: conditionally emits ScopeEvent(leave) before popping.
 */

import { isScopeGateOpen } from './config-gate.js';
import emitEvent from './emit-event.js';

import type { TracerState, JejTag } from '../types.js';

function blockTeardown(
	state: TracerState,
	_parentType: string,
	scopeKind: string,
	_segmentKind: string,
	tag: JejTag,
): void {
	// 1. conditionally emit ScopeEvent(leave) BEFORE popping
	if (isScopeGateOpen(state.config, scopeKind, 'leave')) {
		const currentScope = state.scopeStack[state.scopeStack.length - 1];
		const parentScope = state.scopeStack.length > 1
			? state.scopeStack[state.scopeStack.length - 2]
			: undefined;

		emitEvent(state, tag, 'statement', 'scopes.leave', {
			kind: scopeKind,
			event: 'leave',
			depth: currentScope.depth,
			creationStep: currentScope.creationStep,
			...(parentScope !== undefined && { parentCreationStep: parentScope.creationStep }),
			...(currentScope.structure !== null && { structure: currentScope.structure }),
			...(currentScope.structureStep !== null && { structureStep: currentScope.structureStep }),
		});
	}

	// 2. pop scope
	state.scopeStack.pop();
}

export default blockTeardown;
