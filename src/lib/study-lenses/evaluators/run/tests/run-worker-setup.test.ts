/* cspell:ignore antwoord genegeerd standaard vraag zeker */

/**
 * @file The worker-side seam suite: the globals run injects (the guard pair
 * plus the three dialog traps, HR-9), the cap the base projects from the
 * delivered worker config, the halt the base's author stamps on every
 * worker-side stop, and the ask protocol the traps speak over the
 * machinery's call channel.
 *
 * Transported content-level from the deprecated kind's
 * `run/tests/run-worker-setup.test.ts` (literals rewritten under HR-8),
 * re-aimed at the new setup over the guarded worker base; the trap rows are
 * new here, modeled on the deprecated intercept setup's dialog traps under
 * run's no-stream posture — no records emitted, answers written back only.
 *
 * One deliberate exception, acknowledged: `haltOfTrip` holds a try/catch,
 * outside every test body — the same exception the sibling
 * `iteration-guard/tests/read-limit-trip.test.ts` documents, and the one the
 * human ratified at the deprecated increment (ruling R-1, 2026-07-30): a
 * real marked throw must be HELD to be handed to the halt author, which no
 * `toThrow` matcher can do.
 */

import { describe, expect, it } from 'vitest';

import type {
	CallResponse,
	HaltKind,
	HaltPhase,
	WorkerApi,
	WorkerSetup,
	WorkerSetupResult,
} from '../../../lib/engine/types.js';
import runWorkerSetup from '../run-worker-setup.js';
import type { RunHalt } from '../types.js';

type DialogCall = (...callArguments: unknown[]) => unknown;

function resultOf(workerConfig?: unknown): WorkerSetupResult {
	const quietApi: WorkerApi = {
		emit() {},
		call() {
			return null;
		},
	};
	return runWorkerSetup(quietApi, workerConfig);
}

type GuardCall = (loopIndex: number, locString: string) => void;
type ResetCall = (loopIndex: number) => void;
type AuthorHalt = (
	kind: HaltKind,
	rawError?: unknown,
	phase?: HaltPhase,
) => RunHalt;

function setupWith(workerConfig?: unknown): {
	guardCall: GuardCall;
	resetCall: ResetCall;
	authorHalt: AuthorHalt;
} {
	const { globals, serializeHalt } = resultOf(workerConfig);
	if (serializeHalt === undefined) {
		throw new Error('run must register a halt author');
	}
	return {
		guardCall: globals['__$il'] as GuardCall,
		resetCall: globals['__$ir'] as ResetCall,
		authorHalt: serializeHalt as AuthorHalt,
	};
}

function haltOfTrip(): RunHalt {
	const { guardCall, authorHalt } = setupWith({ iterationLimit: 0 });
	try {
		guardCall(2, '3:4:5:6');
	} catch (error) {
		return authorHalt('throw', error, 'evaluation');
	}
	throw new Error('the guard did not trip');
}

function trapsWith(answer: CallResponse): {
	ask: (verb: string, ...callArguments: unknown[]) => unknown;
	asked: unknown[];
	emitted: unknown[];
} {
	const asked: unknown[] = [];
	const emitted: unknown[] = [];
	const api: WorkerApi = {
		emit(message) {
			emitted.push(message);
		},
		call(request) {
			asked.push(request);
			return answer;
		},
	};
	const { globals } = runWorkerSetup(api, {});
	return {
		ask(verb, ...callArguments) {
			return (globals[verb] as DialogCall)(...callArguments);
		},
		asked,
		emitted,
	};
}

