/**
 * @file I2's transported cluster: the record path's one narrowing site —
 * full declared depth or dropped, frozen where narrowed, extended with
 * the offset legs of the wire attribution (both-or-neither, structural
 * in the wrap's one six-field stamp).
 *
 * All 25 of the deprecated port's it-blocks (31 runnable rows — the two
 * `it.each` expansions) transport content-level from
 * `evaluators-deprecated/intercept/tests/narrow-record-message.test.ts`
 * under HR-8/HR-11/HR-14: the port's `kind`/`returnValue` literals
 * rewrite to the reference spellings `event`/`return`, and the drop
 * answer is `null` (this seam's own contract; the port answered
 * `undefined` — the engine's sentinel, which the onMessage wiring now
 * owns). Eight offset it-blocks extend the transport for the stamp's
 * offset pair — 33 blocks, 39 runnable rows in all.
 *
 * Ruling carry block (prose, not PINNED — the pinned-guard hook is
 * unregistered and a guard-down period accepts no new pins, human ruling
 * 2026-08-06; authority stays with the deprecated suite's markers;
 * replant when the guard re-arms):
 * - deprecated DOCS § Structural constraints: records are deep-frozen
 *   where narrowed — a fresh allocation after the clone, nobody else's.
 *   Load-bearing here, not ceremonial: the engine's freeze at yield is
 *   one shallow `Object.freeze` on the yielded item (its delivery step),
 *   and the engine's types assign interior freezing of consumer payloads
 *   to downstream owners, while `args` and `loc` ride by reference into
 *   the delivered event — this narrowing is the one site that
 *   deep-freezes them.
 * - H-3 (ruled 2026-08-04): the alert record states the modelled
 *   `undefined` rather than omitting it — present-and-undefined is a
 *   real check under `exactOptionalPropertyTypes`.
 * - ar-3 I3 resolution (2026-08-05): a position present but not an
 *   object must DROP, never throw — the region's guard order, object-ness
 *   before any leaf read.
 * - B-4 (Phase-1 briefing decisions 2026-08-05): anything failing the
 *   full declared depth is dropped — the drop answer, never a guess.
 *
 * Fixtures are hand-built wire messages: shared in-file builders carry
 * the well-formed baselines and each row overrides exactly the field
 * under test inline — a drop row differs from the riding baseline by one
 * field, which is what makes each drop assertion meaningful.
 *
 * Triangulation, stated honestly: the first riding row alone is passable
 * by `return message as InterceptWireRecord`; the drop rows are what
 * force real validation, the per-event `return` rows force per-arm
 * depth, and the offset rows force the both-or-neither legs.
 */

import { describe, expect, it } from 'vitest';

import narrowRecordMessage from '../narrow-record-message.js';

function recordOf(overrides: Record<string, unknown> = {}): unknown {
	return {
		event: 'console',
		method: 'log',
		args: ['hi'],
		step: 1,
		loc: null,
		start: null,
		end: null,
		...overrides,
	};
}

function promptRecordOf(overrides: Record<string, unknown> = {}): unknown {
	return {
		event: 'prompt',
		args: ['who?'],
		step: 2,
		loc: null,
		start: null,
		end: null,
		return: 'Ada',
		...overrides,
	};
}

