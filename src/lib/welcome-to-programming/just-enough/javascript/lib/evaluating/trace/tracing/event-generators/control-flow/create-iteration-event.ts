import type { IterationEvent, LoopKind, ValueRepresentation } from '../../types.js';

type IterationParams = {
	readonly kind: LoopKind;
	readonly index: number;
	readonly scopeCreationStep: number;
	readonly iterable?: ValueRepresentation;
	readonly iterationValue?: ValueRepresentation;
	readonly iterationVariable?: string;
	readonly label?: string;
};

/**
 * Creates an IterationEvent for loop iteration start.
 * forOf-specific fields (iterable, iterationValue, iterationVariable) must all co-occur.
 *
 * @throws {Error} If index < 0 or forOf fields don't co-occur
 */
function createIterationEvent({
	kind,
	index,
	scopeCreationStep,
	iterable,
	iterationValue,
	iterationVariable,
	label,
}: IterationParams = {} as IterationParams): Omit<
	IterationEvent,
	'step' | 'semantics' | 'loc' | 'node' | 'source'
> {
	if (index < 0) {
		throw new Error('createIterationEvent: index must be >= 0');
	}

	const forOfFields = [iterable, iterationValue, iterationVariable];
	const forOfPresent = forOfFields.filter((field) => field !== undefined).length;
	if (forOfPresent > 0 && forOfPresent < 3) {
		throw new Error(
			'createIterationEvent: iterable, iterationValue, and iterationVariable must all be present or all absent',
		);
	}

	return {
		category: 'controlFlow',
		event: 'iteration',
		kind,
		index,
		scopeCreationStep,
		...(iterable !== undefined && { iterable }),
		...(iterationValue !== undefined && { iterationValue }),
		...(iterationVariable !== undefined && { iterationVariable }),
		...(label !== undefined && { label }),
	};
}

export default createIterationEvent;
