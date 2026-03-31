import type { WithEvent, ValueRepresentation } from '../../types.js';

/**
 * Creates a WithEvent for the with statement (easter egg).
 *
 * @param params - event type and the object being with'd
 * @returns Domain-specific fields for a WithEvent
 * @throws {Error} If event or object is missing
 */
function createWithEvent({
	event,
	object,
}: {
	readonly event: 'enter' | 'leave';
	readonly object: ValueRepresentation;
} = {} as {
	readonly event: 'enter' | 'leave';
	readonly object: ValueRepresentation;
}): Omit<WithEvent, 'semantics' | 'loc' | 'node' | 'source'> {
	if (!event) {
		throw new Error('createWithEvent: event is required');
	}
	if (object === undefined || object === null) {
		throw new Error('createWithEvent: object is required');
	}

	return {
		category: 'with',
		event,
		object,
	};
}

export default createWithEvent;
