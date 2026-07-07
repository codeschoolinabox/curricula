import type {
	BaseEvent,
	ControlFlowStructure,
	ScopeEvent,
	ScopeEventType,
	ScopeKind,
	ScopePopReason,
} from '../../types.js';
import type { DistributiveOmit, Equal, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a ScopeEvent (scope lifecycle). The dispatcher
 * stamps the base fields.
 *
 * @param params - scope kind, event type, depth, step references, optional structure
 * @returns Domain fields for a ScopeEvent
 * @throws {Error} If depth < 0
 */
export default function createScopeEvent(
	{
		kind,
		event,
		depth,
		creationStep,
		parentCreationStep,
		structure,
	}: ScopeParams = {} as ScopeParams,
): ScopeDomainFields {
	if (depth < 0) {
		throw new Error('createScopeEvent: depth must be >= 0');
	}

	return {
		category: 'scope',
		kind,
		event,
		depth,
		creationStep,
		...(parentCreationStep !== undefined && { parentCreationStep }),
		...(structure !== undefined && { structure }),
	};
}

type ScopeParams = {
	readonly kind: ScopeKind;
	readonly event: ScopeEventType;
	readonly depth: number;
	readonly creationStep: number;
	readonly parentCreationStep?: number;
	readonly structure?: ControlFlowStructure;
};

/** Domain fields (base stamped downstream) for ScopeEvent. */
type ScopeDomainFields = {
	readonly category: 'scope';
	readonly kind: ScopeKind;
	readonly event: ScopeEventType;
	readonly depth: number;
	readonly creationStep?: number;
	readonly parentCreationStep?: number;
	readonly structure?: ControlFlowStructure;
	readonly reason?: ScopePopReason;
};

type _AssertScope = Expect<
	Equal<ScopeDomainFields, DistributiveOmit<ScopeEvent, keyof BaseEvent>>
>;
