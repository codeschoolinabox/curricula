import type {
	BaseEvent,
	PureOperatorEvent,
	PureOperatorSubkind,
	ValueRepresentation,
} from '../../types.js';
import type { DistributiveOmit, Equal, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a PureOperatorEvent (operators that evaluate all
 * operands). The result rides the paired ResolveEvent (kind: 'operator'), not
 * this event. The dispatcher stamps the base fields.
 *
 * @param params - subkind, operator string, operands, optional coercedOperands
 * @returns Domain fields for a PureOperatorEvent
 * @throws {Error} If operands is empty
 */
export default function createPureOperatorEvent(
	{
		subkind,
		operator,
		operands,
		coercedOperands,
	}: PureOperatorParams = {} as PureOperatorParams,
): PureOperatorDomainFields {
	if (!operands || operands.length === 0) {
		throw new Error('createPureOperatorEvent: operands must be non-empty');
	}

	const coercionOccurred =
		coercedOperands !== undefined && hasCoercion(operands, coercedOperands);

	return {
		category: 'operator',
		kind: 'pure',
		subkind,
		operator,
		operands,
		...(coercionOccurred && { coercion: coercedOperands }),
	};
}

type PureOperatorParams = {
	readonly subkind: PureOperatorSubkind;
	readonly operator: string;
	readonly operands: readonly ValueRepresentation[];
	readonly coercedOperands?: readonly ValueRepresentation[];
};

/** Domain fields (base stamped downstream) for PureOperatorEvent. */
type PureOperatorDomainFields = {
	readonly category: 'operator';
	readonly kind: 'pure';
	readonly subkind: PureOperatorSubkind;
	readonly operator: string;
	readonly operands: readonly ValueRepresentation[];
	readonly coercion?: readonly ValueRepresentation[];
};

type _AssertPureOperator = Expect<
	Equal<
		PureOperatorDomainFields,
		DistributiveOmit<PureOperatorEvent, keyof BaseEvent>
	>
>;

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
