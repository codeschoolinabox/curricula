/**
 * @file InterceptResult.outcome classification tests — browser project.
 *
 * Triangulates buildResult's outcome classification (intercept.ts) across
 * all six paths: complete, cancel-via-explicit, cancel-via-break,
 * timeout, iteration-limit, error. Pins outcome ↔ ok consistency.
 *
 * @remarks Adapted from Test-Design Specialist's N1 + N2 clusters in
 * the termination-contract plan. Every outcome variant gets at least
 * one test that would fail if the classification branch were removed.
 * The `it.each` ok-consistency table prevents a future "add new
 * outcome without wiring ok" bug.
 */

import { describe, expect, it, vi } from 'vitest';

import format from '../../../formatting/format.js';
import createInterceptGenerator from '../intercept.js';

vi.setConfig({ testTimeout: 60_000 });

describe('createInterceptGenerator outcome classification (browser)', () => {
	describe('happy path', () => {
		it('empty program → outcome:complete, ok:true', async () => {
			const result = await createInterceptGenerator('let x = 1;\n');
			expect(result.outcome).toBe('complete');
			expect(result.ok).toBe(true);
		});

		it('console-only program → outcome:complete, ok:true', async () => {
			const code = format('console.log(1);\nconsole.log(2);\n');
			const result = await createInterceptGenerator(code);
			expect(result.outcome).toBe('complete');
			expect(result.ok).toBe(true);
		});
	});

	describe('stopped', () => {
		it('explicit .cancel() after first event → outcome:cancel, ok:true', async () => {
			const gen = createInterceptGenerator('console.log(1);\n');
			await gen.next();
			gen.cancel();
			const result = await gen;
			expect(result.outcome).toBe('cancel');
			expect(result.ok).toBe(true);
		});

		it('for-await break after first event → outcome:cancel, ok:true', async () => {
			const code = format('console.log(1);\nconsole.log(2);\n');
			const gen = createInterceptGenerator(code);
			for await (const event of gen) {
				void event;
				break;
			}
			const result = await gen;
			expect(result.outcome).toBe('cancel');
			expect(result.ok).toBe(true);
		});

		it('cancel before first iterate → outcome:cancel, ok:true (worker never spawned)', async () => {
			const gen = createInterceptGenerator('let x = 1;\n');
			gen.cancel();
			const result = await gen;
			expect(result.outcome).toBe('cancel');
			expect(result.ok).toBe(true);
		});
	});

	describe('failure outcomes', () => {
		it('stuck infinite loop within seconds budget → outcome:timeout, ok:false', async () => {
			const code = format('while (true) { let x = 1; }\n');
			const result = await createInterceptGenerator(code, { seconds: 0.1 });
			expect(result.outcome).toBe('timeout');
			expect(result.ok).toBe(false);
		});

		it('loop exceeds iterations cap → outcome:iteration-limit, ok:false', async () => {
			const code = format(
				'for (let i = 0; i < 1000; i = i + 1) { let x = 1; }\n',
			);
			const result = await createInterceptGenerator(code, { iterations: 5 });
			expect(result.outcome).toBe('iteration-limit');
			expect(result.ok).toBe(false);
		});

		it('unformatted source → outcome:error, ok:false (format gate)', async () => {
			const result = await createInterceptGenerator('let x=1;\n');
			expect(result.outcome).toBe('error');
			expect(result.ok).toBe(false);
		});
	});

	describe('outcome ↔ ok consistency matrix', () => {
		// Drive real runs for each outcome. If someone adds a new outcome
		// variant and forgets to wire ok, one of these rows fails — far
		// stronger than a hand-built Record<string, boolean> tautology.
		it.each([
			{
				label: 'complete → ok:true',
				code: 'let x = 1;\n',
				options: undefined as never,
				expectedOutcome: 'complete' as const,
				expectedOk: true,
			},
			{
				label: 'timeout → ok:false',
				code: format('while (true) { let x = 1; }\n'),
				options: { seconds: 0.1 },
				expectedOutcome: 'timeout' as const,
				expectedOk: false,
			},
			{
				label: 'iteration-limit → ok:false',
				code: format(
					'for (let i = 0; i < 1000; i = i + 1) { let x = 1; }\n',
				),
				options: { iterations: 5 },
				expectedOutcome: 'iteration-limit' as const,
				expectedOk: false,
			},
			{
				label: 'error (format-reject) → ok:false',
				code: 'let x=1;\n',
				options: undefined as never,
				expectedOutcome: 'error' as const,
				expectedOk: false,
			},
		])('$label', async ({ code, options, expectedOutcome, expectedOk }) => {
			const result = await createInterceptGenerator(code, options);
			expect(result.outcome).toBe(expectedOutcome);
			expect(result.ok).toBe(expectedOk);
		});

		it('cancel → ok:true', async () => {
			const gen = createInterceptGenerator('let x = 1;\n');
			gen.cancel();
			const result = await gen;
			expect(result.outcome).toBe('cancel');
			expect(result.ok).toBe(true);
		});
	});

	describe('.fail(reason) — consumer-driven structured termination', () => {
		it('outcome:fail + reason preserved by reference identity through replay', async () => {
			const payload = { kind: 'prediction-wrong', expected: 42, got: 43 };
			const gen = createInterceptGenerator('console.log(1);\n');
			await gen.next();
			gen.fail(payload);
			const result = await gen;
			expect(result.outcome).toBe('fail');
			expect(result.reason).toBe(payload);
		});

		it('.fail() with no reason → outcome:fail, reason:undefined', async () => {
			const gen = createInterceptGenerator('let x = 1;\n');
			gen.fail();
			const result = await gen;
			expect(result.outcome).toBe('fail');
			expect(result.reason).toBe(undefined);
		});

		it('.fail() first-write-wins over subsequent .cancel()', async () => {
			const gen = createInterceptGenerator('let x = 1;\n');
			gen.fail('first');
			gen.cancel();
			const result = await gen;
			expect(result.outcome).toBe('fail');
			expect(result.reason).toBe('first');
		});

		it('.cancel() first-write-wins over subsequent .fail()', async () => {
			const gen = createInterceptGenerator('let x = 1;\n');
			gen.cancel();
			gen.fail('too late');
			const result = await gen;
			expect(result.outcome).toBe('cancel');
			expect(result.reason).toBe(undefined);
		});

		it('.fail() is ok:true (consumer-driven stop, not an error)', async () => {
			const gen = createInterceptGenerator('let x = 1;\n');
			gen.fail({ kind: 'done-early' });
			const result = await gen;
			expect(result.ok).toBe(true);
		});
	});

	describe('logs are pure — no synthetic termination markers', () => {
		it('cancel: logs contain only live events, not a trailing cancel marker', async () => {
			const gen = createInterceptGenerator('console.log(1);\n');
			await gen.next();
			gen.cancel();
			const result = await gen;
			if (!result.logs) throw new Error('expected logs');
			for (const event of result.logs) {
				expect(event.event).not.toBe('cancel');
			}
		});

		it('fail: logs contain only live events, not a trailing fail marker', async () => {
			const gen = createInterceptGenerator('console.log(1);\n');
			await gen.next();
			gen.fail('test');
			const result = await gen;
			if (!result.logs) throw new Error('expected logs');
			for (const event of result.logs) {
				expect((event as { event: string }).event).not.toBe('cancel');
				expect((event as { event: string }).event).not.toBe('fail');
			}
		});
	});
});
