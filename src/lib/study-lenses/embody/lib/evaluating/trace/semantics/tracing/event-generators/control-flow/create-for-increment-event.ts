/**
 * Creates the domain fields for a for-loop increment (update) event. Kind is
 * always 'for'. The dispatcher stamps the base fields.
 */
export default function createForIncrementEvent(
	{ scopeCreationStep }: ForIncrementParams = {} as ForIncrementParams,
): ForIncrementDomainFields {
	return {
		category: 'loop',
		kind: 'for',
		event: 'increment',
		scopeCreationStep,
	};
}

type ForIncrementParams = {
	readonly scopeCreationStep: number;
};

/** Domain fields (base stamped downstream) for LoopEvent(increment, kind 'for'). */
type ForIncrementDomainFields = {
	readonly category: 'loop';
	readonly kind: 'for';
	readonly event: 'increment';
	readonly scopeCreationStep: number;
};
