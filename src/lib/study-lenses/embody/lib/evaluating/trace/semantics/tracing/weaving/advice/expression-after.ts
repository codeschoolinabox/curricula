/**
 * @file Advice for expression@after — after expression evaluation.
 *
 * CRITICAL: This is a value transformer — it MUST return the result value.
 *
 * State: sets lastExpressionResult (always), rotates previousExpressionResult.
 * Events: dispatches LiteralEvent, BindingEvent(read), TestEvent,
 *         ShortCircuitingOperatorEvent based on point[0] discriminant.
 *
 * Also resets iteration counter when a loop test evaluates false.
 */

import {
	isLiteralEnabled,
	isBindingGateOpen,
	isControlFlowGateOpen,
	isOperatorEnabled,
} from './gating.js';
import emitEvent from './emit-event.js';
import lookupVariable from './lookup-variable.js';
import representValue from '../../represent-value/represent-value.js';

import type { TracerState, JejTag } from '../types.js';

export default function expressionAfter(
	state: TracerState,
	result: unknown,
	...point: unknown[]
): unknown {
	try {
		const discriminant = point[0] as string;

		if (discriminant === 'literal') {
			const tag = point[1] as JejTag;
			const literalKind = tag.literalKind;

			if (literalKind && isLiteralEnabled(state.config, literalKind)) {
				emitEvent(state, tag, 'expression', `literals.${literalKind}`, {
					kind: literalKind,
					value: representValue(result),
				});
			}
		} else if (discriminant === 'read') {
			const varName = point[1] as string;
			const tag = point[2] as JejTag;
			const lookup = lookupVariable(state, varName);

			// store read value for compound assignment operands (effect-before needs it)
			state.lastReadValues[varName] = result;

			if (
				lookup &&
				isBindingGateOpen(state.config, lookup.info.kind, 'read', varName)
			) {
				emitEvent(state, tag, 'expression', 'bindings.read', {
					kind: lookup.info.kind,
					event: 'read',
					name: varName,
					scopeCreationStep: lookup.scope.creationStep,
					declarationStep: lookup.info.declarationStep,
					value: representValue(result),
				});
			}
		} else if (discriminant === 'test') {
			const testSource = point[1] as string;
			const tag = point[2] as JejTag;
			const boolResult = Boolean(result);
			const kind = testSource;
			// deferred: not yet migrated to scope-stack.ts currentScope() — deferred to S3 (read+operators slice)
			const currentScope = state.scopeStack[state.scopeStack.length - 1];

			if (isControlFlowGateOpen(state.config, kind, 'test')) {
				const coercion =
					typeof result !== 'boolean' ? representValue(boolResult) : undefined;

				emitEvent(state, tag, 'expression', 'controlFlow.test', {
					kind,
					value: representValue(result),
					result: boolResult,
					scopeCreationStep: currentScope.creationStep,
					...(coercion !== undefined && { coercion }),
				});
			}

			// reset iteration counter when loop test is false
			if (!boolResult && testSource !== 'conditional') {
				const counterKey = `${tag.loc.start.line}:${tag.loc.start.column}`;
				delete state.iterationCounters[counterKey];
			}
		} else if (discriminant === 'shortCircuiting') {
			const operator = point[1] as string;
			const tag = point[2] as JejTag;

			if (isOperatorEnabled(state.config, 'shortCircuiting')) {
				const shortCircuited = didShortCircuit(operator, result);

				// when short-circuited: left = result (the left value was returned as-is)
				// when not short-circuited: left = previousExpressionResult
				//   (the test sub-expression set lastExpressionResult, then the branch
				//    sub-expression overwrote it — previousExpressionResult holds the test value)
				const leftValue = shortCircuited
					? result
					: state.previousExpressionResult;

				emitEvent(state, tag, 'expression', 'operators.shortCircuiting', {
					operator,
					left: representValue(leftValue),
					result: representValue(result),
					...(shortCircuited
						? { shortCircuited: true }
						: { right: representValue(result) }),
				});
			}
		}
	} catch {
		// swallow advice errors — don't break learner code
	}

	// rotate expression results — previousExpressionResult holds the value
	// before this expression, used for short-circuiting left operand recovery
	state.previousExpressionResult = state.lastExpressionResult;
	state.lastExpressionResult = result;
	return result;
}

/**
 * Determines if a short-circuiting operator short-circuited based on
 * the operator and the result value.
 *
 * For &&: short-circuits when left is falsy (result = left)
 * For ||: short-circuits when left is truthy (result = left)
 * For ??: short-circuits when left is not null/undefined (result = left)
 */
function didShortCircuit(operator: string, result: unknown): boolean {
	if (operator === '&&') return !Boolean(result);
	if (operator === '||') return Boolean(result);
	if (operator === '??') return result !== null && result !== undefined;
	return false;
}
