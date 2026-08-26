import { describe, expect, it, vi } from 'vitest';

import createExecution from '../create-execution.js';
import type { ResultOnlySource, StreamingSource } from '../types.js';

type MockResult = { readonly ok: boolean; readonly events: readonly string[] };

const INERT: MockResult = { ok: false, events: [] };
const DEFECT: MockResult = { ok: false, events: ['defect'] };

function createStreamingSource(
	items: readonly string[],
	result: MockResult,
): StreamingSource<string, MockResult> & {
	readonly startCalls: () => number;
	readonly stopCalls: () => number;
	readonly returnCalls: () => number;
	readonly nextCalls: () => number;
} {
	let started = 0;
	let stopped = 0;
	let returned = 0;
	let pulled = 0;
	let index = 0;
	let resolveResult!: (value: MockResult) => void;
	const resultPromise = new Promise<MockResult>(function hold(resolve) {
		resolveResult = resolve;
	});
	return {
		start(_mode) {
			started += 1;
		},
		stop() {
			stopped += 1;
			resolveResult({ ok: false, events: result.events.slice(0, index) });
		},
		result: resultPromise,
		inertCancelResult: () => INERT,
		sourceDefectResult: (_cause: unknown) => DEFECT,
		events: {
			next(): Promise<IteratorResult<string>> {
				pulled += 1;
				if (index < items.length) {
					const value = items[index];
					index += 1;
					return Promise.resolve({ value, done: false });
				}
				resolveResult(result);
				return Promise.resolve({ value: undefined, done: true });
			},
			return(): Promise<IteratorResult<string>> {
				returned += 1;
				return Promise.resolve({ value: undefined, done: true });
			},
		},
		startCalls: () => started,
		stopCalls: () => stopped,
		returnCalls: () => returned,
		nextCalls: () => pulled,
	};
}

function createResultOnlySource(
	result: MockResult,
): ResultOnlySource<MockResult> & { readonly startCalls: () => number } {
	let started = 0;
	return {
		start(_mode) {
			started += 1;
		},
		stop() {},
		result: Promise.resolve(result),
		inertCancelResult: () => INERT,
		sourceDefectResult: (_cause: unknown) => DEFECT,
		startCalls: () => started,
	};
}

describe('batch consumption (await)', () => {
	it('resolves to the source result', async () => {
		const result = { ok: true, events: ['a', 'b'] };
		const execution = createExecution(
			createStreamingSource(['a', 'b'], result),
		);

		const actual = await execution;

		expect(actual).toEqual(result);
	});

	it('multiple await calls return the same result', async () => {
		const execution = createExecution(
			createStreamingSource(['a'], { ok: true, events: ['a'] }),
		);

		const first = await execution;
		const second = await execution;

		expect(first).toBe(second);
	});

	it('an empty stream resolves correctly', async () => {
		const execution = createExecution(
			createStreamingSource([], { ok: true, events: [] }),
		);

		const actual = await execution;

		expect(actual.ok).toBe(true);
	});
});

describe('step-through (for await)', () => {
	it.skip('yields all events from the source', async () => {
		const execution = createExecution(
			createStreamingSource(['a', 'b', 'c'], { ok: true, events: [] }),
		);
		const collected: string[] = [];

		for await (const event of execution) {
			collected.push(event);
		}

		expect(collected).toEqual(['a', 'b', 'c']);
	});

	it.skip('events arrive in order', async () => {
		const execution = createExecution(
			createStreamingSource(['first', 'second'], { ok: true, events: [] }),
		);
		const collected: string[] = [];

		for await (const event of execution) {
			collected.push(event);
		}

		expect(collected[0]).toBe('first');
	});

	it.skip('.result resolves after iteration completes', async () => {
		const execution = createExecution(
			createStreamingSource(['a'], { ok: true, events: ['a'] }),
		);
		const collected: string[] = [];

		for await (const event of execution) {
			collected.push(event);
		}

		expect(await execution.result).toEqual({ ok: true, events: collected });
	});
});

describe('PromiseLike (.then)', () => {
	it('.then() resolves to the same value as await', async () => {
		const result = { ok: true, events: ['a'] };
		const execution = createExecution(createStreamingSource(['a'], result));

		const actual = await new Promise<MockResult>(function subscribe(resolve) {
			execution.then(resolve);
		});

		expect(actual).toEqual(result);
	});

	it('multiple .then() calls resolve to the same value', async () => {
		const execution = createExecution(
			createStreamingSource(['a'], { ok: true, events: ['a'] }),
		);

		const first = await new Promise<MockResult>(function one(resolve) {
			execution.then(resolve);
		});
		const second = await new Promise<MockResult>(function two(resolve) {
			execution.then(resolve);
		});

		expect(first).toBe(second);
	});
});

