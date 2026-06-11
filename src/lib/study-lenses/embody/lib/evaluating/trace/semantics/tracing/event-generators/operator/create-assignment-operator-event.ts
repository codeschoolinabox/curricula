import type {
	AssignmentOperatorEvent,
	ValueRepresentation,
} from '../../types.js';

/**
 * Creates an AssignmentOperatorEvent for =, +=, -=, ??=, ||=, &&=, etc.
 *
 * @param params - operator, target, operands, result, scope ref, optional coercion/shortCircuited
 * @returns Domain-specific fields for an AssignmentOperatorEvent
 * @throws {Error} If target is empty
 */
export default function createAssignmentOperatorEvent(
	{
		operator,
		target,
		operands,
		result,
		scopeCreationStep,
		coercedOperands,
		shortCircuited,
	}: AssignmentParams = {} as AssignmentParams,
): Omit<
	AssignmentOperatorEvent,
	'step' | 'semantics' | 'loc' | 'node' | 'source'
> {
	if (!target) {
		throw new Error(
			'createAssignmentOperatorEvent: target is required and must be non-empty',
		);
	}

	const coercionOccurred =
		coercedOperands !== undefined && hasCoercion(operands, coercedOperands);

	return {
		category: 'assignment',
		kind: 'assignment',
		operator,
		target,
		operands,
		result,
		scopeCreationStep,
		...(coercionOccurred && { coercion: coercedOperands }),
		...(shortCircuited && { shortCircuited }),
	};
}

type AssignmentParams = {
	readonly operator: string;
	readonly target: string;
	readonly operands: readonly ValueRepresentation[];
	readonly result: ValueRepresentation;
	readonly scopeCreationStep: number;
	readonly coercedOperands?: readonly ValueRepresentation[];
	readonly shortCircuited?: true;
};

/**
 * Compares two ValueRepresentation arrays for shallow equality.
 */
function hasCoercion(
	operands: readonly ValueRepresentation[],
	coerced: readonly ValueRepresentation[],
): boolean {
	if (operands.length !== coerced.length) return true;

	for (let i = 0; i < operands.length; i += 1) {
		const original = operands[i];
		const coercedValue = coerced[i];
		if (original.type !== coercedValue.type) return true;
		if (
			'value' in original &&
			'value' in coercedValue &&
			original.value !== coercedValue.value
		) {
			return true;
		}
	}

	return false;
}
