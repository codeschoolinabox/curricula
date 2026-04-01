/**
 * @file Advice for block@declaration — after scope variables are set up.
 *
 * Always runs: records variable→scope mappings for binding event data.
 * Events: conditionally emits BindingEvent(declare/initialize/available).
 *
 * Fires BEFORE block@before (Aran's order, verified in visit.mjs).
 */

import ARAN_PARAMETERS from '../aran-parameters.js';
import { isBindingGateOpen } from './config-gate.js';
import emitEvent from './emit-event.js';
import representValue from '../../represent-value/represent-value.js';

import type { TracerState, JejTag } from '../types.js';

function blockDeclaration(
	state: TracerState,
	frame: Record<string, unknown>,
	_parentType: string,
	_scopeKind: string,
	_segmentKind: string,
	tag: JejTag,
): void {
	const currentScope = state.scopeStack[state.scopeStack.length - 1];
	const kind = tag.bindingKind ?? 'let';

	for (const varName of Object.keys(frame)) {
		if (ARAN_PARAMETERS.has(varName)) continue;

		const value = frame[varName];

		// always record variable in scope (internal tracking)
		state.step += 1;
		currentScope.variables[varName] = { kind, declarationStep: state.step };

		// conditionally emit BindingEvent(declare)
		if (isBindingGateOpen(state.config, kind, 'declare')) {
			emitEvent(state, tag, 'expression', 'bindings.declare', {
				kind,
				event: 'declare',
				name: varName,
				scopeCreationStep: currentScope.creationStep,
			});
		}

		// skip initialize/available for deadzone (TDZ) values
		if (typeof value === 'symbol') continue;

		// conditionally emit BindingEvent(initialize)
		if (isBindingGateOpen(state.config, kind, 'initialize')) {
			emitEvent(state, tag, 'expression', 'bindings.initialize', {
				kind,
				event: 'initialize',
				name: varName,
				scopeCreationStep: currentScope.creationStep,
				declarationStep: currentScope.variables[varName].declarationStep,
				value: representValue(value),
				...(tag.explicit !== undefined && { explicit: tag.explicit }),
			});
		}

		// conditionally emit BindingEvent(available)
		if (isBindingGateOpen(state.config, kind, 'available')) {
			emitEvent(state, tag, 'expression', 'bindings.available', {
				kind,
				event: 'available',
				name: varName,
				scopeCreationStep: currentScope.creationStep,
				declarationStep: currentScope.variables[varName].declarationStep,
				value: representValue(value),
			});
		}
	}
}

export default blockDeclaration;
