/**
 * @file R3's truth table over synthetic engine settlements — every arm the
 * precedence rule can reach, including the combinations run's own surface
 * cannot produce, which the mapper must answer loudly rather than guess at.
 *
 * The settlements here are built by hand rather than driven through a real
 * run: that is the point of a truth table. The rows that matter most are the
 * PRECEDENCE COLLISIONS — settlements carrying two things at once, where an
 * implementation keyed on `outcome` and one keyed on the carried data give
 * different answers.
 *
 * `haltOf` and `settlementOf` build the fixtures; both are wiring, and each
 * row still names its own data.
 */

import { describe, expect, it, vi } from 'vitest';

import type {
	EngineError,
	EngineSettlement,
} from '../../../lib/engine/types.js';
import mapSettlement from '../map-settlement.js';
import type { RunDefectCause, RunHalt } from '../types.js';

function haltOf(overrides: Partial<RunHalt> = {}): RunHalt {
	return {
		natural: true,
		errorName: '',
		message: '',
		trip: null,
		iterationCount: 0,
		...overrides,
	};
}

function settlementOf(
	overrides: Partial<EngineSettlement> = {},
): EngineSettlement {
	return { outcome: 'completed', durationMs: 1, ...overrides };
}

describe('mapSettlement', () => {
	describe('a consumer-ended run', () => {
		it('a cancelled outcome maps to the canceled arm', () => {
			expect(
				mapSettlement(settlementOf({ outcome: 'cancelled' })),
			).toStrictEqual({ ended: 'canceled' });
		});
	});

	describe('a completed run', () => {
		it('a completed settlement carrying its natural halt maps to clean', () => {
			// PINNED(human-ratified Phase 0 6256571c: the clean arm stays the kind's floor — no iteration count rides a clean settlement)
			expect(
				mapSettlement(settlementOf({ halt: haltOf({ iterationCount: 12 }) })),
			).toStrictEqual({ ended: 'clean' });
		});

		it('an errored outcome carrying a well-formed natural halt maps to unreachable-outcome, not clean', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ outcome: 'errored', halt: haltOf() }),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('freezes the settlement it returns', () => {
			expect(
				Object.isFrozen(mapSettlement(settlementOf({ outcome: 'cancelled' }))),
			).toBe(true);
		});
	});

	describe('a halt recording the program its own throw', () => {
		it('maps to the error arm with reason threw', () => {
			const settlement = settlementOf({
				outcome: 'errored',
				halt: haltOf({
					natural: false,
					errorName: 'TypeError',
					message: 'null is not a function',
					iterationCount: 4,
				}),
			});

			expect(mapSettlement(settlement)).toStrictEqual({
				ended: 'error',
				error: {
					name: 'TypeError',
					message: 'null is not a function',
					reason: 'threw',
					iterationCount: 4,
				},
			});
		});
	});

	describe("a halt recording the guard's trip", () => {
		it('maps to loop-cap carrying the trip record whole', () => {
			const settlement = settlementOf({
				outcome: 'errored',
				halt: haltOf({
					natural: false,
					errorName: 'RangeError',
					message: 'Loop 1 exceeded 3 iterations.',
					trip: {
						loopIndex: 1,
						loc: { start: { line: 2, column: 0 }, end: { line: 4, column: 1 } },
					},
					iterationCount: 4,
				}),
			});

			// PINNED(human-ratified Phase 0 6256571c: loop-cap carries the whole trip record — classification and attribution are one fact)
			expect(mapSettlement(settlement)).toStrictEqual({
				ended: 'error',
				error: {
					name: 'RangeError',
					message: 'Loop 1 exceeded 3 iterations.',
					reason: 'loop-cap',
					iterationCount: 4,
					trip: {
						loopIndex: 1,
						loc: { start: { line: 2, column: 0 }, end: { line: 4, column: 1 } },
					},
				},
			});
		});

		it('freezes the settlement through the trip span', () => {
			const settlement = settlementOf({
				outcome: 'errored',
				halt: haltOf({
					natural: false,
					errorName: 'RangeError',
					message: 'Loop 1 exceeded 0 iterations.',
					trip: {
						loopIndex: 1,
						loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 9 } },
					},
					iterationCount: 1,
				}),
			});
			const mapped = mapSettlement(settlement);

			expect(
				Object.isFrozen(
					(mapped as { error: { trip: { loc: { start: object } } } }).error.trip
						.loc.start,
				),
			).toBe(true);
		});
	});

	describe('an engine-made stop', () => {
		it('a timeout cause maps to reason timeout', () => {
			const error: EngineError = {
				cause: 'timeout',
				name: 'EngineTimeoutError',
				message: 'exceeded its budget',
			};

			expect(
				mapSettlement(settlementOf({ outcome: 'timed-out', error })),
			).toStrictEqual({
				ended: 'error',
				error: {
					name: 'EngineTimeoutError',
					message: 'exceeded its budget',
					reason: 'timeout',
				},
			});
		});

		it('the timeout arm carries no iteration count', () => {
			const error: EngineError = {
				cause: 'timeout',
				name: 'EngineTimeoutError',
				message: 'exceeded its budget',
			};
			const mapped = mapSettlement(
				settlementOf({ outcome: 'timed-out', error }),
			);

			// PINNED(human-ratified Phase 0 6256571c: timeout is the floor alone — the stop was thread-side, so no count is real)
			expect(mapped).not.toHaveProperty('error.iterationCount');
		});

		it.each([['worker-error'], ['call-error'], ['hook-error']])(
			'an engine %s cause maps to defect carrying that cause',
			(cause) => {
				const error: EngineError = {
					cause: cause as EngineError['cause'],
					name: 'EngineError',
					message: 'machinery failed',
				};

				// PINNED(human-ratified Phase 0 6256571c: each engine machinery cause mirrors structurally onto RunDefectCause)
				expect(
					mapSettlement(settlementOf({ outcome: 'errored', error })),
				).toStrictEqual({
					ended: 'error',
					error: {
						name: 'EngineError',
						message: 'machinery failed',
						reason: 'defect',
						cause,
					},
				});
			},
		);
	});

	// Every row in this block is type-valid against the public
	// `EngineSettlement` and UNREACHABLE through run's own wiring: evaluate.ts's
	// internal stop shapes never pair a timeout cause with an errored outcome,
	// never carry a halt on the timeout branch, and run supplies no refineError,
	// which is the only way a halt and an engine error coexist. They are tested
	// because the mapper's contract is totality over the type it accepts, not
	// over the subset today's engine happens to emit.
	describe('precedence over the carried data', () => {
		it('an errored settlement whose engine cause is timeout maps to timeout, not defect', () => {
			const error: EngineError = {
				cause: 'timeout',
				name: 'EngineTimeoutError',
				message: 'exceeded its budget',
			};
			const mapped = mapSettlement(settlementOf({ outcome: 'errored', error }));

			// PINNED(human-ratified Phase 0 6256571c: the engine's structured cause answers, never the outcome label)
			expect(mapped).toStrictEqual({
				ended: 'error',
				error: {
					name: 'EngineTimeoutError',
					message: 'exceeded its budget',
					reason: 'timeout',
				},
			});
		});

		it('a halt recording a throw wins over a coexisting engine error', () => {
			const settlement = settlementOf({
				outcome: 'errored',
				halt: haltOf({
					natural: false,
					errorName: 'Error',
					message: 'the program threw',
					iterationCount: 2,
				}),
				error: {
					cause: 'hook-error',
					name: 'EngineHookError',
					message: 'refineError threw',
				},
			});

			// PINNED(human-ratified Phase 0 6256571c: precedence is over carried data — a well-formed halt recording a throw wins over an engine error)
			expect(mapSettlement(settlement)).toStrictEqual({
				ended: 'error',
				error: {
					name: 'Error',
					message: 'the program threw',
					reason: 'threw',
					iterationCount: 2,
				},
			});
		});

		it('a natural halt riding a timed-out settlement falls through to timeout', () => {
			const settlement = settlementOf({
				outcome: 'timed-out',
				halt: haltOf({ iterationCount: 99 }),
				error: {
					cause: 'timeout',
					name: 'EngineTimeoutError',
					message: 'exceeded its budget',
				},
			});

			expect(mapSettlement(settlement)).toStrictEqual({
				ended: 'error',
				error: {
					name: 'EngineTimeoutError',
					message: 'exceeded its budget',
					reason: 'timeout',
				},
			});
		});
	});

	describe('combinations run cannot produce', () => {
		it('a failed outcome maps to defect with cause unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ outcome: 'failed', failReason: 'nobody calls fail' }),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a completed settlement missing its halt maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(settlementOf({ outcome: 'completed' }));
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a halt whose trip is not trip-shaped maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: {
						...haltOf({ natural: false, errorName: 'RangeError' }),
						trip: {},
					},
				}),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a malformed halt payload maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ outcome: 'errored', halt: { natural: 'yes' } }),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('the defensive arm carries well-formed machine words, never undefined', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(settlementOf({ outcome: 'failed' }));
			warn.mockRestore();

			expect(
				(mapped as { error: { name: string; message: string } }).error.message
					.length,
			).toBeGreaterThan(0);
		});

		it('the defensive arm warns loudly', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			mapSettlement(settlementOf({ outcome: 'failed' }));
			const warned = warn.mock.calls.length;
			warn.mockRestore();

			expect(warned).toBe(1);
		});

		it('a reachable arm never warns', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			mapSettlement(settlementOf({ halt: haltOf() }));
			const warned = warn.mock.calls.length;
			warn.mockRestore();

			expect(warned).toBe(0);
		});
	});

	describe('the engine contract', () => {
		it('every engine machinery cause lands in RunDefectCause', () => {
			const probe: RunDefectCause = 'worker-error' as Exclude<
				EngineError['cause'],
				'timeout'
			>;

			expect(probe).toBe('worker-error');
		});
	});
});
