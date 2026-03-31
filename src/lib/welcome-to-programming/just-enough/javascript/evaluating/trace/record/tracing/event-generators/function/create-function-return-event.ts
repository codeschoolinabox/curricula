import type { FunctionReturnEvent, ValueRepresentation } from '../../types.js';

/**
 * Creates a FunctionReturnEvent for built-in function returns.
 *
 * @param params - function name and return value
 * @returns Domain-specific fields for a FunctionReturnEvent
 * @throws {Error} If name is empty or value is missing
 */
function createFunctionReturnEvent({
	name,
	value,
}: {
	readonly name: string;
	readonly value: ValueRepresentation;
} = {} as {
	readonly name: string;
	readonly value: ValueRepresentation;
}): Omit<FunctionReturnEvent, 'semantics' | 'loc' | 'node' | 'source'> {
	if (!name) {
		throw new Error('createFunctionReturnEvent: name is required and must be non-empty');
	}
	if (value === undefined || value === null) {
		throw new Error('createFunctionReturnEvent: value is required');
	}

	return {
		category: 'function',
		event: 'return',
		name,
		value,
	};
}

export default createFunctionReturnEvent;
