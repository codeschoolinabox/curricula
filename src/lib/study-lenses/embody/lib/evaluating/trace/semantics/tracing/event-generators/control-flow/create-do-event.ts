/**
 * Creates the domain fields for a do-while body event — fires before every body
 * execution. Kind is always 'doWhile'. The dispatcher stamps the base fields.
 */
export default function createDoEvent(
	{ scopeCreationStep }: DoParams = {} as DoParams,
): DoDomainFields {
	return {
		category: 'loop',
		kind: 'doWhile',
		event: 'do',
		scopeCreationStep,
	};
}

type DoParams = {
	readonly scopeCreationStep: number;
};

/** Domain fields (base stamped downstream) for LoopEvent(do, kind 'doWhile'). */
type DoDomainFields = {
	readonly category: 'loop';
	readonly kind: 'doWhile';
	readonly event: 'do';
	readonly scopeCreationStep: number;
};
