import type {
	TestEvent,
	ControlFlowKind,
	ValueRepresentation,
} from '../../types.js';

/**
 * Creates a TestEvent for condition evaluation in control flow.
 *
 * @param params - kind, tested value, boolean result, optional coercion, scope ref, label
 * @returns Domain-specific fields for a TestEvent
 */
export default function createTestEvent(
	{
		kind,
		value,
		result,
		coercion,
		scopeCreationStep,
		label,
	}: {
		readonly kind: ControlFlowKind;
		readonly value: ValueRepresentation;
		readonly result: boolean;
		readonly coercion?: ValueRepresentation;
		readonly scopeCreationStep: number;
		readonly label?: string;
	} = {} as {
		readonly kind: ControlFlowKind;
		readonly value: ValueRepresentation;
		readonly result: boolean;
		readonly coercion?: ValueRepresentation;
		readonly scopeCreationStep: number;
		readonly label?: string;
	},
): Omit<TestEvent, 'step' | 'semantics' | 'loc' | 'node' | 'source'> {
	return {
		category: 'controlFlow',
		event: 'test',
		kind,
		value,
		result,
		scopeCreationStep,
		...(coercion !== undefined && { coercion }),
		...(label !== undefined && { label }),
	};
}
