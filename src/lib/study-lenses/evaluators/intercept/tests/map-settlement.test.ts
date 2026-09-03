/**
 * @file I5's truth table over synthetic engine settlements — every arm the
 * precedence rule can reach, the precedence COLLISIONS (settlements
 * carrying two things at once, where an outcome-keyed or a
 * span-keyed implementation gives a different answer), and the
 * combinations intercept's own wiring cannot produce, which the mapper
 * answers loudly rather than guesses at. Transported from the deprecated
 * port's suite onto the committed InterceptResult contract: the port's
 * `ended` × `reason` vocabulary retires and the six reference outcomes
 * answer (HR-8) — the port's `'failed' → defect` row INVERTS under the
 * restored fail arm, and the port's count-free clean arm gains the
 * clean-arm `iterationCount` the committed type requires. Extended with
 * the io-flag steps, the step-0 fail split, the joins assembled from the
 * delivered events (visitCounts / eventsByNode under the null-key
 * policy), the phase carriage, the loc narrowing legs, and the
 * deep-freeze rows this contract adds. The I5 ar-3 fix-all round (human
 * ruling 2026-09-02, relayed) re-armed the H-6 pin's completed-outcome
 * half (the one combination that makes the natural arm's trip pin
 * load-bearing), deepened the halt-loc narrowing rows to the record
 * path's leaf-finiteness depth (empty position objects and non-finite
 * leaves reject — the second row adopted from the re-round's CONSIDER),
 * and added the conjunct-isolation rows on both narrowing arms.
 *
 * The settlements are built by hand rather than driven through a real
 * run: that is the point of a truth table. Triangulation, stated
 * honestly: run's R3 kill-shot rides here too — an errored outcome
 * carrying a well-formed NATURAL halt must map to unreachable-outcome,
 * which no outcome-keyed lookup can answer; the trip-AND-loc collision
 * row is intercept's own kill-shot for a mapper branching on whether a
 * span exists; and the mock-independence row (an ask and its record at
 * one node counting once) kills a per-event counter. The entwined
 * fixture is a real record off the embody pipeline; `naturalHaltOf`,
 * `throwHaltOf`, `settlementOf`, `flagOf`, and the event builders are
 * wiring, and each row still names its own data. The final row is a
 * COMPILE-TIME probe: the cast widens its static type to the whole
 * machinery-cause union, so a new engine cause not mirrored into
 * `InterceptDefectCause` fails the build here, loudly.
 */

import { describe, expect, it, vi } from 'vitest';

import deriveFacts from '../../../embody/derive-facts.js';
import type { Entwined, NodePath } from '../../../embody/types.js';
import type {
	EngineError,
	EngineSettlement,
} from '../../../lib/engine/types.js';
import mapSettlement from '../map-settlement.js';
import type {
	ConsoleEvent,
	ErrorEvent,
	InterceptDefectCause,
	InterceptEvent,
	InterceptHalt,
	InterceptIoFlag,
	InterceptResult,
	PendingInteractionEvent,
	PromptEvent,
} from '../types.js';

function entwinedOf(source: string): Entwined {
	const stage = deriveFacts({ source, type: 'script' }).entwined;
	if (!stage.ok) {
		throw new Error('the fixture program failed to entwine');
	}
	return stage.value;
}

function naturalHaltOf(iterationCount = 0): InterceptHalt {
	return {
		natural: true,
		errorName: '',
		message: '',
		trip: null,
		iterationCount,
		phase: null,
		loc: null,
	};
}

function throwHaltOf(
	overrides: Partial<Extract<InterceptHalt, { natural: false }>> = {},
): InterceptHalt {
	return {
		natural: false,
		errorName: 'Error',
		message: 'the program threw',
		trip: null,
		iterationCount: 0,
		phase: 'evaluation',
		loc: null,
		...overrides,
	};
}

function settlementOf(
	overrides: Partial<EngineSettlement> = {},
): EngineSettlement {
	return { outcome: 'completed', durationMs: 1, ...overrides };
}

