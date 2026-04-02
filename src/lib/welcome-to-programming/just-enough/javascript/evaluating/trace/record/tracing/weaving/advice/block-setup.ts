/**
 * @file Advice for block@setup — first thing in any block.
 *
 * CRITICAL: MUST return state (it's a state transformer).
 * Always runs: initializes scope tracking.
 *
 * State: pushes ScopeInfo onto scopeStack, increments step.
 * Events: conditionally emits ScopeEvent(create) when scope gate is open.
 */

import { isScopeGateOpen } from './config-gate.js';
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
			const globalCallback = (globalThis as Record<string, unknown>).__jej_onEvent;
			if (typeof globalCallback === 'function') {
				state.onEvent = globalCallback as (event: unknown) => void;
			}
		}

		// 1. increment step for scope creation
		state.step += 1;

		// 2. push scope onto stack
		state.scopeStack.push({
			creationStep: state.step,
			depth: state.scopeStack.length,
			kind: scopeKind,
			structure: tag.structure ?? null,
			structureStep: null,
			variables: {},
		});

		// 3. conditionally emit ScopeEvent(create)
		if (isScopeGateOpen(state.config, scopeKind, 'create')) {
			const currentScope = state.scopeStack[state.scopeStack.length - 1];
			const parentScope = state.scopeStack.length > 1
				? state.scopeStack[state.scopeStack.length - 2]
				: undefined;

			emitEvent(state, tag, 'statement', 'scopes.create', {
				kind: scopeKind,
				event: 'create',
				depth: currentScope.depth,
				creationStep: currentScope.creationStep,
				...(parentScope !== undefined && { parentCreationStep: parentScope.creationStep }),
				...(currentScope.structure !== null && { structure: currentScope.structure }),
				...(currentScope.structureStep !== null && { structureStep: currentScope.structureStep }),
			});
		}
	} catch {
		// swallow advice errors — don't crash learner code
	}

	return state;
}

export default blockSetup;
