/**
 * @file Advice for apply@around — wraps ALL function call execution.
 *
 * CRITICAL: This REPLACES function call execution. It MUST call Reflect.apply
 * and return the result or the program breaks.
 *
 * State: sets lastExpressionResult (always).
 * Events: dispatches PureOperatorEvent, PropertyAccessEvent, FunctionCallEvent,
 *         FunctionReturnEvent, TemplateEvents based on point[0] discriminant.
 *
 * Dispatch relies on pointcut-side intrinsic detection: point[0] is the
 * intrinsic name (e.g., 'aran.performBinaryOperation'), 'template', or 'call'.
 */

import { isOperatorEnabled, isPropertyAccessEnabled, isFunctionEnabled, isTemplateEnabled } from './config-gate.js';
import emitEvent from './emit-event.js';
import representValue from '../../represent-value/represent-value.js';

import type { TracerState, JejTag } from '../types.js';

/** Binary operator → PureOperatorSubkind */
const BINARY_SUBKIND: Record<string, string> = {
	'+': 'addition',
	'-': 'arithmetic', '*': 'arithmetic', '/': 'arithmetic', '%': 'arithmetic', '**': 'arithmetic',
	'===': 'comparison', '!==': 'comparison', '>': 'comparison', '<': 'comparison', '>=': 'comparison', '<=': 'comparison',
	'&': 'bitwise', '|': 'bitwise', '^': 'bitwise', '<<': 'bitwise', '>>': 'bitwise', '>>>': 'bitwise',
};

/** Unary operator → PureOperatorSubkind */
const UNARY_SUBKIND: Record<string, string> = {
	'typeof': 'typeof',
	'!': 'negation.logical',
	'~': 'negation.bitwise',
	'+': 'arithmetic',
	'-': 'arithmetic',
};

function applyAround(
	state: TracerState,
	callee: unknown,
	thisArg: unknown,
	args: unknown[],
	...point: unknown[]
): unknown {
	const callResult = Reflect.apply(callee as Function, thisArg, args);

	try {
		const discriminant = point[0] as string;
		const tag = point[1] as JejTag;

		if (discriminant === 'aran.performBinaryOperation') {
			const operator = args[0] as string;
			const left = args[1];
			const right = args[2];
			const subkind = BINARY_SUBKIND[operator];

			if (subkind && isOperatorEnabled(state.config, `pure.${subkind}`)) {
				emitEvent(state, tag, 'expression', `operators.pure.${subkind}`, {
					subkind,
					operator,
					operands: [representValue(left), representValue(right)],
					result: representValue(callResult),
				});
			}
		} else if (discriminant === 'aran.performUnaryOperation') {
			const operator = args[0] as string;
			const operand = args[1];
			const subkind = UNARY_SUBKIND[operator];

			if (subkind && isOperatorEnabled(state.config, `pure.${subkind}`)) {
				emitEvent(state, tag, 'expression', `operators.pure.${subkind}`, {
					subkind,
					operator,
					operands: [representValue(operand)],
					result: representValue(callResult),
				});
			}
		} else if (discriminant === 'aran.getValueProperty') {
			const object = args[0];
			const key = args[1];
			const accessKind = tag.accessKind ?? 'dot';

			if (isPropertyAccessEnabled(state.config, accessKind)) {
				emitEvent(state, tag, 'expression', `propertyAccess.${accessKind}`, {
					kind: accessKind,
					object: String(object),
					key,
					value: representValue(callResult),
				});
			}
		} else if (discriminant === 'template') {
			const strings = tag.templateStrings;
			const expressionCount = tag.templateExpressionCount ?? 0;

			// TemplateBeginEvent
			if (strings && isTemplateEnabled(state.config, 'begin')) {
				emitEvent(state, tag, 'expression', 'templates.begin', {
					strings,
					expressionCount,
				});
			}

			const beginStep = state.step;

			// TemplateEvaluationEvent per expression
			if (isTemplateEnabled(state.config, 'evaluation')) {
				for (let i = 0; i < expressionCount; i += 1) {
					const expressionValue = args[i * 2 + 1];
					emitEvent(state, tag, 'expression', 'templates.evaluation', {
						index: i,
						value: representValue(expressionValue),
						beginStep,
					});
				}
			}

			// TemplateEndEvent
			if (isTemplateEnabled(state.config, 'end')) {
				emitEvent(state, tag, 'expression', 'templates.end', {
					value: representValue(callResult),
					beginStep,
				});
			}
		} else if (discriminant === 'call') {
			const name = (callee as Function)?.name || 'anonymous';

			if (isFunctionEnabled(state.config, 'call')) {
				emitEvent(state, tag, 'expression', 'functions.call', {
					name,
					args: args.map(representValue),
				});
			}

			if (isFunctionEnabled(state.config, 'return')) {
				emitEvent(state, tag, 'expression', 'functions.return', {
					name,
					value: representValue(callResult),
				});
			}
		}
		// any other intrinsic (aran.toPropertyKey, etc.): skip, just return result
	} catch {
		// swallow advice errors — don't break learner code
	}

	state.lastExpressionResult = callResult;
	return callResult;
}

export default applyAround;
