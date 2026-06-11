import type { ForInitializeEvent } from '../../types.js';

/**
 * Creates a ForInitializeEvent for the for-loop initialization phase.
 * Kind is always 'for' — set automatically.
 */
export default function createForInitializeEvent(
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
): Omit<ForInitializeEvent, 'step' | 'semantics' | 'loc' | 'node' | 'source'> {
	return {
		category: 'controlFlow',
		event: 'initialize',
		kind: 'for',
		scopeCreationStep,
		...(label !== undefined && { label }),
	};
}
