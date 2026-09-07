import { describe, expect, it } from 'vitest';

import type {
	BaseEvent,
	CapTrip,
	DeclinedSite,
	FinalTraceEvent,
	LifecycleAnchorEvent,
	ResolveEvent,
	TraceEvent,
} from '../types.js';

type Expect<T extends true> = T;
type Extends<A, B> = A extends B ? true : false;

describe('compile probes — the contract pins (live)', () => {
	it('an anchor is a complete BaseEvent with the lifecycle layer', () => {
		type AnchorIsBase = Expect<Extends<LifecycleAnchorEvent, BaseEvent>>;
		const anchor: LifecycleAnchorEvent = {
			step: 1,
			semantics: 'lifecycle',
			category: 'lifecycle',
			phase: 'source',
			nodePath: '$',
			type: 'Program',
			loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } },
			start: 0,
			end: 0,
			source: '',
		};
		const witness: AnchorIsBase = true;
		expect({ witness, anchor: anchor.phase }).toEqual({
			witness: true,
			anchor: 'source',
		});
	});

	it('the union discriminates on semantics and a trip on kind', () => {
		type ResolveInUnion = Expect<Extends<ResolveEvent, TraceEvent>>;
		type FinalCoversNonResolve = Expect<
			Extends<Exclude<TraceEvent, ResolveEvent>, FinalTraceEvent>
		>;
		const trip: CapTrip = { kind: 'sites', measured: 6, cap: 5 };
		const decline: DeclinedSite = {
			nodePath: '$.body.0',
			reason: 'typeof-operand',
		};
		const witnesses: [ResolveInUnion, FinalCoversNonResolve] = [true, true];
		expect({ witnesses, trip: trip.kind, decline: decline.reason }).toEqual({
			witnesses: [true, true],
			trip: 'sites',
			decline: 'typeof-operand',
		});
	});
});
