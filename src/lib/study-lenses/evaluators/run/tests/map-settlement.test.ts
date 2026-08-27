/**
 * @file R3's truth table over synthetic engine settlements — every arm the
 * six-step precedence can reach, including the combinations run's own
 * surface cannot produce, which the mapper must answer loudly rather than
 * guess at. Transported from the deprecated port's suite onto the
 * committed RunResult contract: the port's `ended` × `reason` vocabulary
 * retires, and the reference outcomes answer (the region README's T1
 * composes the mapping); extended with the io-flag steps, the phase
 * carriage, and the deep-freeze rows this contract adds.
 *
 * The settlements are built by hand rather than driven through a real
 * run: that is the point of a truth table. The rows that matter most are
 * the PRECEDENCE COLLISIONS — settlements carrying two things at once,
 * type-valid against the public `EngineSettlement` and unreachable
 * through run's own wiring, because the mapper's contract is totality
 * over the type it accepts, not over the subset today's engine happens
 * to emit. The ast fixture is a real parsed Program off the embody
 * pipeline; `naturalHaltOf`, `throwHaltOf`, `settlementOf`, and `flagOf`
 * are wiring, and each row still names its own data. The final row is a
 * COMPILE-TIME probe, not a runtime check: the cast widens its static
 * type to the whole machinery-cause union, so a new engine cause that is
 * not mirrored into `RunDefectCause` fails the build here, loudly.
 */

import type { Program } from 'acorn';
import { describe, expect, it, vi } from 'vitest';

import deriveFacts from '../../../embody/derive-facts.js';
import type {
	EngineError,
	EngineSettlement,
} from '../../../lib/engine/types.js';
import mapSettlement from '../map-settlement.js';
import type {
	RunDefectCause,
	RunHalt,
	RunIoFlag,
	RunResult,
} from '../types.js';

function programOf(source: string): Program {
	const stage = deriveFacts({ source, type: 'script' }).ast;
	if (!stage.ok) {
		throw new Error('the fixture program failed to parse');
	}
	return stage.value;
}

function naturalHaltOf(iterationCount = 0): RunHalt {
	return {
		natural: true,
		errorName: '',
		message: '',
		trip: null,
		iterationCount,
		phase: null,
	};
}

function throwHaltOf(
	overrides: Partial<Extract<RunHalt, { natural: false }>> = {},
): RunHalt {
	return {
		natural: false,
		errorName: 'Error',
		message: 'the program threw',
		trip: null,
		iterationCount: 0,
		phase: 'evaluation',
		...overrides,
	};
}

function settlementOf(
	overrides: Partial<EngineSettlement> = {},
): EngineSettlement {
	return { outcome: 'completed', durationMs: 1, ...overrides };
}

function flagOf(): RunIoFlag {
	return Object.freeze({
		kind: 'io',
		verb: 'prompt',
		name: 'MissingMockError',
		message: 'the program called prompt, but the spec supplies no prompt mock',
	});
}

function errorArmOf(
	result: RunResult,
): Extract<RunResult, { outcome: 'error' }> {
	if (result.outcome !== 'error') {
		throw new Error(`expected the error arm, got ${result.outcome}`);
	}
	return result;
}

function limitArmOf(
	result: RunResult,
): Extract<RunResult, { outcome: 'iteration-limit' }> {
	if (result.outcome !== 'iteration-limit') {
		throw new Error(`expected the iteration-limit arm, got ${result.outcome}`);
	}
	return result;
}

