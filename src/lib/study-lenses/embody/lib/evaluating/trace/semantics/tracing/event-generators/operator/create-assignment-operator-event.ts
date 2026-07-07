import type {
	AssignmentOperatorEvent,
	BaseEvent,
	ValueRepresentation,
} from '../../types.js';
import type { DistributiveOmit, Equal, Expect } from '../conformance.js';

/**
 * Creates the domain fields for an AssignmentOperatorEvent (=, +=, -=, ??=, ||=,
 * &&=, etc.). Unlike pure operators, the written `value` stays on this event —
 * it is the operator's own perspective on the write, not a separate resolve.
 * The dispatcher stamps the base fields.
 *
 * @param params - operator, target, operands, result (the written value), scope ref, optional coercion/shortCircuited
 * @returns Domain fields for an AssignmentOperatorEvent
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
): AssignmentDomainFields {
	if (!target) {
		throw new Error(
			'createAssignmentOperatorEvent: target is required and must be non-empty',
		);
	}

	const coercionOccurred =
		coercedOperands !== undefined && hasCoercion(operands, coercedOperands);

	return {
		category: 'assignment',
		operator,
		target,
		operands,
		value: result,
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

/** Domain fields (base stamped downstream) for AssignmentOperatorEvent. */
type AssignmentDomainFields = {
	readonly category: 'assignment';
	readonly operator: string;
	readonly target: string;
	readonly operands: readonly ValueRepresentation[];
	readonly value: ValueRepresentation;
	readonly coercion?: readonly ValueRepresentation[];
	readonly shortCircuited?: true;
	readonly scopeCreationStep?: number;
};

type _AssertAssignment = Expect<
	Equal<
		AssignmentDomainFields,
		DistributiveOmit<AssignmentOperatorEvent, keyof BaseEvent>
	>
>;

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
