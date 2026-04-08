/**
 * @file Advice for block@throwing — when block exits via error.
 *
 * CRITICAL: MUST return the error value.
 * Conditionally registered: only when any scope event is enabled.
 * Events: emits ScopeEvent(interrupt) when scope gate is open.
 */

import { isScopeGateOpen } from './config-gate.js';
import emitEvent from './emit-event.js';

import type { TracerState, JejTag } from '../types.js';

function blockThrowing(
	state: TracerState,
	error: unknown,
	_parentType: string,
	scopeKind: string,
	_segmentKind: string,
	tag: JejTag,
	_label: string | null,
): unknown {
	try {
		if (isScopeGateOpen(state.config, scopeKind, 'interrupt')) {
			const currentScope = state.scopeStack[state.scopeStack.length - 1];
			const parentScope = state.scopeStack.length > 1
				? state.scopeStack[state.scopeStack.length - 2]
				: undefined;

			emitEvent(state, tag, 'statement', 'scopes.interrupt', {
				kind: scopeKind,
				event: 'interrupt',
				depth: currentScope.depth,
				creationStep: currentScope.creationStep,
				...(parentScope !== undefined && { parentCreationStep: parentScope.creationStep }),
				...(currentScope.structure !== null && { structure: currentScope.structure }),
				...(currentScope.structureStep !== null && { structureStep: currentScope.structureStep }),
			});
		}
	} catch {
		// swallow advice errors — don't mask the original error
	}

	return error;
}

export default blockThrowing;
