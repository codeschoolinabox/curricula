/**
 * @file Advice for expression@after — after expression evaluation.
 *
 * CRITICAL: This is a value transformer — it MUST return the result value.
 *
 * State: sets lastExpressionResult (always).
 * Events: dispatches LiteralEvent, BindingEvent(read), TestEvent based on
 *         point[0] discriminant. ShortCircuiting deferred to Phase 7.
 *
 * Also resets iteration counter when a loop test evaluates false.
 */

import { isLiteralEnabled, isBindingGateOpen, isControlFlowGateOpen } from './config-gate.js';
import emitEvent from './emit-event.js';
import lookupVariable from './lookup-variable.js';
import representValue from '../../represent-value/represent-value.js';

import type { TracerState, JejTag } from '../types.js';

function expressionAfter(
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

			if (lookup && isBindingGateOpen(state.config, lookup.info.kind, 'read')) {
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
			const currentScope = state.scopeStack[state.scopeStack.length - 1];

			if (isControlFlowGateOpen(state.config, kind, 'test')) {
				const coercion = typeof result !== 'boolean'
					? representValue(boolResult)
					: undefined;

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
		}
		// 'shortCircuiting' — deferred to Phase 7
	} catch {
		// swallow advice errors — don't break learner code
	}

	state.lastExpressionResult = result;
	return result;
}

export default expressionAfter;
