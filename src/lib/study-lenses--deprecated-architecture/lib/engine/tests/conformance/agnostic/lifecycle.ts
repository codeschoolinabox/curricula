import { describe, expect, it } from 'vitest';

import type { AgnosticRunner } from './types.js';

/**
 * Post-start handle lifecycle. Pre-start behavior (laziness, pre-start
 * stops) is proven structurally in tests/evaluate.test.ts, where no
 * transport exists at all.
 */
export default function registerLifecycle(runner: AgnosticRunner): void {
	describe(`lifecycle (${runner.name})`, () => {
		it('memoizes result across a live run', async () => {
			const handle = runner.run('');
			const first = handle.result;
			await first;

			expect(handle.result).toBe(first);
		});

		it('freezes the settlement', async () => {
			const handle = runner.run('');
			const { settlement } = await handle.result;

			expect(Object.isFrozen(settlement)).toBe(true);
		});

		it('freezes the items array', async () => {
			const handle = runner.run("emit('a');");
			const { items } = await handle.result;

			expect(Object.isFrozen(items)).toBe(true);
		});

		it('yields nothing when iterating after settlement', async () => {
			const handle = runner.run("emit('a');");
			await handle.result;
			const pulled: unknown[] = [];
			for await (const item of handle) {
				pulled.push(item);
			}

			expect(pulled).toEqual([]);
		});

		it('treats a cancel after settlement as a no-op', async () => {
			const handle = runner.run('');
			const first = await handle.result;
			handle.cancel();
			const second = await handle.result;

			expect(second).toBe(first);
		});
	});
}
