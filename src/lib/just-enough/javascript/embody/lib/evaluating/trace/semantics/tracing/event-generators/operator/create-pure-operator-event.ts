import type { PureOperatorEvent, PureOperatorSubkind, ValueRepresentation } from '../../types.js';

type PureOperatorParams = {
	readonly subkind: PureOperatorSubkind;
	readonly operator: string;
	readonly operands: readonly ValueRepresentation[];
	readonly result: ValueRepresentation;
	readonly coercedOperands?: readonly ValueRepresentation[];
};

/**
 * Compares two ValueRepresentation arrays for shallow equality.
 * Returns true if any element differs (coercion occurred).
 */
function hasCoercion(
	operands: readonly ValueRepresentation[],
	coerced: readonly ValueRepresentation[],
): boolean {
	if (operands.length !== coerced.length) return true;

	for (let i = 0; i < operands.length; i += 1) {
		const original = operands[i];
		const coercedValue = coerced[i];

		// compare type field — present on all ValueRepresentation variants
		if (original.type !== coercedValue.type) return true;

		// compare value field when both have it
		if ('value' in original && 'value' in coercedValue && original.value !== coercedValue.value) {
			return true;
		}
	}

	return false;
}

/**
 * Creates a PureOperatorEvent for operators that evaluate all operands.
 *
 * @param params - subkind, operator string, operands, result, optional coercedOperands
 * @returns Domain-specific fields for a PureOperatorEvent
 * @throws {Error} If operands is empty
 */
function createPureOperatorEvent({
	subkind,
	operator,
	operands,
	result,
	coercedOperands,
}: PureOperatorParams = {} as PureOperatorParams): Omit<
	PureOperatorEvent,
	'step' | 'semantics' | 'loc' | 'node' | 'source'
> {
	if (!operands || operands.length === 0) {
		throw new Error('createPureOperatorEvent: operands must be non-empty');
	}

	const coercionOccurred = coercedOperands !== undefined && hasCoercion(operands, coercedOperands);

	return {
		category: 'operator',
		kind: 'pure',
		subkind,
		operator,
		operands,
		result,
		...(coercionOccurred && { coercion: coercedOperands }),
	};
}

export default createPureOperatorEvent;
