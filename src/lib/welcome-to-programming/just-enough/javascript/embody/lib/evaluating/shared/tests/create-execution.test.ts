/**
 * @file Unit tests for createExecution — the Execution wrapper factory.
 *
 * Tests all consumption patterns (batch, step-through, replay), cancel
 * semantics, PromiseLike behavior, and edge cases using mock async generators.
 * No Workers or SAB needed — pure Node tests.
 */

import { describe, expect, it, vi } from 'vitest';

import createExecution from '../create-execution.js';

// --- Mock generator helpers ---

type MockResult = { readonly ok: boolean; readonly logs: readonly string[] };

function createMockGen(
	items: readonly string[],
	result: MockResult,
): () => AsyncGenerator<string, MockResult> {
	return async function* () {
		for (const item of items) {
			yield item;
		}
		return result;
	};
}

function noop(): void {}

// =====================================================================
// Batch consumption (await)
// =====================================================================

describe('batch consumption (await)', () => {
	it('resolves to the generator return value', async () => {
		const result = { ok: true, logs: ['a', 'b'] };
		const execution = createExecution(createMockGen(['a', 'b'], result), noop);

		const actual = await execution;

		expect(actual).toEqual(result);
	});

	it('multiple await calls return same result', async () => {
		const result = { ok: true, logs: ['a'] };
		const execution = createExecution(createMockGen(['a'], result), noop);

		const r1 = await execution;
		const r2 = await execution;

		expect(r1).toBe(r2);
	});

	it('empty generator resolves correctly', async () => {
		const result = { ok: true, logs: [] as string[] };
		const execution = createExecution(createMockGen([], result), noop);

		const actual = await execution;

		expect(actual.ok).toBe(true);
		expect(actual.logs).toEqual([]);
	});
});

// =====================================================================
// Step-through (for await)
// =====================================================================

describe('step-through (for await)', () => {
	it('yields all events from generator', async () => {
		const result = { ok: true, logs: ['a', 'b', 'c'] };
		const execution = createExecution(createMockGen(['a', 'b', 'c'], result), noop);
		const collected: string[] = [];

		for await (const event of execution) {
			collected.push(event);
		}

		expect(collected).toEqual(['a', 'b', 'c']);
	});

	it('events arrive in order', async () => {
		const result = { ok: true, logs: ['first', 'second', 'third'] };
		const execution = createExecution(createMockGen(['first', 'second', 'third'], result), noop);
		const collected: string[] = [];

		for await (const event of execution) {
			collected.push(event);
		}

		expect(collected[0]).toBe('first');
		expect(collected[2]).toBe('third');
	});

	it('.result resolves after iteration completes', async () => {
		const result = { ok: true, logs: ['a'] };
		const execution = createExecution(createMockGen(['a'], result), noop);

		for await (const _event of execution) {
			// consume all
		}

		const actual = await execution.result;

		expect(actual).toEqual(result);
	});
});

// =====================================================================
// PromiseLike (.then)
// =====================================================================

describe('PromiseLike (.then)', () => {
	it('.then() resolves to same value as await', async () => {
		const result = { ok: true, logs: ['a'] };
		const execution = createExecution(createMockGen(['a'], result), noop);

		const actual = await new Promise<MockResult>((resolve) => {
			execution.then(resolve);
		});

		expect(actual).toEqual(result);
	});

	it('multiple .then() calls resolve to same value', async () => {
		const result = { ok: true, logs: ['a'] };
		const execution = createExecution(createMockGen(['a'], result), noop);

		const r1 = await new Promise<MockResult>((resolve) => { execution.then(resolve); });
		const r2 = await new Promise<MockResult>((resolve) => { execution.then(resolve); });

		expect(r1).toBe(r2);
	});
});

// =====================================================================
// .result property
// =====================================================================

describe('.result property', () => {
	it('.result is a Promise', () => {
		const execution = createExecution(createMockGen([], { ok: true, logs: [] }), noop);

		expect(execution.result).toBeInstanceOf(Promise);
	});

	it('.result resolves without iteration (internal drain)', async () => {
		const result = { ok: true, logs: ['a', 'b'] };
		const execution = createExecution(createMockGen(['a', 'b'], result), noop);

		const actual = await execution.result;

		expect(actual).toEqual(result);
	});
});

