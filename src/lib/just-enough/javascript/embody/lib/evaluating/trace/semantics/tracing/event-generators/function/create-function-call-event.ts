import type { FunctionCallEvent, ValueRepresentation } from '../../types.js';

/**
 * Creates a FunctionCallEvent for built-in function calls.
 *
 * @param params - function name and arguments
 * @returns Domain-specific fields for a FunctionCallEvent
 * @throws {Error} If name is missing or empty
 */
export default function createFunctionCallEvent(
	{
		name,
		args,
	}: {
		readonly name: string;
		readonly args: readonly ValueRepresentation[];
	} = {} as {
		readonly name: string;
		readonly args: readonly ValueRepresentation[];
	},
): Omit<FunctionCallEvent, 'step' | 'semantics' | 'loc' | 'node' | 'source'> {
	if (!name) {
		throw new Error(
			'createFunctionCallEvent: name is required and must be non-empty',
		);
	}

	return {
		category: 'function',
		event: 'call',
		name,
		args,
	};
}
