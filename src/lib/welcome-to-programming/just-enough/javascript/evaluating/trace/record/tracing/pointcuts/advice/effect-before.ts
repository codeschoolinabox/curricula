/**
 * @file Advice for effect@before — before side-effects execute.
 *
 * Events: emits BindingEvent(assign) and/or AssignmentOperatorEvent.
 * Reads assignment value from state.lastExpressionResult.
 */

import { isBindingGateOpen, isOperatorEnabled } from './config-gate.js';
import emitEvent from './emit-event.js';
import lookupVariable from './lookup-variable.js';
import representValue from '../../represent-value/represent-value.js';

import type { TracerState, JejTag } from '../types.js';

function effectBefore(state: TracerState, ...point: unknown[]): void {
	const variable = point[0] as string;
	const tag = point[1] as JejTag;
	const assignedValue = state.lastExpressionResult;
	const lookup = lookupVariable(state, variable);

	if (!lookup) return;

	const isCompound = tag.operator !== undefined && tag.operator !== '=';

	// compound assignment (+=, -=, etc.) — emit AssignmentOperatorEvent
	if (isCompound && isOperatorEnabled(state.config, 'assignment')) {
		emitEvent(state, tag, 'expression', 'operators.assignment', {
			operator: tag.operator,
			target: variable,
			operands: [representValue(assignedValue)],
			result: representValue(assignedValue),
			scopeCreationStep: lookup.scope.creationStep,
		});
	}

	// BindingEvent(assign) — for both simple and compound
	if (isBindingGateOpen(state.config, lookup.info.kind, 'assign')) {
		emitEvent(state, tag, 'expression', 'bindings.assign', {
			kind: lookup.info.kind,
			event: 'assign',
			name: variable,
			scopeCreationStep: lookup.scope.creationStep,
			declarationStep: lookup.info.declarationStep,
			value: representValue(assignedValue),
		});
	}
}

export default effectBefore;
