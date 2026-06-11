/**
 * @file Advice for block@declaration — after scope variables are set up.
 *
 * Always runs: records variable→scope mappings for binding event data.
 * Events: conditionally emits BindingEvent(declare/initialize/available).
 *
 * Fires BEFORE block@before (Aran's order, verified in visit.mjs).
 */

import ARAN_PARAMETERS from '../aran-parameters.js';
import { isBindingGateOpen } from './gating.js';
import emitEvent from './emit-event.js';
import representValue from '../../represent-value/represent-value.js';

import type { TracerState, JejTag } from '../types.js';

export default function blockDeclaration(
	state: TracerState,
	frame: Record<string, unknown>,
	_parentType: string,
	_scopeKind: string,
	_segmentKind: string,
	tag: JejTag,
	_label: string | null,
): void {
	// deferred: not yet migrated to scope-stack.ts currentScope() — deferred to S2 (variable lifecycle slice)
	const currentScope = state.scopeStack[state.scopeStack.length - 1];

	for (const varName of Object.keys(frame)) {
		if (ARAN_PARAMETERS.has(varName)) continue;
		// Aran internal variables use `.` prefix (e.g., `.w.1110`)
		// User variables cannot start with `.` in JavaScript
		if (varName.startsWith('.')) continue;

		const value = frame[varName];
		// WHY variableKinds lookup: the block tag (Program/Block) has no
		// bindingKind. The actual kind is on the VariableDeclaration ESTree
		// node, which Aran desugars away. variableKinds is built during
		// instrument()'s pre-walk and embedded in initialState.
		const kind = state.variableKinds[varName] ?? 'let';

		// always record variable in scope (internal tracking)
		// initialized: false when TDZ (symbol value), true when value is available
		const isTDZ = typeof value === 'symbol';
		state.step += 1;
		currentScope.variables[varName] = {
			kind,
			declarationStep: state.step,
			initialized: !isTDZ,
		};

		// conditionally emit BindingEvent(declare)
		if (isBindingGateOpen(state.config, kind, 'declare', varName)) {
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
		if (isBindingGateOpen(state.config, kind, 'initialize', varName)) {
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
		if (isBindingGateOpen(state.config, kind, 'available', varName)) {
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
