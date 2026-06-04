import type {
	BindingEvent,
	BindingKind,
	BindingEventType,
	ValueRepresentation,
} from '../../types.js';

type BindingParams = {
	readonly kind: BindingKind;
	readonly event: BindingEventType;
	readonly name: string;
	readonly scopeCreationStep: number;
	readonly declarationStep?: number;
	readonly value?: ValueRepresentation;
	readonly explicit?: boolean;
};

const EVENTS_WITH_VALUE = new Set<BindingEventType>([
	'initialize',
	'available',
	'assign',
	'read',
]);

/**
 * Creates a BindingEvent for variable lifecycle tracking.
 *
 * @param params - binding kind, event type, name, scope ref, and optional fields
 * @returns Domain-specific fields for a BindingEvent
 * @throws {Error} If name is empty or value missing on events that require it
 */
function createBindingEvent(
	{
		kind,
		event,
		name,
		scopeCreationStep,
		declarationStep,
		value,
		explicit,
	}: BindingParams = {} as BindingParams,
): Omit<BindingEvent, 'step' | 'semantics' | 'loc' | 'node' | 'source'> {
	if (!name) {
		throw new Error(
			'createBindingEvent: name is required and must be non-empty',
		);
	}
	if (EVENTS_WITH_VALUE.has(event) && value === undefined) {
		throw new Error(
			`createBindingEvent: value is required for '${event}' events`,
		);
	}

	return {
		category: 'variable',
		kind,
		event,
		name,
		scopeCreationStep,
		...(declarationStep !== undefined && { declarationStep }),
		...(value !== undefined && { value }),
		...(event === 'initialize' && explicit !== undefined && { explicit }),
	};
}

export default createBindingEvent;
