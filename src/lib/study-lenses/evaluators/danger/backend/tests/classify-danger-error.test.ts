import { describe, expect, it } from 'vitest';

import classifyDangerError from '../classify-danger-error.js';

// The guard injects exactly this message shape (guard-loops.ts:120):
// `Loop ${id} exceeded ${maxIterations} iterations.` — trailing period included.
const GUARD_MESSAGE = 'Loop 1 exceeded 100 iterations.';

describe('classifyDangerError', () => {
	describe('Zero — a non-RangeError is always errored', () => {
		it('a TypeError is errored, carrying its primitives', () => {
			// No cap in play — the third argument is omitted (undefined).
			expect(classifyDangerError('TypeError', 'x is not a function')).toEqual({
				outcome: 'errored',
				error: { name: 'TypeError', message: 'x is not a function' },
			});
		});

		it('an Error whose message LOOKS like the guard trip is still errored (the name gate)', () => {
			// Same message as a real trip, iterations set — but name !== 'RangeError',
			// so it is the learner's own error, not a limit trip.
			expect(classifyDangerError('Error', GUARD_MESSAGE, 100)).toEqual({
				outcome: 'errored',
				error: { name: 'Error', message: GUARD_MESSAGE },
			});
		});
	});

	describe('One / Many — a recognised guard trip is limit-exceeded', () => {
		it('the canonical single-loop trip, carrying the machine error', () => {
			expect(
				classifyDangerError('RangeError', GUARD_MESSAGE, 100),
			).toStrictEqual({
				outcome: 'limit-exceeded',
				error: { name: 'RangeError', message: GUARD_MESSAGE },
			});
		});

		it('a higher loop id + different cap (not hardcoded to loop 1 / 100)', () => {
			expect(
				classifyDangerError('RangeError', 'Loop 3 exceeded 50 iterations.', 50),
			).toStrictEqual({
				outcome: 'limit-exceeded',
				error: {
					name: 'RangeError',
					message: 'Loop 3 exceeded 50 iterations.',
				},
			});
		});
	});

	describe('Boundaries — the iterations gate', () => {
		it('a matching RangeError with NO cap (iterations omitted) is errored', () => {
			// The no-cap affordance: with no guard applied, an identical RangeError is
			// genuinely the learner's, classified errored (README § Edge cases).
			expect(classifyDangerError('RangeError', GUARD_MESSAGE)).toEqual({
				outcome: 'errored',
				error: { name: 'RangeError', message: GUARD_MESSAGE },
			});
		});

		it('an iterations cap of 0 (falsy-but-DEFINED) still recognises a matching trip', () => {
			// The predicate gates on `iterations !== undefined`, NOT `Boolean(iterations)`.
			// A cap of 0 is falsy but defined; an `if (iterations && …)` idiom would wrongly
			// classify this as errored. Pins the exact predicate the DDD locked.
			expect(classifyDangerError('RangeError', GUARD_MESSAGE, 0)).toStrictEqual(
				{
					outcome: 'limit-exceeded',
					error: { name: 'RangeError', message: GUARD_MESSAGE },
				},
			);
		});
	});

	describe('Interfaces — the result shape', () => {
		it('carries the same { name, message } error floor an errored result does', () => {
			// The kind's error floor is UNIFORM across non-clean outcomes
			// (backend/types.ts): a loop-cap trip is not a bare `{ outcome }` — it
			// carries the machine's words like any throw, so a consumer reads the floor
			// identically whichever way the run ended. New fixture (loop 7 / cap 1000)
			// so this pins the shape symmetry, not a value another test already covers.
			const tripped = classifyDangerError(
				'RangeError',
				'Loop 7 exceeded 1000 iterations.',
				1000,
			);
			const thrown = classifyDangerError(
				'TypeError',
				'x is not a function',
				1000,
			);
			expect(tripped).toStrictEqual({
				outcome: 'limit-exceeded',
				error: {
					name: 'RangeError',
					message: 'Loop 7 exceeded 1000 iterations.',
				},
			});
			expect(Object.keys(tripped.error ?? {})).toStrictEqual(
				Object.keys(thrown.error ?? {}),
			);
		});

		it('an errored result carries { name, message } and nothing else', () => {
			const result = classifyDangerError(
				'SyntaxError',
				'Unexpected token',
				100,
			);
			expect(result).toStrictEqual({
				outcome: 'errored',
				error: { name: 'SyntaxError', message: 'Unexpected token' },
			});
		});
	});

	describe('Exceptions — both substrings are required, adversarially', () => {
		it("the accepted false-positive: a NON-guard message the anchored regex would reject but 'includes' accepts", () => {
			// `budget exceeded after many iterations` fails /^Loop \d+ exceeded \d+ iterations\.?/
			// but contains both 'exceeded' and 'iterations' — so it classifies as a trip.
			// This pins the DDD's includes-over-regex choice (no sentinel disambiguates).
			expect(
				classifyDangerError(
					'RangeError',
					'budget exceeded after many iterations',
					100,
				),
			).toStrictEqual({
				outcome: 'limit-exceeded',
				error: {
					name: 'RangeError',
					message: 'budget exceeded after many iterations',
				},
			});
		});

		it("a RangeError with 'exceeded' but NOT 'iterations' is errored", () => {
			expect(
				classifyDangerError('RangeError', 'array length exceeded', 100),
			).toEqual({
				outcome: 'errored',
				error: { name: 'RangeError', message: 'array length exceeded' },
			});
		});

		it("a RangeError with 'iterations' but NOT 'exceeded' is errored", () => {
			expect(
				classifyDangerError('RangeError', 'too many iterations here', 100),
			).toEqual({
				outcome: 'errored',
				error: { name: 'RangeError', message: 'too many iterations here' },
			});
		});
	});
});