describe('narrowRecordMessage', () => {
	describe('degenerate messages', () => {
		it.each([[null], [undefined], ['a string'], [42], [true]])(
			'%p is dropped',
			(message) => {
				expect(narrowRecordMessage(message)).toBeNull();
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
			const message = recordOf({ loc: locOf(), start: 30, end: 46 });
			const narrowed = narrowRecordMessage(message);

			expect(
				Object.isFrozen((narrowed as { loc: { start: object } }).loc.start),
			).toBe(true);
		});
	});

	describe('each dialog record rides', () => {
		it('an answered alert, return present and undefined', () => {
			const message = {
				event: 'alert',
				args: ['done'],
				step: 3,
				loc: null,
				start: null,
				end: null,
				return: undefined,
			};

			expect(narrowRecordMessage(message)).toBe(message);
		});

		it('an answered confirm with its boolean', () => {
			const message = {
				event: 'confirm',
				args: ['sure?'],
				step: 1,
				loc: null,
				start: null,
				end: null,
				return: false,
			};

			expect(narrowRecordMessage(message)).toBe(message);
		});

		it('an answered prompt with its string rides by the same reference', () => {
			const message = promptRecordOf();

			expect(narrowRecordMessage(message)).toBe(message);
		});

		it('a prompt answered null — the platform cancel — rides', () => {
			const message = promptRecordOf({ return: null });

			expect(narrowRecordMessage(message)).toBe(message);
		});
	});

	describe('the loc arm', () => {
		it('a full span rides', () => {
			const message = recordOf({ loc: locOf(), start: 30, end: 46 });

			expect(narrowRecordMessage(message)).toBe(message);
		});

		it('a missing loc key is dropped — null is stated, never inferred', () => {
			expect(
				narrowRecordMessage({
					event: 'console',
					method: 'log',
					args: ['hi'],
					step: 1,
					start: null,
					end: null,
				}),
			).toBeNull();
		});

		it('a truncated span is dropped', () => {
			expect(
				narrowRecordMessage(
					recordOf({
						loc: { start: { line: 1, column: 0 } },
						start: 30,
						end: 46,
					}),
				),
			).toBeNull();
		});

		it('a loc whose start is not an object is dropped', () => {
			expect(
				narrowRecordMessage(
					recordOf({
						loc: { start: 'nope', end: { line: 3, column: 20 } },
						start: 30,
						end: 46,
					}),
				),
			).toBeNull();
		});

		it('a non-finite position is dropped', () => {
			expect(
				narrowRecordMessage(
					recordOf({
						loc: {
							start: { line: 1, column: 0 },
							end: { line: Number.NaN, column: 2 },
						},
						start: 30,
						end: 46,
					}),
				),
			).toBeNull();
		});
	});

	describe('the offset pair', () => {
		it('a span without its offsets is dropped — the pair travels with the span', () => {
			expect(narrowRecordMessage(recordOf({ loc: locOf() }))).toBeNull();
		});

		it('half an offset pair is dropped', () => {
			expect(
				narrowRecordMessage(recordOf({ loc: locOf(), start: 30 })),
			).toBeNull();
		});

		it('the reverse half pair is dropped', () => {
			expect(
				narrowRecordMessage(recordOf({ loc: locOf(), end: 46 })),
			).toBeNull();
		});

		it('a loc-null record carrying offsets is dropped — the legs are null together', () => {
			expect(narrowRecordMessage(recordOf({ start: 30, end: 46 }))).toBeNull();
		});

		it('a loc-null record with one stray offset is dropped', () => {
			expect(narrowRecordMessage(recordOf({ start: 30 }))).toBeNull();
		});

		it('a missing start key is dropped — offsets are stated, never inferred', () => {
			expect(
				narrowRecordMessage({
					event: 'console',
					method: 'log',
					args: ['hi'],
					step: 1,
					loc: null,
					end: null,
				}),
			).toBeNull();
		});

		it('a non-finite offset is dropped', () => {
			expect(
				narrowRecordMessage(
					recordOf({ loc: locOf(), start: 30, end: Number.NaN }),
				),
			).toBeNull();
		});

		it('a string offset is dropped', () => {
			expect(
				narrowRecordMessage(recordOf({ loc: locOf(), start: '30', end: 46 })),
			).toBeNull();
		});
	});

	describe('the step arm', () => {
		it('a missing step is dropped', () => {
			expect(
				narrowRecordMessage({
					event: 'console',
					method: 'log',
					args: ['hi'],
					loc: null,
					start: null,
					end: null,
				}),
			).toBeNull();
		});

		it.each([['2'], [Number.POSITIVE_INFINITY], [Number.NaN]])(
			'a step of %p is dropped',
			(step) => {
				expect(narrowRecordMessage(recordOf({ step }))).toBeNull();
			},
		);
	});

	describe('per-event depth', () => {
		it('an unlisted event is dropped, never guessed at', () => {
			expect(narrowRecordMessage(recordOf({ event: 'telemetry' }))).toBeNull();
		});

		it('a console record without a string method is dropped', () => {
			expect(narrowRecordMessage(recordOf({ method: 42 }))).toBeNull();
		});

		it('an alert record whose return is present but not undefined is dropped', () => {
			expect(
				narrowRecordMessage({
					event: 'alert',
					args: ['done'],
					step: 3,
					loc: null,
					start: null,
					end: null,
					return: false,
				}),
			).toBeNull();
		});

		it('an alert record MISSING return is dropped', () => {
			expect(
				narrowRecordMessage({
					event: 'alert',
					args: [],
					step: 1,
					loc: null,
					start: null,
					end: null,
				}),
			).toBeNull();
		});

		it('a confirm record with a non-boolean answer is dropped', () => {
			expect(
				narrowRecordMessage({
					event: 'confirm',
					args: [],
					step: 1,
					loc: null,
					start: null,
					end: null,
					return: 'yes',
				}),
			).toBeNull();
		});

		it('a prompt record with a numeric answer is dropped', () => {
			expect(narrowRecordMessage(promptRecordOf({ return: 42 }))).toBeNull();
		});
	});

	describe('the args arm', () => {
		it('a console record whose args is not an array is dropped', () => {
			expect(
				narrowRecordMessage(recordOf({ args: 'not an array' })),
			).toBeNull();
		});

		it('a confirm record whose args is not an array is dropped', () => {
			expect(
				narrowRecordMessage({
					event: 'confirm',
					args: 'not an array',
					step: 1,
					loc: null,
					start: null,
					end: null,
					return: false,
				}),
			).toBeNull();
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
