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

import { isScopeGateOpen, isControlFlowGateOpen } from './config-gate.js';
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
	const currentScope = state.scopeStack[state.scopeStack.length - 1];

	// 1. ScopeEvent(enter)
	if (isScopeGateOpen(state.config, scopeKind, 'enter')) {
		const parentScope = state.scopeStack.length > 1
			? state.scopeStack[state.scopeStack.length - 2]
			: undefined;

		emitEvent(state, tag, 'statement', 'scopes.enter', {
			kind: scopeKind,
			event: 'enter',
			depth: currentScope.depth,
			creationStep: currentScope.creationStep,
			...(parentScope !== undefined && { parentCreationStep: parentScope.creationStep }),
			...(currentScope.structure !== null && { structure: currentScope.structure }),
			...(currentScope.structureStep !== null && { structureStep: currentScope.structureStep }),
		});
	}

	// 2. BranchEvent for then/else
	if (segmentKind === 'then' && isControlFlowGateOpen(state.config, 'conditional', 'branch')) {
		emitEvent(state, tag, 'statement', 'controlFlow.branch', {
			branch: 'consequent',
			scopeCreationStep: currentScope.creationStep,
			...(label !== null && { label }),
		});
	}

	if (segmentKind === 'else' && isControlFlowGateOpen(state.config, 'conditional', 'branch')) {
		emitEvent(state, tag, 'statement', 'controlFlow.branch', {
			branch: 'alternate',
			scopeCreationStep: currentScope.creationStep,
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
				scopeCreationStep: currentScope.creationStep,
				...(label !== null && { label }),
			});
		}

		state.iterationCounters[counterKey] += 1;

		// conditionally: emit DoEvent for do-while
		if (loopKind === 'doWhile' && isControlFlowGateOpen(state.config, 'doWhile', 'do')) {
			emitEvent(state, tag, 'statement', 'controlFlow.do', {
				scopeCreationStep: currentScope.creationStep,
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
