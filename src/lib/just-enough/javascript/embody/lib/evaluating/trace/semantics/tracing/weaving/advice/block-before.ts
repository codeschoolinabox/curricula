/**
 * @file Advice for block@before — before block body executes.
 *
 * Always runs: loop guard must be active regardless of config.
 * Events: conditionally emits ScopeEvent(enter), BranchEvent, IterationEvent, DoEvent.
 *
 * Fires AFTER block@declaration (Aran's order, verified in visit.mjs).
 *
 * Dual responsibilities:
 * 1. Loop guard (always active): increment counter, throw RangeError if
 *    config.maxIterations exceeded. Controlled by config.maxIterations, NOT
 *    by config.controlFlow.
 * 2. Event dispatch (config-gated): ScopeEvent(enter), BranchEvent,
 *    IterationEvent, DoEvent. Each has its own config gate.
 */

import { isScopeGateOpen, isControlFlowGateOpen } from './gating.js';
import { currentScope, parentScope } from './scope-stack.js';
import emitEvent from './emit-event.js';

import type { TracerState, JejTag } from '../types.js';

function blockBefore(
	state: TracerState,
	_parentType: string,
	scopeKind: string,
	segmentKind: string,
	tag: JejTag,
	label: string | null,
): void {
	const current = currentScope(state)!;

	// 1. ScopeEvent(enter)
	if (isScopeGateOpen(state.config, scopeKind, 'enter')) {
		const parent = parentScope(state);

		emitEvent(state, tag, 'statement', 'scopes.enter', {
			kind: scopeKind,
			event: 'enter',
			depth: current.depth,
			creationStep: current.creationStep,
			...(parent !== undefined && { parentCreationStep: parent.creationStep }),
			...(current.structure !== null && { structure: current.structure }),
			...(current.structureStep !== null && { structureStep: current.structureStep }),
		});
	}

	// 2. BranchEvent for then/else
	if (segmentKind === 'then' && isControlFlowGateOpen(state.config, 'conditional', 'branch')) {
		emitEvent(state, tag, 'statement', 'controlFlow.branch', {
			branch: 'consequent',
			scopeCreationStep: current.creationStep,
			...(label !== null && { label }),
		});
	}

	if (segmentKind === 'else' && isControlFlowGateOpen(state.config, 'conditional', 'branch')) {
		emitEvent(state, tag, 'statement', 'controlFlow.branch', {
			branch: 'alternate',
			scopeCreationStep: current.creationStep,
			...(label !== null && { label }),
		});
	}

	// 3. Loop handling (while segment covers all loop types in AranLang)
	if (segmentKind === 'while') {
		const loopKind = tag.loopKind ?? 'while';
		const counterKey = `${tag.loc.start.line}:${tag.loc.start.column}`;

		// always: init/increment counter
		state.iterationCounters[counterKey] ??= 0;
		const currentIndex = state.iterationCounters[counterKey];

		// conditionally: emit IterationEvent
		if (isControlFlowGateOpen(state.config, loopKind, 'iteration')) {
			emitEvent(state, tag, 'statement', 'controlFlow.iteration', {
				kind: loopKind,
				index: currentIndex,
				scopeCreationStep: current.creationStep,
				...(label !== null && { label }),
			});
		}

		state.iterationCounters[counterKey] += 1;

		// conditionally: emit DoEvent for do-while
		if (loopKind === 'doWhile' && isControlFlowGateOpen(state.config, 'doWhile', 'do')) {
			emitEvent(state, tag, 'statement', 'controlFlow.do', {
				scopeCreationStep: current.creationStep,
				...(label !== null && { label }),
			});
		}

		// loop guard (always active, independent of controlFlow config)
		const maxIterations = state.config.maxIterations as number | undefined;
		if (maxIterations !== undefined && state.iterationCounters[counterKey] > maxIterations) {
			throw new RangeError(`Maximum iterations (${maxIterations}) exceeded`);
		}
	}
}

export default blockBefore;
