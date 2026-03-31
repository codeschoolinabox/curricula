import type { DoEvent } from '../../types.js';

/**
 * Creates a DoEvent for do-while loops. Fires before every body execution.
 * Kind is always 'doWhile' — set automatically.
 */
function createDoEvent({
	scopeCreationStep,
	label,
}: {
	readonly scopeCreationStep: number;
	readonly label?: string;
} = {} as {
	readonly scopeCreationStep: number;
	readonly label?: string;
}): Omit<DoEvent, 'semantics' | 'loc' | 'node' | 'source'> {
	return {
		category: 'controlFlow',
		event: 'do',
		kind: 'doWhile',
		scopeCreationStep,
		...(label !== undefined && { label }),
	};
}

export default createDoEvent;
