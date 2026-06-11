import type { JumpEvent, LoopKind } from '../../types.js';

/**
 * Creates a JumpEvent for break/continue statements.
 */
export default function createJumpEvent(
	{
		kind,
		target,
		targetScopeCreationStep,
		label,
	}: {
		readonly kind: 'break' | 'continue';
		readonly target: LoopKind;
		readonly targetScopeCreationStep: number;
		readonly label?: string;
	} = {} as {
		readonly kind: 'break' | 'continue';
		readonly target: LoopKind;
		readonly targetScopeCreationStep: number;
		readonly label?: string;
	},
): Omit<JumpEvent, 'step' | 'semantics' | 'loc' | 'node' | 'source'> {
	return {
		category: 'jump',
		event: 'jump',
		kind,
		target,
		targetScopeCreationStep,
		...(label !== undefined && { label }),
	};
}
