/**
 * @file Behavior tests for one run's guard state, driven directly as
 * functions: counter arithmetic, cap edges, reset isolation, run-total
 * accounting, the marked throw's full shape (pinned message, descriptor,
 * deep-frozen trip record), the plain-throw degradation on a garbage loc
 * string, and per-run disposability. ZOMBIES order. The marker key is
 * imported from its shared constant — never retyped. Three deliberate
 * exceptions, acknowledged: the shared `LOC` primitive rides tests whose
 * decoded value is irrelevant (immutable, no cross-test coupling); bare
 * counting loops drive the stateful closure N times where no `it.each`
 * form exists; and the capture helpers below hold the one try/catch —
 * outside every test body — because the marker is non-enumerable, which
 * no `toThrow` matcher can reach. No branching hides in any of them.
 */

import { describe, expect, it } from 'vitest';

import createIterationGuard from '../create-iteration-guard.js';
import LIMIT_MARKER_KEY from '../limit-marker-key.js';

const LOC = '1:0:3:1';

function caughtFrom(run: () => void): unknown {
	try {
		run();
	} catch (error) {
		return error;
	}
	return undefined;
}

function tripOnce(cap: number): unknown {
	const { globals } = createIterationGuard(cap);
	return caughtFrom(() => {
		for (let index = 0; index <= cap + 1; index += 1) {
			globals.__$il(1, LOC);
		}
	});
}

function tripWith(loopIndex: number, locString: string): unknown {
	const { globals } = createIterationGuard(0);
	return caughtFrom(() => {
		globals.__$il(loopIndex, locString);
	});
}

