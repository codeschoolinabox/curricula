import type { ForIncrementEvent } from '../../types.js';

/**
 * Creates a ForIncrementEvent for the for-loop update/increment phase.
 * Kind is always 'for' — set automatically.
 */
function createForIncrementEvent(
	{
		scopeCreationStep,
		label,
	}: {
		readonly scopeCreationStep: number;
		readonly label?: string;
	} = {} as {
		readonly scopeCreationStep: number;
		readonly label?: string;
	},
): Omit<ForIncrementEvent, 'step' | 'semantics' | 'loc' | 'node' | 'source'> {
	return {
		category: 'controlFlow',
		event: 'increment',
		kind: 'for',
		scopeCreationStep,
		...(label !== undefined && { label }),
	};
}

export default createForIncrementEvent;
