import { describe, it, expect, vi } from 'vitest';

import type { RunEvent } from '../../evaluating/shared/types.js';

// WHY: raw run() uses Web Workers + SharedArrayBuffer, unavailable in Node
vi.mock('../../evaluating/run/run.js', () => ({
	default: vi.fn(),
}));

import run from '../run.js';
import rawRun from '../../evaluating/run/run.js';

const mockedRun = vi.mocked(rawRun);

describe('run', () => {
	describe('validation failures', () => {
		it('returns ok false for unparseable code', async () => {
			const result = await run('let = ;', 5);
			expect(result.ok).toBe(false);
		});

		it('sets parse error for unparseable code', async () => {
			const result = await run('let = ;', 5);
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('parse');
		});

		it('does not call raw run for unparseable code', async () => {
			await run('let = ;', 5);
			expect(mockedRun).not.toHaveBeenCalled();
		});

		it('returns ok false for code with rejections', async () => {
			const result = await run('var x = 5;', 5);
			expect(result.ok).toBe(false);
		});

		it('sets rejections for code with rejections', async () => {
			const result = await run('var x = 5;', 5);
			expect(result.rejections).toBeDefined();
			expect(result.rejections!.length).toBeGreaterThan(0);
		});

		it('does not call raw run for code with rejections', async () => {
			await run('var x = 5;', 5);
			expect(mockedRun).not.toHaveBeenCalled();
		});

		it('does not set logs for validation failures', async () => {
			const result = await run('let = ;', 5);
			expect(result.logs).toBeUndefined();
		});
	});

	describe('successful execution', () => {
		it('returns ok true when code runs without errors', async () => {
			const logs: readonly RunEvent[] = Object.freeze([
				{ event: 'log' as const, args: ['hello'], line: 1 },
			]);
			mockedRun.mockResolvedValueOnce(logs);

			const result = await run('let x = 5;\n', 5);
			expect(result.ok).toBe(true);
		});

		it('includes logs in the result', async () => {
			const logs: readonly RunEvent[] = Object.freeze([
				{ event: 'log' as const, args: ['hello'], line: 1 },
			]);
			mockedRun.mockResolvedValueOnce(logs);

			const result = await run('let x = 5;\n', 5);
			expect(result.logs).toBeDefined();
			expect(result.logs).toHaveLength(1);
		});

		it('includes warnings from validation', async () => {
			mockedRun.mockResolvedValueOnce(Object.freeze([]));

			const result = await run('let x = 5;\n', 5);
			expect(result.warnings).toBeDefined();
		});

		it('passes code and maxSeconds to raw run', async () => {
			mockedRun.mockResolvedValueOnce(Object.freeze([]));

			await run('let x = 5;\n', 3);
			expect(mockedRun).toHaveBeenCalledWith('let x = 5;\n', 3);
		});
	});

	describe('runtime errors', () => {
		it('returns ok false when code throws', async () => {
			const logs: readonly RunEvent[] = Object.freeze([
				{
					event: 'error' as const,
					name: 'ReferenceError',
					message: 'x is not defined',
					line: 1,
					phase: 'execution' as const,
				},
			]);
			mockedRun.mockResolvedValueOnce(logs);

			const result = await run('let x = 5;\n', 5);
			expect(result.ok).toBe(false);
		});

		it('sets error with kind javascript', async () => {
			const logs: readonly RunEvent[] = Object.freeze([
				{
					event: 'error' as const,
					name: 'ReferenceError',
					message: 'x is not defined',
					line: 1,
					phase: 'execution' as const,
				},
			]);
			mockedRun.mockResolvedValueOnce(logs);

			const result = await run('let x = 5;\n', 5);
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('javascript');
		});

		it('includes logs alongside error', async () => {
			const logs: readonly RunEvent[] = Object.freeze([
				{ event: 'log' as const, args: ['before'], line: 1 },
				{
					event: 'error' as const,
					name: 'TypeError',
					message: 'oops',
					phase: 'execution' as const,
				},
			]);
			mockedRun.mockResolvedValueOnce(logs);

			const result = await run('let x = 5;\n', 5);
			expect(result.logs).toHaveLength(2);
		});
	});

	describe('timeout errors', () => {
		it('returns ok false on timeout', async () => {
			const logs: readonly RunEvent[] = Object.freeze([
				{
					event: 'error' as const,
					name: 'TimeoutError',
					message: 'Execution exceeded 5 second time limit',
					phase: 'execution' as const,
				},
			]);
			mockedRun.mockResolvedValueOnce(logs);

			const result = await run('let x = 5;\n', 5);
			expect(result.ok).toBe(false);
		});

		it('sets error with kind timeout', async () => {
			const logs: readonly RunEvent[] = Object.freeze([
				{
					event: 'error' as const,
					name: 'TimeoutError',
					message: 'Execution exceeded 5 second time limit',
					phase: 'execution' as const,
				},
			]);
			mockedRun.mockResolvedValueOnce(logs);

			const result = await run('let x = 5;\n', 5);
			expect(result.error!.kind).toBe('timeout');
		});

		it('includes limit value on timeout error', async () => {
			const logs: readonly RunEvent[] = Object.freeze([
				{
					event: 'error' as const,
					name: 'TimeoutError',
					message: 'Execution exceeded 3 second time limit',
					phase: 'execution' as const,
				},
			]);
			mockedRun.mockResolvedValueOnce(logs);

			const result = await run('let x = 5;\n', 3);
			expect((result.error as { limit: number }).limit).toBe(3);
		});
	});

	describe('absence of fields', () => {
		it('does not set warnings for parse errors', async () => {
			const result = await run('let = ;', 5);
			expect(result.warnings).toBeUndefined();
		});

		it('does not set rejections for parse errors', async () => {
			const result = await run('let = ;', 5);
			expect(result.rejections).toBeUndefined();
		});

		it('does not set error for rejections', async () => {
			const result = await run('var x = 5;', 5);
			expect(result.error).toBeUndefined();
		});

		it('does not set logs for rejections', async () => {
			const result = await run('var x = 5;', 5);
			expect(result.logs).toBeUndefined();
		});

		it('does not set error for successful execution', async () => {
			mockedRun.mockResolvedValueOnce(Object.freeze([]));

			const result = await run('let x = 5;\n', 5);
			expect(result.error).toBeUndefined();
		});

		it('does not set rejections for successful execution', async () => {
			mockedRun.mockResolvedValueOnce(Object.freeze([]));

			const result = await run('let x = 5;\n', 5);
			expect(result.rejections).toBeUndefined();
		});
	});

	describe('multi-error detection', () => {
		it('detects last error when multiple exist', async () => {
			const logs: readonly RunEvent[] = Object.freeze([
				{
					event: 'error' as const,
					name: 'TypeError',
					message: 'first',
					phase: 'execution' as const,
				},
				{ event: 'log' as const, args: ['between'], line: 2 },
				{
					event: 'error' as const,
					name: 'ReferenceError',
					message: 'second',
					phase: 'execution' as const,
				},
			]);
			mockedRun.mockResolvedValueOnce(logs);

			const result = await run('let x = 5;\n', 5);
			expect(result.error!.name).toBe('ReferenceError');
			expect(result.error!.message).toBe('second');
		});
	});

	describe('result is frozen', () => {
		it('result is frozen on success', async () => {
			mockedRun.mockResolvedValueOnce(Object.freeze([]));

			const result = await run('let x = 5;\n', 5);
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('result is frozen on error', async () => {
			const logs: readonly RunEvent[] = Object.freeze([
				{
					event: 'error' as const,
					name: 'TypeError',
					message: 'oops',
					phase: 'execution' as const,
				},
			]);
			mockedRun.mockResolvedValueOnce(logs);

			const result = await run('let x = 5;\n', 5);
			expect(Object.isFrozen(result)).toBe(true);
		});
	});
});
