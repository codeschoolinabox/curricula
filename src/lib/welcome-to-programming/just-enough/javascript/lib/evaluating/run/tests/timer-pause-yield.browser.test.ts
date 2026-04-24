/**
 * @file Timer pauses during yield — browser project.
 *
 * Verifies M.5: the cumulative execution timer is paused while
 * the engine is yielded to the consumer between `.next()` pulls.
 * Stepping time no longer counts against `options.seconds`.
 *
 * @remarks Paired with M.3's EVENT_READY signal: the timer can
 * be paused around yield AND correctly reschedule if a fire
 * lands in the worker-emitted-event-but-not-yet-dequeued race
 * window. Together they close the "Known inconsistency" noted
 * in pre-merge docs. See DOCS.md § Timer-vs-yield.
 */

import { describe, expect, it, vi } from 'vitest';

import format from '../../../formatting/format.js';
import createRunGenerator from '../run.js';

vi.setConfig({ testTimeout: 60_000 });

describe('createRunGenerator timer pauses during yield (browser)', () => {
	describe('consumer stalls between pulls', () => {
		it('seconds budget is not consumed while yielded to consumer', async () => {
			const code = format('console.log(1);\nconsole.log(2);\n');
			const gen = createRunGenerator(code, { seconds: 0.2 });
			await gen.next();
			await new Promise((resolve) => setTimeout(resolve, 500));
			const result = await gen.result;
			expect(result.ok).toBe(true);
		});
	});

	describe('Worker runs without emitting events', () => {
		it('timer fires timeout within remainingMs when no traps are hit', async () => {
			const code = format('while (true) { let x = 1; }\n');
			const result = await createRunGenerator(code, { seconds: 0.1 });
			if (result.ok) throw new Error('expected ok:false');
			expect(result.error.kind).toBe('timeout');
		});
	});

	describe('cancel interacts correctly with paused timer', () => {
		it('cancel after stall beyond seconds returns CancelEvent, not TimeoutError', async () => {
			const code = format('console.log(1);\nconsole.log(2);\n');
			const gen = createRunGenerator(code, { seconds: 0.2 });
			await gen.next();
			await new Promise((resolve) => setTimeout(resolve, 500));
			gen.cancel();
			const result = await gen.result;
			if (!result.ok) throw new Error('expected ok:true (cancel, not timeout)');
			expect(result.logs.at(-1)).toEqual({ event: 'cancel' });
		});
	});
});
