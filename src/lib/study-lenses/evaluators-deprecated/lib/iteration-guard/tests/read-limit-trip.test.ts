/**
 * @file Truth table for the classification verb: real marked throws (via
 * the real worker helpers — the same-module protocol end-to-end), learner
 * look-alikes, forged markers with malformed payloads, non-object values,
 * and the hostile inputs that could otherwise crash a worker (throwing
 * getter, trapping proxy). ZOMBIES order. Forged markers are built with
 * `defineProperty` under the shared key constant — the classification
 * must reject them on SHAPE, never on provenance. One deliberate
 * exception, acknowledged: the capture helper holds the one try/catch —
 * outside every test body — because the real marked throw must be held
 * to be classified, which no `toThrow` matcher can do.
 */

import { describe, expect, it } from 'vitest';

import createIterationGuard from '../create-iteration-guard.js';
import LIMIT_MARKER_KEY from '../limit-marker-key.js';
import readLimitTrip from '../read-limit-trip.js';

function realTripOf(loopIndex: number, locString: string): unknown {
	const { globals } = createIterationGuard(0);
	try {
		globals.__$il(loopIndex, locString);
	} catch (error) {
		return error;
	}
	return undefined;
}

function realTrip(): unknown {
	return realTripOf(2, '2:1:4:2');
}

function forged(payload: unknown): Error {
	const error = new RangeError('Loop 1 exceeded 1 iterations.');
	Object.defineProperty(error, LIMIT_MARKER_KEY, { value: payload });
	return error;
}

describe('readLimitTrip', () => {
	describe('zero — non-object and unmarked values', () => {
		it.each([
			['null', null],
			['undefined', undefined],
			['a number', 42],
			['a string', 'Loop 1 exceeded 1 iterations.'],
			['a plain error', new Error('boom')],
		])('answers null for %s', (_label, value) => {
			expect(readLimitTrip(value)).toBeNull();
		});
	});

	describe('one — the real marked throw', () => {
		it('returns the trip record the guard stamped', () => {
			expect(readLimitTrip(realTrip())).toEqual({
				loopIndex: 2,
				loc: { start: { line: 2, column: 1 }, end: { line: 4, column: 2 } },
			});
		});

		it('returns the stamped record by reference, not a copy', () => {
			const thrown = realTrip();

			expect(readLimitTrip(thrown)).toBe(
				(
					Object.getOwnPropertyDescriptor(
						thrown as object,
						LIMIT_MARKER_KEY,
					) as { value: unknown }
				).value,
			);
		});
	});

	describe('many — distinct trips classify to their own records', () => {
		it('returns a different trip record for a different loop and span', () => {
			expect(readLimitTrip(realTripOf(5, '10:2:12:9'))).toEqual({
				loopIndex: 5,
				loc: { start: { line: 10, column: 2 }, end: { line: 12, column: 9 } },
			});
		});
	});

	describe('boundaries — look-alikes and malformed payloads', () => {
		it('answers null for a learner RangeError carrying the exact pinned message', () => {
			expect(
				readLimitTrip(new RangeError('Loop 1 exceeded 1 iterations.')),
			).toBeNull();
		});

		it.each([
			['a non-object payload', true],
			['a null payload', null],
			['a payload missing loc', { loopIndex: 1 }],
			[
				'a payload missing loopIndex',
				{ loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } } },
			],
			[
				'a non-finite loopIndex',
				{
					loopIndex: Number.NaN,
					loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 1 } },
				},
			],
			[
				'a loc missing its start',
				{ loopIndex: 1, loc: { end: { line: 1, column: 1 } } },
			],
			[
				'a loc missing its end',
				{ loopIndex: 1, loc: { start: { line: 1, column: 0 } } },
			],
			[
				'a non-finite start position',
				{
					loopIndex: 1,
					loc: {
						start: { line: 1, column: Number.NaN },
						end: { line: 1, column: 1 },
					},
				},
			],
			[
				'a non-finite end position',
				{
					loopIndex: 1,
					loc: {
						start: { line: 1, column: 0 },
						end: { line: Number.NaN, column: 1 },
					},
				},
			],
			[
				'a non-number position',
				{
					loopIndex: 1,
					loc: { start: { line: '1', column: 0 }, end: { line: 1, column: 1 } },
				},
			],
		])('answers null for a forged marker with %s', (_label, payload) => {
			expect(readLimitTrip(forged(payload))).toBeNull();
		});

		it('classifies a well-formed forged marker — shape, never provenance', () => {
			const payload = {
				loopIndex: 3,
				loc: { start: { line: 1, column: 0 }, end: { line: 2, column: 1 } },
			};

			expect([
				readLimitTrip(forged(payload)) === payload,
				Object.isFrozen(payload),
			]).toEqual([true, false]);
		});
	});

	describe('interface — null is the whole "not a trip" answer', () => {
		it('never returns undefined for an unmarked value', () => {
			expect(readLimitTrip(new Error('x'))).not.toBeUndefined();
		});
	});

	describe('exceptions — hostile values must classify, never crash', () => {
		it('answers null when reading the marker payload invokes a throwing getter', () => {
			const hostile = new Error('boom');
			Object.defineProperty(hostile, LIMIT_MARKER_KEY, {
				get() {
					throw new Error('gotcha');
				},
			});

			expect(readLimitTrip(hostile)).toBeNull();
		});

		it('answers null when property inspection itself throws through a trapping proxy', () => {
			const trap = new Proxy(
				{},
				{
					getOwnPropertyDescriptor() {
						throw new Error('trapped');
					},
					has() {
						throw new Error('trapped');
					},
				},
			);

			expect(readLimitTrip(trap)).toBeNull();
		});
	});
});
