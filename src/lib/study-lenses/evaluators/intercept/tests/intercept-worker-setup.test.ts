/**
 * @file I2's ZOMBIES cluster: the injected surface, the emit-only console
 * trap, the ask-then-record dialog traps, the loc-wrap helper's stamping
 * discipline, the halt author, and the cap edges read through the worker
 * config.
 *
 * Driven against a stub of the engine's worker api that records every
 * emit and scripts every call answer — built inside the helpers, since no
 * row has anything to say about the stub itself (run's R1 precedent). The
 * ordering rows use one shared operations log so call-before-emit is a
 * single observable sequence.
 *
 * One deliberate exception, acknowledged: `tripOf` holds a try/catch
 * outside every test body — the R-1 ratified deviation (the sibling
 * `run-worker-setup.test.ts` documents the same): a real marked throw must
 * be HELD to be handed to the halt author, which no `toThrow` matcher can
 * do. The same shape captures a wrap-stamped throw for the loc rows.
 *
 * Triangulation, stated honestly: the single-record rows alone are
 * passable by hardcoded emission; the step-sequence rows (three records →
 * steps 1, 2, 3) and the value-varied dialog answers kill it, and the
 * run-total row forces the injected helpers and the halt author into one
 * shared closure (run's R1 triangulator, inherited).
 */

import { describe, expect, it } from 'vitest';

import type {
	HaltKind,
	WorkerApi,
	WorkerSetup,
} from '../../../lib/engine/types.js';
import interceptWorkerSetup from '../intercept-worker-setup.js';
import type {
	InterceptAnswer,
	InterceptAskMessage,
	InterceptHalt,
	InterceptRecordMessage,
} from '../types.js';

type GuardCall = (loopIndex: number, locString: string) => void;
type ResetCall = (loopIndex: number) => void;
type LocWrap = <T>(encodedLoc: string, call: () => T) => T;
type ConsoleTrap = Record<string, (...callArguments: unknown[]) => unknown>;
type DialogTrap = (...callArguments: unknown[]) => unknown;
type AuthorHalt = (kind: HaltKind, rawError?: unknown) => InterceptHalt;

type Setup = {
	guardCall: GuardCall;
	resetCall: ResetCall;
	locWrap: LocWrap;
	consoleTrap: ConsoleTrap;
	alertTrap: DialogTrap;
	confirmTrap: DialogTrap;
	promptTrap: DialogTrap;
	authorHalt: AuthorHalt;
	emitted: InterceptRecordMessage[];
	asked: InterceptAskMessage[];
	operations: string[];
};

function setupWith(
	answers: InterceptAnswer[] = [],
	workerConfig?: unknown,
): Setup {
	const emitted: InterceptRecordMessage[] = [];
	const asked: InterceptAskMessage[] = [];
	const operations: string[] = [];
	const pending = [...answers];
	const api: WorkerApi = {
		emit(message) {
			operations.push('emit');
			emitted.push(message as InterceptRecordMessage);
		},
		call(request) {
			operations.push('call');
			asked.push(request as InterceptAskMessage);
			return pending.shift();
		},
	};
	const { globals, serializeHalt } = interceptWorkerSetup(api, workerConfig);
	if (serializeHalt === undefined) {
		throw new Error('intercept must register a halt author');
	}
	return {
		guardCall: globals['__$il'] as GuardCall,
		resetCall: globals['__$ir'] as ResetCall,
		locWrap: globals['__$lc'] as LocWrap,
		consoleTrap: globals['console'] as ConsoleTrap,
		alertTrap: globals['alert'] as DialogTrap,
		confirmTrap: globals['confirm'] as DialogTrap,
		promptTrap: globals['prompt'] as DialogTrap,
		authorHalt: serializeHalt as AuthorHalt,
		emitted,
		asked,
		operations,
	};
}

function tripOf(setup: Setup): InterceptHalt {
	try {
		setup.guardCall(2, '3:4:5:6');
	} catch (error) {
		return setup.authorHalt('throw', error);
	}
	throw new Error('the guard did not trip');
}

