import type {
	BaseEvent,
	TemplateEvaluationEvent,
	ValueRepresentation,
} from '../../types.js';
import type { DistributiveOmit, Equal, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a TemplateEvaluationEvent (a ${} expression
 * inside a template). The dispatcher stamps the base fields.
 *
 * @param params - expression index, evaluated value, and begin step reference
 * @returns Domain fields for a TemplateEvaluationEvent
 * @throws {Error} If index < 0
 */
export default function createTemplateEvaluationEvent(
	{
		index,
		value,
		beginStep,
	}: {
		readonly index: number;
		readonly value: ValueRepresentation;
		readonly beginStep: number;
	} = {} as {
		readonly index: number;
		readonly value: ValueRepresentation;
		readonly beginStep: number;
	},
): TemplateEvaluationDomainFields {
	if (index < 0) {
		throw new Error('createTemplateEvaluationEvent: index must be >= 0');
	}

	return {
		category: 'template',
		event: 'evaluation',
		index,
		value,
		beginStep,
	};
}

/** Domain fields (base stamped downstream) for TemplateEvaluationEvent. */
type TemplateEvaluationDomainFields = {
	readonly category: 'template';
	readonly event: 'evaluation';
	readonly index: number;
	readonly value: ValueRepresentation;
	readonly coercion?: ValueRepresentation;
	readonly beginStep: number;
};

type _AssertTemplateEvaluation = Expect<
	Equal<
		TemplateEvaluationDomainFields,
		DistributiveOmit<TemplateEvaluationEvent, keyof BaseEvent>
	>
>;