describe('createIterationGuard', () => {
	describe('zero — no cap, nothing run', () => {
		it('starts the run total at zero', () => {
			expect(createIterationGuard().readIterationCount()).toBe(0);
		});

		it('counts without ever throwing when no cap is set', () => {
			const { globals, readIterationCount } = createIterationGuard();
			for (let index = 0; index < 10_000; index += 1) {
				globals.__$il(1, LOC);
			}

			expect(readIterationCount()).toBe(10_000);
		});
	});

	describe('one — a single capped loop', () => {
		it('permits exactly the cap in completed iterations before tripping', () => {
			const { globals } = createIterationGuard(3);
			globals.__$il(1, LOC);
			globals.__$il(1, LOC);
			globals.__$il(1, LOC);

			expect(() => globals.__$il(1, LOC)).toThrow(RangeError);
		});

		it('carries type, pinned message, and marker on the same thrown object', () => {
			const thrown = tripOnce(3) as Error;

			expect([
				thrown instanceof RangeError,
				thrown.message,
				Object.hasOwn(thrown, LIMIT_MARKER_KEY),
			]).toEqual([true, 'Loop 1 exceeded 3 iterations.', true]);
		});

		it('interpolates multi-digit loop indices into the pinned message', () => {
			const { globals } = createIterationGuard(0);

			expect(() => globals.__$il(12, LOC)).toThrow(
				'Loop 12 exceeded 0 iterations.',
			);
		});

		it('counts the tripping iteration in the run total', () => {
			const { globals, readIterationCount } = createIterationGuard(2);
			globals.__$il(1, LOC);
			globals.__$il(1, LOC);
			expect(() => globals.__$il(1, LOC)).toThrow(RangeError);

			expect(readIterationCount()).toBe(3);
		});
	});

	describe('many — independent loops, reset isolation, disposability', () => {
		it('keeps per-entry counters independent across loop indices', () => {
			const { globals } = createIterationGuard(2);
			globals.__$il(1, LOC);
			globals.__$il(1, LOC);
			globals.__$il(2, LOC);
			globals.__$il(2, LOC);

			expect(() => globals.__$il(2, LOC)).toThrow(RangeError);
		});

		it('restarts only the reset loop on a fresh entry', () => {
			const { globals } = createIterationGuard(2);
			globals.__$il(1, LOC);
			globals.__$il(1, LOC);
			globals.__$ir(1);
			globals.__$il(1, LOC);
			globals.__$il(1, LOC);

			expect(() => globals.__$il(1, LOC)).toThrow(RangeError);
		});

		it('never resets the run total', () => {
			const { globals, readIterationCount } = createIterationGuard(2);
			globals.__$il(1, LOC);
			globals.__$il(1, LOC);
			globals.__$ir(1);
			globals.__$il(1, LOC);

			expect(readIterationCount()).toBe(3);
		});

		it('keeps two runs fully independent', () => {
			const first = createIterationGuard(1);
			first.globals.__$il(1, LOC);
			const second = createIterationGuard(1);

			expect(second.readIterationCount()).toBe(0);
		});

		it('sums the run total across independent loop indices', () => {
			const { globals, readIterationCount } = createIterationGuard(5);
			globals.__$il(1, LOC);
			globals.__$il(2, LOC);
			globals.__$il(2, LOC);

			expect(readIterationCount()).toBe(3);
		});
	});

	describe('boundaries — cap edges, unused indices', () => {
		it('trips on the first pass when the cap is zero', () => {
			const { globals } = createIterationGuard(0);

			expect(() => globals.__$il(1, LOC)).toThrow(RangeError);
		});

		it('trips on the first pass when the cap is negative', () => {
			const { globals } = createIterationGuard(-5);

			expect(() => globals.__$il(1, LOC)).toThrow(RangeError);
		});

		it('never trips when the cap is Infinity', () => {
			const { globals, readIterationCount } = createIterationGuard(
				Number.POSITIVE_INFINITY,
			);
			for (let index = 0; index < 1000; index += 1) {
				globals.__$il(1, LOC);
			}

			expect(readIterationCount()).toBe(1000);
		});

		it('never trips when the cap is NaN', () => {
			const { globals, readIterationCount } = createIterationGuard(Number.NaN);
			for (let index = 0; index < 1000; index += 1) {
				globals.__$il(1, LOC);
			}

			expect(readIterationCount()).toBe(1000);
		});

		it('zeroes an index that never incremented without effect', () => {
			const { globals, readIterationCount } = createIterationGuard(2);
			globals.__$ir(7);

			expect(readIterationCount()).toBe(0);
		});
	});

	describe('interface — the marked throw and the injectable record', () => {
		it('defines the trip record under the marker key, non-enumerable and locked', () => {
			const thrown = tripOnce(1);

			expect(
				Object.getOwnPropertyDescriptor(thrown as object, LIMIT_MARKER_KEY),
			).toEqual({
				value: {
					loopIndex: 1,
					loc: {
						start: { line: 1, column: 0 },
						end: { line: 3, column: 1 },
					},
				},
				writable: false,
				enumerable: false,
				configurable: false,
			});
		});

		it('decodes multi-digit positions from the loc string', () => {
			expect(
				(
					Object.getOwnPropertyDescriptor(
						tripWith(12, '10:42:120:7') as object,
						LIMIT_MARKER_KEY,
					) as { value: unknown }
				).value,
			).toEqual({
				loopIndex: 12,
				loc: {
					start: { line: 10, column: 42 },
					end: { line: 120, column: 7 },
				},
			});
		});

		it('deep-freezes the trip record through both positions', () => {
			const record = (
				Object.getOwnPropertyDescriptor(
					tripOnce(1) as object,
					LIMIT_MARKER_KEY,
				) as { value: { loc: { start: object; end: object } } }
			).value;

			expect([
				Object.isFrozen(record),
				Object.isFrozen(record.loc),
				Object.isFrozen(record.loc.start),
				Object.isFrozen(record.loc.end),
			]).toEqual([true, true, true, true]);
		});

		it('keeps the marker out of enumeration', () => {
			expect(Object.keys(tripOnce(1) as object)).toEqual([]);
		});

		it('survives a second stamper writing its own key onto the same error', () => {
			const thrown = tripOnce(1) as Record<PropertyKey, unknown>;
			Object.defineProperty(thrown, '__$otherStamp', { value: 'x' });

			expect(
				(
					Object.getOwnPropertyDescriptor(thrown, LIMIT_MARKER_KEY) as {
						value: unknown;
					}
				).value,
			).toEqual({
				loopIndex: 1,
				loc: { start: { line: 1, column: 0 }, end: { line: 3, column: 1 } },
			});
		});

		it('exposes exactly the two helpers as injectable globals', () => {
			expect(
				Object.keys(createIterationGuard().globals).toSorted((a, b) =>
					a.localeCompare(b),
				),
			).toEqual(['__$il', '__$ir']);
		});

		it('assigns onto a plain readonly string-keyed record', () => {
			const probe: Readonly<Record<string, unknown>> =
				createIterationGuard().globals;

			expect(typeof probe['__$il']).toBe('function');
		});
	});

	describe('exceptions — garbage loc string degrades safely', () => {
		it('still throws the pinned message on a trip with an undecodable loc', () => {
			const { globals } = createIterationGuard(0);

			expect(() => globals.__$il(1, 'garbage')).toThrow(
				'Loop 1 exceeded 0 iterations.',
			);
		});

		it('builds no marker when the loc string does not decode to four finite positions', () => {
			expect(
				Object.hasOwn(tripWith(1, '1:0:3') as object, LIMIT_MARKER_KEY),
			).toBe(false);
		});

		it('builds no marker when a four-part loc string carries a non-numeric position', () => {
			expect(
				Object.hasOwn(tripWith(1, 'a:0:3:1') as object, LIMIT_MARKER_KEY),
			).toBe(false);
		});
	});
});
