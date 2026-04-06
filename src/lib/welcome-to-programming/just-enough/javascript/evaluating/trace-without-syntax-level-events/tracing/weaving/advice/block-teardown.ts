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
	_label: string | null,
): void {
	// 1. conditionally emit ScopeEvent(leave) BEFORE popping
	// try/catch protects scopeStack.pop() — if emitEvent throws, scope tracking
	// would be permanently corrupted for all subsequent advice calls
	try {
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
	} catch {
		// swallow advice errors — scopeStack.pop() MUST run
	}

	// 2. pop scope — always, even if event emission failed
	state.scopeStack.pop();
}

export default blockTeardown;
