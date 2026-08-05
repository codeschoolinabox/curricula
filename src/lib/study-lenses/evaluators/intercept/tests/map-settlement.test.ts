/**
 * @file I4's truth table over synthetic engine settlements — every arm the
 * precedence rule can reach, the precedence COLLISIONS (settlements
 * carrying two things at once, where an outcome-keyed and a
 * carried-data-keyed implementation give different answers), and the
 * combinations intercept's own wiring cannot produce, which the mapper
 * answers loudly rather than guesses at (run's R3 shape, plus intercept's
 * trip/loc deltas).
 *
 * `haltOf` and `settlementOf` build the fixtures; both are wiring, and each
 * row still names its own data.
 *
 * Triangulation, stated honestly: run's R3 kill-shot rides here too — an
 * errored outcome carrying a well-formed NATURAL halt must map to
 * unreachable-outcome, which no outcome-keyed lookup can answer; the
 * trip-AND-loc collision row is intercept's own kill-shot for a mapper
 * branching on whether a span exists.
 */

import { describe, expect, it, vi } from 'vitest';

import type {
	EngineError,
	EngineSettlement,
} from '../../../lib/engine/types.js';
import mapSettlement from '../map-settlement.js';
import type { InterceptHalt } from '../types.js';

function haltOf(overrides: Partial<InterceptHalt> = {}): InterceptHalt {
	return {
		natural: true,
		errorName: '',
		message: '',
		trip: null,
		loc: null,
		iterationCount: 0,
		...overrides,
	};
}

function settlementOf(
	overrides: Partial<EngineSettlement> = {},
): EngineSettlement {
	return { outcome: 'completed', durationMs: 1, ...overrides };
}

