/**
 * @file Layer 4b: trace() cancel semantics, replay, PromiseLike,
 * Execution interface edge cases.
 *
 * Tests the Execution wrapper's async iteration, cancellation,
 * and caching behavior through the full Worker pipeline.
 */

import { describe, expect, it, vi } from 'vitest';

import trace from '../trace.js';

import type { TraceEvent } from '../../evaluating/trace/tracing/types.js';

vi.setConfig({ testTimeout: 60000 });

describe('trace Execution interface', () => {
	describe('PromiseLike', () => {
		it('await resolves to TraceResult', async () => {
			const execution = trace('let x = 5;\n');
			const result = await execution;

			expect(result.ok).toBe(true);
		});

		it('validation failure resolves immediately via await', async () => {
			const result = await trace('let = ;');

			expect(result.ok).toBe(false);
			expect(result.error!.kind).toBe('parse');
		});
	});

	describe('.cancel()', () => {
		it('has .cancel() method', () => {
			const execution = trace('let x = 5;\n');

			expect(typeof execution.cancel).toBe('function');
		});

		it('.cancel() on validation failure does not throw', () => {
			const execution = trace('let = ;');

			expect(() => execution.cancel()).not.toThrow();
		});

		it('.cancel() is idempotent', () => {
			const execution = trace('let x = 5;\n');
			execution.cancel();

			expect(() => execution.cancel()).not.toThrow();
		});

		it('break in for-await resolves .result without hanging', async () => {
			const execution = trace(
				'let i = 0;\n\nwhile (true) {\n\ti = i + 1;\n}\n',
				{ seconds: 30 },
			);
			const collected: TraceEvent[] = [];

			for await (const event of execution) {
				collected.push(event);
				if (collected.length >= 3) break;
			}

			// WHY: the key assertion is that .result resolves at all
			// (doesn't deadlock). The value may be undefined if the
			// generator's finally block doesn't return a structured result.
			const result = await execution.result;
			expect(collected.length).toBe(3);
			void result;
		});
	});

	describe('validation/format failure iteration', () => {
		it('parse error yields zero events', async () => {
			const execution = trace('let = ;');
			const collected: TraceEvent[] = [];

			for await (const event of execution) {
				collected.push(event);
			}

			expect(collected.length).toBe(0);
		});

		it('format error yields zero events', async () => {
			const execution = trace('let x=5;');
			const collected: TraceEvent[] = [];

			for await (const event of execution) {
				collected.push(event);
			}

			expect(collected.length).toBe(0);
		});
	});

	describe('replay (second iteration)', () => {
		it('second for-await replays from cached result', async () => {
			const execution = trace('let x = 5;\nlet y = 10;\n');

			const first: TraceEvent[] = [];
			for await (const event of execution) {
				first.push(event);
			}
			expect(first.length).toBeGreaterThan(0);

			const second: TraceEvent[] = [];
			for await (const event of execution) {
				second.push(event);
			}

			expect(second.length).toBe(first.length);
		});

		it('replayed events have same step numbers', async () => {
			const execution = trace('let x = 5;\nlet y = 10;\n');

			const first: TraceEvent[] = [];
			for await (const event of execution) {
				first.push(event);
			}

			const second: TraceEvent[] = [];
			for await (const event of execution) {
				second.push(event);
			}

			for (let i = 0; i < first.length; i++) {
				expect(second[i].step).toBe(first[i].step);
			}
		});

		it('replay after await produces same event count', async () => {
			const execution = trace('let x = 5;\n');
			const result = await execution;

			const replayed: TraceEvent[] = [];
			for await (const event of execution) {
				replayed.push(event);
			}

			expect(replayed.length).toBe(result.logs!.length);
		});

		it('replay of validation failure yields zero events', async () => {
			const execution = trace('let = ;');
			await execution;

			const collected: TraceEvent[] = [];
			for await (const event of execution) {
				collected.push(event);
			}

			expect(collected.length).toBe(0);
		});
	});

	describe('result immutability', () => {
		it('successful result is frozen', async () => {
			const result = await trace('let x = 5;\n');

			expect(Object.isFrozen(result)).toBe(true);
		});
	});
});
