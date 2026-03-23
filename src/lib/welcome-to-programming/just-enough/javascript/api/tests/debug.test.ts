import { describe, it, expect, vi } from 'vitest';

// WHY: raw debug() uses iframe + DOM APIs, unavailable in Node
vi.mock('../../evaluating/debug/index.js', () => ({
	default: vi.fn(),
}));

import debug from '../debug.js';
import rawDebug from '../../evaluating/debug/index.js';

const mockedDebug = vi.mocked(rawDebug);

describe('debug', () => {
	describe('validation failures', () => {
		it('returns ok false for unparseable code', async () => {
			const result = await debug('let = ;', 100);
			expect(result.ok).toBe(false);
		});

		it('sets parse error for unparseable code', async () => {
			const result = await debug('let = ;', 100);
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('parse');
		});

		it('does not call raw debug for unparseable code', async () => {
			await debug('let = ;', 100);
			expect(mockedDebug).not.toHaveBeenCalled();
		});

		it('returns ok false for code with rejections', async () => {
			const result = await debug('var x = 5;', 100);
			expect(result.ok).toBe(false);
		});

		it('sets rejections for code with rejections', async () => {
			const result = await debug('var x = 5;', 100);
			expect(result.rejections).toBeDefined();
			expect(result.rejections!.length).toBeGreaterThan(0);
		});

		it('does not call raw debug for code with rejections', async () => {
			await debug('var x = 5;', 100);
			expect(mockedDebug).not.toHaveBeenCalled();
		});
	});

	describe('successful execution', () => {
		it('returns ok true when debug completes', async () => {
			mockedDebug.mockResolvedValueOnce(undefined);

			const result = await debug('let x = 5;\n', 100);
			expect(result.ok).toBe(true);
		});

		it('includes warnings from validation', async () => {
			mockedDebug.mockResolvedValueOnce(undefined);

			const result = await debug('let x = 5;\n', 100);
			expect(result.warnings).toBeDefined();
		});

		it('passes code and maxIterations to raw debug', async () => {
			mockedDebug.mockResolvedValueOnce(undefined);

			await debug('let x = 5;\n', 50);
			expect(mockedDebug).toHaveBeenCalledWith('let x = 5;\n', 50);
		});
	});

	describe('execution errors', () => {
		it('returns ok false when raw debug rejects', async () => {
			mockedDebug.mockRejectedValueOnce(
				new Error('Failed to access iframe document'),
			);

			const result = await debug('let x = 5;\n', 100);
			expect(result.ok).toBe(false);
		});

		it('sets error with kind javascript on rejection', async () => {
			mockedDebug.mockRejectedValueOnce(
				new Error('Failed to access iframe document'),
			);

			const result = await debug('let x = 5;\n', 100);
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('javascript');
		});

		it('includes error name and message from rejection', async () => {
			mockedDebug.mockRejectedValueOnce(
				new Error('Failed to access iframe document'),
			);

			const result = await debug('let x = 5;\n', 100);
			expect(result.error!.name).toBe('Error');
			expect(result.error!.message).toBe(
				'Failed to access iframe document',
			);
		});
	});

	describe('iteration limit errors', () => {
		it('returns ok false on RangeError', async () => {
			mockedDebug.mockRejectedValueOnce(
				new RangeError('loop 1 exceeded 100 iterations'),
			);

			const result = await debug('let x = 5;\n', 100);
			expect(result.ok).toBe(false);
		});

		it('sets error with kind iteration-limit', async () => {
			mockedDebug.mockRejectedValueOnce(
				new RangeError('loop 1 exceeded 100 iterations'),
			);

			const result = await debug('let x = 5;\n', 100);
			expect(result.error!.kind).toBe('iteration-limit');
		});

		it('includes limit value from maxIterations', async () => {
			mockedDebug.mockRejectedValueOnce(
				new RangeError('loop 1 exceeded 50 iterations'),
			);

			const result = await debug('let x = 5;\n', 50);
			expect((result.error as { limit: number }).limit).toBe(50);
		});

		it('sets phase to execution for iteration limit', async () => {
			mockedDebug.mockRejectedValueOnce(
				new RangeError('loop 1 exceeded 100 iterations'),
			);

			const result = await debug('let x = 5;\n', 100);
			expect(
				(result.error as { phase: string }).phase,
			).toBe('execution');
		});
	});

	describe('absence of fields', () => {
		it('does not set warnings for parse errors', async () => {
			const result = await debug('let = ;', 100);
			expect(result.warnings).toBeUndefined();
		});

		it('does not set rejections for parse errors', async () => {
			const result = await debug('let = ;', 100);
			expect(result.rejections).toBeUndefined();
		});

		it('does not set error for rejections', async () => {
			const result = await debug('var x = 5;', 100);
			expect(result.error).toBeUndefined();
		});

		it('does not set error for successful execution', async () => {
			mockedDebug.mockResolvedValueOnce(undefined);

			const result = await debug('let x = 5;\n', 100);
			expect(result.error).toBeUndefined();
		});

		it('does not set rejections for successful execution', async () => {
			mockedDebug.mockResolvedValueOnce(undefined);

			const result = await debug('let x = 5;\n', 100);
			expect(result.rejections).toBeUndefined();
		});
	});

	describe('result is frozen', () => {
		it('result is frozen on success', async () => {
			mockedDebug.mockResolvedValueOnce(undefined);

			const result = await debug('let x = 5;\n', 100);
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('result is frozen on error', async () => {
			mockedDebug.mockRejectedValueOnce(new Error('boom'));

			const result = await debug('let x = 5;\n', 100);
			expect(Object.isFrozen(result)).toBe(true);
		});
	});
});
