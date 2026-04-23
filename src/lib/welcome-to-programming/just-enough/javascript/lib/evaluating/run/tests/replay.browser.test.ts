/**
 * @file Native replay on RunHandle — browser project.
 *
 * Verifies DOCS.md § Replay / re-iteration on RunHandle:
 *   - After a run completes (success, error, or cancel), a second
 *     `for await` over the same handle yields the SAME event
 *     references as the first iteration, in order.
 *   - Replay draws from the frozen `logs` array on the settled
 *     RunResult. No Worker respawn, no clone.
 *   - Mid-execution, `[Symbol.asyncIterator]()` returns the live
 *     AsyncGenerator (same behavior as pre-M.4).
 */

import { describe, expect, it, vi } from 'vitest';

import { format } from '../../../../api/format.js';
import createRunGenerator from '../run.js';

vi.setConfig({ testTimeout: 60_000 });

describe('createRunGenerator replay (browser)', () => {
	describe('after happy-path completion', () => {
		it('zero-event program → replay yields no events', async () => {
			const gen = createRunGenerator('let x = 1;\n');
			await gen.result;
			const replayed: unknown[] = [];
			for await (const event of gen) replayed.push(event);
			expect(replayed).toEqual([]);
		});

		it('single-event program → replay yields that event', async () => {
			const gen = createRunGenerator('console.log(1);\n');
			const live: unknown[] = [];
			for await (const event of gen) live.push(event);
			const replayed: unknown[] = [];
			for await (const event of gen) replayed.push(event);
			expect(replayed.length).toBe(live.length);
		});

		it('multi-event program → each replay event === live event (reference identity)', async () => {
			const gen = createRunGenerator(
				'console.log(1);\nconsole.log(2);\nconsole.log(3);\n',
			);
			const live: unknown[] = [];
			for await (const event of gen) live.push(event);
			const replayed: unknown[] = [];
			for await (const event of gen) replayed.push(event);
			expect(replayed.length).toBe(live.length);
			for (let i = 0; i < live.length; i++) {
				expect(replayed[i]).toBe(live[i]);
			}
		});
	});

	describe('after runtime error', () => {
		it('error event appears in replay (thrown-error completion path)', async () => {
			const code = format('for (let i = 0; i < 1000; i = i + 1) { let x = 1; }\n');
			const gen = createRunGenerator(code, { iterations: 5 });
			await gen.result;
			const replayed: { event: string }[] = [];
			for await (const event of gen) replayed.push(event as { event: string });
			const hasError = replayed.some((e) => e.event === 'error');
			expect(hasError).toBe(true);
		});
	});

	describe('after cancel', () => {
		it('cancel event appears as final entry of replay', async () => {
			const gen = createRunGenerator('console.log(1);\n');
			await gen.next();
			gen.cancel();
			await gen.result;
			const replayed: { event: string }[] = [];
			for await (const event of gen) replayed.push(event as { event: string });
			expect(replayed.at(-1)).toEqual({ event: 'cancel' });
		});
	});

	describe('mid-execution', () => {
		it('[Symbol.asyncIterator]() on in-progress handle returns the live generator', () => {
			const gen = createRunGenerator('console.log(1);\n');
			const iter = gen[Symbol.asyncIterator]();
			expect(iter).toBe(gen);
		});
	});
});