describe('mapSettlement', () => {
	describe('a consumer-ended run', () => {
		it('a cancelled outcome maps to the cancel arm', () => {
			const ast = programOf('let x = 1;\n');
			expect(
				mapSettlement(settlementOf({ outcome: 'cancelled' }), null, ast, 3),
			).toStrictEqual({ outcome: 'cancel', ok: false, ast });
		});

		it('a cancelled outcome outranks a set io flag', () => {
			const ast = programOf('let x = 1;\n');
			expect(
				mapSettlement(settlementOf({ outcome: 'cancelled' }), flagOf(), ast, 3),
			).toStrictEqual({ outcome: 'cancel', ok: false, ast });
		});

		it('a cancelled outcome discards a riding halt — no count reaches the arm', () => {
			const ast = programOf('let x = 1;\n');
			expect(
				mapSettlement(
					settlementOf({ outcome: 'cancelled', halt: naturalHaltOf(7) }),
					null,
					ast,
					3,
				),
			).toStrictEqual({ outcome: 'cancel', ok: false, ast });
		});
	});

	describe('a flagged run', () => {
		it('a flagged run settles the io arm, never the defect arm', () => {
			const ast = programOf('prompt("your name?");\n');
			const settlement = settlementOf({
				outcome: 'errored',
				error: {
					cause: 'call-error',
					name: 'EngineCallError',
					message: 'the round-trip could not be serviced',
				},
			});
			expect(mapSettlement(settlement, flagOf(), ast, 3)).toStrictEqual({
				outcome: 'error',
				ok: false,
				ast,
				error: flagOf(),
			});
		});

		it('the flag rides the error arm unchanged', () => {
			const ast = programOf('prompt("your name?");\n');
			const flag = flagOf();
			const mapped = mapSettlement(
				settlementOf({ outcome: 'errored' }),
				flag,
				ast,
				3,
			);
			expect(errorArmOf(mapped).error).toBe(flag);
		});

		it('the io arm rides frozen', () => {
			const mapped = mapSettlement(
				settlementOf({ outcome: 'errored' }),
				flagOf(),
				programOf('prompt("your name?");\n'),
				3,
			);
			expect(Object.isFrozen(errorArmOf(mapped).error)).toBe(true);
		});
	});

	describe('a completed run', () => {
		it('a completed settlement carrying its natural halt maps to complete with the run total', () => {
			const ast = programOf('let x = 1;\n');
			expect(
				mapSettlement(settlementOf({ halt: naturalHaltOf(12) }), null, ast, 3),
			).toStrictEqual({
				outcome: 'complete',
				ok: true,
				ast,
				iterationCount: 12,
			});
		});

		it('a zero run total rides the complete arm as zero, never dropped', () => {
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				programOf('let x = 1;\n'),
				3,
			);

			expect(mapped).toHaveProperty('iterationCount', 0);
		});

		it('an errored outcome carrying a well-formed natural halt maps to unreachable-outcome, not complete', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ outcome: 'errored', halt: naturalHaltOf() }),
				null,
				programOf('let x = 1;\n'),
				3,
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});
	});

	describe('a halt recording the program its own throw', () => {
		it('maps to the error arm with the javascript kind', () => {
			const ast = programOf('null();\n');
			const settlement = settlementOf({
				outcome: 'errored',
				halt: throwHaltOf({
					errorName: 'TypeError',
					message: 'null is not a function',
					iterationCount: 4,
				}),
			});

			expect(mapSettlement(settlement, null, ast, 3)).toStrictEqual({
				outcome: 'error',
				ok: false,
				ast,
				error: {
					kind: 'javascript',
					name: 'TypeError',
					message: 'null is not a function',
					phase: 'evaluation',
					iterationCount: 4,
				},
			});
		});

		it('the javascript arm carries the halt creation phase', () => {
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: throwHaltOf({ phase: 'creation' }),
				}),
				null,
				programOf('null();\n'),
				3,
			);

			expect(mapped).toHaveProperty('error.phase', 'creation');
		});

		it('a loop-cap-looking message with no trip stays the javascript kind — classification is structural, never a message match', () => {
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: throwHaltOf({
						errorName: 'RangeError',
						message: 'Loop 1 exceeded 3 iterations.',
					}),
				}),
				null,
				programOf('while (true) {}\n'),
				3,
			);

			expect(mapped).toHaveProperty('error.kind', 'javascript');
		});
	});

	describe("a halt recording the guard's trip", () => {
		it('maps to the iteration-limit arm carrying the trip record whole', () => {
			const ast = programOf('while (true) {}\n');
			const settlement = settlementOf({
				outcome: 'errored',
				halt: throwHaltOf({
					errorName: 'RangeError',
					message: 'Loop 1 exceeded 3 iterations.',
					trip: {
						loopIndex: 1,
						loc: { start: { line: 2, column: 0 }, end: { line: 4, column: 1 } },
					},
					iterationCount: 4,
				}),
			});

			expect(mapSettlement(settlement, null, ast, 3)).toStrictEqual({
				outcome: 'iteration-limit',
				ok: false,
				ast,
				error: {
					kind: 'iteration-limit',
					name: 'RangeError',
					message: 'Loop 1 exceeded 3 iterations.',
					iterationCount: 4,
					trip: {
						loopIndex: 1,
						loc: { start: { line: 2, column: 0 }, end: { line: 4, column: 1 } },
					},
				},
			});
		});

		it('freezes the result through the trip span', () => {
			const settlement = settlementOf({
				outcome: 'errored',
				halt: throwHaltOf({
					errorName: 'RangeError',
					message: 'Loop 1 exceeded 0 iterations.',
					trip: {
						loopIndex: 1,
						loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 9 } },
					},
					iterationCount: 1,
				}),
			});
			const mapped = mapSettlement(
				settlement,
				null,
				programOf('while (true) {}\n'),
				3,
			);

			expect(Object.isFrozen(limitArmOf(mapped).error.trip.loc.start)).toBe(
				true,
			);
		});

		it('the iteration-limit arm echoes the halt words, never its own', () => {
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: throwHaltOf({
						errorName: 'InfiniteLoopError',
						message: 'Loop 2 exceeded 9 iterations.',
						trip: {
							loopIndex: 2,
							loc: {
								start: { line: 3, column: 1 },
								end: { line: 5, column: 2 },
							},
						},
						iterationCount: 10,
					}),
				}),
				null,
				programOf('while (true) {}\n'),
				3,
			);

			expect(limitArmOf(mapped).error).toStrictEqual({
				kind: 'iteration-limit',
				name: 'InfiniteLoopError',
				message: 'Loop 2 exceeded 9 iterations.',
				iterationCount: 10,
				trip: {
					loopIndex: 2,
					loc: { start: { line: 3, column: 1 }, end: { line: 5, column: 2 } },
				},
			});
		});
	});

	describe('an engine-made stop', () => {
		it('a timeout cause maps to the timeout arm carrying limit and durationMs', () => {
			const ast = programOf('while (true) {}\n');
			const error: EngineError = {
				cause: 'timeout',
				name: 'EngineTimeoutError',
				message: 'exceeded its budget',
			};

			expect(
				mapSettlement(
					settlementOf({ outcome: 'timed-out', durationMs: 250, error }),
					null,
					ast,
					2,
				),
			).toStrictEqual({
				outcome: 'timeout',
				ok: false,
				ast,
				error: {
					kind: 'timeout',
					name: 'EngineTimeoutError',
					message: 'exceeded its budget',
					limit: 2,
					durationMs: 250,
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
				null,
				programOf('while (true) {}\n'),
				2,
			);

			expect(mapped).not.toHaveProperty('error.iterationCount');
		});

		it.each([
			['worker-error', 'EngineWorkerError', 'the worker crashed'],
			['call-error', 'EngineCallError', 'the round-trip failed'],
			['hook-error', 'EngineHookError', 'a thread hook threw'],
		])(
			'an engine %s cause maps to the defect arm carrying that cause and its words',
			(cause, name, message) => {
				const ast = programOf('let x = 1;\n');
				const error: EngineError = {
					cause: cause as EngineError['cause'],
					name,
					message,
				};

				expect(
					mapSettlement(
						settlementOf({ outcome: 'errored', error }),
						null,
						ast,
						3,
					),
				).toStrictEqual({
					outcome: 'error',
					ok: false,
					ast,
					error: { kind: 'defect', name, message, cause },
				});
			},
		);
	});

	describe('precedence over the carried data', () => {
		it('an errored settlement whose engine cause is timeout maps to the timeout arm, not the defect arm', () => {
			const ast = programOf('while (true) {}\n');
			const error: EngineError = {
				cause: 'timeout',
				name: 'BudgetError',
				message: 'the budget elapsed before the run settled',
			};

			expect(
				mapSettlement(
					settlementOf({ outcome: 'errored', durationMs: 7, error }),
					null,
					ast,
					4,
				),
			).toStrictEqual({
				outcome: 'timeout',
				ok: false,
				ast,
				error: {
					kind: 'timeout',
					name: 'BudgetError',
					message: 'the budget elapsed before the run settled',
					limit: 4,
					durationMs: 7,
				},
			});
		});

		it('a set io flag wins over a coexisting throw halt', () => {
			const ast = programOf('prompt("your name?");\n');
			const settlement = settlementOf({
				outcome: 'errored',
				halt: throwHaltOf({
					errorName: 'ReferenceError',
					message: 'prompt is not defined',
				}),
			});

			expect(mapSettlement(settlement, flagOf(), ast, 3)).toStrictEqual({
				outcome: 'error',
				ok: false,
				ast,
				error: flagOf(),
			});
		});

		it('a set io flag wins over a completed run carrying its natural halt', () => {
			const ast = programOf('prompt("your name?");\n');

			expect(
				mapSettlement(
					settlementOf({ halt: naturalHaltOf(5) }),
					flagOf(),
					ast,
					3,
				),
			).toStrictEqual({
				outcome: 'error',
				ok: false,
				ast,
				error: flagOf(),
			});
		});

		it('a set io flag wins over a coexisting engine timeout', () => {
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'timed-out',
					error: {
						cause: 'timeout',
						name: 'EngineTimeoutError',
						message: 'exceeded its budget',
					},
				}),
				flagOf(),
				programOf('prompt("your name?");\n'),
				2,
			);

			expect(mapped).toHaveProperty('error.kind', 'io');
		});

		it('a halt recording a throw wins over a coexisting engine error', () => {
			const ast = programOf('null();\n');
			const settlement = settlementOf({
				outcome: 'errored',
				halt: throwHaltOf({
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

			expect(mapSettlement(settlement, null, ast, 3)).toStrictEqual({
				outcome: 'error',
				ok: false,
				ast,
				error: {
					kind: 'javascript',
					name: 'Error',
					message: 'the program threw',
					phase: 'evaluation',
					iterationCount: 2,
				},
			});
		});

		it('a natural halt riding a timed-out settlement falls through to the timeout arm', () => {
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'timed-out',
					halt: naturalHaltOf(99),
					error: {
						cause: 'timeout',
						name: 'EngineTimeoutError',
						message: 'exceeded its budget',
					},
				}),
				null,
				programOf('while (true) {}\n'),
				2,
			);

			expect(mapped).toHaveProperty('error.kind', 'timeout');
		});
	});

	describe('combinations run cannot produce', () => {
		it('a failed outcome maps to the defect arm with cause unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ outcome: 'failed', failReason: 'nobody calls fail' }),
				null,
				programOf('let x = 1;\n'),
				3,
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a completed settlement missing its halt maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ outcome: 'completed' }),
				null,
				programOf('let x = 1;\n'),
				3,
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a halt whose trip is not trip-shaped maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: { ...throwHaltOf({ errorName: 'RangeError' }), trip: {} },
				}),
				null,
				programOf('while (true) {}\n'),
				3,
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a trip whose loc is an empty object maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: {
						...throwHaltOf({ errorName: 'RangeError' }),
						trip: { loopIndex: 1, loc: {} },
					},
				}),
				null,
				programOf('while (true) {}\n'),
				3,
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a malformed halt payload maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ outcome: 'errored', halt: { natural: 'yes' } }),
				null,
				programOf('let x = 1;\n'),
				3,
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a natural halt violating the pinned empty members maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					halt: { ...naturalHaltOf(), errorName: 'bogus' },
				}),
				null,
				programOf('let x = 1;\n'),
				3,
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a throw halt carrying a garbage phase maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: { ...throwHaltOf(), phase: 'execution' },
				}),
				null,
				programOf('null();\n'),
				3,
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('the defensive arm carries well-formed machine words, never undefined', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ outcome: 'failed' }),
				null,
				programOf('let x = 1;\n'),
				3,
			);
			warn.mockRestore();

			expect(errorArmOf(mapped).error.message.length).toBeGreaterThan(0);
		});

		it('the defensive arm warns loudly', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			mapSettlement(
				settlementOf({ outcome: 'failed' }),
				null,
				programOf('let x = 1;\n'),
				3,
			);
			const warned = warn.mock.calls.length;
			warn.mockRestore();

			expect(warned).toBe(1);
		});

		it('a reachable arm never warns', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				programOf('let x = 1;\n'),
				3,
			);
			const warned = warn.mock.calls.length;
			warn.mockRestore();

			expect(warned).toBe(0);
		});
	});

	describe('the result record', () => {
		it('freezes the result it returns', () => {
			expect(
				Object.isFrozen(
					mapSettlement(
						settlementOf({ outcome: 'cancelled' }),
						null,
						programOf('let x = 1;\n'),
						3,
					),
				),
			).toBe(true);
		});

		it('freezes the result through the error record', () => {
			const mapped = mapSettlement(
				settlementOf({ outcome: 'errored', halt: throwHaltOf() }),
				null,
				programOf('null();\n'),
				3,
			);

			expect(Object.isFrozen(errorArmOf(mapped).error)).toBe(true);
		});

		it('carries the given ast by reference', () => {
			const ast = programOf('let x = 1;\n');
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				ast,
				3,
			);

			expect(mapped.ast).toBe(ast);
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
