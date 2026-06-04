import type {
	ScopeEvent,
	ScopeKind,
	ScopeEventType,
	ControlFlowStructure,
} from '../../types.js';

type ScopeParams = {
	readonly kind: ScopeKind;
	readonly event: ScopeEventType;
	readonly depth: number;
	readonly creationStep: number;
	readonly parentCreationStep?: number;
	readonly structure?: ControlFlowStructure;
	readonly structureStep?: number;
	readonly label?: string;
};

/**
 * Creates a ScopeEvent for scope lifecycle tracking.
 *
 * @param params - scope kind, event type, depth, step references, optional structure/label
 * @returns Domain-specific fields for a ScopeEvent
 * @throws {Error} If depth < 0 or structure/structureStep don't co-occur
 */
function createScopeEvent(
	{
		kind,
		event,
		depth,
		creationStep,
		parentCreationStep,
		structure,
		structureStep,
		label,
	}: ScopeParams = {} as ScopeParams,
): Omit<ScopeEvent, 'step' | 'semantics' | 'loc' | 'node' | 'source'> {
	if (depth < 0) {
		throw new Error('createScopeEvent: depth must be >= 0');
	}

	const hasStructure = structure !== undefined;
	const hasStructureStep = structureStep !== undefined;
	if (hasStructure !== hasStructureStep) {
		throw new Error(
			'createScopeEvent: structure and structureStep must both be present or both absent',
		);
	}

	return {
		category: 'scope',
		kind,
		event,
		depth,
		creationStep,
		...(parentCreationStep !== undefined && { parentCreationStep }),
		...(structure !== undefined && { structure }),
		...(structureStep !== undefined && { structureStep }),
		...(label !== undefined && { label }),
	};
}

export default createScopeEvent;
