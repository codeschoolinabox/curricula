import type {
	BaseEvent,
	ProtoChainStep,
	PropertyAccessEvent,
	PropertyAccessKind,
	ValueRepresentation,
} from '../../types.js';
import type { DistributiveOmit, Equal, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a PropertyAccessEvent (dot, bracket, or optional
 * chaining reads). The accessed value rides the paired ResolveEvent
 * (kind: 'property'), not this event. The dispatcher stamps the base fields.
 *
 * @param params - access kind, object value, key, optional shortCircuited
 * @returns Domain fields for a PropertyAccessEvent
 * @throws {Error} If shortCircuited is set on a non-optionalChaining kind
 */
export default function createPropertyAccessEvent(
	{
		kind,
		object,
		key,
		shortCircuited,
	}: {
		readonly kind: PropertyAccessKind;
		readonly object: ValueRepresentation;
		readonly key: string | number;
		readonly shortCircuited?: true;
	} = {} as {
		readonly kind: PropertyAccessKind;
		readonly object: ValueRepresentation;
		readonly key: string | number;
		readonly shortCircuited?: true;
	},
): PropertyAccessDomainFields {
	if (shortCircuited && kind !== 'optionalChaining') {
		throw new Error(
			'createPropertyAccessEvent: shortCircuited is only valid for optionalChaining',
		);
	}

	return {
		category: 'property',
		kind,
		object,
		key,
		...(shortCircuited && { shortCircuited }),
	};
}

/** Domain fields (base stamped downstream) for PropertyAccessEvent. */
type PropertyAccessDomainFields = {
	readonly category: 'property';
	readonly kind: PropertyAccessKind;
	readonly object: ValueRepresentation;
	readonly key: string | number;
	readonly protoChainWalk?: readonly ProtoChainStep[];
	readonly shortCircuited?: true;
};

type _AssertPropertyAccess = Expect<
	Equal<
		PropertyAccessDomainFields,
		DistributiveOmit<PropertyAccessEvent, keyof BaseEvent>
	>
>;
