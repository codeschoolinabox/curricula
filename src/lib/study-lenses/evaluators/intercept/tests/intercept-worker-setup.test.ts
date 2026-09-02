/**
 * @file I3's transported cluster: the injected surface, the whole-surface
 * record-only console trap, the ask-then-record dialog traps, the
 * loc-wrap helper's stamping discipline, the halt author over the guarded
 * worker base, the worker-sent error record, and the cap edges read
 * through the worker config.
 *
 * The deprecated port's 63 rows transport content-level from
 * `evaluators-deprecated/intercept/tests/intercept-worker-setup.test.ts`
 * under HR-8/HR-11/HR-14 — `kind`/`returnValue` literals rewrite to the
 * reference spellings `event`/`return` — and are extended for what the
 * greenfield contract adds: the wrap's ONE six-field stamp
 * (`'L:C:L:C:S:E'`, I1's decode contract — span and offset legs
 * validated SEPARATELY), the offset pair on every record and ask, the
 * halt's `phase` per the guarded worker base's core union (E2
 * `a2ff78b0` + the base `ebb3f603`), the worker-sent in-stream error
 * record (human ruling 2026-08-26 — emitted at the throw site,
 * immediately before the stop record, step in the one shared ordinal
 * space; the trip and the natural end emit nothing), and the
 * whole-surface console trap (human ruling 2026-08-19 / HR-18 — an
 * exotic method records faithfully; the deprecated platform-mirror row
 * adapts, its supersede recorded in README § io).
 *
 * Driven against a stub of the engine's worker api that records every
 * emit and scripts every call answer — built inside the helpers, since
 * no row has anything to say about the stub itself (run's R1 precedent).
 * The ordering rows use one shared operations log so call-before-emit is
 * a single observable sequence. A few seam rows drive emitted records
 * through the LANDED `narrowRecordMessage` — both modules are this
 * increment's seam pair, and the rows pin that what the worker posts is
 * what the thread narrowing accepts.
 *
 * One deliberate exception, acknowledged: `tripOf` holds a try/catch
 * outside every test body — the R-1 ratified deviation (the sibling
 * `run-worker-setup.test.ts` documents the same): a real marked throw
 * must be HELD to be handed to the halt author, which no `toThrow`
 * matcher can do. The same shape captures a wrap-stamped throw for the
 * loc rows.
 *
 * Triangulation, stated honestly: the single-record rows alone are
 * passable by hardcoded emission; the step-sequence rows (three records
 * → steps 1, 2, 3) and the value-varied dialog answers kill it, the
 * run-total row forces the injected helpers and the halt author into one
 * shared closure, and the separate-leg rows (a corrupt offset pair with
 * a sound span) force the decode's two validations apart.
 */

import { describe, expect, it } from 'vitest';

import type {
	HaltKind,
	HaltPhase,
	WorkerApi,
	WorkerSetup,
} from '../../../lib/engine/types.js';
import interceptWorkerSetup from '../intercept-worker-setup.js';
import narrowRecordMessage from '../narrow-record-message.js';
import type {
	InterceptAskMessage,
	InterceptDialogAnswer,
	InterceptHalt,
	InterceptWireRecord,
	WireConsoleRecord,
	WirePromptRecord,
} from '../types.js';

type GuardCall = (loopIndex: number, locString: string) => void;
type ResetCall = (loopIndex: number) => void;
type LocWrap = <T>(encodedLoc: string, call: () => T) => T;
type ConsoleTrap = Record<string, (...callArguments: unknown[]) => unknown>;
type DialogTrap = (...callArguments: unknown[]) => unknown;
type AuthorHalt = (
	kind: HaltKind,
	rawError?: unknown,
	phase?: HaltPhase,
) => InterceptHalt;

type Setup = {
	guardCall: GuardCall;
	resetCall: ResetCall;
	locWrap: LocWrap;
	consoleTrap: ConsoleTrap;
	alertTrap: DialogTrap;
	confirmTrap: DialogTrap;
	promptTrap: DialogTrap;
	authorHalt: AuthorHalt;
	emitted: InterceptWireRecord[];
	asked: InterceptAskMessage[];
	operations: string[];
};

