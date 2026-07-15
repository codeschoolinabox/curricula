import type { BaseEvent, JumpEvent, LoopKind } from '../../types.js';
import type { DistributiveOmit, Equal, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a jump event (break/continue). The dispatcher
 * stamps the base fields.
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
): JumpDomainFields {
	return {
		category: 'jump',
		event: 'jump',
		kind,
		target,
		targetScopeCreationStep,
		...(label !== undefined && { label }),
	};
}

/** Domain fields (base stamped downstream) for JumpEvent. */
type JumpDomainFields = {
	readonly category: 'jump';
	readonly event: 'jump';
	readonly kind: 'break' | 'continue';
	readonly target: LoopKind;
	readonly targetScopeCreationStep?: number;
	readonly label?: string;
};

type _AssertJump = Expect<
	Equal<JumpDomainFields, DistributiveOmit<JumpEvent, keyof BaseEvent>>
>;
