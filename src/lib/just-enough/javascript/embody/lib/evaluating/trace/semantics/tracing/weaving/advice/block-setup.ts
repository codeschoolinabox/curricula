/**
 * @file Advice for block@setup — first thing in any block.
 *
 * CRITICAL: MUST return state (it's a state transformer).
 * Always runs: initializes scope tracking.
 *
 * State: pushes ScopeInfo onto scopeStack, increments step.
 * Events: conditionally emits ScopeEvent(create) when scope gate is open.
 */

import { isScopeGateOpen } from './gating.js';
import { pushScope, currentScope, parentScope } from './scope-stack.js';
import emitEvent from './emit-event.js';

import type { TracerState, JejTag } from '../types.js';

function blockSetup(
	state: TracerState,
	_parentType: string,
	scopeKind: string,
	_segmentKind: string,
	tag: JejTag,
	_label: string | null,
): TracerState {
	try {
		// 0. Pick up global event callback if not already set.
		// WHY: Aran JSON-clones initialState into the instrumented code, losing
		// onEvent (functions aren't JSON-serializable). The worker sets a global
		// callback before eval. block-setup (first hook) picks it up and sets it
		// on the state. Since block-setup RETURNS state, all subsequent hooks
		// inherit onEvent.
		if (!state.onEvent && typeof globalThis !== 'undefined') {
			const globalCallback = (globalThis as Record<string, unknown>)
				.__jej_onEvent;
			if (typeof globalCallback === 'function') {
				state.onEvent = globalCallback as (event: unknown) => void;
			}
		}

		// 1+2. increment step + push scope onto stack (step owned by pushScope)
		pushScope(state, { kind: scopeKind, structure: tag.structure });

		// 3. conditionally emit ScopeEvent(create)
		if (isScopeGateOpen(state.config, scopeKind, 'create')) {
			const current = currentScope(state)!;
			const parent = parentScope(state);

			emitEvent(state, tag, 'statement', 'scopes.create', {
				kind: scopeKind,
				event: 'create',
				depth: current.depth,
				creationStep: current.creationStep,
				...(parent !== undefined && {
					parentCreationStep: parent.creationStep,
				}),
				...(current.structure !== null && { structure: current.structure }),
				...(current.structureStep !== null && {
					structureStep: current.structureStep,
				}),
			});
		}
	} catch {
		// swallow advice errors — don't crash learner code
	}

	return state;
}

export default blockSetup;
