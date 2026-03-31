import type { ParenthesisEvent } from '../../types.js';

/**
 * Creates a ParenthesisEvent for grouping parenthesis enter/leave.
 *
 * @param params - event type, depth, and optional parent reference
 * @returns Domain-specific fields for a ParenthesisEvent
 * @throws {Error} If event is missing, depth < 1, or parentStep at depth 1
 */
function createParenthesisEvent({
	event,
	depth,
	parentStep,
}: {
	readonly event: 'enter' | 'leave';
	readonly depth: number;
	readonly parentStep?: number;
} = {} as {
	readonly event: 'enter' | 'leave';
	readonly depth: number;
	readonly parentStep?: number;
}): Omit<ParenthesisEvent, 'semantics' | 'loc' | 'node' | 'source'> {
	if (!event) {
		throw new Error('createParenthesisEvent: event is required');
	}
	if (depth < 1) {
		throw new Error('createParenthesisEvent: depth must be >= 1');
	}
	if (depth === 1 && parentStep !== undefined) {
		throw new Error('createParenthesisEvent: parentStep must be absent at depth 1');
	}

	return {
		category: 'parenthesis',
		event,
		depth,
		...(parentStep !== undefined && { parentStep }),
	};
}

export default createParenthesisEvent;