describe('.result property', () => {
	it('.result is a Promise', () => {
		const execution = createExecution(
			createStreamingSource([], { ok: true, events: [] }),
		);

		expect(execution.result).toBeInstanceOf(Promise);
	});

	it('.result resolves without iteration — the drainer', async () => {
		const result = { ok: true, events: ['a', 'b'] };
		const execution = createExecution(
			createStreamingSource(['a', 'b'], result),
		);

		expect(await execution.result).toEqual(result);
	});

	it('the settle is the same promise object across touches', () => {
		const source = createStreamingSource(['a'], { ok: true, events: ['a'] });
		const execution = createExecution(source);

		expect(execution.result).toBe(execution.result);
	});

	it('a batch ignition calls start once', () => {
		const source = createStreamingSource(['a'], { ok: true, events: ['a'] });
		const execution = createExecution(source);

		void execution.result;

		expect(source.startCalls()).toBe(1);
	});

	it('a mixed .result-then-await touch starts once', async () => {
		const source = createStreamingSource(['a'], { ok: true, events: ['a'] });
		const execution = createExecution(source);

		void execution.result;
		await execution;

		expect(source.startCalls()).toBe(1);
	});

	it('the drainer pulls the stream to exhaustion', async () => {
		const source = createStreamingSource(['a', 'b'], {
			ok: true,
			events: ['a', 'b'],
		});
		const execution = createExecution(source);

		await execution.result;

		expect(source.nextCalls()).toBe(3);
	});
});

describe('cancel', () => {
	it.skip('.cancel() is idempotent', () => {
		const execution = createExecution(
			createStreamingSource(['a'], { ok: true, events: ['a'] }),
		);
		execution.cancel();

		expect(() => execution.cancel()).not.toThrow();
	});

	it.skip('cancel before ignition prevents any start', async () => {
		const source = createStreamingSource(['a'], { ok: true, events: ['a'] });
		const execution = createExecution(source);

		execution.cancel();
		await execution.result;

		expect(source.startCalls()).toBe(0);
	});

	it.skip('cancel before ignition resolves the inert-cancel result', async () => {
		const execution = createExecution(
			createStreamingSource(['a'], { ok: true, events: ['a'] }),
		);
		execution.cancel();

		expect(await execution.result).toBe(INERT);
	});

	it.skip('break in for-await resolves .result without hanging', async () => {
		const source = createStreamingSource(
			Array.from({ length: 50 }, (_unused, index) => `event-${index}`),
			{ ok: true, events: [] },
		);
		const execution = createExecution(source);

		const iterator = execution[Symbol.asyncIterator]();
		await iterator.next();
		await iterator.return?.();

		const settled = await execution.result;

		expect(settled.ok).toBe(false);
	});

	it.skip('stop is called once on a cancel after ignition', async () => {
		const source = createStreamingSource(['a', 'b'], { ok: true, events: [] });
		const execution = createExecution(source);
		const iterator = execution[Symbol.asyncIterator]();
		await iterator.next();

		execution.cancel();
		await execution.result;

		expect(source.stopCalls()).toBe(1);
	});
});

describe('edge cases', () => {
	it('an immediate-end stream resolves correctly', async () => {
		const execution = createExecution(
			createStreamingSource([], { ok: true, events: [] }),
		);

		const settled = await execution;

		expect(settled.ok).toBe(true);
	});

	it.skip('a source result rejection settles the source-defect result', async () => {
		const source = createStreamingSource([], { ok: true, events: [] });
		const rejecting = {
			...source,
			result: Promise.reject(new Error('source broke')),
		};
		const execution = createExecution(rejecting);

		expect(await execution.result).toBe(DEFECT);
	});
});

describe('the mode latch', () => {
	it.skip('Symbol.asyncIterator answers the same iterator for the handle’s life', () => {
		const execution = createExecution(
			createStreamingSource(['a'], { ok: true, events: ['a'] }),
		);
		expect(execution[Symbol.asyncIterator]()).toBe(
			execution[Symbol.asyncIterator](),
		);
	});

	it.skip('batch first: .result resolves the complete result', async () => {
		const result = { ok: true, events: ['a'] };
		const execution = createExecution(createStreamingSource(['a'], result));

		expect(await execution.result).toEqual(result);
	});

	it.skip('batch first: a later iterator is already ended', async () => {
		const execution = createExecution(
			createStreamingSource(['a', 'b'], { ok: true, events: [] }),
		);
		await execution.result;
		const collected: string[] = [];

		for await (const event of execution) {
			collected.push(event);
		}

		expect(collected).toEqual([]);
	});

	it.skip('iterate first: a later await subscribes and resolves', async () => {
		const execution = createExecution(
			createStreamingSource(['a', 'b'], { ok: true, events: ['a', 'b'] }),
		);
		const collected: string[] = [];

		for await (const event of execution) {
			collected.push(event);
		}

		expect(await execution).toEqual({ ok: true, events: collected });
	});

	it.skip('the source learns the engaged mode at start', async () => {
		const modes: string[] = [];
		const source = createStreamingSource(['a'], { ok: true, events: [] });
		const observing = {
			...source,
			start(mode: 'iterate' | 'batch') {
				modes.push(mode);
				source.start(mode);
			},
		};
		const execution = createExecution(observing);

		await execution.result;

		expect(modes).toEqual(['batch']);
	});
});

