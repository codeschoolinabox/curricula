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

import {
	isOperatorEnabled,
	isPropertyAccessEnabled,
	isFunctionEnabled,
	isTemplateEnabled,
	isBindingGateOpen,
} from './gating.js';
import emitEvent from './emit-event.js';
import representValue from '../../represent-value/represent-value.js';

import type { TracerState, JejTag } from '../types.js';

/**
 * Computes coerced operands for a binary operator.
 * Returns undefined if no coercion is possible (strict operators).
 */
function computeBinaryCoercion(
	operator: string,
	left: unknown,
	right: unknown,
): [unknown, unknown] | undefined {
	// strict equality — never coerces
	if (operator === '===' || operator === '!==') return undefined;

	// addition: if either is string, both coerce to string; else both to number
	if (operator === '+') {
		if (typeof left === 'string' || typeof right === 'string') {
			return [String(left), String(right)];
		}
		return [Number(left), Number(right)];
	}

	// arithmetic/bitwise: coerce to number
	if (
		['-', '*', '/', '%', '**', '&', '|', '^', '<<', '>>', '>>>'].includes(
			operator,
		)
	) {
		return [Number(left), Number(right)];
	}

	// comparison: both strings → no coercion; otherwise coerce to number
	if (['<', '>', '<=', '>='].includes(operator)) {
		if (typeof left === 'string' && typeof right === 'string') return undefined;
		return [Number(left), Number(right)];
	}

	return undefined;
}

/**
 * Computes coerced operand for a unary operator.
 */
function computeUnaryCoercion(
	operator: string,
	operand: unknown,
): [unknown] | undefined {
	if (operator === '!') return [Boolean(operand)];
	if (operator === '+' || operator === '-') return [Number(operand)];
	if (operator === '~') return [Number(operand)];
	return undefined;
}

/** Binary operator → PureOperatorSubkind */
const BINARY_SUBKIND: Record<string, string> = {
	'+': 'addition',
	'-': 'arithmetic',
	'*': 'arithmetic',
	'/': 'arithmetic',
	'%': 'arithmetic',
	'**': 'arithmetic',
	'===': 'comparison',
	'!==': 'comparison',
	'>': 'comparison',
	'<': 'comparison',
	'>=': 'comparison',
	'<=': 'comparison',
	'&': 'bitwise',
	'|': 'bitwise',
	'^': 'bitwise',
	'<<': 'bitwise',
	'>>': 'bitwise',
	'>>>': 'bitwise',
};

/** Unary operator → PureOperatorSubkind */
const UNARY_SUBKIND: Record<string, string> = {
	typeof: 'typeof',
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

			if (
				subkind &&
				isOperatorEnabled(state.config, `pure.${subkind}`, operator)
			) {
				const operands = [representValue(left), representValue(right)];
				const coerced = computeBinaryCoercion(operator, left, right);
				emitEvent(state, tag, 'expression', `operators.pure.${subkind}`, {
					subkind,
					operator,
					operands,
					result: representValue(callResult),
					...(coerced && { coercedOperands: coerced.map(representValue) }),
				});
			}
		} else if (discriminant === 'aran.performUnaryOperation') {
			const operator = args[0] as string;
			const operand = args[1];
			const subkind = UNARY_SUBKIND[operator];

			if (
				subkind &&
				isOperatorEnabled(state.config, `pure.${subkind}`, operator)
			) {
				const operands = [representValue(operand)];
				const coerced = computeUnaryCoercion(operator, operand);
				emitEvent(state, tag, 'expression', `operators.pure.${subkind}`, {
					subkind,
					operator,
					operands,
					result: representValue(callResult),
					...(coerced && { coercedOperands: coerced.map(representValue) }),
				});
			}
		} else if (discriminant === 'aran.getValueProperty') {
			const object = args[0];
			const key = args[1];
			const accessKind = tag.accessKind ?? 'dot';

			if (isPropertyAccessEnabled(state.config, accessKind, String(key))) {
				const isShortCircuited =
					accessKind === 'optionalChaining' &&
					(object === null || object === undefined);
				emitEvent(state, tag, 'expression', `propertyAccess.${accessKind}`, {
					kind: accessKind,
					object: representValue(object),
					key,
					value: representValue(callResult),
					...(isShortCircuited && { shortCircuited: true }),
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

			if (isFunctionEnabled(state.config, 'call', name)) {
				emitEvent(state, tag, 'expression', 'functions.call', {
					name,
					args: args.map(representValue),
				});
			}

			if (isFunctionEnabled(state.config, 'return', name)) {
				emitEvent(state, tag, 'expression', 'functions.return', {
					name,
					value: representValue(callResult),
				});
			}
		} else if (discriminant === 'aran.readGlobalVariable') {
			const varName = args[0] as string;
			if (isBindingGateOpen(state.config, 'global', 'read', varName)) {
				emitEvent(state, tag, 'expression', 'bindings.read', {
					kind: 'global',
					event: 'read',
					name: varName,
					scopeCreationStep: 0,
					value: representValue(callResult),
				});
			}
		} else if (
			discriminant === 'aran.writeGlobalVariableStrict' ||
			discriminant === 'aran.writeGlobalVariableSloppy'
		) {
			const varName = args[0] as string;
			if (isBindingGateOpen(state.config, 'global', 'assign', varName)) {
				emitEvent(state, tag, 'expression', 'bindings.assign', {
					kind: 'global',
					event: 'assign',
					name: varName,
					scopeCreationStep: 0,
					value: representValue(callResult),
				});
			}
		} else if (discriminant === 'aran.typeofGlobalVariable') {
			const varName = args[0] as string;
			if (isOperatorEnabled(state.config, 'pure.typeof', 'typeof')) {
				emitEvent(state, tag, 'expression', 'operators.pure.typeof', {
					subkind: 'typeof',
					operator: 'typeof',
					operands: [representValue(varName)],
					result: representValue(callResult),
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