// =====================================================================
// Cancel
// =====================================================================

describe('cancel', () => {
	it('.cancel() is idempotent', () => {
		const execution = createExecution(createMockGen(['a'], { ok: true, logs: ['a'] }), noop);
		execution.cancel();

		expect(() => execution.cancel()).not.toThrow();
	});

	it('cancel before iteration prevents generator execution', async () => {
		let generatorCreated = false;
		const genFn = async function* (): AsyncGenerator<string, MockResult> {
			generatorCreated = true;
			yield 'a';
			return { ok: true, logs: ['a'] };
		};
		const execution = createExecution(genFn, noop);

		execution.cancel();
		await execution.result;

		expect(generatorCreated).toBe(false);
	});

	it('cancel before iteration resolves .result to undefined', async () => {
		const execution = createExecution(createMockGen(['a'], { ok: true, logs: ['a'] }), noop);
		execution.cancel();

		const result = await execution.result;

		expect(result).toBeUndefined();
	});

	it('break in for-await resolves .result without hanging', async () => {
		const items = Array.from({ length: 100 }, (_, i) => `event-${i}`);
		const result = { ok: true, logs: items };
		const execution = createExecution(createMockGen(items, result), noop);

		for await (const _event of execution) {
			break;
		}

		// WHY: generator.return() returns { value: undefined, done: true }
		// for simple mock generators. The key assertion is that .result
		// resolves at all (doesn't deadlock).
		const actual = await execution.result;
		expect(actual).toBeUndefined();
	});

	it('cancelFn is called on cancel', () => {
		const cancelFn = vi.fn();
		const execution = createExecution(createMockGen([], { ok: true, logs: [] }), cancelFn);

		execution.cancel();

		expect(cancelFn).toHaveBeenCalledOnce();
	});
});

// =====================================================================
// Replay (second iteration)
// =====================================================================

describe('replay', () => {
	it('second for-await replays from cached result', async () => {
		const result = { ok: true, logs: ['a', 'b'] };
		const execution = createExecution(createMockGen(['a', 'b'], result), noop);

		const first: string[] = [];
		for await (const event of execution) {
			first.push(event);
		}

		const second: string[] = [];
		for await (const event of execution) {
			second.push(event);
		}

		expect(second).toEqual(first);
	});

	it('replay after await produces same events', async () => {
		const result = { ok: true, logs: ['a', 'b'] };
		const execution = createExecution(createMockGen(['a', 'b'], result), noop);

		await execution;

		const replayed: string[] = [];
		for await (const event of execution) {
			replayed.push(event);
		}

		expect(replayed).toEqual(['a', 'b']);
	});

	it('replay of zero-event execution works', async () => {
		const result = { ok: true, logs: [] as string[] };
		const execution = createExecution(createMockGen([], result), noop);

		await execution;

		const replayed: string[] = [];
		for await (const event of execution) {
			replayed.push(event);
		}

		expect(replayed).toEqual([]);
	});
});

// =====================================================================
// Edge cases
// =====================================================================

describe('edge cases', () => {
	it('immediate-return generator (no yields) resolves correctly', async () => {
		const genFn = async function* (): AsyncGenerator<string, MockResult> {
			return { ok: true, logs: [] };
		};
		const execution = createExecution(genFn, noop);

		const result = await execution;

		expect(result.ok).toBe(true);
	});

	it('generator that throws rejects .result', async () => {
		const genFn = async function* (): AsyncGenerator<string, MockResult> {
			throw new Error('generator blew up');
		};
		const execution = createExecution(genFn, noop);

		await expect(execution.result).rejects.toThrow('Execution generator threw unexpectedly');
	});

	it('.result accessed during live iteration resolves after completion', async () => {
		const result = { ok: true, logs: ['a', 'b'] };
		const execution = createExecution(createMockGen(['a', 'b'], result), noop);

		const collected: string[] = [];
		const resultPromise = execution.result;

		for await (const event of execution) {
			collected.push(event);
		}

		const actual = await resultPromise;

		expect(actual).toEqual(result);
		expect(collected).toEqual(['a', 'b']);
	});
});
