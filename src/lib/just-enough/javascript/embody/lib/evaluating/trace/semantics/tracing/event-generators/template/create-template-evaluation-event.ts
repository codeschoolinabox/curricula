import type {
	TemplateEvaluationEvent,
	ValueRepresentation,
} from '../../types.js';

/**
 * Creates a TemplateEvaluationEvent for a ${} expression inside a template.
 *
 * @param params - expression index, evaluated value, and begin step reference
 * @returns Domain-specific fields for a TemplateEvaluationEvent
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
): Omit<
	TemplateEvaluationEvent,
	'step' | 'semantics' | 'loc' | 'node' | 'source'
> {
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
