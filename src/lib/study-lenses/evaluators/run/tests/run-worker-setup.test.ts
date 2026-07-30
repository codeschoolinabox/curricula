/**
 * @file R1's ZOMBIES cluster: the globals run injects, the cap it projects
 * from the delivered worker config, and the halt it authors on every
 * worker-side stop.
 *
 * Driven against a stub of the engine's worker api, which run ignores —
 * being eventless and dialog-free is part of the contract, not an omission.
 * The stub is built inside the helpers rather than read by any row, because
 * no row has anything to say about it; the engine's own
 * `reference-worker-setup.test.ts` declares its twin inline per test for the
 * opposite reason — there, rows assert identity against `emit`/`call`, so the
 * api IS that file's test data.
 *
 * One deliberate exception, acknowledged: `haltOfTrip` holds a try/catch,
 * outside every test body — the same exception the sibling
 * `iteration-guard/tests/read-limit-trip.test.ts` documents, and the one the
 * human ratified for this increment (ruling R-1, 2026-07-30): a real marked
 * throw must be HELD to be handed to the halt author, which no `toThrow`
 * matcher can do.
 */

import { describe, expect, it } from 'vitest';

import type {
	HaltKind,
	WorkerApi,
	WorkerSetup,
	WorkerSetupResult,
} from '../../../lib/engine/types.js';
import runWorkerSetup from '../run-worker-setup.js';
import type { RunHalt } from '../types.js';

type GuardCall = (loopIndex: number, locString: string) => void;
type ResetCall = (loopIndex: number) => void;
type AuthorHalt = (kind: HaltKind, rawError?: unknown) => RunHalt;

function resultOf(workerConfig?: unknown): WorkerSetupResult {
	const quietApi: WorkerApi = {
		emit() {},
		call() {
			return null;
		},
	};
	return runWorkerSetup(quietApi, workerConfig);
}

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
		return authorHalt('throw', error);
	}
	throw new Error('the guard did not trip');
}

describe('runWorkerSetup', () => {
	describe('injected globals', () => {
		it('an absent iteration limit injects exactly the two guard helpers', () => {
			expect(
				Object.keys(resultOf().globals).toSorted((a, b) => a.localeCompare(b)),
			).toEqual(['__$il', '__$ir']);
		});

		it.each([['prompt'], ['alert'], ['confirm']])(
			'injects no %s — run adds no dialog the platform lacks',
			(dialog) => {
				expect(Object.keys(resultOf({}).globals)).not.toContain(dialog);
			},
		);

		it('registers a halt author', () => {
			expect(typeof resultOf({}).serializeHalt).toBe('function');
		});

		it('freezes the result it returns', () => {
			expect(Object.isFrozen(resultOf({}))).toBe(true);
		});
	});

	describe('halt authoring', () => {
		describe('a natural end', () => {
			it('reports itself natural, with no machine words and no trip', () => {
				expect(setupWith().authorHalt('natural-end')).toStrictEqual({
					natural: true,
					errorName: '',
					message: '',
					trip: null,
					iterationCount: 0,
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
				const halt = setupWith().authorHalt('throw', new TypeError('boom'));

				expect(halt.natural).toBe(false);
			});

			it('carries the thrown name', () => {
				const halt = setupWith().authorHalt('throw', new TypeError('boom'));

				expect(halt.errorName).toBe('TypeError');
			});

			it('carries the thrown message', () => {
				const halt = setupWith().authorHalt('throw', new TypeError('boom'));

				expect(halt.message).toBe('boom');
			});

			it('carries no trip record', () => {
				const halt = setupWith().authorHalt('throw', new TypeError('boom'));

				expect(halt.trip).toBeNull();
			});

			it('carries the run total the guard reached before the throw', () => {
				const { guardCall, authorHalt } = setupWith();
				guardCall(1, '1:0:1:20');
				guardCall(1, '1:0:1:20');

				expect(authorHalt('throw', new TypeError('boom')).iterationCount).toBe(
					2,
				);
			});
		});

		describe('a non-Error throw', () => {
			it('renders the name honestly as Error', () => {
				expect(setupWith().authorHalt('throw', 'oops').errorName).toBe('Error');
			});

			it('renders the message as the thrown value in string form', () => {
				expect(setupWith().authorHalt('throw', 'oops').message).toBe('oops');
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
				expect(setupWith().authorHalt('throw', forgery).trip).toBeNull();
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

	describe('the engine contract', () => {
		it('is usable as the engine worker setup', () => {
			const probe: WorkerSetup = runWorkerSetup;

			expect(typeof probe).toBe('function');
		});
	});
});
