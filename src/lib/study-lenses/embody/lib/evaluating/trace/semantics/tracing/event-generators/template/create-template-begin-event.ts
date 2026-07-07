import type { BaseEvent, TemplateBeginEvent } from '../../types.js';
import type { DistributiveOmit, Equal, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a TemplateBeginEvent (template evaluation
 * starts). The dispatcher stamps the base fields.
 *
 * @param params - static string parts and expression count
 * @returns Domain fields for a TemplateBeginEvent
 * @throws {Error} If strings.length !== expressionCount + 1
 */
export default function createTemplateBeginEvent(
	{
		strings,
		expressionCount,
	}: {
		readonly strings: readonly string[];
		readonly expressionCount: number;
	} = {} as {
		readonly strings: readonly string[];
		readonly expressionCount: number;
	},
): TemplateBeginDomainFields {
	if (strings.length !== expressionCount + 1) {
		throw new Error(
			`createTemplateBeginEvent: strings.length (${String(strings.length)}) must be expressionCount + 1 (${String(expressionCount + 1)})`,
		);
	}

	return {
		category: 'template',
		event: 'begin',
		strings,
		expressionCount,
	};
}

/** Domain fields (base stamped downstream) for TemplateBeginEvent. */
type TemplateBeginDomainFields = {
	readonly category: 'template';
	readonly event: 'begin';
	readonly strings: readonly string[];
	readonly expressionCount: number;
};

type _AssertTemplateBegin = Expect<
	Equal<
		TemplateBeginDomainFields,
		DistributiveOmit<TemplateBeginEvent, keyof BaseEvent>
	>
>;