describe('runWorkerSetup', () => {
	describe('injected globals', () => {
		it('an absent iteration limit injects exactly the guard pair and the three dialog traps', () => {
			expect(
				Object.keys(resultOf().globals).toSorted((a, b) => a.localeCompare(b)),
			).toEqual(['__$il', '__$ir', 'alert', 'confirm', 'prompt']);
		});

		it('injects no console trap — captured logs are intercept’s business', () => {
			expect(Object.keys(resultOf({}).globals)).not.toContain('console');
		});

		it('registers a halt author', () => {
			expect(typeof resultOf({}).serializeHalt).toBe('function');
		});

		it('freezes the result it returns', () => {
			expect(Object.isFrozen(resultOf({}))).toBe(true);
		});

		it('a dialog trap asks the thread through the call channel', () => {
			const asked: unknown[] = [];
			const api: WorkerApi = {
				emit() {},
				call(request) {
					asked.push(request);
					return null;
				},
			};
			(runWorkerSetup(api, {}).globals['alert'] as DialogCall)('hallo');
			expect(asked).toHaveLength(1);
		});
	});

	describe('halt authoring', () => {
		describe('a natural end', () => {
			it('reports itself natural, with no machine words, no trip, and no phase', () => {
				expect(setupWith().authorHalt('natural-end')).toStrictEqual({
					natural: true,
					errorName: '',
					message: '',
					trip: null,
					iterationCount: 0,
					phase: null,
				});
			});

			it('carries the real run total after guarded iterations', () => {
				const { guardCall, authorHalt } = setupWith();
				guardCall(1, '1:0:1:20');
				guardCall(1, '1:0:1:20');
				guardCall(1, '1:0:1:20');

				expect(authorHalt('natural-end').iterationCount).toBe(3);
			});
		});

		describe('a thrown error', () => {
			it('reports the stop as not natural', () => {
				const halt = setupWith().authorHalt(
					'throw',
					new TypeError('boom'),
					'evaluation',
				);

				expect(halt.natural).toBe(false);
			});

			it('carries the thrown name', () => {
				const halt = setupWith().authorHalt(
					'throw',
					new TypeError('boom'),
					'evaluation',
				);

				expect(halt.errorName).toBe('TypeError');
			});

			it('carries the thrown message', () => {
				const halt = setupWith().authorHalt(
					'throw',
					new TypeError('boom'),
					'evaluation',
				);

				expect(halt.message).toBe('boom');
			});

			it('carries no trip record', () => {
				const halt = setupWith().authorHalt(
					'throw',
					new TypeError('boom'),
					'evaluation',
				);

				expect(halt.trip).toBeNull();
			});

			it('carries the run total the guard reached before the throw', () => {
				const { guardCall, authorHalt } = setupWith();
				guardCall(1, '1:0:1:20');
				guardCall(1, '1:0:1:20');

				expect(
					authorHalt('throw', new TypeError('boom'), 'evaluation')
						.iterationCount,
				).toBe(2);
			});

			it("carries the engine's phase through the base", () => {
				const halt = setupWith().authorHalt(
					'throw',
					new TypeError('boom'),
					'creation',
				);

				expect(halt.phase).toBe('creation');
			});
		});

		describe('a non-Error throw', () => {
			it('renders the name honestly as Error', () => {
				expect(
					setupWith().authorHalt('throw', 'oops', 'evaluation').errorName,
				).toBe('Error');
			});

			it('renders the message as the thrown value in string form', () => {
				expect(
					setupWith().authorHalt('throw', 'oops', 'evaluation').message,
				).toBe('oops');
			});
		});

		describe('classification', () => {
			it("the guard's marked throw carries the trip record whole", () => {
				// PINNED(human-ratified Phase 0 6256571c: loop-cap carries the whole trip record — its loop index AND its decoded span, never a bare loc)
				expect(haltOfTrip().trip).toStrictEqual({
					loopIndex: 2,
					loc: { start: { line: 3, column: 4 }, end: { line: 5, column: 6 } },
				});
			});

			it("the guard's marked throw counts the tripping iteration", () => {
				// PINNED(iteration-guard README § Edge cases: the guard increments before it compares, so the trip is counted)
				expect(haltOfTrip().iterationCount).toBe(1);
			});

			it('a learner RangeError carrying the guard message verbatim is no trip', () => {
				const forgery = new RangeError('Loop 2 exceeded 0 iterations.');

				// PINNED(human-ratified Phase 0 6256571c: classification is structural — the guard's marker, never a name and never a message)
				expect(
					setupWith().authorHalt('throw', forgery, 'evaluation').trip,
				).toBeNull();
			});
		});
	});

	describe('the iteration cap', () => {
		it('a cap of 0 trips on the first guard call, with the pinned message', () => {
			const { guardCall } = setupWith({ iterationLimit: 0 });

			// PINNED(iteration-guard C1 ruling: no iteration-cap default exists — the cap rides through unchanged and 0 trips on the first pass)
			expect(() => guardCall(1, '1:0:1:20')).toThrow(
				'Loop 1 exceeded 0 iterations.',
			);
		});

		it('a cap of 1 permits one iteration of an entry, then trips', () => {
			const { guardCall } = setupWith({ iterationLimit: 1 });
			guardCall(1, '1:0:1:20');

			expect(() => guardCall(1, '1:0:1:20')).toThrow();
		});

		it('the injected reset restarts that entry, so the cap applies afresh', () => {
			const { guardCall, resetCall } = setupWith({ iterationLimit: 1 });
			guardCall(1, '1:0:1:20');
			resetCall(1);

			expect(() => guardCall(1, '1:0:1:20')).not.toThrow();
		});

		it.each([[Number.POSITIVE_INFINITY], [Number.NaN]])(
			'a cap of %p never trips',
			(cap) => {
				const { guardCall } = setupWith({ iterationLimit: cap });
				guardCall(1, '1:0:1:20');

				// PINNED(iteration-guard C1 ruling: no finiteness gate lives in the evaluator — Infinity and NaN ride through and never trip)
				expect(() => guardCall(1, '1:0:1:20')).not.toThrow();
			},
		);

		it('a non-number iterationLimit is read as no cap', () => {
			const { guardCall } = setupWith({ iterationLimit: 'nonsense' });
			guardCall(1, '1:0:1:20');

			expect(() => guardCall(1, '1:0:1:20')).not.toThrow();
		});
	});

	describe('the ask protocol', () => {
		it('alert with no argument renders the empty message', () => {
			const { ask, asked } = trapsWith(null);
			ask('alert');

			expect(asked).toStrictEqual([{ verb: 'alert', message: '' }]);
		});

		it("alert converts one argument — an explicit undefined renders 'undefined'", () => {
			const { ask, asked } = trapsWith(null);
			// eslint-disable-next-line unicorn/no-useless-undefined -- the explicit undefined argument IS the decoded case under test
			ask('alert', undefined);

			expect(asked).toStrictEqual([{ verb: 'alert', message: 'undefined' }]);
		});

		it('alert converts a real message through String, same as confirm and prompt', () => {
			const { ask, asked } = trapsWith(null);
			ask('alert', {});

			expect(asked).toStrictEqual([
				{ verb: 'alert', message: '[object Object]' },
			]);
		});

		it('alert returns undefined whatever the thread answered', () => {
			expect(trapsWith('genegeerd').ask('alert', 'hallo')).toBeUndefined();
		});

		it('confirm renders its request without a defaultValue slot', () => {
			const { ask, asked } = trapsWith(true);
			ask('confirm', 'zeker?');

			expect(asked).toStrictEqual([{ verb: 'confirm', message: 'zeker?' }]);
		});

		it('confirm ignores a second argument — the platform dialog has no default', () => {
			const { ask, asked } = trapsWith(true);
			ask('confirm', 'zeker?', 'genegeerd');

			expect(asked).toStrictEqual([{ verb: 'confirm', message: 'zeker?' }]);
		});

		it('an object message rides its platform String form', () => {
			const { ask, asked } = trapsWith(true);
			ask('confirm', {});

			expect(asked).toStrictEqual([
				{ verb: 'confirm', message: '[object Object]' },
			]);
		});

		it("confirm returns the thread's boolean answer", () => {
			expect(trapsWith(false).ask('confirm', 'zeker?')).toBe(false);
		});

		it('confirm returns a true answer unchanged', () => {
			expect(trapsWith(true).ask('confirm', 'zeker?')).toBe(true);
		});

		it('prompt renders its request with the message and the default', () => {
			const { ask, asked } = trapsWith(null);
			ask('prompt', 'vraag', 'standaard');

			expect(asked).toStrictEqual([
				{ verb: 'prompt', message: 'vraag', defaultValue: 'standaard' },
			]);
		});

		it('prompt with an undefined default sends no defaultValue slot', () => {
			const { ask, asked } = trapsWith(null);
			ask('prompt', 'vraag');

			expect(asked).toStrictEqual([{ verb: 'prompt', message: 'vraag' }]);
		});

		it('an explicit undefined message counts as omitted for prompt', () => {
			const { ask, asked } = trapsWith(null);
			// eslint-disable-next-line unicorn/no-useless-undefined -- the explicit undefined argument IS the decoded case under test
			ask('prompt', undefined);

			expect(asked).toStrictEqual([{ verb: 'prompt', message: '' }]);
		});

		it("prompt returns the thread's answer", () => {
			expect(trapsWith('antwoord').ask('prompt', 'vraag')).toBe('antwoord');
		});

		it('prompt returns the platform-cancel null unchanged', () => {
			expect(trapsWith(null).ask('prompt', 'vraag')).toBeNull();
		});

		it('a falsy answer rides back unmodified — the trap neither coerces nor validates', () => {
			expect(trapsWith(false).ask('prompt', 'vraag')).toBe(false);
		});

		it('a trap emits nothing — run streams no records', () => {
			const { ask, emitted } = trapsWith('antwoord');
			ask('prompt', 'vraag');

			expect(emitted).toStrictEqual([]);
		});
	});

	describe('the engine contract', () => {
		it('is usable as the engine worker setup', () => {
			const probe: WorkerSetup = runWorkerSetup;

			expect(typeof probe).toBe('function');
		});
	});
});