function stampedThrowOf(
	setup: Setup,
	encodedLoc: string,
	body: () => void,
): unknown {
	try {
		setup.locWrap(encodedLoc, body);
	} catch (error) {
		return error;
	}
	throw new Error('the wrapped call did not throw');
}

describe('interceptWorkerSetup', () => {
	describe('the injected surface', () => {
		it('injects the guard helpers, the loc wrap, the console, and the three dialogs', () => {
			const { globals } = interceptWorkerSetup(quietApi(), {});

			expect(
				Object.keys(globals).toSorted((a, b) => a.localeCompare(b)),
			).toEqual([
				'__$il',
				'__$ir',
				'__$lc',
				'alert',
				'confirm',
				'console',
				'prompt',
			]);
		});

		it('registers a halt author', () => {
			expect(typeof setupWith().authorHalt).toBe('function');
		});

		it('freezes the result it returns', () => {
			expect(Object.isFrozen(interceptWorkerSetup(quietApi(), {}))).toBe(true);
		});

		it('freezes the globals record it returns', () => {
			expect(
				Object.isFrozen(interceptWorkerSetup(quietApi(), {}).globals),
			).toBe(true);
		});

		it('leaves the console trap itself mutable — reassignment is the platform contract', () => {
			expect(
				Object.isFrozen(
					interceptWorkerSetup(quietApi(), {}).globals['console'],
				),
			).toBe(false);
		});

		it("covers exactly the methods the worker's own console has", () => {
			// PINNED(committed README § Edge cases: a name that is not a console method at all fails as it would on the platform, rather than being invented into a record)
			expect(setupWith().consoleTrap['notAThing']).toBeUndefined();
		});
	});

	describe('the loc wrap', () => {
		it('returns its call result untouched', () => {
			expect(setupWith().locWrap('1:1:1:9', () => 42)).toBe(42);
		});

		it('a record after a wrap exits normally carries loc null again', () => {
			// PINNED(committed types.ts Seam 5: the wrap restores the stack on the way out — a missing restore silently mis-attributes every later moment)
			const setup = setupWith();
			setup.locWrap('3:4:3:20', () => setup.consoleTrap['log']?.('in'));
			setup.consoleTrap['log']?.('out');

			expect(setup.emitted[1]?.loc).toBeNull();
		});

		it('two sequential wraps each carry their own span', () => {
			const setup = setupWith();
			setup.locWrap('1:0:1:14', () => setup.consoleTrap['log']?.('a'));
			setup.locWrap('2:0:2:14', () => setup.consoleTrap['log']?.('b'));

			expect(setup.emitted.map((record) => record.loc?.start.line)).toEqual([
				1, 2,
			]);
		});
	});

	describe('the console trap — emit-only', () => {
		it('a trap built but never called emits nothing', () => {
			expect(setupWith().emitted).toHaveLength(0);
		});

		it('one call emits one complete record', () => {
			const setup = setupWith();
			setup.consoleTrap['log']?.('hi');

			expect(setup.emitted).toStrictEqual([
				{ kind: 'console', method: 'log', args: ['hi'], step: 1, loc: null },
			]);
		});

		it('returns undefined to the program, exactly as the platform does', () => {
			// PINNED(C4 ratified: console is EMIT-ONLY — no round-trip happens and nothing returns)
			expect(setupWith().consoleTrap['log']?.('hi')).toBeUndefined();
		});

		it('makes no call round-trip', () => {
			const setup = setupWith();
			setup.consoleTrap['log']?.('hi');

			expect(setup.asked).toHaveLength(0);
		});

		it('three calls number their events 1, 2, 3', () => {
			const setup = setupWith();
			setup.consoleTrap['log']?.('a');
			setup.consoleTrap['warn']?.('b');
			setup.consoleTrap['log']?.('c');

			expect(setup.emitted.map((record) => record.step)).toEqual([1, 2, 3]);
		});

		it('reports the called method faithfully', () => {
			const setup = setupWith();
			setup.consoleTrap['warn']?.('careful');

			expect(setup.emitted[0]).toHaveProperty('method', 'warn');
		});

		it('an argument that cannot cross the boundary rides as its string form', () => {
			const setup = setupWith();
			setup.consoleTrap['log']?.(function boom() {});

			expect(setup.emitted[0]?.args[0]).toContain('boom');
		});

		it('a symbol argument rides as its string form', () => {
			const setup = setupWith();
			setup.consoleTrap['log']?.(Symbol('tag'));

			expect(setup.emitted[0]?.args[0]).toBe('Symbol(tag)');
		});

		it('a clone-safe argument rides as itself', () => {
			const setup = setupWith();
			setup.consoleTrap['log']?.({ answer: 42 });

			expect(setup.emitted[0]?.args[0]).toStrictEqual({ answer: 42 });
		});

		it.each([['error'], ['info'], ['debug'], ['trace'], ['table']])(
			'calling %s emits that method name',
			(method) => {
				const setup = setupWith();
				setup.consoleTrap[method]?.('x');

				expect(setup.emitted[0]).toHaveProperty('method', method);
			},
		);

		it('a learner reassigning a trap silences its own further records', () => {
			// PINNED(committed README § Edge cases: the trap is an injected value, not a protected one — the collision guard covers accident, and this is not one)
			const setup = setupWith();
			setup.consoleTrap['log'] = () => {};
			setup.consoleTrap['log']?.('hi');

			expect(setup.emitted).toHaveLength(0);
		});

		it('a record inside a wrapped call carries the decoded call-site span', () => {
			const setup = setupWith();
			setup.locWrap('3:4:3:20', () => setup.consoleTrap['log']?.('hi'));

			expect(setup.emitted[0]?.loc).toStrictEqual({
				start: { line: 3, column: 4 },
				end: { line: 3, column: 20 },
			});
		});

		it('a record outside any wrap carries loc null', () => {
			const setup = setupWith();
			setup.consoleTrap['log']?.('hi');

			expect(setup.emitted[0]?.loc).toBeNull();
		});
	});

	describe('a dialog — ask first, record after', () => {
		it('the ask crosses before the record is emitted', () => {
			// PINNED(D3 ratified: call-then-emit — the record carries the answer precisely because the ask completed first)
			const setup = setupWith(['Ada']);
			setup.promptTrap('who?');

			expect(setup.operations).toEqual(['call', 'emit']);
		});

		it('the ask carries the request, its step, and its loc', () => {
			const setup = setupWith(['Ada']);
			setup.promptTrap('who?');

			expect(setup.asked).toStrictEqual([
				{ step: 1, loc: null, request: { kind: 'prompt', message: 'who?' } },
			]);
		});

		it('the record is the very next event after its ask — the steps differ by one', () => {
			// PINNED(ar-1 CP-1 ruling 2026-08-04: step is the EVENT ordinal and ADJACENCY is what pairs a dialog's two events)
			const setup = setupWith(['Ada']);
			setup.promptTrap('who?');

			expect(setup.emitted[0]?.step).toBe(2);
		});

		it("prompt's record carries the answered return value", () => {
			const setup = setupWith(['Ada']);
			setup.promptTrap('who?');

			expect(setup.emitted[0]).toHaveProperty('returnValue', 'Ada');
		});

		it('prompt returns the answer to the program', () => {
			expect(setupWith(['Ada']).promptTrap('who?')).toBe('Ada');
		});

		it('prompt answered null returns null, the platform cancel', () => {
			expect(setupWith([null]).promptTrap('who?')).toBeNull();
		});

		it('confirm returns its boolean answer', () => {
			expect(setupWith([false]).confirmTrap('sure?')).toBe(false);
		});

		it("alert's answer is ignored — the program receives undefined", () => {
			// PINNED(H-3 ruled 2026-08-04: these traps model the browser's own dialogs, and alert handing back undefined is part of what is modelled)
			expect(setupWith([true]).alertTrap('done')).toBeUndefined();
		});

		it("alert's record carries returnValue present and undefined", () => {
			// PINNED(H-3 ruled 2026-08-04: D2 honored literally — the alert record states the modelled value rather than omitting it)
			const setup = setupWith([true]);
			setup.alertTrap('done');

			expect(
				setup.emitted[0] !== undefined && 'returnValue' in setup.emitted[0],
			).toBe(true);
		});

		it("alert's recorded returnValue is undefined", () => {
			const setup = setupWith([true]);
			setup.alertTrap('done');

			expect(
				(setup.emitted[0] as { returnValue?: unknown }).returnValue,
			).toBeUndefined();
		});

		it('the record carries the RAW arguments beside the decoded request', () => {
			const setup = setupWith(['Ada']);
			setup.promptTrap('who?', 'stranger');

			expect(setup.emitted[0]?.args).toStrictEqual(['who?', 'stranger']);
		});

		it("confirm's record carries its answered boolean", () => {
			const setup = setupWith([false]);
			setup.confirmTrap('sure?');

			expect(setup.emitted[0]).toHaveProperty('returnValue', false);
		});

		it('a dialog inside a wrapped call stamps the ask with the decoded span', () => {
			const setup = setupWith(['Ada']);
			setup.locWrap('4:8:4:22', () => setup.promptTrap('who?'));

			expect(setup.asked[0]?.loc).toStrictEqual({
				start: { line: 4, column: 8 },
				end: { line: 4, column: 22 },
			});
		});

		it('a dialog inside a wrapped call stamps its record with the same span', () => {
			const setup = setupWith(['Ada']);
			setup.locWrap('4:8:4:22', () => setup.promptTrap('who?'));

			expect(setup.emitted[0]?.loc).toStrictEqual({
				start: { line: 4, column: 8 },
				end: { line: 4, column: 22 },
			});
		});

		it('a dialog inside a console argument is two boundary moments, strictly sequential', () => {
			// PINNED(committed README § Edge cases: the prompt suspends, is answered, emits its record, and only then does the console call happen and emit its own)
			const setup = setupWith(['Ada']);
			setup.consoleTrap['log']?.(setup.promptTrap('who?'));

			expect(setup.operations).toEqual(['call', 'emit', 'emit']);
		});

		it('step numbering is one shared sequence across dialog and console moments', () => {
			// PINNED(ar-3 I2 resolution 2026-08-05: step is ONE worker-side ordinal across every kind — per-kind counters would silently destroy the adjacency pairing)
			const setup = setupWith(['Ada']);
			setup.consoleTrap['log']?.(setup.promptTrap('who?'));

			expect(setup.emitted.map((record) => record.step)).toEqual([2, 3]);
		});
	});

	describe('decoding the request — the platform rules, per dialog', () => {
		it('alert() decodes an empty message', () => {
			// PINNED(B-5, Phase-1 briefing decisions 2026-08-05: alert is two overloads — no argument decodes '')
			const setup = setupWith([true]);
			setup.alertTrap();

			expect(setup.asked[0]?.request).toStrictEqual({
				kind: 'alert',
				message: '',
			});
		});

		it("alert(undefined) decodes the string 'undefined'", () => {
			// PINNED(B-5, Phase-1 briefing decisions 2026-08-05: one argument rides the DOMString overload — String(undefined))
			const setup = setupWith([true]);
			// eslint-disable-next-line unicorn/no-useless-undefined -- the explicit undefined argument IS the decoded case under test
			setup.alertTrap(undefined);

			expect(setup.asked[0]?.request).toStrictEqual({
				kind: 'alert',
				message: 'undefined',
			});
		});

		it('confirm(undefined) decodes an empty message', () => {
			// PINNED(B-5, Phase-1 briefing decisions 2026-08-05: confirm's message is optional-with-default — an explicit undefined counts as omitted)
			const setup = setupWith([true]);
			// eslint-disable-next-line unicorn/no-useless-undefined -- the explicit undefined argument IS the decoded case under test
			setup.confirmTrap(undefined);

			expect(setup.asked[0]?.request).toStrictEqual({
				kind: 'confirm',
				message: '',
			});
		});

		it('a non-string message decodes as the platform renders it', () => {
			const setup = setupWith([true]);
			setup.confirmTrap(42);

			expect(setup.asked[0]?.request).toStrictEqual({
				kind: 'confirm',
				message: '42',
			});
		});

		it('prompt with no default carries no defaultValue key', () => {
			const setup = setupWith(['x']);
			setup.promptTrap('q');

			expect(
				setup.asked[0] !== undefined &&
					'defaultValue' in setup.asked[0].request,
			).toBe(false);
		});

		it('prompt with an undefined default counts as passing none', () => {
			// PINNED(B-5, Phase-1 briefing decisions 2026-08-05: the browser's own prompt('x', undefined) shows an empty input — undefined for an optional parameter is omitted)
			const setup = setupWith(['x']);
			// eslint-disable-next-line unicorn/no-useless-undefined -- the explicit undefined argument IS the decoded case under test
			setup.promptTrap('q', undefined);

			expect(
				setup.asked[0] !== undefined &&
					'defaultValue' in setup.asked[0].request,
			).toBe(false);
		});

		it('prompt with a default carries it decoded', () => {
			const setup = setupWith(['x']);
			setup.promptTrap('q', 'a toad');

			expect(setup.asked[0]?.request).toHaveProperty('defaultValue', 'a toad');
		});
	});

	describe('the halt author', () => {
		it('a natural end reports itself natural with no machine words', () => {
			expect(setupWith().authorHalt('natural-end')).toStrictEqual({
				natural: true,
				errorName: '',
				message: '',
				trip: null,
				loc: null,
				iterationCount: 0,
			});
		});

		it('carries the real run total on every halt', () => {
			const setup = setupWith();
			setup.guardCall(1, '1:0:1:20');
			setup.guardCall(1, '1:0:1:20');
			setup.guardCall(1, '1:0:1:20');

			expect(setup.authorHalt('natural-end').iterationCount).toBe(3);
		});

		it('a thrown error carries the machine words', () => {
			const halt = setupWith().authorHalt('throw', new TypeError('boom'));

			expect([halt.errorName, halt.message]).toEqual(['TypeError', 'boom']);
		});

		it('a non-Error throw renders honestly', () => {
			const halt = setupWith().authorHalt('throw', 'oops');

			expect([halt.errorName, halt.message]).toEqual(['Error', 'oops']);
		});

		it('a thrown-error halt carries the run total', () => {
			const setup = setupWith();
			setup.guardCall(1, '1:0:1:20');
			setup.guardCall(1, '1:0:1:20');

			expect(setup.authorHalt('throw', new TypeError('x')).iterationCount).toBe(
				2,
			);
		});

		it('the trip halt counts the tripping iteration', () => {
			// PINNED(iteration-guard README § Edge cases: the guard increments before it compares, so the trip is counted)
			expect(
				tripOf(setupWith(undefined, { iterationLimit: 0 })).iterationCount,
			).toBe(1);
		});

		it('a throw that escaped no wrap carries loc null', () => {
			expect(
				setupWith().authorHalt('throw', new TypeError('x')).loc,
			).toBeNull();
		});

		it("the guard's marked throw carries the trip record whole", () => {
			// PINNED(inherited run R1 ruling: classification is structural — the guard's marker through its verb, never a name and never a message)
			expect(
				tripOf(setupWith(undefined, { iterationLimit: 0 })).trip,
			).toStrictEqual({
				loopIndex: 2,
				loc: { start: { line: 3, column: 4 }, end: { line: 5, column: 6 } },
			});
		});

		it('a learner RangeError carrying the guard message verbatim is no trip', () => {
			const forgery = new RangeError('Loop 2 exceeded 0 iterations.');

			// PINNED(inherited run R1 ruling: shape, never provenance — a message can be forged, the marker cannot be accidental)
			expect(setupWith().authorHalt('throw', forgery).trip).toBeNull();
		});

		it('a throw through a wrapped call carries the decoded call-site span', () => {
			// PINNED(committed README § Design commitments: a throw is attributed to the innermost call it escaped — the stamp is read off the error, decoded only at the halt)
			const setup = setupWith();
			const thrown = stampedThrowOf(setup, '9:9:9:12', () => {
				throw new TypeError('x');
			});

			expect(setup.authorHalt('throw', thrown).loc).toStrictEqual({
				start: { line: 9, column: 9 },
				end: { line: 9, column: 12 },
			});
		});

		it('nested wraps attribute the throw to the innermost — first write wins', () => {
			// PINNED(committed README § Design commitments: the first stamp wins and the first stamp is the innermost, the same first-write rule the guard's marker follows)
			const setup = setupWith();
			const thrown = stampedThrowOf(setup, '1:1:1:9', () =>
				setup.locWrap('2:2:2:8', () => {
					throw new TypeError('x');
				}),
			);

			expect(setup.authorHalt('throw', thrown).loc).toStrictEqual({
				start: { line: 2, column: 2 },
				end: { line: 2, column: 8 },
			});
		});

		it('a primitive throw through a wrap rides unstamped, loc null', () => {
			const setup = setupWith();
			const thrown = stampedThrowOf(setup, '9:9:9:12', () => {
				// eslint-disable-next-line @typescript-eslint/only-throw-error -- a primitive throw IS the case under test: it cannot carry a stamp
				throw 'oops';
			});

			expect(setup.authorHalt('throw', thrown).loc).toBeNull();
		});

		it('a guard trip escaping a wrapped call carries both the trip and its loc', () => {
			// PINNED(committed types.ts InterceptHalt: a guard throw propagating through a wrapped call legitimately has BOTH — the mapper's precedence runs through the trip, never through whether a span exists)
			const setup = setupWith(undefined, { iterationLimit: 0 });
			const thrown = stampedThrowOf(setup, '7:0:7:30', () =>
				setup.guardCall(2, '3:4:5:6'),
			);
			const halt = setup.authorHalt('throw', thrown);

			expect([halt.trip?.loopIndex, halt.loc?.start.line]).toEqual([2, 7]);
		});

		it('a malformed encoded span stamps nothing — loc null, never a guess', () => {
			const setup = setupWith();
			const thrown = stampedThrowOf(setup, 'garbage', () => {
				throw new TypeError('x');
			});

			expect(setup.authorHalt('throw', thrown).loc).toBeNull();
		});
	});

	describe('the iteration cap, read through the worker config', () => {
		it('a cap of 0 trips on the first guard call with the pinned message', () => {
			// PINNED(C1 ruled: no iteration-cap default exists — the cap rides through unchanged and 0 trips on the first pass)
			const setup = setupWith(undefined, { iterationLimit: 0 });

			expect(() => setup.guardCall(1, '1:0:1:20')).toThrow(
				'Loop 1 exceeded 0 iterations.',
			);
		});

		it('the injected reset restarts that entry', () => {
			const setup = setupWith(undefined, { iterationLimit: 1 });
			setup.guardCall(1, '1:0:1:20');
			setup.resetCall(1);

			expect(() => setup.guardCall(1, '1:0:1:20')).not.toThrow();
		});

		it.each([[Number.POSITIVE_INFINITY], [Number.NaN], ['nonsense']])(
			'an iterationLimit of %p never trips',
			(cap) => {
				const setup = setupWith(undefined, { iterationLimit: cap });
				setup.guardCall(1, '1:0:1:20');

				expect(() => setup.guardCall(1, '1:0:1:20')).not.toThrow();
			},
		);
	});

	describe('the engine contract', () => {
		it('is usable as the engine worker setup', () => {
			const probe: WorkerSetup = interceptWorkerSetup;

			expect(typeof probe).toBe('function');
		});
	});
});

function quietApi(): WorkerApi {
	return {
		emit() {},
		call() {
			return null;
		},
	};
}
