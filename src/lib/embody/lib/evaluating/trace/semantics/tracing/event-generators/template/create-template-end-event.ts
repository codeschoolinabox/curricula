import type { BaseEvent, TemplateEndEvent } from '../../types.js';
import type { DistributiveOmit, Equal, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a TemplateEndEvent (a template literal is fully
 * assembled). The assembled string rides the paired ResolveEvent
 * (kind: 'template'), not this event. The dispatcher stamps the base fields.
 *
 * @param params - begin step reference
 * @returns Domain fields for a TemplateEndEvent
 */
export default function createTemplateEndEvent(
	{ beginStep }: { readonly beginStep: number } = {} as {
		readonly beginStep: number;
	},
): TemplateEndDomainFields {
	return {
		category: 'template',
		event: 'end',
		beginStep,
	};
}

/** Domain fields (base stamped downstream) for TemplateEndEvent. */
type TemplateEndDomainFields = {
	readonly category: 'template';
	readonly event: 'end';
	readonly beginStep: number;
};

type _AssertTemplateEnd = Expect<
	Equal<
		TemplateEndDomainFields,
		DistributiveOmit<TemplateEndEvent, keyof BaseEvent>
	>
>;
