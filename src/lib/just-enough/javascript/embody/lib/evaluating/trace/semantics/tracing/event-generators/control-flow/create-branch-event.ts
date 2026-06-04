import type { BranchEvent } from '../../types.js';

/**
 * Creates a BranchEvent for if/else path selection.
 * Kind is always 'conditional' — set automatically.
 */
function createBranchEvent(
	{
		branch,
		scopeCreationStep,
		label,
	}: {
		readonly branch: 'consequent' | 'alternate' | 'none';
		readonly scopeCreationStep: number;
		readonly label?: string;
	} = {} as {
		readonly branch: 'consequent' | 'alternate' | 'none';
		readonly scopeCreationStep: number;
		readonly label?: string;
	},
): Omit<BranchEvent, 'step' | 'semantics' | 'loc' | 'node' | 'source'> {
	return {
		category: 'controlFlow',
		event: 'branch',
		kind: 'conditional',
		branch,
		scopeCreationStep,
		...(label !== undefined && { label }),
	};
}

export default createBranchEvent;