function setupWith(
	answers: InterceptDialogAnswer[] = [],
	workerConfig?: unknown,
): Setup {
	const emitted: InterceptWireRecord[] = [];
	const asked: InterceptAskMessage[] = [];
	const operations: string[] = [];
	const pending = [...answers];
	const api: WorkerApi = {
		emit(message) {
			operations.push('emit');
			emitted.push(message as InterceptWireRecord);
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
		return setup.authorHalt('throw', error, 'evaluation');
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

function residualErrorOf(stack: string): TypeError {
	const error = new TypeError('boom');
	error.stack = stack;
	return error;
}

function tripErrorWithStack(setup: Setup, stack: string): unknown {
	try {
		setup.guardCall(2, '3:4:5:6');
	} catch (error) {
		(error as { stack?: string }).stack = stack;
		return error;
	}
	throw new Error('the guard did not trip');
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

		it('the whole console surface is trapped — an exotic method is a function too', () => {
			expect(typeof setupWith().consoleTrap['profile']).toBe('function');
		});
	});

	describe('the loc wrap', () => {
		it('returns its call result untouched', () => {
			expect(setupWith().locWrap('1:1:1:9:1:9', () => 42)).toBe(42);
		});

		it('a record after a wrap exits normally carries loc null again', () => {
			const setup = setupWith();
			setup.locWrap('3:4:3:20:30:46', () => setup.consoleTrap['log']?.('in'));
			setup.consoleTrap['log']?.('out');

			expect(setup.emitted[1]?.loc).toBeNull();
		});

		it('two sequential wraps each carry their own span', () => {
			const setup = setupWith();
			setup.locWrap('1:0:1:14:0:14', () => setup.consoleTrap['log']?.('a'));
			setup.locWrap('2:0:2:14:15:29', () => setup.consoleTrap['log']?.('b'));

			expect(setup.emitted.map((record) => record.loc?.start.line)).toEqual([
				1, 2,
			]);
		});
	});

	describe('the console trap — record-only, whole surface', () => {
		it('a trap built but never called emits nothing', () => {
			expect(setupWith().emitted).toHaveLength(0);
		});

		it('one call emits one complete record', () => {
			const setup = setupWith();
			setup.consoleTrap['log']?.('hi');

			expect(setup.emitted).toStrictEqual([
				{
					event: 'console',
					method: 'log',
					args: ['hi'],
					step: 1,
					loc: null,
					start: null,
					end: null,
				},
			]);
		});

		it('returns undefined to the program, exactly as the platform does', () => {
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

		it('an exotic method call records faithfully with its own name', () => {
			const setup = setupWith();
			setup.consoleTrap['profile']?.('section');

			expect(setup.emitted[0]).toHaveProperty('method', 'profile');
		});

		it('an argument that cannot cross the boundary rides as its string form', () => {
			const setup = setupWith();
			setup.consoleTrap['log']?.(function boom() {});

			expect((setup.emitted[0] as WireConsoleRecord).args[0]).toContain('boom');
		});

		it('a symbol argument rides as its string form', () => {
			const setup = setupWith();
			setup.consoleTrap['log']?.(Symbol('tag'));

			expect((setup.emitted[0] as WireConsoleRecord).args[0]).toBe(
				'Symbol(tag)',
			);
		});

		it('a clone-safe argument rides as itself', () => {
			const setup = setupWith();
			setup.consoleTrap['log']?.({ answer: 42 });

			expect((setup.emitted[0] as WireConsoleRecord).args[0]).toStrictEqual({
				answer: 42,
			});
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
			const setup = setupWith();
			setup.consoleTrap['log'] = () => {};
			setup.consoleTrap['log']?.('hi');

			expect(setup.emitted).toHaveLength(0);
		});

		it('a record inside a wrapped call carries the decoded call-site span', () => {
			const setup = setupWith();
			setup.locWrap('3:4:3:20:30:46', () => setup.consoleTrap['log']?.('hi'));

			expect(setup.emitted[0]?.loc).toStrictEqual({
				start: { line: 3, column: 4 },
				end: { line: 3, column: 20 },
			});
		});

		it('a record inside a wrapped call carries the decoded offset pair', () => {
			const setup = setupWith();
			setup.locWrap('3:4:3:20:30:46', () => setup.consoleTrap['log']?.('hi'));

			expect([setup.emitted[0]?.start, setup.emitted[0]?.end]).toEqual([
				30, 46,
			]);
		});

		it('a record outside any wrap carries loc null', () => {
			const setup = setupWith();
			setup.consoleTrap['log']?.('hi');

			expect(setup.emitted[0]?.loc).toBeNull();
		});

		it('an emitted console record survives the landed narrowing', () => {
			const setup = setupWith();
			setup.locWrap('3:4:3:20:30:46', () => setup.consoleTrap['log']?.('hi'));

			expect(narrowRecordMessage(setup.emitted[0])).toBe(setup.emitted[0]);
		});
	});

	describe('a dialog — ask first, record after', () => {
		it('the ask crosses before the record is emitted', () => {
			const setup = setupWith(['Ada']);
			setup.promptTrap('who?');

			expect(setup.operations).toEqual(['call', 'emit']);
		});

		it('the ask carries the request, its step, and its attribution legs', () => {
			const setup = setupWith(['Ada']);
			setup.promptTrap('who?');

			expect(setup.asked).toStrictEqual([
				{
					step: 1,
					loc: null,
					start: null,
					end: null,
					request: { kind: 'prompt', message: 'who?' },
				},
			]);
		});

		it('the record is the very next event after its ask — the steps differ by one', () => {
			const setup = setupWith(['Ada']);
			setup.promptTrap('who?');

			expect(setup.emitted[0]?.step).toBe(2);
		});

		it("prompt's record carries the answered return value", () => {
			const setup = setupWith(['Ada']);
			setup.promptTrap('who?');

			expect(setup.emitted[0]).toHaveProperty('return', 'Ada');
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
			expect(setupWith([true]).alertTrap('done')).toBeUndefined();
		});

		it("alert's record carries return present and undefined", () => {
			const setup = setupWith([true]);
			setup.alertTrap('done');

			expect(
				setup.emitted[0] !== undefined && 'return' in setup.emitted[0],
			).toBe(true);
		});

		it("alert's recorded return is undefined", () => {
			const setup = setupWith([true]);
			setup.alertTrap('done');

			expect((setup.emitted[0] as { return?: unknown }).return).toBeUndefined();
		});

		it('the record carries the RAW arguments beside the decoded request', () => {
			const setup = setupWith(['Ada']);
			setup.promptTrap('who?', 'stranger');

			expect((setup.emitted[0] as WirePromptRecord).args).toStrictEqual([
				'who?',
				'stranger',
			]);
		});

		it("confirm's record carries its answered boolean", () => {
			const setup = setupWith([false]);
			setup.confirmTrap('sure?');

			expect(setup.emitted[0]).toHaveProperty('return', false);
		});

		it('a dialog inside a wrapped call stamps the ask with the decoded span', () => {
			const setup = setupWith(['Ada']);
			setup.locWrap('4:8:4:22:41:55', () => setup.promptTrap('who?'));

			expect(setup.asked[0]?.loc).toStrictEqual({
				start: { line: 4, column: 8 },
				end: { line: 4, column: 22 },
			});
		});

		it("the ask's offset pair rides beside its span", () => {
			const setup = setupWith(['Ada']);
			setup.locWrap('4:8:4:22:41:55', () => setup.promptTrap('who?'));

			expect([setup.asked[0]?.start, setup.asked[0]?.end]).toEqual([41, 55]);
		});

		it('a dialog inside a wrapped call stamps its record with the same span', () => {
			const setup = setupWith(['Ada']);
			setup.locWrap('4:8:4:22:41:55', () => setup.promptTrap('who?'));

			expect(setup.emitted[0]?.loc).toStrictEqual({
				start: { line: 4, column: 8 },
				end: { line: 4, column: 22 },
			});
		});

		it('an emitted dialog record survives the landed narrowing', () => {
			const setup = setupWith(['Ada']);
			setup.promptTrap('who?');

			expect(narrowRecordMessage(setup.emitted[0])).toBe(setup.emitted[0]);
		});

		it('a dialog inside a console argument is two boundary moments, strictly sequential', () => {
			const setup = setupWith(['Ada']);
			setup.consoleTrap['log']?.(setup.promptTrap('who?'));

			expect(setup.operations).toEqual(['call', 'emit', 'emit']);
		});

		it('step numbering is one shared sequence across dialog and console moments', () => {
			const setup = setupWith(['Ada']);
			setup.consoleTrap['log']?.(setup.promptTrap('who?'));

			expect(setup.emitted.map((record) => record.step)).toEqual([2, 3]);
		});
	});

	describe('decoding the request — the platform rules, per dialog', () => {
		it('alert() decodes an empty message', () => {
			const setup = setupWith([true]);
			setup.alertTrap();

			expect(setup.asked[0]?.request).toStrictEqual({
				kind: 'alert',
				message: '',
			});
		});

		it("alert(undefined) decodes the string 'undefined'", () => {
			const setup = setupWith([true]);
			// eslint-disable-next-line unicorn/no-useless-undefined -- the explicit undefined argument IS the decoded case under test
			setup.alertTrap(undefined);

			expect(setup.asked[0]?.request).toStrictEqual({
				kind: 'alert',
				message: 'undefined',
			});
		});

		it('confirm(undefined) decodes an empty message', () => {
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
		it('a natural end reports itself natural with no machine words and no phase', () => {
			expect(setupWith().authorHalt('natural-end')).toStrictEqual({
				natural: true,
				errorName: '',
				message: '',
				trip: null,
				loc: null,
				iterationCount: 0,
				phase: null,
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
			const halt = setupWith().authorHalt(
				'throw',
				new TypeError('boom'),
				'evaluation',
			);

			expect([halt.errorName, halt.message]).toEqual(['TypeError', 'boom']);
		});

		it('a non-Error throw renders honestly', () => {
			const halt = setupWith().authorHalt('throw', 'oops', 'evaluation');

			expect([halt.errorName, halt.message]).toEqual(['Error', 'oops']);
		});

		it("the throw arm carries the engine's phase", () => {
			const halt = setupWith().authorHalt(
				'throw',
				new TypeError('boom'),
				'creation',
			);

			expect(halt.phase).toBe('creation');
		});

		it('a thrown-error halt carries the run total', () => {
			const setup = setupWith();
			setup.guardCall(1, '1:0:1:20');
			setup.guardCall(1, '1:0:1:20');

			expect(
				setup.authorHalt('throw', new TypeError('x'), 'evaluation')
					.iterationCount,
			).toBe(2);
		});

		it('the trip halt counts the tripping iteration', () => {
			expect(
				tripOf(setupWith(undefined, { iterationLimit: 0 })).iterationCount,
			).toBe(1);
		});

		it('a throw that escaped no wrap carries loc null', () => {
			expect(
				setupWith().authorHalt('throw', new TypeError('x'), 'evaluation').loc,
			).toBeNull();
		});

		it("the guard's marked throw carries the trip record whole", () => {
			expect(
				tripOf(setupWith(undefined, { iterationLimit: 0 })).trip,
			).toStrictEqual({
				loopIndex: 2,
				loc: { start: { line: 3, column: 4 }, end: { line: 5, column: 6 } },
			});
		});

		it('a learner RangeError carrying the guard message verbatim is no trip', () => {
			const forgery = new RangeError('Loop 2 exceeded 0 iterations.');

			expect(
				setupWith().authorHalt('throw', forgery, 'evaluation').trip,
			).toBeNull();
		});

		it('a throw through a wrapped call carries the decoded call-site span', () => {
			const setup = setupWith();
			const thrown = stampedThrowOf(setup, '9:9:9:12:100:103', () => {
				throw new TypeError('x');
			});

			expect(setup.authorHalt('throw', thrown, 'evaluation').loc).toStrictEqual(
				{
					start: { line: 9, column: 9 },
					end: { line: 9, column: 12 },
				},
			);
		});

		it('nested wraps attribute the throw to the innermost — first write wins', () => {
			const setup = setupWith();
			const thrown = stampedThrowOf(setup, '1:1:1:9:1:9', () =>
				setup.locWrap('2:2:2:8:12:18', () => {
					throw new TypeError('x');
				}),
			);

			expect(setup.authorHalt('throw', thrown, 'evaluation').loc).toStrictEqual(
				{
					start: { line: 2, column: 2 },
					end: { line: 2, column: 8 },
				},
			);
		});

		it('a primitive throw through a wrap rides unstamped, loc null', () => {
			const setup = setupWith();
			const thrown = stampedThrowOf(setup, '9:9:9:12:100:103', () => {
				// eslint-disable-next-line @typescript-eslint/only-throw-error -- a primitive throw IS the case under test: it cannot carry a stamp
				throw 'oops';
			});

			expect(setup.authorHalt('throw', thrown, 'evaluation').loc).toBeNull();
		});

		it('a guard trip escaping a wrapped call carries both the trip and its loc', () => {
			const setup = setupWith(undefined, { iterationLimit: 0 });
			const thrown = stampedThrowOf(setup, '7:0:7:30:80:110', () =>
				setup.guardCall(2, '3:4:5:6'),
			);
			const halt = setup.authorHalt('throw', thrown, 'evaluation');

			expect([halt.trip?.loopIndex, halt.loc?.start.line]).toEqual([2, 7]);
		});

		it('a malformed encoded span stamps nothing — loc null, never a guess', () => {
			const setup = setupWith();
			const thrown = stampedThrowOf(setup, 'garbage', () => {
				throw new TypeError('x');
			});

			expect(setup.authorHalt('throw', thrown, 'evaluation').loc).toBeNull();
		});

		it('a four-field stamp is the retired encoding — loc null, never a guess', () => {
			const setup = setupWith();
			const thrown = stampedThrowOf(setup, '9:9:9:12', () => {
				throw new TypeError('x');
			});

			expect(setup.authorHalt('throw', thrown, 'evaluation').loc).toBeNull();
		});

		it('a corrupt offset pair beside a sound span still attributes the halt — the legs validate separately', () => {
			const setup = setupWith();
			const thrown = stampedThrowOf(setup, '9:9:9:12:x:y', () => {
				throw new TypeError('x');
			});

			expect(setup.authorHalt('throw', thrown, 'evaluation').loc).toStrictEqual(
				{
					start: { line: 9, column: 9 },
					end: { line: 9, column: 12 },
				},
			);
		});
	});

	describe('the worker-sent error record', () => {
		it('a learner throw emits the error record before the stop record is authored', () => {
			const setup = setupWith();
			setup.authorHalt('throw', new TypeError('boom'), 'evaluation');

			expect(setup.emitted).toStrictEqual([
				{
					event: 'error',
					name: 'TypeError',
					message: 'boom',
					step: 1,
					loc: null,
					start: null,
					end: null,
				},
			]);
		});

		it('a natural end emits nothing', () => {
			const setup = setupWith();
			setup.authorHalt('natural-end');

			expect(setup.emitted).toHaveLength(0);
		});

		it("the guard's marked trip emits nothing — the halt ends the timeline", () => {
			const setup = setupWith(undefined, { iterationLimit: 0 });
			tripOf(setup);

			expect(setup.emitted).toHaveLength(0);
		});

		it('a learner RangeError carrying the guard message verbatim still emits an error record — forgery is not suppression', () => {
			const setup = setupWith();
			const forgery = new RangeError('Loop 2 exceeded 0 iterations.');
			setup.authorHalt('throw', forgery, 'evaluation');

			expect(setup.emitted).toHaveLength(1);
		});

		it('a non-Error throw classifies on the record exactly as on the halt', () => {
			const setup = setupWith();
			setup.authorHalt('throw', 'oops', 'evaluation');

			expect([setup.emitted[0]?.event, setup.emitted[0]]).toEqual([
				'error',
				expect.objectContaining({ name: 'Error', message: 'oops' }),
			]);
		});

		it("the error record's step rides the one shared ordinal sequence", () => {
			const setup = setupWith();
			setup.consoleTrap['log']?.('hi');
			setup.authorHalt('throw', new TypeError('boom'), 'evaluation');

			expect(setup.emitted.map((record) => record.step)).toEqual([1, 2]);
		});

		it("a stamped throw's error record carries the span and the offset pair", () => {
			const setup = setupWith();
			const thrown = stampedThrowOf(setup, '9:9:9:12:100:103', () => {
				throw new TypeError('x');
			});
			setup.authorHalt('throw', thrown, 'evaluation');

			expect([
				setup.emitted[0]?.loc?.start.line,
				setup.emitted[0]?.start,
				setup.emitted[0]?.end,
			]).toEqual([9, 100, 103]);
		});

		it('a corrupt offset pair beside a sound span sends the record with every leg null — both-or-neither is the wire rule', () => {
			const setup = setupWith();
			const thrown = stampedThrowOf(setup, '9:9:9:12:x:y', () => {
				throw new TypeError('x');
			});
			setup.authorHalt('throw', thrown, 'evaluation');

			expect([
				setup.emitted[0]?.loc,
				setup.emitted[0]?.start,
				setup.emitted[0]?.end,
			]).toEqual([null, null, null]);
		});

		it('an emitted error record survives the landed narrowing', () => {
			const setup = setupWith();
			setup.authorHalt('throw', new TypeError('boom'), 'evaluation');

			expect(narrowRecordMessage(setup.emitted[0])).toBe(setup.emitted[0]);
		});
	});

	describe('the iteration cap, read through the worker config', () => {
		it('a cap of 0 trips on the first guard call with the pinned message', () => {
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

	describe('the residual stack parse — the ruled worker-side column correction', () => {
		it('a residual throw with no parseable learner frame keeps loc null', () => {
			const halt = setupWith().authorHalt(
				'throw',
				residualErrorOf(
					'TypeError: boom\n    at runScriptInThisContext (node:internal/vm:144:10)',
				),
				'evaluation',
			);

			expect(halt.loc).toBeNull();
		});

		it('a stack getter that throws degrades to loc null', () => {
			const trap = Object.defineProperty(new TypeError('boom'), 'stack', {
				get() {
					throw new Error('trapped');
				},
			});

			expect(
				setupWith().authorHalt('throw', trap, 'evaluation').loc,
			).toBeNull();
		});

		it('a module-path frame attributes at its own line — the blob is the code', () => {
			const halt = setupWith().authorHalt(
				'throw',
				residualErrorOf(
					'TypeError: boom\n    at blob:http://sandbox.test/0001-aaaa:2:6',
				),
				'evaluation',
			);

			expect(halt.loc).toStrictEqual({
				start: { line: 2, column: 5 },
				end: { line: 2, column: 5 },
			});
		});

		it('a function-path frame subtracts the wrapper and the strict prefix', () => {
			const halt = setupWith().authorHalt(
				'throw',
				residualErrorOf(
					'TypeError: boom\n    at eval (eval at <anonymous> ([eval]:5:15), <anonymous>:5:6)\n    at [eval]:6:3',
				),
				'evaluation',
			);

			expect(halt.loc).toStrictEqual({
				start: { line: 2, column: 5 },
				end: { line: 2, column: 5 },
			});
		});

		it("a spliced line's column is corrected by the config deltas", () => {
			const setup = setupWith(undefined, { spliceColumnDeltas: { 2: 3 } });
			const halt = setup.authorHalt(
				'throw',
				residualErrorOf(
					'TypeError: boom\n    at eval (eval at <anonymous> ([eval]:5:15), <anonymous>:5:6)',
				),
				'evaluation',
			);

			expect(halt.loc).toStrictEqual({
				start: { line: 2, column: 2 },
				end: { line: 2, column: 2 },
			});
		});

		it('the correction applies on the module path too — one rule, both frame shapes', () => {
			const setup = setupWith(undefined, { spliceColumnDeltas: { 2: 1 } });
			const halt = setup.authorHalt(
				'throw',
				residualErrorOf(
					'TypeError: boom\n    at blob:http://sandbox.test/0001-aaaa:2:6',
				),
				'evaluation',
			);

			expect(halt.loc?.start.column).toBe(4);
		});

		it('an unspliced line passes through uncorrected', () => {
			const setup = setupWith(undefined, { spliceColumnDeltas: { 9: 3 } });
			const halt = setup.authorHalt(
				'throw',
				residualErrorOf(
					'TypeError: boom\n    at eval (eval at <anonymous> ([eval]:5:15), <anonymous>:5:6)',
				),
				'evaluation',
			);

			expect(halt.loc?.start.column).toBe(5);
		});

		it('a delta larger than the column leaves it uncorrected — never negative', () => {
			const setup = setupWith(undefined, { spliceColumnDeltas: { 2: 99 } });
			const halt = setup.authorHalt(
				'throw',
				residualErrorOf(
					'TypeError: boom\n    at eval (eval at <anonymous> ([eval]:5:15), <anonymous>:5:6)',
				),
				'evaluation',
			);

			expect(halt.loc?.start.column).toBe(5);
		});

		it('the line always survives the correction', () => {
			const setup = setupWith(undefined, { spliceColumnDeltas: { 2: 3 } });
			const halt = setup.authorHalt(
				'throw',
				residualErrorOf(
					'TypeError: boom\n    at eval (eval at <anonymous> ([eval]:5:15), <anonymous>:5:6)',
				),
				'evaluation',
			);

			expect(halt.loc?.start.line).toBe(2);
		});

		it('a frame above the learner text is skipped, never mis-attributed', () => {
			const halt = setupWith().authorHalt(
				'throw',
				residualErrorOf(
					'TypeError: boom\n    at <anonymous>:3:1\n    at blob:http://sandbox.test/0001-aaaa:2:6',
				),
				'evaluation',
			);

			expect(halt.loc?.start.line).toBe(2);
		});

		it('the residual position is zero-width — a position, not a span', () => {
			const halt = setupWith().authorHalt(
				'throw',
				residualErrorOf(
					'TypeError: boom\n    at blob:http://sandbox.test/0001-aaaa:2:6',
				),
				'evaluation',
			);

			expect(halt.loc?.start).toStrictEqual(halt.loc?.end);
		});

		it('the residual error record still crosses with every attribution leg null', () => {
			const setup = setupWith(undefined, { spliceColumnDeltas: { 2: 3 } });
			setup.authorHalt(
				'throw',
				residualErrorOf(
					'TypeError: boom\n    at eval (eval at <anonymous> ([eval]:5:15), <anonymous>:5:6)',
				),
				'evaluation',
			);

			expect([
				setup.emitted[0]?.loc,
				setup.emitted[0]?.start,
				setup.emitted[0]?.end,
			]).toEqual([null, null, null]);
		});

		it('a stamped throw never stack-parses — the wrap wins', () => {
			const setup = setupWith(undefined, { spliceColumnDeltas: { 2: 3 } });
			const thrown = stampedThrowOf(setup, '9:9:9:12:100:103', () => {
				throw new TypeError('x');
			});
			(thrown as { stack?: string }).stack =
				'TypeError: x\n    at eval (eval at <anonymous> ([eval]:5:15), <anonymous>:5:6)';

			expect(setup.authorHalt('throw', thrown, 'evaluation').loc).toStrictEqual(
				{
					start: { line: 9, column: 9 },
					end: { line: 9, column: 12 },
				},
			);
		});

		it('a marked trip never stack-parses — the trip owns its attribution', () => {
			const setup = setupWith(undefined, { iterationLimit: 0 });
			const thrown = tripErrorWithStack(
				setup,
				'RangeError: Loop 2 exceeded 0 iterations.\n    at eval (eval at <anonymous> ([eval]:5:15), <anonymous>:5:6)',
			);

			expect(setup.authorHalt('throw', thrown, 'evaluation').loc).toBeNull();
		});
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
