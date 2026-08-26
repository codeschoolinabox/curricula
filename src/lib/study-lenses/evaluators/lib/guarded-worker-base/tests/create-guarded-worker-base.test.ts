// cspell:ignore kapot
import { describe, expect, it } from 'vitest';

import type { InterceptWorkerConfig } from '../../../intercept/types.js';
import type { RunWorkerConfig } from '../../../run/types.js';
import createGuardedWorkerBase from '../create-guarded-worker-base.js';
import type { HaltCore } from '../types.js';

const NO_RAW_ERROR: unknown = undefined;

function tripOn(
	base: ReturnType<typeof createGuardedWorkerBase>,
	calls: number,
): unknown {
	try {
		for (let index = 0; index < calls; index += 1) {
			base.guardGlobals.__$il(1, '1:0:1:10');
		}
	} catch (error) {
		return error;
	}
	throw new Error('the capped helper never threw');
}

describe('createGuardedWorkerBase', () => {
	describe('zero — a natural end', () => {
		it('a natural end authors the pinned natural arm', () => {
			const base = createGuardedWorkerBase({});
			expect(base.serializeHalt('natural-end', NO_RAW_ERROR)).toEqual({
				natural: true,
				errorName: '',
				message: '',
				trip: null,
				iterationCount: 0,
				phase: null,
			});
		});

		it('the natural halt carries the real run total', () => {
			const base = createGuardedWorkerBase({});
			base.guardGlobals.__$il(1, '1:0:1:10');
			base.guardGlobals.__$il(1, '1:0:1:10');
			const core = base.serializeHalt('natural-end', NO_RAW_ERROR) as HaltCore;
			expect(core.iterationCount).toBe(2);
		});
	});

	describe('one — a throw', () => {
		it('a throw authors errorName and message from the error', () => {
			const base = createGuardedWorkerBase({});
			const core = base.serializeHalt(
				'throw',
				new TypeError('kapot'),
				'evaluation',
			) as HaltCore;
			expect([core.natural, core.errorName, core.message]).toEqual([
				false,
				'TypeError',
				'kapot',
			]);
		});

		it('a non-Error throw classifies as Error with its string form', () => {
			const base = createGuardedWorkerBase({});
			const core = base.serializeHalt(
				'throw',
				'kapot',
				'evaluation',
			) as HaltCore;
			expect([core.errorName, core.message]).toEqual(['Error', 'kapot']);
		});

		it('the throw arm carries the engine’s phase', () => {
			const base = createGuardedWorkerBase({});
			const core = base.serializeHalt(
				'throw',
				new TypeError('kapot'),
				'creation',
			) as HaltCore;
			expect(core.phase).toBe('creation');
		});
	});

	describe('many and boundaries — the cap, pass-through', () => {
		it('a numeric cap rides through and trips the helper past it', () => {
			const base = createGuardedWorkerBase({ iterationLimit: 2 });
			expect(tripOn(base, 3)).toBeInstanceOf(RangeError);
		});

		it('a zero cap trips on the first call', () => {
			const base = createGuardedWorkerBase({ iterationLimit: 0 });
			expect(tripOn(base, 1)).toBeInstanceOf(RangeError);
		});

		it('a five cap permits exactly five calls before tripping', () => {
			const base = createGuardedWorkerBase({ iterationLimit: 5 });
			for (let index = 0; index < 5; index += 1) {
				base.guardGlobals.__$il(1, '1:0:1:10');
			}
			expect(tripOn(base, 1)).toBeInstanceOf(RangeError);
		});

		it('a non-number cap counts and never throws', () => {
			const base = createGuardedWorkerBase({ iterationLimit: 'nope' });
			for (let index = 0; index < 50; index += 1) {
				base.guardGlobals.__$il(1, '1:0:1:10');
			}
			const core = base.serializeHalt('natural-end', NO_RAW_ERROR) as HaltCore;
			expect(core.iterationCount).toBe(50);
		});
	});

	describe('interface — classification and the finisher', () => {
		it('the marked limit throw classifies as the trip, structurally', () => {
			const base = createGuardedWorkerBase({ iterationLimit: 2 });
			const thrown = tripOn(base, 3);
			const core = base.serializeHalt(
				'throw',
				thrown,
				'evaluation',
			) as HaltCore;
			expect(core.trip).toEqual({
				loopIndex: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
			});
		});

		it('a learner RangeError never classifies as a trip', () => {
			const base = createGuardedWorkerBase({ iterationLimit: 2 });
			const core = base.serializeHalt(
				'throw',
				new RangeError('Loop 1 exceeded 2 iterations.'),
				'evaluation',
			) as HaltCore;
			expect(core.trip).toBeNull();
		});

		it('the finisher maps the core onto the unit’s own shape', () => {
			const base = createGuardedWorkerBase({}, (core) => ({
				...core,
				loc: null,
			}));
			const finished = base.serializeHalt('natural-end', NO_RAW_ERROR) as {
				loc: unknown;
			};
			expect(finished.loc).toBeNull();
		});

		it('the finisher maps a throw halt too', () => {
			const base = createGuardedWorkerBase({}, (core) => ({
				...core,
				loc: 'stamped',
			}));
			const finished = base.serializeHalt(
				'throw',
				new TypeError('kapot'),
				'evaluation',
			) as { loc: unknown; errorName: string };
			expect([finished.loc, finished.errorName]).toEqual([
				'stamped',
				'TypeError',
			]);
		});

		it('the finisher fires on natural ends too, with no raw error', () => {
			const seen: unknown[] = [];
			const base = createGuardedWorkerBase({}, (core, rawError) => {
				seen.push(rawError);
				return core;
			});
			base.serializeHalt('natural-end', NO_RAW_ERROR);
			expect(seen).toEqual([undefined]);
		});
	});

	describe('exceptions — the builder guard', () => {
		it('a throwing finisher degrades to the whole unfinished core', () => {
			const base = createGuardedWorkerBase({}, () => {
				throw new Error('stack parse broke');
			});
			expect(base.serializeHalt('natural-end', NO_RAW_ERROR)).toEqual({
				natural: true,
				errorName: '',
				message: '',
				trip: null,
				iterationCount: 0,
				phase: null,
			});
		});

		it('a throwing finisher on a throw halt keeps the whole throw core', () => {
			const base = createGuardedWorkerBase({ iterationLimit: 2 }, () => {
				throw new Error('stack parse broke');
			});
			const thrown = tripOn(base, 3);
			const core = base.serializeHalt(
				'throw',
				thrown,
				'evaluation',
			) as HaltCore;
			expect([
				core.natural,
				core.errorName,
				core.iterationCount,
				core.phase,
				core.trip === null,
			]).toEqual([false, 'RangeError', 3, 'evaluation', false]);
		});
	});
});

describe('compile probes (live)', () => {
	it('both worker configs still declare the member the base reads', () => {
		const runCap: number | undefined =
			null as unknown as RunWorkerConfig['iterationLimit'];
		const interceptCap: number | undefined =
			null as unknown as InterceptWorkerConfig['iterationLimit'];
		expect([runCap, interceptCap]).toEqual([null, null]);
	});
});