describe('the laws the quarry never had', () => {
	it('construction calls nothing on the source', () => {
		const source = createStreamingSource(['a'], { ok: true, events: ['a'] });

		createExecution(source);

		expect(source.startCalls()).toBe(0);
	});

	it('construction does not call stop on the source', () => {
		const source = createStreamingSource(['a'], { ok: true, events: ['a'] });

		createExecution(source);

		expect(source.stopCalls()).toBe(0);
	});

	it("construction does not pull the source's events", () => {
		const source = createStreamingSource(['a'], { ok: true, events: ['a'] });

		createExecution(source);

		expect(source.nextCalls()).toBe(0);
	});

	it('installing extras does not ignite', () => {
		const source = createStreamingSource(['a'], { ok: true, events: ['a'] });

		createExecution(source, () => ({ code: 'let x;' }));

		expect(source.startCalls()).toBe(0);
	});

	it.skip('a touch after an inert cancel never starts', async () => {
		const source = createStreamingSource(['a'], { ok: true, events: ['a'] });
		const execution = createExecution(source);
		execution.cancel();

		await execution.result;
		const iterator = execution[Symbol.asyncIterator]();
		await iterator.next();

		expect(source.startCalls()).toBe(0);
	});

	it.skip('a throwing source is never re-entered', async () => {
		let calls = 0;
		const source = createStreamingSource(['a'], { ok: true, events: [] });
		const throwing = {
			...source,
			start(_mode: 'iterate' | 'batch') {
				calls += 1;
				throw new Error('assembly failed');
			},
		};
		const execution = createExecution(throwing);

		await execution.result;
		await execution.result;

		expect(calls).toBe(1);
	});

	it.skip('a throwing source settles the source-defect result', async () => {
		const source = createStreamingSource(['a'], { ok: true, events: [] });
		const throwing = {
			...source,
			start(_mode: 'iterate' | 'batch') {
				throw new Error('assembly failed');
			},
		};
		const execution = createExecution(throwing);

		expect(await execution.result).toBe(DEFECT);
	});

	it.skip('the drainer stands down on a mid-drain settle', async () => {
		const source = createStreamingSource(
			Array.from({ length: 50 }, (_unused, index) => `event-${index}`),
			{ ok: true, events: [] },
		);
		let pulls = 0;
		let resolveEarly!: (value: MockResult) => void;
		const early = new Promise<MockResult>(function hold(resolve) {
			resolveEarly = resolve;
		});
		const settling = {
			...source,
			result: early,
			events: {
				next(): Promise<IteratorResult<string>> {
					pulls += 1;
					if (pulls === 3) {
						resolveEarly({ ok: false, events: [] });
						return new Promise<IteratorResult<string>>(function pending() {});
					}
					return Promise.resolve({ value: 'x', done: false });
				},
			},
		};
		const execution = createExecution(settling);

		await execution.result;

		expect(pulls).toBe(3);
	});

	it.skip('a mid-iteration settle ends the live consumer iterator', async () => {
		let resolveEarly!: (value: MockResult) => void;
		const early = new Promise<MockResult>(function hold(resolve) {
			resolveEarly = resolve;
		});
		const source = createStreamingSource(['a', 'b', 'c'], {
			ok: true,
			events: [],
		});
		const settling = { ...source, result: early };
		const execution = createExecution(settling);
		const collected: string[] = [];

		for await (const event of execution) {
			collected.push(event);
			if (collected.length === 1) {
				resolveEarly({ ok: false, events: ['a'] });
			}
		}

		expect(collected).toEqual(['a']);
	});

	it.skip('the source iterator is disposed on a settle-first exit', async () => {
		const source = createStreamingSource(['a', 'b', 'c'], {
			ok: true,
			events: [],
		});
		let resolveEarly!: (value: MockResult) => void;
		const early = new Promise<MockResult>(function hold(resolve) {
			resolveEarly = resolve;
		});
		const settling = { ...source, result: early };
		const execution = createExecution(settling);
		const iterator = execution[Symbol.asyncIterator]();
		await iterator.next();
		resolveEarly({ ok: false, events: ['a'] });

		await execution.result;

		expect(source.returnCalls()).toBe(1);
	});

	it.skip('cancel never queues behind a pending pull', async () => {
		const source = createStreamingSource(['a'], { ok: true, events: [] });
		const suspended = {
			...source,
			events: {
				next: () => new Promise<IteratorResult<string>>(function pending() {}),
			},
		};
		const execution = createExecution(suspended);
		const iterator = execution[Symbol.asyncIterator]();
		void iterator.next();

		execution.cancel();
		const settled = await execution.result;

		expect(settled.ok).toBe(false);
	});

	it.skip('an events rejection mid-pull settles the source-defect result', async () => {
		const source = createStreamingSource(['a'], { ok: true, events: [] });
		const rejecting = {
			...source,
			events: {
				next: () =>
					Promise.reject<IteratorResult<string>>(new Error('pull broke')),
			},
		};
		const execution = createExecution(rejecting);

		expect(await execution.result).toBe(DEFECT);
	});

	it.skip('a stop that throws settles the source-defect result', async () => {
		const source = createStreamingSource(['a', 'b'], { ok: true, events: [] });
		const throwing = {
			...source,
			stop() {
				throw new Error('teardown broke');
			},
		};
		const execution = createExecution(throwing);
		const iterator = execution[Symbol.asyncIterator]();
		await iterator.next();

		execution.cancel();

		expect(await execution.result).toBe(DEFECT);
	});

	it.skip('cancel after settlement is inert on the source', async () => {
		const source = createStreamingSource([], { ok: true, events: [] });
		const execution = createExecution(source);
		await execution.result;

		execution.cancel();

		expect(source.stopCalls()).toBe(0);
	});

	it.skip('a result-only source resolves under await', async () => {
		const result = { ok: true, events: [] };
		const execution = createExecution(createResultOnlySource(result));

		expect(await execution).toEqual(result);
	});

	it.skip('a result-only source is always told batch', async () => {
		const modes: string[] = [];
		const source = createResultOnlySource({ ok: true, events: [] });
		const observing = {
			...source,
			start(mode: 'iterate' | 'batch') {
				modes.push(mode);
				source.start(mode);
			},
		};
		const execution = createExecution(observing);

		await execution.result;

		expect(modes).toEqual(['batch']);
	});

	it.skip('a result-only cancel before ignition settles inert', async () => {
		const source = createResultOnlySource({ ok: true, events: [] });
		const execution = createExecution(source);
		execution.cancel();

		expect(await execution.result).toBe(INERT);
	});

	it.skip('a builder that cancels synchronously yields a settled handle', async () => {
		const source = createStreamingSource(['a'], { ok: true, events: ['a'] });
		const execution = createExecution(source, (controls) => {
			controls.cancel();
			return { code: 'let x;' };
		});

		expect(await execution.result).toBe(INERT);
	});

	it.skip('a throwing builder throws synchronously at construction', () => {
		const source = createStreamingSource(['a'], { ok: true, events: ['a'] });

		expect(() =>
			createExecution(source, () => {
				throw new Error('builder bug');
			}),
		).toThrow('builder bug');
	});

	it('extras land on the handle', () => {
		const source = createStreamingSource([], { ok: true, events: [] });

		const execution = createExecution(source, () => ({ code: 'let x;' }));

		expect(execution.code).toBe('let x;');
	});

	it('a second extras key lands alongside the first', () => {
		const source = createStreamingSource([], { ok: true, events: [] });

		const execution = createExecution(source, () => ({
			code: 'let x;',
			label: 'demo',
		}));

		expect(execution.label).toBe('demo');
	});

	it('the handle with extras installed is frozen', () => {
		const source = createStreamingSource([], { ok: true, events: [] });

		const execution = createExecution(source, () => ({ code: 'let x;' }));

		expect(Object.isFrozen(execution)).toBe(true);
	});
});

describe('compile probes (live)', () => {
	it('rejects a colliding result extra', () => {
		const source = createStreamingSource([], { ok: true, events: [] });
		function collides(): void {
			// @ts-expect-error a `result` extra shadows the memoized settle
			createExecution(source, () => ({ result: Promise.resolve(null) }));
		}

		expect(typeof collides).toBe('function');
	});

	it('rejects a colliding iterator extra on the result-only arm', () => {
		const source = createResultOnlySource({ ok: true, events: [] });
		function collides(): void {
			// @ts-expect-error a Symbol.asyncIterator extra fakes a stream
			createExecution(source, () => ({ [Symbol.asyncIterator]: vi.fn() }));
		}

		expect(typeof collides).toBe('function');
	});
});