function flagOf(): InterceptIoFlag {
	return Object.freeze({
		kind: 'io',
		source: 'console.table',
		name: 'IoCallbackError',
		message: 'the console.table callback threw',
	});
}

function attributionOf(nodePath: NodePath | null): {
	loc: InterceptEvent['loc'];
	start: number | null;
	end: number | null;
	nodePath: NodePath | null;
} {
	if (nodePath === null) {
		return { loc: null, start: null, end: null, nodePath: null };
	}
	return {
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 20 } },
		start: 0,
		end: 20,
		nodePath,
	};
}

function consoleEventOf(step: number, nodePath: NodePath | null): ConsoleEvent {
	return {
		event: 'console',
		method: 'log',
		args: ['hello'],
		step,
		...attributionOf(nodePath),
		node: null,
		prev: null,
		next: null,
		calleePath: null,
		callee: null,
	};
}

function promptRecordOf(step: number, nodePath: NodePath | null): PromptEvent {
	return {
		event: 'prompt',
		args: ['your name?'],
		return: 'Ada',
		step,
		...attributionOf(nodePath),
		node: null,
		prev: null,
		next: null,
		calleePath: null,
		callee: null,
	};
}

function pendingAskOf(
	step: number,
	nodePath: NodePath | null,
): PendingInteractionEvent {
	return {
		event: 'pending-interaction',
		request: { kind: 'prompt', message: 'your name?' },
		respond: () => {},
		step,
		...attributionOf(nodePath),
		node: null,
		prev: null,
		next: null,
		calleePath: null,
		callee: null,
	};
}

function errorEventOf(step: number, nodePath: NodePath | null): ErrorEvent {
	return {
		event: 'error',
		name: 'TypeError',
		message: 'null is not a function',
		step,
		...attributionOf(nodePath),
		node: null,
		prev: null,
		next: null,
	};
}

function errorArmOf(
	result: InterceptResult,
): Extract<InterceptResult, { outcome: 'error' }> {
	if (result.outcome !== 'error') {
		throw new Error(`expected the error arm, got ${result.outcome}`);
	}
	return result;
}

function limitArmOf(
	result: InterceptResult,
): Extract<InterceptResult, { outcome: 'iteration-limit' }> {
	if (result.outcome !== 'iteration-limit') {
		throw new Error(`expected the iteration-limit arm, got ${result.outcome}`);
	}
	return result;
}

function failArmOf(
	result: InterceptResult,
): Extract<InterceptResult, { outcome: 'fail' }> {
	if (result.outcome !== 'fail') {
		throw new Error(`expected the fail arm, got ${result.outcome}`);
	}
	return result;
}

