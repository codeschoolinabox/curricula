import { describe, expect, it } from 'vitest';

import type { AgnosticRunner } from './types.js';

/** Drop-vs-yield, the drain, and consumer iteration. */
export default function registerStreaming(runner: AgnosticRunner): void {
	describe(`streaming (${runner.name})`, () => {
		it('drains every item in worker-post order with no iterator', async () => {
			const handle = runner.run("emit('a'); emit('b'); emit('c');");
			const { items, settlement } = await handle.result;

			expect([items, settlement.outcome]).toEqual([
				['a', 'b', 'c'],
				'completed',
			]);
		});

		it('drops the sentinel and yields the rest', async () => {
			const handle = runner.run("emit('reference:drop'); emit('kept');");
			const { items } = await handle.result;

			expect(items).toEqual(['kept']);
		});

		it('freezes each item at yield', async () => {
			const handle = runner.run('emit({ step: 1 });');
			const { items } = await handle.result;

			expect(Object.isFrozen(items[0])).toBe(true);
		});

		it('pulls ordered items that match the result record', async () => {
			const handle = runner.run("emit('a'); emit('b');");
			const pulled: unknown[] = [];
			for await (const item of handle) {
				pulled.push(item);
			}
			const { items, settlement } = await handle.result;

			expect([pulled, items, settlement.outcome]).toEqual([
				['a', 'b'],
				['a', 'b'],
				'completed',
			]);
		});

		it('settles cancelled with kept items on an early break', async () => {
			const handle = runner.run("emit('a'); emit('b');");
			const yielded: unknown[] = [];
			for await (const item of handle) {
				yielded.push(item);
				break;
			}
			const { items, settlement } = await handle.result;

			expect([yielded, items, settlement.outcome]).toEqual([
				['a'],
				['a'],
				'cancelled',
			]);
		});
	});
}
