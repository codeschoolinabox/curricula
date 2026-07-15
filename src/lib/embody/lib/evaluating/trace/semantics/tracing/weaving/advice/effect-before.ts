/**
 * @file Advice for effect@before — before side-effects execute.
 *
 * Events: emits AssignmentOperatorEvent for compound assignments (+=, -=, etc.).
 *
 * @remarks
 * BindingEvent(assign) has been moved to effect-after.ts because Aran fires
 * effect@before BEFORE the value sub-expression is evaluated. The compound
 * AssignmentOperatorEvent stays here because it needs the pre-write current
 * value (available via state.lastReadValues) and the RHS value (available
 * via state.lastExpressionResult for compound assignments where the RHS is
 * evaluated before the compound effect).
 */

import { isOperatorEnabled } from './gating.js';
import emitEvent from './emit-event.js';
import lookupVariable from './lookup-variable.js';
import representValue from '../../represent-value/represent-value.js';

import type { TracerState, JejTag } from '../types.js';

export default function effectBefore(
	state: TracerState,
	...point: unknown[]
): void {
	const variable = point[0] as string;
	const tag = point[1] as JejTag;
	const assignedValue = state.lastExpressionResult;
	const lookup = lookupVariable(state, variable);

	if (!lookup) return;

	const isCompound = tag.operator !== undefined && tag.operator !== '=';

	// compound assignment (+=, -=, etc.) — emit AssignmentOperatorEvent
	if (
		isCompound &&
		isOperatorEnabled(state.config, 'assignment', tag.operator)
	) {
		const currentValue = state.lastReadValues[variable];
		emitEvent(state, tag, 'expression', 'operators.assignment', {
			operator: tag.operator,
			target: variable,
			operands:
				currentValue !== undefined
					? [representValue(currentValue), representValue(assignedValue)]
					: [representValue(assignedValue)],
			result: representValue(assignedValue),
			scopeCreationStep: lookup.scope.creationStep,
		});
	}
}
