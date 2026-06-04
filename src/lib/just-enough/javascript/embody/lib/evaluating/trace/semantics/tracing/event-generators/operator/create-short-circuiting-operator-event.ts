import type {
	ShortCircuitingOperatorEvent,
	ValueRepresentation,
} from '../../types.js';

type ShortCircuitingParams = {
	readonly operator: '&&' | '||' | '??';
	readonly left: ValueRepresentation;
	readonly right?: ValueRepresentation;
	readonly result: ValueRepresentation;
	readonly shortCircuited?: true;
};

/**
 * Creates a ShortCircuitingOperatorEvent for &&, ||, ??, ?:.
 *
 * @param params - operator, left, optional right, result, optional shortCircuited
 * @returns Domain-specific fields for a ShortCircuitingOperatorEvent
 * @throws {Error} If shortCircuited with right present, or not shortCircuited without right
 */
function createShortCircuitingOperatorEvent(
	{
		operator,
		left,
		right,
		result,
		shortCircuited,
	}: ShortCircuitingParams = {} as ShortCircuitingParams,
): Omit<
	ShortCircuitingOperatorEvent,
	'step' | 'semantics' | 'loc' | 'node' | 'source'
> {
	if (shortCircuited && right !== undefined) {
		throw new Error(
			'createShortCircuitingOperatorEvent: right must be absent when shortCircuited',
		);
	}
	if (!shortCircuited && right === undefined) {
		throw new Error(
			'createShortCircuitingOperatorEvent: right is required when not shortCircuited',
		);
	}

	return {
		category: 'operator',
		kind: 'shortCircuiting',
		operator,
		left,
		result,
		...(right !== undefined && { right }),
		...(shortCircuited && { shortCircuited }),
	};
}

export default createShortCircuitingOperatorEvent;
