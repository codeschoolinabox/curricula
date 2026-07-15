import type {
	BaseEvent,
	ShortCircuitingOperatorEvent,
	ValueRepresentation,
} from '../../types.js';
import type { DistributiveOmit, Equal, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a ShortCircuitingOperatorEvent (&&, ||, ??). The
 * result rides the paired ResolveEvent (kind: 'shortCircuit'), not this event.
 * The dispatcher stamps the base fields.
 *
 * @param params - operator, left, optional right, optional shortCircuited
 * @returns Domain fields for a ShortCircuitingOperatorEvent
 * @throws {Error} If shortCircuited with right present, or not shortCircuited without right
 */
export default function createShortCircuitingOperatorEvent(
	{
		operator,
		left,
		right,
		shortCircuited,
	}: ShortCircuitingParams = {} as ShortCircuitingParams,
): ShortCircuitingDomainFields {
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
		...(right !== undefined && { right }),
		...(shortCircuited && { shortCircuited }),
	};
}

type ShortCircuitingParams = {
	readonly operator: '&&' | '||' | '??';
	readonly left: ValueRepresentation;
	readonly right?: ValueRepresentation;
	readonly shortCircuited?: true;
};

/** Domain fields (base stamped downstream) for ShortCircuitingOperatorEvent. */
type ShortCircuitingDomainFields = {
	readonly category: 'operator';
	readonly kind: 'shortCircuiting';
	readonly operator: '&&' | '||' | '??';
	readonly left: ValueRepresentation;
	readonly right?: ValueRepresentation;
	readonly shortCircuited?: true;
};

type _AssertShortCircuiting = Expect<
	Equal<
		ShortCircuitingDomainFields,
		DistributiveOmit<ShortCircuitingOperatorEvent, keyof BaseEvent>
	>
>;
