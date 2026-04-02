import type { PropertyAccessEvent, PropertyAccessKind, ValueRepresentation } from '../../types.js';

/**
 * Creates a PropertyAccessEvent for dot, bracket, or optional chaining reads.
 *
 * @param params - access kind, object value, key, value, optional shortCircuited
 * @returns Domain-specific fields for a PropertyAccessEvent
 * @throws {Error} If shortCircuited is set on non-optionalChaining kind
 */
function createPropertyAccessEvent({
	kind,
	object,
	key,
	value,
	shortCircuited,
}: {
	readonly kind: PropertyAccessKind;
	readonly object: ValueRepresentation;
	readonly key: string | number;
	readonly value: ValueRepresentation;
	readonly shortCircuited?: true;
} = {} as {
	readonly kind: PropertyAccessKind;
	readonly object: ValueRepresentation;
	readonly key: string | number;
	readonly value: ValueRepresentation;
	readonly shortCircuited?: true;
}): Omit<PropertyAccessEvent, 'semantics' | 'loc' | 'node' | 'source'> {
	if (shortCircuited && kind !== 'optionalChaining') {
		throw new Error(
			'createPropertyAccessEvent: shortCircuited is only valid for optionalChaining',
		);
	}

	return {
		category: 'propertyAccess',
		kind,
		object,
		key,
		value,
		...(shortCircuited && { shortCircuited }),
	};
}

export default createPropertyAccessEvent;
