/**
 * @file I3's ZOMBIES cluster: the record path's one narrowing site — full
 * declared depth or dropped (briefing decision B-4), frozen where narrowed.
 *
 * Fixtures are hand-built wire messages: shared in-file builders carry the
 * well-formed baselines and each row overrides exactly the field under
 * test inline — a drop row differs from the riding baseline by one field,
 * which is what makes each drop assertion meaningful.
 *
 * Triangulation, stated honestly: the first riding row alone is passable by
 * `return message as InterceptRecord`; the drop rows are what force real
 * validation, and the per-kind returnValue rows force per-arm depth.
 */

import { describe, expect, it } from 'vitest';

import narrowRecordMessage from '../narrow-record-message.js';

function recordOf(overrides: Record<string, unknown> = {}): unknown {
	return {
		kind: 'console',
		method: 'log',
		args: ['hi'],
		step: 1,
		loc: null,
		...overrides,
	};
}

function promptRecordOf(overrides: Record<string, unknown> = {}): unknown {
	return {
		kind: 'prompt',
		args: ['who?'],
		step: 2,
		loc: null,
		returnValue: 'Ada',
		...overrides,
	};
}

describe('narrowRecordMessage', () => {
	describe('degenerate messages', () => {
		it.each([[null], [undefined], ['a string'], [42], [true]])(
			'%p is dropped',
			(message) => {
				expect(narrowRecordMessage(message)).toBeUndefined();
			},
		);
	});

	describe('a well-formed console record', () => {
		it('rides through as itself', () => {
			const message = recordOf();

			expect(narrowRecordMessage(message)).toBe(message);
		});

		it('is frozen at its top level', () => {
			expect(Object.isFrozen(narrowRecordMessage(recordOf()))).toBe(true);
		});

		it('is deep-frozen at the narrowing', () => {
			// PINNED(committed DOCS § Structural constraints: events are deep-frozen where they are authored — a record at its narrowing, a fresh allocation after the clone)
			const message = recordOf({ loc: locOf() });
			const narrowed = narrowRecordMessage(message);

			expect(
				Object.isFrozen((narrowed as { loc: { start: object } }).loc.start),
			).toBe(true);
		});
	});

	describe('each dialog record rides', () => {
		it('an answered alert, returnValue present and undefined', () => {
			// PINNED(H-3 ruled 2026-08-04: the alert record states the modelled undefined rather than omitting it — present-and-undefined is a real check under exactOptionalPropertyTypes)
			const message = {
				kind: 'alert',
				args: ['done'],
				step: 3,
				loc: null,
				returnValue: undefined,
			};

			expect(narrowRecordMessage(message)).toBe(message);
		});

		it('an answered confirm with its boolean', () => {
			const message = {
				kind: 'confirm',
				args: ['sure?'],
				step: 1,
				loc: null,
				returnValue: false,
			};

			expect(narrowRecordMessage(message)).toBe(message);
		});

		it('an answered prompt with its string rides by the same reference', () => {
			const message = promptRecordOf();

			expect(narrowRecordMessage(message)).toBe(message);
		});

		it('a prompt answered null — the platform cancel — rides', () => {
			const message = promptRecordOf({ returnValue: null });

			expect(narrowRecordMessage(message)).toBe(message);
		});
	});

	describe('the loc arm', () => {
		it('a full span rides', () => {
			const message = recordOf({ loc: locOf() });

			expect(narrowRecordMessage(message)).toBe(message);
		});

		it('a missing loc key is dropped — null is stated, never inferred', () => {
			expect(
				narrowRecordMessage({
					kind: 'console',
					method: 'log',
					args: ['hi'],
					step: 1,
				}),
			).toBeUndefined();
		});

		it('a truncated span is dropped', () => {
			expect(
				narrowRecordMessage(
					recordOf({ loc: { start: { line: 1, column: 0 } } }),
				),
			).toBeUndefined();
		});

		it('a loc whose start is not an object is dropped', () => {
			// PINNED(ar-3 I3 resolution 2026-08-05: a position present but not an object must DROP, never throw — the region's isFinitePosition guard order)
			expect(
				narrowRecordMessage(
					recordOf({ loc: { start: 'nope', end: { line: 3, column: 20 } } }),
				),
			).toBeUndefined();
		});

		it('a non-finite position is dropped', () => {
			expect(
				narrowRecordMessage(
					recordOf({
						loc: {
							start: { line: 1, column: 0 },
							end: { line: Number.NaN, column: 2 },
						},
					}),
				),
			).toBeUndefined();
		});
	});

	describe('the step arm', () => {
		it('a missing step is dropped', () => {
			expect(
				narrowRecordMessage({
					kind: 'console',
					method: 'log',
					args: ['hi'],
					loc: null,
				}),
			).toBeUndefined();
		});

		it.each([['2'], [Number.POSITIVE_INFINITY], [Number.NaN]])(
			'a step of %p is dropped',
			(step) => {
				expect(narrowRecordMessage(recordOf({ step }))).toBeUndefined();
			},
		);
	});

	describe('per-kind depth', () => {
		it('an unlisted kind is dropped, never guessed at', () => {
			// PINNED(B-4, Phase-1 briefing decisions 2026-08-05: anything failing the full declared depth is dropped — the drop sentinel, never a guess)
			expect(
				narrowRecordMessage(recordOf({ kind: 'telemetry' })),
			).toBeUndefined();
		});

		it('a console record without a string method is dropped', () => {
			expect(narrowRecordMessage(recordOf({ method: 42 }))).toBeUndefined();
		});

		it('an alert record whose returnValue is present but not undefined is dropped', () => {
			// PINNED(H-3 ruled 2026-08-04: the contract states the modelled undefined — a presence-only check would accept a malformed alert record carrying a value)
			expect(
				narrowRecordMessage({
					kind: 'alert',
					args: ['done'],
					step: 3,
					loc: null,
					returnValue: false,
				}),
			).toBeUndefined();
		});

		it('an alert record MISSING returnValue is dropped', () => {
			expect(
				narrowRecordMessage({
					kind: 'alert',
					args: [],
					step: 1,
					loc: null,
				}),
			).toBeUndefined();
		});

		it('a confirm record with a non-boolean answer is dropped', () => {
			expect(
				narrowRecordMessage({
					kind: 'confirm',
					args: [],
					step: 1,
					loc: null,
					returnValue: 'yes',
				}),
			).toBeUndefined();
		});

		it('a prompt record with a numeric answer is dropped', () => {
			expect(
				narrowRecordMessage(promptRecordOf({ returnValue: 42 })),
			).toBeUndefined();
		});
	});

	describe('the args arm', () => {
		it('a console record whose args is not an array is dropped', () => {
			expect(
				narrowRecordMessage(recordOf({ args: 'not an array' })),
			).toBeUndefined();
		});

		it('a confirm record whose args is not an array is dropped', () => {
			expect(
				narrowRecordMessage({
					kind: 'confirm',
					args: 'not an array',
					step: 1,
					loc: null,
					returnValue: false,
				}),
			).toBeUndefined();
		});

		it('the args ELEMENTS stay unknown — any clone-safe learner value rides', () => {
			const message = recordOf({ args: [{ deep: [1, 2] }, null] });

			expect(narrowRecordMessage(message)).toBe(message);
		});

		it('freezes the args array through its elements', () => {
			const narrowed = narrowRecordMessage(
				recordOf({ args: [{ nested: true }] }),
			);

			expect(Object.isFrozen(narrowed?.args[0])).toBe(true);
		});
	});
});

function locOf(): unknown {
	return {
		start: { line: 3, column: 4 },
		end: { line: 3, column: 20 },
	};
}
