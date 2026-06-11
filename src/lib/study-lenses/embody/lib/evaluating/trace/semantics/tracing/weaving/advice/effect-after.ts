/**
 * @file Advice for effect@after — after side-effects complete.
 *
 * Emits BindingEvent(assign) for variable writes. Fires AFTER the value
 * expression has been evaluated, so state.lastExpressionResult contains
 * the correct assigned value.
 *
 * @remarks
 * WHY effect@after instead of effect@before: Aran fires effect@before BEFORE
 * the value sub-expression is evaluated. For `let x = 5`, the order is:
 * effect@before(x) → expression@after(5) → effect@after(x). Only at
 * effect@after is lastExpressionResult populated with the value 5.
 *
 * Events are the public contract — which internal hook emits them doesn't
 * matter as long as order and content are correct.
 */

import { isBindingGateOpen } from './gating.js';
import emitEvent from './emit-event.js';
import lookupVariable from './lookup-variable.js';
import representValue from '../../represent-value/represent-value.js';

import type { TracerState, JejTag } from '../types.js';

export default function effectAfter(
	state: TracerState,
	...point: unknown[]
): void {
	try {
		const variable = point[0] as string;
		const tag = point[1] as JejTag;
		const assignedValue = state.lastExpressionResult;
		const lookup = lookupVariable(state, variable);

		if (!lookup) return;

		if (!lookup.info.initialized) {
			// First write to a TDZ variable — this is initialization, not assignment.
			// Emit initialize + available events instead of assign.
			lookup.info.initialized = true;

			if (
				isBindingGateOpen(
					state.config,
					lookup.info.kind,
					'initialize',
					variable,
				)
			) {
				emitEvent(state, tag, 'expression', 'bindings.initialize', {
					kind: lookup.info.kind,
					event: 'initialize',
					name: variable,
					scopeCreationStep: lookup.scope.creationStep,
					declarationStep: lookup.info.declarationStep,
					value: representValue(assignedValue),
					explicit: true,
				});
			}

			if (
				isBindingGateOpen(state.config, lookup.info.kind, 'available', variable)
			) {
				emitEvent(state, tag, 'expression', 'bindings.available', {
					kind: lookup.info.kind,
					event: 'available',
					name: variable,
					scopeCreationStep: lookup.scope.creationStep,
					declarationStep: lookup.info.declarationStep,
					value: representValue(assignedValue),
				});
			}
		} else {
			// Subsequent write — this is a reassignment.
			if (
				isBindingGateOpen(state.config, lookup.info.kind, 'assign', variable)
			) {
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
	} catch {
		// swallow advice errors — don't crash learner code
	}
}