function quietly(map: () => unknown): unknown {
	const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	const mapped = map();
	warn.mockRestore();
	return mapped;
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
			// PINNED(committed types.ts InterceptSettlement: the clean arm stays the kind's floor — no count and no events ride it)
			expect(
				mapSettlement(settlementOf({ halt: haltOf({ iterationCount: 12 }) })),
			).toStrictEqual({ ended: 'clean' });
		});

		it('an errored outcome carrying a well-formed natural halt maps to unreachable-outcome, not clean', () => {
			const mapped = quietly(() =>
				mapSettlement(settlementOf({ outcome: 'errored', halt: haltOf() })),
			);

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('freezes the settlement it returns', () => {
			expect(
				Object.isFrozen(mapSettlement(settlementOf({ outcome: 'cancelled' }))),
			).toBe(true);
		});

		it('a completed settlement whose natural halt carries a trip is the defensive arm, not clean', () => {
			// PINNED(human ruling H-6 as extended 2026-08-05: this branch READS the halt, so the same self-contradiction the trip branch refuses to guess about cannot pass here either)
			const mapped = quietly(() =>
				mapSettlement(
					settlementOf({
						halt: haltOf({
							trip: {
								loopIndex: 1,
								loc: {
									start: { line: 1, column: 0 },
									end: { line: 1, column: 5 },
								},
							},
						}),
					}),
				),
			);

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a cancelled settlement ignores the halt entirely, by design', () => {
			// PINNED(human ruling H-6 as extended 2026-08-05: the canceled branch consults no halt — a consumer-ended run's settlement does not depend on what the worker said, so the asymmetry with the completed branch is deliberate)
			expect(
				mapSettlement(
					settlementOf({
						outcome: 'cancelled',
						halt: haltOf({
							trip: {
								loopIndex: 1,
								loc: {
									start: { line: 1, column: 0 },
									end: { line: 1, column: 5 },
								},
							},
						}),
					}),
				),
			).toStrictEqual({ ended: 'canceled' });
		});
	});

	describe('a halt recording the program its own throw', () => {
		it('maps to the error arm with reason threw, the stamped loc riding', () => {
			const settlement = settlementOf({
				outcome: 'errored',
				halt: haltOf({
					natural: false,
					errorName: 'TypeError',
					message: 'null is not a function',
					loc: {
						start: { line: 3, column: 4 },
						end: { line: 3, column: 20 },
					},
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
					loc: {
						start: { line: 3, column: 4 },
						end: { line: 3, column: 20 },
					},
				},
			});
		});

		it('a throw that escaped no wrap carries loc null on the arm', () => {
			const settlement = settlementOf({
				outcome: 'errored',
				halt: haltOf({
					natural: false,
					errorName: 'TypeError',
					message: 'boom',
					iterationCount: 0,
				}),
			});

			expect(mapSettlement(settlement)).toHaveProperty('error.loc', null);
		});

		it('freezes the threw arm through the stamped span', () => {
			const settlement = settlementOf({
				outcome: 'errored',
				halt: haltOf({
					natural: false,
					errorName: 'TypeError',
					message: 'boom',
					loc: {
						start: { line: 3, column: 4 },
						end: { line: 3, column: 20 },
					},
					iterationCount: 0,
				}),
			});
			const mapped = mapSettlement(settlement);

			expect(
				Object.isFrozen(
					(mapped as { error: { loc: { start: object } } }).error.loc.start,
				),
			).toBe(true);
		});
	});

	describe("a halt recording the guard's trip", () => {
		it('maps to loop-cap carrying the trip record whole and NO separate span', () => {
			const settlement = settlementOf({
				outcome: 'errored',
				halt: haltOf({
					natural: false,
					errorName: 'RangeError',
					message: 'Loop 1 exceeded 3 iterations.',
					trip: {
						loopIndex: 1,
						loc: {
							start: { line: 2, column: 0 },
							end: { line: 4, column: 1 },
						},
					},
					iterationCount: 4,
				}),
			});

			// PINNED(committed types.ts InterceptEvaluationError: loop-cap carries the guard's whole trip record and NO separate span — the trip is classification AND attribution in one field)
			expect(mapSettlement(settlement)).toStrictEqual({
				ended: 'error',
				error: {
					name: 'RangeError',
					message: 'Loop 1 exceeded 3 iterations.',
					reason: 'loop-cap',
					iterationCount: 4,
					trip: {
						loopIndex: 1,
						loc: {
							start: { line: 2, column: 0 },
							end: { line: 4, column: 1 },
						},
					},
				},
			});
		});

		it('a trip AND a stamped loc coexisting resolve through the trip, no span beside it', () => {
			// PINNED(committed types.ts InterceptHalt: a guard throw propagating through a wrapped call legitimately has BOTH — the precedence runs through the TRIP, never through whether a span exists, and the arm carries NO loc key for the colliding span to leak into)
			const settlement = settlementOf({
				outcome: 'errored',
				halt: haltOf({
					natural: false,
					errorName: 'RangeError',
					message: 'Loop 1 exceeded 0 iterations.',
					trip: {
						loopIndex: 1,
						loc: {
							start: { line: 1, column: 0 },
							end: { line: 1, column: 27 },
						},
					},
					loc: {
						start: { line: 1, column: 15 },
						end: { line: 1, column: 26 },
					},
					iterationCount: 1,
				}),
			});

			expect(mapSettlement(settlement)).toStrictEqual({
				ended: 'error',
				error: {
					name: 'RangeError',
					message: 'Loop 1 exceeded 0 iterations.',
					reason: 'loop-cap',
					iterationCount: 1,
					trip: {
						loopIndex: 1,
						loc: {
							start: { line: 1, column: 0 },
							end: { line: 1, column: 27 },
						},
					},
				},
			});
		});

		it('a well-formed trip riding a NATURAL halt is the defensive arm, not loop-cap', () => {
			// PINNED(human ruling H-6 2026-08-05, inverting the I4 ar-3 pin: the same phase-10 sentence's other clause is "natural-end halts fall through", and this combination is unreachable from intercept's own worker (its natural-end branch hardcodes trip: null) — so a halt asserting both is self-contradictory forged data, and the one place this mapper would otherwise trust one field over a directly contradicting sibling field)
			const mapped = quietly(() =>
				mapSettlement(
					settlementOf({
						outcome: 'errored',
						halt: haltOf({
							trip: {
								loopIndex: 1,
								loc: {
									start: { line: 1, column: 0 },
									end: { line: 1, column: 5 },
								},
							},
						}),
					}),
				),
			);

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
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
						loc: {
							start: { line: 1, column: 0 },
							end: { line: 1, column: 9 },
						},
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
		it('a timeout cause maps to reason timeout, the floor alone', () => {
			const error: EngineError = {
				cause: 'timeout',
				name: 'EngineTimeoutError',
				message: 'exceeded its budget',
			};

			// PINNED(H-2 ruled 2026-08-04: the per-yield charge makes this arm reachable with almost no runtime — the records already delivered stand, and the arm stays the floor alone)
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

		it.each([['worker-error'], ['call-error'], ['hook-error']])(
			'an engine %s cause maps to defect carrying that cause',
			(cause) => {
				const error: EngineError = {
					cause: cause as EngineError['cause'],
					name: 'EngineError',
					message: 'machinery failed',
				};

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

	describe('precedence over the carried data', () => {
		it('an errored settlement whose engine cause is timeout maps to timeout, not defect', () => {
			const error: EngineError = {
				cause: 'timeout',
				name: 'EngineTimeoutError',
				message: 'exceeded its budget',
			};

			expect(
				mapSettlement(settlementOf({ outcome: 'errored', error })),
			).toHaveProperty('error.reason', 'timeout');
		});

		it('a trip-bearing halt wins over a coexisting engine error too', () => {
			// PINNED(ar-4 I4 resolution 2026-08-05: the refinement-throw corner can ride a loop-cap halt as easily as a threw halt — an error-first branch order would mis-arm exactly this row)
			const settlement = settlementOf({
				outcome: 'errored',
				halt: haltOf({
					natural: false,
					errorName: 'RangeError',
					message: 'Loop 1 exceeded 2 iterations.',
					trip: {
						loopIndex: 1,
						loc: {
							start: { line: 1, column: 0 },
							end: { line: 1, column: 9 },
						},
					},
					iterationCount: 3,
				}),
				error: {
					cause: 'hook-error',
					name: 'EngineHookError',
					message: 'refineError threw',
				},
			});

			expect(mapSettlement(settlement)).toHaveProperty(
				'error.reason',
				'loop-cap',
			);
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

			expect(mapSettlement(settlement)).toHaveProperty('error.reason', 'threw');
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

			expect(mapSettlement(settlement)).toHaveProperty(
				'error.reason',
				'timeout',
			);
		});
	});

	// Every row here is type-valid against the public EngineSettlement and
	// UNREACHABLE through intercept's own wiring. They are tested because the
	// mapper's contract is totality over the type it accepts, not over the
	// subset today's engine happens to emit (run's R3 comment, carried).
	describe('combinations intercept cannot produce', () => {
		it('a failed outcome maps to defect with cause unreachable-outcome', () => {
			const mapped = quietly(() =>
				mapSettlement(
					settlementOf({ outcome: 'failed', failReason: 'nobody calls fail' }),
				),
			);

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a completed settlement missing its halt maps to unreachable-outcome', () => {
			const mapped = quietly(() =>
				mapSettlement(settlementOf({ outcome: 'completed' })),
			);

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a malformed halt payload maps to unreachable-outcome', () => {
			const mapped = quietly(() =>
				mapSettlement(
					settlementOf({ outcome: 'errored', halt: { natural: 'yes' } }),
				),
			);

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a halt whose trip is not trip-shaped maps to unreachable-outcome', () => {
			// PINNED(inherited run R3 ruling: this is the one branded narrowing site for adversarial worker output — an empty object must not reach a consumer typed to read trip.loc.start.line)
			const mapped = quietly(() =>
				mapSettlement(
					settlementOf({
						outcome: 'errored',
						halt: { ...haltOf({ natural: false }), trip: {} },
					}),
				),
			);

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a halt whose loc is not span-shaped maps to unreachable-outcome', () => {
			const mapped = quietly(() =>
				mapSettlement(
					settlementOf({
						outcome: 'errored',
						halt: { ...haltOf({ natural: false }), loc: 'garbage' },
					}),
				),
			);

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a halt whose loc is missing a position maps to unreachable-outcome', () => {
			const mapped = quietly(() =>
				mapSettlement(
					settlementOf({
						outcome: 'errored',
						halt: {
							...haltOf({ natural: false }),
							loc: { start: { line: 1, column: 0 } },
						},
					}),
				),
			);

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('the defensive arm carries well-formed machine words, never undefined', () => {
			const mapped = quietly(() =>
				mapSettlement(settlementOf({ outcome: 'failed' })),
			);

			expect(
				(mapped as { error: { message: string } }).error.message.length,
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
		it('every engine machinery cause lands in InterceptDefectCause', () => {
			const probe: import('../types.js').InterceptDefectCause =
				'worker-error' as Exclude<EngineError['cause'], 'timeout'>;

			expect(probe).toBe('worker-error');
		});
	});
});
