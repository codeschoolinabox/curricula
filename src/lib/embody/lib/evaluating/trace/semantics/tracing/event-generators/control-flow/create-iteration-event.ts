import type {
	BaseEvent,
	LoopEvent,
	LoopKind,
	ValueRepresentation,
} from '../../types.js';
import type { DistributiveOmit, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a loop iteration event. forOf-specific fields
 * (iterable, iterationValue, iterationVariable) must all co-occur. The
 * dispatcher stamps the base fields.
 *
 * @throws {Error} If index < 0, or the forOf fields do not all co-occur
 */
export default function createIterationEvent(
	{
		kind,
		index,
		scopeCreationStep,
		iterable,
		iterationValue,
		iterationVariable,
	}: IterationParams = {} as IterationParams,
): IterationDomainFields {
	if (index < 0) {
		throw new Error('createIterationEvent: index must be >= 0');
	}

	const forOfFields = [iterable, iterationValue, iterationVariable];
	const forOfPresent = forOfFields.filter(
		(field) => field !== undefined,
	).length;
	if (forOfPresent > 0 && forOfPresent < 3) {
		throw new Error(
			'createIterationEvent: iterable, iterationValue, and iterationVariable must all be present or all absent',
		);
	}

	return {
		category: 'loop',
		kind,
		event: 'iteration',
		index,
		scopeCreationStep,
		...(iterable !== undefined && { iterable }),
		...(iterationValue !== undefined && { iterationValue }),
		...(iterationVariable !== undefined && { iterationVariable }),
	};
}

type IterationParams = {
	readonly kind: LoopKind;
	readonly index: number;
	readonly scopeCreationStep: number;
	readonly iterable?: ValueRepresentation;
	readonly iterationValue?: ValueRepresentation;
	readonly iterationVariable?: string;
};

/** Domain fields (base stamped downstream) for LoopEvent(iteration). */
type IterationDomainFields = {
	readonly category: 'loop';
	readonly kind: LoopKind;
	readonly event: 'iteration';
	readonly index: number;
	readonly scopeCreationStep: number;
	readonly iterable?: ValueRepresentation;
	readonly iterationValue?: ValueRepresentation;
	readonly iterationVariable?: string;
};

type _AssertIterationShape = Expect<
	[IterationDomainFields] extends [DistributiveOmit<LoopEvent, keyof BaseEvent>]
		? true
		: false
>;
