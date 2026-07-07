import type { BaseEvent, LoopEvent } from '../../types.js';
import type { DistributiveOmit, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a for-loop setup (initialization) event. Kind is
 * always 'for'. The dispatcher stamps the base fields.
 */
export default function createForInitializeEvent(
	{ scopeCreationStep }: ForInitializeParams = {} as ForInitializeParams,
): ForInitializeDomainFields {
	return {
		category: 'loop',
		kind: 'for',
		event: 'setup',
		scopeCreationStep,
	};
}

type ForInitializeParams = {
	readonly scopeCreationStep: number;
};

/** Domain fields (base stamped downstream) for LoopEvent(setup, kind 'for'). */
type ForInitializeDomainFields = {
	readonly category: 'loop';
	readonly kind: 'for';
	readonly event: 'setup';
	readonly scopeCreationStep: number;
};

type _AssertForInitializeShape = Expect<
	[ForInitializeDomainFields] extends [
		DistributiveOmit<LoopEvent, keyof BaseEvent>,
	]
		? true
		: false
>;
