/**
 * @file Advice for block@teardown — always, right before leaving block.
 *
 * Always runs: pops scope from stack.
 * Events: conditionally emits ScopeEvent(leave) before popping.
 */

import { isScopeGateOpen } from './gating.js';
import { popScope, currentScope, parentScope } from './scope-stack.js';
import emitEvent from './emit-event.js';

import type { TracerState, JejTag } from '../types.js';

export default function blockTeardown(
	state: TracerState,
	_parentType: string,
	scopeKind: string,
	_segmentKind: string,
	tag: JejTag,
	_label: string | null,
): void {
	// 1. conditionally emit ScopeEvent(leave) BEFORE popping
	// try/catch protects popScope() — if emitEvent throws, scope tracking
	// would be permanently corrupted for all subsequent advice calls
	try {
		if (isScopeGateOpen(state.config, scopeKind, 'leave')) {
			const current = currentScope(state)!;
			const parent = parentScope(state);

			emitEvent(state, tag, 'statement', 'scopes.leave', {
				kind: scopeKind,
				event: 'leave',
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
		// swallow advice errors — popScope() MUST run
	}

	// 2. pop scope — always, even if event emission failed
	popScope(state);
}
