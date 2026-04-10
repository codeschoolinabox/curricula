/**
 * @file Advice for block@throwing — when block exits via error.
 *
 * CRITICAL: MUST return the error value.
 * Conditionally registered: only when any scope event is enabled.
 * Events: emits ScopeEvent(interrupt) when scope gate is open.
 */

import { isScopeGateOpen } from './gating.js';
import { currentScope, parentScope } from './scope-stack.js';
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
			const current = currentScope(state)!;
			const parent = parentScope(state);

			emitEvent(state, tag, 'statement', 'scopes.interrupt', {
				kind: scopeKind,
				event: 'interrupt',
				depth: current.depth,
				creationStep: current.creationStep,
				...(parent !== undefined && { parentCreationStep: parent.creationStep }),
				...(current.structure !== null && { structure: current.structure }),
				...(current.structureStep !== null && { structureStep: current.structureStep }),
			});
		}
	} catch {
		// swallow advice errors — don't mask the original error
	}

	return error;
}

export default blockThrowing;
