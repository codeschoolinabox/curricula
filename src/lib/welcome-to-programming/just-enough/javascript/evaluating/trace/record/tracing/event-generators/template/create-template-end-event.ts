import type { TemplateEndEvent, ValueRepresentation } from '../../types.js';

/**
 * Creates a TemplateEndEvent when a template literal is fully assembled.
 *
 * @param params - final string value and begin step reference
 * @returns Domain-specific fields for a TemplateEndEvent
 */
function createTemplateEndEvent({
	value,
	beginStep,
}: {
	readonly value: ValueRepresentation;
	readonly beginStep: number;
} = {} as {
	readonly value: ValueRepresentation;
	readonly beginStep: number;
}): Omit<TemplateEndEvent, 'semantics' | 'loc' | 'node' | 'source'> {
	return {
		category: 'template',
		event: 'end',
		value,
		beginStep,
	};
}

export default createTemplateEndEvent;