describe('mapSettlement', () => {
	describe('a consumer-ended run', () => {
		it('a cancelled outcome maps to the cancel arm carrying the whole archive', () => {
			const entwined = entwinedOf('let x = 1;\n');
			expect(
				mapSettlement(
					settlementOf({ outcome: 'cancelled' }),
					null,
					[],
					'let x = 1;\n',
					{ seconds: 3 },
					entwined,
				),
			).toStrictEqual({
				outcome: 'cancel',
				ok: true,
				events: [],
				code: 'let x = 1;\n',
				options: { seconds: 3 },
				entwined,
				visitCounts: {},
				eventsByNode: {},
			});
		});

		it('a cancelled outcome outranks a set io flag', () => {
			const mapped = mapSettlement(
				settlementOf({ outcome: 'cancelled' }),
				flagOf(),
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);

			expect(mapped).toHaveProperty('outcome', 'cancel');
		});

		it('a cancelled outcome discards a riding halt — no count reaches the arm', () => {
			const entwined = entwinedOf('let x = 1;\n');
			expect(
				mapSettlement(
					settlementOf({ outcome: 'cancelled', halt: naturalHaltOf(7) }),
					null,
					[],
					'let x = 1;\n',
					{ seconds: 3 },
					entwined,
				),
			).toStrictEqual({
				outcome: 'cancel',
				ok: true,
				events: [],
				code: 'let x = 1;\n',
				options: { seconds: 3 },
				entwined,
				visitCounts: {},
				eventsByNode: {},
			});
		});

		it('the structural drain-cancel carries the events delivered before the unanswered ask', () => {
			const entwined = entwinedOf('console.log("hello");\n');
			const record = consoleEventOf(1, '$.body.0.expression');
			expect(
				mapSettlement(
					settlementOf({ outcome: 'cancelled' }),
					null,
					[record],
					'console.log("hello");\n',
					{ seconds: 3 },
					entwined,
				),
			).toStrictEqual({
				outcome: 'cancel',
				ok: true,
				events: [record],
				code: 'console.log("hello");\n',
				options: { seconds: 3 },
				entwined,
				visitCounts: { '$.body.0.expression': 1 },
				eventsByNode: { '$.body.0.expression': [record] },
			});
		});

		it('a failed outcome maps to the fail arm carrying the consumer reason', () => {
			const entwined = entwinedOf('let x = 1;\n');
			expect(
				mapSettlement(
					settlementOf({ outcome: 'failed', failReason: 'the lens is done' }),
					null,
					[],
					'let x = 1;\n',
					{ seconds: 3 },
					entwined,
				),
			).toStrictEqual({
				outcome: 'fail',
				ok: true,
				reason: 'the lens is done',
				events: [],
				code: 'let x = 1;\n',
				options: { seconds: 3 },
				entwined,
				visitCounts: {},
				eventsByNode: {},
			});
		});

		it('the fail arm carries the reason by reference', () => {
			const reason = { why: 'the lens is done' };
			const mapped = mapSettlement(
				settlementOf({ outcome: 'failed', failReason: reason }),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);

			expect(failArmOf(mapped).reason).toBe(reason);
		});

		it('a failed outcome with no recorded reason carries reason undefined, the key present', () => {
			const entwined = entwinedOf('let x = 1;\n');
			expect(
				mapSettlement(
					settlementOf({ outcome: 'failed' }),
					null,
					[],
					'let x = 1;\n',
					{ seconds: 3 },
					entwined,
				),
			).toStrictEqual({
				outcome: 'fail',
				ok: true,
				reason: undefined,
				events: [],
				code: 'let x = 1;\n',
				options: { seconds: 3 },
				entwined,
				visitCounts: {},
				eventsByNode: {},
			});
		});

		it('a failed outcome outranks a set io flag', () => {
			const mapped = mapSettlement(
				settlementOf({ outcome: 'failed', failReason: 'stop' }),
				flagOf(),
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);

			expect(mapped).toHaveProperty('outcome', 'fail');
		});

		it('a failed outcome discards a riding halt — no count reaches the arm', () => {
			const entwined = entwinedOf('let x = 1;\n');
			expect(
				mapSettlement(
					settlementOf({
						outcome: 'failed',
						failReason: 'stop',
						halt: naturalHaltOf(7),
					}),
					null,
					[],
					'let x = 1;\n',
					{ seconds: 3 },
					entwined,
				),
			).toStrictEqual({
				outcome: 'fail',
				ok: true,
				reason: 'stop',
				events: [],
				code: 'let x = 1;\n',
				options: { seconds: 3 },
				entwined,
				visitCounts: {},
				eventsByNode: {},
			});
		});
	});

	describe('a flagged run', () => {
		it('a flagged run settles the io arm, never the defect arm', () => {
			const entwined = entwinedOf('console.table([1]);\n');
			const settlement = settlementOf({
				outcome: 'errored',
				error: {
					cause: 'call-error',
					name: 'EngineCallError',
					message: 'the round-trip could not be serviced',
				},
			});

			expect(
				mapSettlement(
					settlement,
					flagOf(),
					[],
					'console.table([1]);\n',
					{ seconds: 3 },
					entwined,
				),
			).toStrictEqual({
				outcome: 'error',
				ok: false,
				error: flagOf(),
				events: [],
				code: 'console.table([1]);\n',
				options: { seconds: 3 },
				entwined,
				visitCounts: {},
				eventsByNode: {},
			});
		});

		it('the flag rides the error arm unchanged', () => {
			const flag = flagOf();
			const mapped = mapSettlement(
				settlementOf({ outcome: 'errored' }),
				flag,
				[],
				'console.table([1]);\n',
				{ seconds: 3 },
				entwinedOf('console.table([1]);\n'),
			);

			expect(errorArmOf(mapped).error).toBe(flag);
		});

		it('the io arm rides frozen', () => {
			const mapped = mapSettlement(
				settlementOf({ outcome: 'errored' }),
				flagOf(),
				[],
				'console.table([1]);\n',
				{ seconds: 3 },
				entwinedOf('console.table([1]);\n'),
			);

			expect(Object.isFrozen(errorArmOf(mapped).error)).toBe(true);
		});
	});

	describe('a completed run', () => {
		it('a completed settlement carrying its natural halt maps to complete with the run total', () => {
			const entwined = entwinedOf('let x = 1;\n');
			expect(
				mapSettlement(
					settlementOf({ halt: naturalHaltOf(12) }),
					null,
					[],
					'let x = 1;\n',
					{ seconds: 3 },
					entwined,
				),
			).toStrictEqual({
				outcome: 'complete',
				ok: true,
				iterationCount: 12,
				events: [],
				code: 'let x = 1;\n',
				options: { seconds: 3 },
				entwined,
				visitCounts: {},
				eventsByNode: {},
			});
		});

		it('a zero run total rides the complete arm as zero, never dropped', () => {
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);

			expect(mapped).toHaveProperty('iterationCount', 0);
		});

		it('an errored outcome carrying a well-formed natural halt maps to unreachable-outcome, not complete', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ outcome: 'errored', halt: naturalHaltOf() }),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});
	});

	describe('a halt recording the program its own throw', () => {
		it('maps to the error arm with the javascript kind, the attributed call site riding', () => {
			const entwined = entwinedOf('null();\n');
			const settlement = settlementOf({
				outcome: 'errored',
				halt: throwHaltOf({
					errorName: 'TypeError',
					message: 'null is not a function',
					loc: { start: { line: 3, column: 4 }, end: { line: 3, column: 20 } },
					iterationCount: 4,
				}),
			});

			expect(
				mapSettlement(
					settlement,
					null,
					[],
					'null();\n',
					{ seconds: 3 },
					entwined,
				),
			).toStrictEqual({
				outcome: 'error',
				ok: false,
				error: {
					kind: 'javascript',
					name: 'TypeError',
					message: 'null is not a function',
					loc: { start: { line: 3, column: 4 }, end: { line: 3, column: 20 } },
					phase: 'evaluation',
					iterationCount: 4,
				},
				events: [],
				code: 'null();\n',
				options: { seconds: 3 },
				entwined,
				visitCounts: {},
				eventsByNode: {},
			});
		});

		it('the javascript arm carries the halt creation phase', () => {
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: throwHaltOf({ phase: 'creation' }),
				}),
				null,
				[],
				'null();\n',
				{ seconds: 3 },
				entwinedOf('null();\n'),
			);

			expect(mapped).toHaveProperty('error.phase', 'creation');
		});

		it('a throw that escaped no wrap carries loc null on the arm', () => {
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: throwHaltOf({ errorName: 'TypeError', message: 'boom' }),
				}),
				null,
				[],
				'null();\n',
				{ seconds: 3 },
				entwinedOf('null();\n'),
			);

			expect(mapped).toHaveProperty('error.loc', null);
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
				[],
				'while (true) {}\n',
				{ seconds: 3 },
				entwinedOf('while (true) {}\n'),
			);

			expect(mapped).toHaveProperty('error.kind', 'javascript');
		});

		it('freezes the threw arm through the attributed span', () => {
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: throwHaltOf({
						loc: {
							start: { line: 3, column: 4 },
							end: { line: 3, column: 20 },
						},
					}),
				}),
				null,
				[],
				'null();\n',
				{ seconds: 3 },
				entwinedOf('null();\n'),
			);

			expect(
				Object.isFrozen(
					(mapped as { error: { loc: { start: object } } }).error.loc.start,
				),
			).toBe(true);
		});
	});

	describe("a halt recording the guard's trip", () => {
		it('maps to the iteration-limit arm carrying the trip record whole and NO separate span', () => {
			const entwined = entwinedOf('while (true) {}\n');
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

			expect(
				mapSettlement(
					settlement,
					null,
					[],
					'while (true) {}\n',
					{ seconds: 3 },
					entwined,
				),
			).toStrictEqual({
				outcome: 'iteration-limit',
				ok: false,
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
				events: [],
				code: 'while (true) {}\n',
				options: { seconds: 3 },
				entwined,
				visitCounts: {},
				eventsByNode: {},
			});
		});

		it('a trip AND an attributed call site coexisting resolve through the trip, no span beside it', () => {
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: throwHaltOf({
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
				}),
				null,
				[],
				'while (true) {}\n',
				{ seconds: 3 },
				entwinedOf('while (true) {}\n'),
			);

			expect(limitArmOf(mapped).error).toStrictEqual({
				kind: 'iteration-limit',
				name: 'RangeError',
				message: 'Loop 1 exceeded 0 iterations.',
				iterationCount: 1,
				trip: {
					loopIndex: 1,
					loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 27 } },
				},
			});
		});

		it('a well-formed trip riding a NATURAL halt is the defensive arm, not iteration-limit', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: {
						...naturalHaltOf(),
						trip: {
							loopIndex: 1,
							loc: {
								start: { line: 1, column: 0 },
								end: { line: 1, column: 5 },
							},
						},
					},
				}),
				null,
				[],
				'while (true) {}\n',
				{ seconds: 3 },
				entwinedOf('while (true) {}\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a completed settlement whose natural halt carries a trip is the defensive arm, not complete', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					halt: {
						...naturalHaltOf(),
						trip: {
							loopIndex: 1,
							loc: {
								start: { line: 1, column: 0 },
								end: { line: 1, column: 5 },
							},
						},
					},
				}),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('freezes the result through the trip span', () => {
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: throwHaltOf({
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
				}),
				null,
				[],
				'while (true) {}\n',
				{ seconds: 3 },
				entwinedOf('while (true) {}\n'),
			);

			expect(Object.isFrozen(limitArmOf(mapped).error.trip.loc.start)).toBe(
				true,
			);
		});
	});

	describe('an engine-made stop', () => {
		it('a timeout cause maps to the timeout arm carrying limit and durationMs', () => {
			const entwined = entwinedOf('while (true) {}\n');
			const error: EngineError = {
				cause: 'timeout',
				name: 'EngineTimeoutError',
				message: 'exceeded its budget',
			};

			expect(
				mapSettlement(
					settlementOf({ outcome: 'timed-out', durationMs: 250, error }),
					null,
					[],
					'while (true) {}\n',
					{ seconds: 2 },
					entwined,
				),
			).toStrictEqual({
				outcome: 'timeout',
				ok: false,
				error: {
					kind: 'timeout',
					name: 'EngineTimeoutError',
					message: 'exceeded its budget',
					limit: 2,
					durationMs: 250,
				},
				events: [],
				code: 'while (true) {}\n',
				options: { seconds: 2 },
				entwined,
				visitCounts: {},
				eventsByNode: {},
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
				[],
				'while (true) {}\n',
				{ seconds: 2 },
				entwinedOf('while (true) {}\n'),
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
				const entwined = entwinedOf('let x = 1;\n');
				const error: EngineError = {
					cause: cause as EngineError['cause'],
					name,
					message,
				};

				expect(
					mapSettlement(
						settlementOf({ outcome: 'errored', error }),
						null,
						[],
						'let x = 1;\n',
						{ seconds: 3 },
						entwined,
					),
				).toStrictEqual({
					outcome: 'error',
					ok: false,
					error: { kind: 'defect', name, message, cause },
					events: [],
					code: 'let x = 1;\n',
					options: { seconds: 3 },
					entwined,
					visitCounts: {},
					eventsByNode: {},
				});
			},
		);
	});

	describe('precedence over the carried data', () => {
		it('an errored settlement whose engine cause is timeout maps to the timeout arm, not the defect arm', () => {
			const error: EngineError = {
				cause: 'timeout',
				name: 'BudgetError',
				message: 'the budget elapsed before the run settled',
			};
			const mapped = mapSettlement(
				settlementOf({ outcome: 'errored', durationMs: 7, error }),
				null,
				[],
				'while (true) {}\n',
				{ seconds: 4 },
				entwinedOf('while (true) {}\n'),
			);

			expect(mapped).toHaveProperty('outcome', 'timeout');
		});

		it('a set io flag wins over a coexisting throw halt', () => {
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: throwHaltOf({
						errorName: 'ReferenceError',
						message: 'x is not defined',
					}),
				}),
				flagOf(),
				[],
				'x;\n',
				{ seconds: 3 },
				entwinedOf('x;\n'),
			);

			expect(mapped).toHaveProperty('error.kind', 'io');
		});

		it('a set io flag wins over a completed run carrying its natural halt', () => {
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf(5) }),
				flagOf(),
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);

			expect(mapped).toHaveProperty('error.kind', 'io');
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
				[],
				'while (true) {}\n',
				{ seconds: 2 },
				entwinedOf('while (true) {}\n'),
			);

			expect(mapped).toHaveProperty('error.kind', 'io');
		});

		it('a trip-bearing halt wins over a coexisting engine error', () => {
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: throwHaltOf({
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
				}),
				null,
				[],
				'while (true) {}\n',
				{ seconds: 3 },
				entwinedOf('while (true) {}\n'),
			);

			expect(mapped).toHaveProperty('outcome', 'iteration-limit');
		});

		it('a halt recording a throw wins over a coexisting engine error', () => {
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: throwHaltOf({ iterationCount: 2 }),
					error: {
						cause: 'hook-error',
						name: 'EngineHookError',
						message: 'refineError threw',
					},
				}),
				null,
				[],
				'null();\n',
				{ seconds: 3 },
				entwinedOf('null();\n'),
			);

			expect(mapped).toHaveProperty('error.kind', 'javascript');
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
				[],
				'while (true) {}\n',
				{ seconds: 2 },
				entwinedOf('while (true) {}\n'),
			);

			expect(mapped).toHaveProperty('error.kind', 'timeout');
		});
	});

	describe('combinations intercept cannot produce', () => {
		it('a completed settlement missing its halt maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ outcome: 'completed' }),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a malformed halt payload maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ outcome: 'errored', halt: { natural: 'yes' } }),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
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
				[],
				'while (true) {}\n',
				{ seconds: 3 },
				entwinedOf('while (true) {}\n'),
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
				[],
				'while (true) {}\n',
				{ seconds: 3 },
				entwinedOf('while (true) {}\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a halt whose loc is not span-shaped maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: { ...throwHaltOf(), loc: 'garbage' },
				}),
				null,
				[],
				'null();\n',
				{ seconds: 3 },
				entwinedOf('null();\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a halt whose loc is missing a position maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: { ...throwHaltOf(), loc: { start: { line: 1, column: 0 } } },
				}),
				null,
				[],
				'null();\n',
				{ seconds: 3 },
				entwinedOf('null();\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a halt whose loc has empty position objects maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: { ...throwHaltOf(), loc: { start: {}, end: {} } },
				}),
				null,
				[],
				'null();\n',
				{ seconds: 3 },
				entwinedOf('null();\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a halt whose loc has a non-finite position maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: {
						...throwHaltOf(),
						loc: {
							start: { line: 1, column: 0 },
							end: { line: Number.NaN, column: 20 },
						},
					},
				}),
				null,
				[],
				'null();\n',
				{ seconds: 3 },
				entwinedOf('null();\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a natural halt violating the pinned empty members maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ halt: { ...naturalHaltOf(), errorName: 'bogus' } }),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a natural halt carrying a message violates the pins and maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ halt: { ...naturalHaltOf(), message: 'bogus' } }),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a natural halt carrying a phase violates the pins and maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ halt: { ...naturalHaltOf(), phase: 'evaluation' } }),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a throw halt whose errorName is not a string maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: { ...throwHaltOf(), errorName: 7 },
				}),
				null,
				[],
				'null();\n',
				{ seconds: 3 },
				entwinedOf('null();\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a throw halt whose message is not a string maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					outcome: 'errored',
					halt: { ...throwHaltOf(), message: null },
				}),
				null,
				[],
				'null();\n',
				{ seconds: 3 },
				entwinedOf('null();\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('a natural halt carrying an attributed call site maps to unreachable-outcome', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({
					halt: {
						...naturalHaltOf(),
						loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 5 } },
					},
				}),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
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
				[],
				'null();\n',
				{ seconds: 3 },
				entwinedOf('null();\n'),
			);
			warn.mockRestore();

			expect(mapped).toHaveProperty('error.cause', 'unreachable-outcome');
		});

		it('the defensive arm carries well-formed machine words, never undefined', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const mapped = mapSettlement(
				settlementOf({ outcome: 'errored' }),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);
			warn.mockRestore();

			expect(errorArmOf(mapped).error.message.length).toBeGreaterThan(0);
		});

		it('the defensive arm warns loudly', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			mapSettlement(
				settlementOf({ outcome: 'errored' }),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
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
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);
			const warned = warn.mock.calls.length;
			warn.mockRestore();

			expect(warned).toBe(0);
		});
	});

	describe('the joins over the delivered events', () => {
		it('two console records at one node count twice, keyed by the enriched nodePath', () => {
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[
					consoleEventOf(1, '$.body.0.expression'),
					consoleEventOf(2, '$.body.1.expression'),
					consoleEventOf(3, '$.body.0.expression'),
				],
				'console.log("hello");\nconsole.log("hello");\n',
				{ seconds: 3 },
				entwinedOf('console.log("hello");\nconsole.log("hello");\n'),
			);

			expect(mapped.visitCounts).toStrictEqual({
				'$.body.0.expression': 2,
				'$.body.1.expression': 1,
			});
		});

		it('a dialog counts at its record, never its ask — the number is mock-independent', () => {
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[
					pendingAskOf(1, '$.body.0.expression'),
					promptRecordOf(2, '$.body.0.expression'),
				],
				'prompt("your name?");\n',
				{ seconds: 3 },
				entwinedOf('prompt("your name?");\n'),
			);

			expect(mapped.visitCounts).toStrictEqual({ '$.body.0.expression': 1 });
		});

		it('an in-stream error event mints no visit count', () => {
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[errorEventOf(1, '$.body.0.expression')],
				'null();\n',
				{ seconds: 3 },
				entwinedOf('null();\n'),
			);

			expect(mapped.visitCounts).toStrictEqual({});
		});

		it('eventsByNode joins every event — the ask included', () => {
			const ask = pendingAskOf(1, '$.body.0.expression');
			const record = promptRecordOf(2, '$.body.0.expression');
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[ask, record],
				'prompt("your name?");\n',
				{ seconds: 3 },
				entwinedOf('prompt("your name?");\n'),
			);

			expect(mapped.eventsByNode).toStrictEqual({
				'$.body.0.expression': [ask, record],
			});
		});

		it('eventsByNode joins the in-stream error event at its attributed node', () => {
			const errorEvent = errorEventOf(1, '$.body.0.expression');
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[errorEvent],
				'null();\n',
				{ seconds: 3 },
				entwinedOf('null();\n'),
			);

			expect(mapped.eventsByNode).toStrictEqual({
				'$.body.0.expression': [errorEvent],
			});
		});

		it('a null-attribution event mints no visit count', () => {
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[consoleEventOf(1, null)],
				'console.log("hello");\n',
				{ seconds: 3 },
				entwinedOf('console.log("hello");\n'),
			);

			expect(mapped.visitCounts).toStrictEqual({});
		});

		it('a null-attribution event joins no node', () => {
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[consoleEventOf(1, null)],
				'console.log("hello");\n',
				{ seconds: 3 },
				entwinedOf('console.log("hello");\n'),
			);

			expect(mapped.eventsByNode).toStrictEqual({});
		});

		it('the excluded event still rides the archive with its null loc', () => {
			const record = consoleEventOf(1, null);
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[record],
				'console.log("hello");\n',
				{ seconds: 3 },
				entwinedOf('console.log("hello");\n'),
			);

			expect(mapped.events[0]).toBe(record);
		});
	});

	describe('the result record', () => {
		it('freezes the result it returns', () => {
			expect(
				Object.isFrozen(
					mapSettlement(
						settlementOf({ outcome: 'cancelled' }),
						null,
						[],
						'let x = 1;\n',
						{ seconds: 3 },
						entwinedOf('let x = 1;\n'),
					),
				),
			).toBe(true);
		});

		it('freezes the assembled visitCounts', () => {
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[consoleEventOf(1, '$.body.0.expression')],
				'console.log("hello");\n',
				{ seconds: 3 },
				entwinedOf('console.log("hello");\n'),
			);

			expect(Object.isFrozen(mapped.visitCounts)).toBe(true);
		});

		it('freezes an assembled join list', () => {
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[consoleEventOf(1, '$.body.0.expression')],
				'console.log("hello");\n',
				{ seconds: 3 },
				entwinedOf('console.log("hello");\n'),
			);

			expect(Object.isFrozen(mapped.eventsByNode['$.body.0.expression'])).toBe(
				true,
			);
		});

		it('carries the given events by reference', () => {
			const events = [consoleEventOf(1, '$.body.0.expression')];
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				events,
				'console.log("hello");\n',
				{ seconds: 3 },
				entwinedOf('console.log("hello");\n'),
			);

			expect(mapped.events).toBe(events);
		});

		it('carries the given entwined by reference', () => {
			const entwined = entwinedOf('let x = 1;\n');
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwined,
			);

			expect(mapped.entwined).toBe(entwined);
		});

		it('carries the given options by reference', () => {
			const options = Object.freeze({ seconds: 3 });
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[],
				'let x = 1;\n',
				options,
				entwinedOf('let x = 1;\n'),
			);

			expect(mapped.options).toBe(options);
		});

		it('echoes the given code', () => {
			const mapped = mapSettlement(
				settlementOf({ halt: naturalHaltOf() }),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);

			expect(mapped.code).toBe('let x = 1;\n');
		});

		it('the fail arm rides frozen through the carried reason', () => {
			const reason = { why: 'the lens is done' };
			mapSettlement(
				settlementOf({ outcome: 'failed', failReason: reason }),
				null,
				[],
				'let x = 1;\n',
				{ seconds: 3 },
				entwinedOf('let x = 1;\n'),
			);

			expect(Object.isFrozen(reason)).toBe(true);
		});
	});

	describe('the engine contract', () => {
		it('every engine machinery cause lands in InterceptDefectCause', () => {
			const probe: InterceptDefectCause = 'worker-error' as Exclude<
				EngineError['cause'],
				'timeout'
			>;

			expect(probe).toBe('worker-error');
		});
	});
});
