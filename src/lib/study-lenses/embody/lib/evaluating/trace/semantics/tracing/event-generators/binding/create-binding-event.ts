import type {
	BaseEvent,
	BindingEvent,
	BindingEventType,
	BindingKind,
	ScopeChainStep,
	ValueRepresentation,
} from '../../types.js';
import type { DistributiveOmit, Expect } from '../conformance.js';

/**
 * Creates the domain fields for a BindingEvent (variable lifecycle). Only
 * `initialize` and `update` carry a value; a `read`'s value rides the paired
 * ResolveEvent (kind: 'variable'). The event type selects the variant. The
 * dispatcher stamps the base fields.
 *
 * @param params - binding kind, event type, name, scope ref, and optional fields
 * @returns Domain fields for the BindingEvent variant named by `event`
 * @throws {Error} If name is empty, or value/explicit are missing where the variant requires them
 */
export default function createBindingEvent(
	{
		kind,
		event,
		name,
		scopeCreationStep,
		declarationStep,
		value,
		explicit,
	}: BindingParams = {} as BindingParams,
): BindingDomainFields {
	if (!name) {
		throw new Error(
			'createBindingEvent: name is required and must be non-empty',
		);
	}

	const common = {
		category: 'variable' as const,
		kind,
		name,
		scopeCreationStep,
		...(declarationStep !== undefined && { declarationStep }),
	};

	switch (event) {
		case 'initialize':
			if (value === undefined || explicit === undefined) {
				throw new Error(
					"createBindingEvent: 'initialize' requires value and explicit",
				);
			}
			return { ...common, event, value, explicit };
		case 'update':
			if (value === undefined) {
				throw new Error("createBindingEvent: 'update' requires value");
			}
			return { ...common, event, value };
		case 'declare':
		case 'available':
		case 'read':
			return { ...common, event };
	}
}

type BindingParams = {
	readonly kind: BindingKind;
	readonly event: BindingEventType;
	readonly name: string;
	readonly scopeCreationStep: number;
	readonly declarationStep?: number;
	readonly value?: ValueRepresentation;
	readonly explicit?: boolean;
};

/** Domain fields (base stamped downstream) for BindingEvent. */
type BindingDomainFields = {
	readonly category: 'variable';
	readonly kind: BindingKind;
	readonly name: string;
	readonly scopeCreationStep?: number;
	readonly declarationStep?: number;
} & (
	| { readonly event: 'declare' }
	| {
			readonly event: 'initialize';
			readonly value: ValueRepresentation;
			readonly explicit: boolean;
	  }
	| { readonly event: 'available' }
	| {
			readonly event: 'read';
			readonly scopeChainWalk?: readonly ScopeChainStep[];
	  }
	| { readonly event: 'update'; readonly value: ValueRepresentation }
);

// Full bidirectional conformance (Equal) is inexpressible for a discriminated
// event: the contract writes BindingEvent as `BaseEvent & {common} & (variants)`
// (an intersection-of-union), which `Omit`/`Extract` collapse to the common
// keys, discarding the per-variant fields. This one-directional check ties the
// common fields + the event discriminant set back to types.ts; the per-variant
// fields are tied by the `: BindingDomainFields` return annotation above, which
// forces a correctly-narrowed body (a flat or mis-shaped return fails to
// compile — see conformance.ts).
type _AssertBindingShape = Expect<
	[BindingDomainFields] extends [
		DistributiveOmit<BindingEvent, keyof BaseEvent>,
	]
		? true
		: false
>;
