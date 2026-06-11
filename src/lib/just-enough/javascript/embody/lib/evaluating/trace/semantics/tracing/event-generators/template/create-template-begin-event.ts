import type { TemplateBeginEvent } from '../../types.js';

/**
 * Creates a TemplateBeginEvent when template literal evaluation starts.
 *
 * @param params - static string parts and expression count
 * @returns Domain-specific fields for a TemplateBeginEvent
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
): Omit<TemplateBeginEvent, 'step' | 'semantics' | 'loc' | 'node' | 'source'> {
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
