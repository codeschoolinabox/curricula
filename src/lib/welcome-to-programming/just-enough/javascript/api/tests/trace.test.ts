import { describe, it, expect, vi } from 'vitest';

import type { AranStep } from '../../evaluating/trace/record/types.js';

// WHY: raw record() uses Web Workers + SharedArrayBuffer, unavailable in Node
vi.mock('../../evaluating/trace/record/record.js', () => ({
	default: vi.fn(),
}));

import trace from '../trace.js';
import rawRecord from '../../evaluating/trace/record/record.js';

const mockedRecord = vi.mocked(rawRecord);

describe('trace', () => {
	describe('validation failures', () => {
		it('returns ok false for unparseable code', async () => {
			const result = await trace('let = ;', 5);
			expect(result.ok).toBe(false);
		});

		it('sets parse error for unparseable code', async () => {
			const result = await trace('let = ;', 5);
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('parse');
		});

		it('does not call raw record for unparseable code', async () => {
			await trace('let = ;', 5);
			expect(mockedRecord).not.toHaveBeenCalled();
		});

		it('returns ok false for code with rejections', async () => {
			const result = await trace('var x = 5;', 5);
			expect(result.ok).toBe(false);
		});

		it('sets rejections for code with rejections', async () => {
			const result = await trace('var x = 5;', 5);
			expect(result.rejections).toBeDefined();
			expect(result.rejections!.length).toBeGreaterThan(0);
		});

		it('does not call raw record for code with rejections', async () => {
			await trace('var x = 5;', 5);
			expect(mockedRecord).not.toHaveBeenCalled();
		});

		it('does not set steps for validation failures', async () => {
			const result = await trace('let = ;', 5);
			expect(result.steps).toBeUndefined();
		});

		it('does not set warnings for parse errors', async () => {
			const result = await trace('let = ;', 5);
			expect(result.warnings).toBeUndefined();
		});

		it('does not set rejections for parse errors', async () => {
			const result = await trace('let = ;', 5);
			expect(result.rejections).toBeUndefined();
		});

		it('does not set error for rejections', async () => {
			const result = await trace('var x = 5;', 5);
			expect(result.error).toBeUndefined();
		});

		it('does not set steps for rejections', async () => {
			const result = await trace('var x = 5;', 5);
			expect(result.steps).toBeUndefined();
		});
	});

	describe('successful execution', () => {
		it('returns ok true when code traces without errors', async () => {
			const steps: readonly AranStep[] = Object.freeze([
				createStep(1, 'declare', 'x'),
			]);
			mockedRecord.mockResolvedValueOnce(steps);

			const result = await trace('let x = 5;\n', 5);
			expect(result.ok).toBe(true);
		});

		it('includes steps in the result', async () => {
			const steps: readonly AranStep[] = Object.freeze([
				createStep(1, 'declare', 'x'),
				createStep(2, 'initialize', 'x'),
			]);
			mockedRecord.mockResolvedValueOnce(steps);

			const result = await trace('let x = 5;\n', 5);
			expect(result.steps).toBeDefined();
			expect(result.steps).toHaveLength(2);
		});

		it('includes warnings from validation', async () => {
			mockedRecord.mockResolvedValueOnce(Object.freeze([]));

			const result = await trace('let x = 5;\n', 5);
			expect(result.warnings).toBeDefined();
		});

		it('passes code and timeout to raw record', async () => {
			mockedRecord.mockResolvedValueOnce(Object.freeze([]));

			await trace('let x = 5;\n', 3);
			expect(mockedRecord).toHaveBeenCalledWith(
				'let x = 5;\n',
				expect.objectContaining({
					meta: expect.objectContaining({
						max: expect.objectContaining({ time: 3000 }),
					}),
				}),
			);
		});

		it('does not set error for successful execution', async () => {
			mockedRecord.mockResolvedValueOnce(Object.freeze([]));

			const result = await trace('let x = 5;\n', 5);
			expect(result.error).toBeUndefined();
		});

		it('does not set rejections for successful execution', async () => {
			mockedRecord.mockResolvedValueOnce(Object.freeze([]));

			const result = await trace('let x = 5;\n', 5);
			expect(result.rejections).toBeUndefined();
		});

		it('passes options to raw record', async () => {
			mockedRecord.mockResolvedValueOnce(Object.freeze([]));
			const options = { variables: false };

			await trace('let x = 5;\n', 3, options);
			expect(mockedRecord).toHaveBeenCalledWith(
				'let x = 5;\n',
				expect.objectContaining({
					options,
				}),
			);
		});
	});

	describe('runtime errors', () => {
		it('returns ok false when trace contains exception', async () => {
			const steps: readonly AranStep[] = Object.freeze([
				createExceptionStep(1, 'ReferenceError', 'x is not defined'),
			]);
			mockedRecord.mockResolvedValueOnce(steps);

			const result = await trace('let x = 5;\n', 5);
			expect(result.ok).toBe(false);
		});

		it('sets error with kind javascript', async () => {
			const steps: readonly AranStep[] = Object.freeze([
				createExceptionStep(1, 'ReferenceError', 'x is not defined'),
			]);
			mockedRecord.mockResolvedValueOnce(steps);

			const result = await trace('let x = 5;\n', 5);
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('javascript');
		});

		it('includes steps alongside error', async () => {
			const steps: readonly AranStep[] = Object.freeze([
				createStep(1, 'declare', 'x'),
				createExceptionStep(2, 'TypeError', 'oops'),
			]);
			mockedRecord.mockResolvedValueOnce(steps);

			const result = await trace('let x = 5;\n', 5);
			expect(result.steps).toHaveLength(2);
		});

		it('detects last exception when multiple exist', async () => {
			const steps: readonly AranStep[] = Object.freeze([
				createExceptionStep(1, 'TypeError', 'first'),
				createExceptionStep(2, 'ReferenceError', 'second'),
			]);
			mockedRecord.mockResolvedValueOnce(steps);

			const result = await trace('let x = 5;\n', 5);
			expect(result.error!.name).toBe('ReferenceError');
		});
	});

	describe('timeout errors', () => {
		it('returns ok false on timeout', async () => {
			const steps: readonly AranStep[] = Object.freeze([
				createExceptionStep(
					1,
					'TimeoutError',
					'Execution exceeded 5 second time limit',
				),
			]);
			mockedRecord.mockResolvedValueOnce(steps);

			const result = await trace('let x = 5;\n', 5);
			expect(result.ok).toBe(false);
		});

		it('sets error with kind timeout', async () => {
			const steps: readonly AranStep[] = Object.freeze([
				createExceptionStep(
					1,
					'TimeoutError',
					'Execution exceeded 5 second time limit',
				),
			]);
			mockedRecord.mockResolvedValueOnce(steps);

			const result = await trace('let x = 5;\n', 5);
			expect(result.error!.kind).toBe('timeout');
		});

		it('includes limit value on timeout error', async () => {
			const steps: readonly AranStep[] = Object.freeze([
				createExceptionStep(
					1,
					'TimeoutError',
					'Execution exceeded 3 second time limit',
				),
			]);
			mockedRecord.mockResolvedValueOnce(steps);

			const result = await trace('let x = 5;\n', 3);
			expect((result.error as { limit: number }).limit).toBe(3);
		});
	});

	describe('result is frozen', () => {
		it('result is frozen on success', async () => {
			mockedRecord.mockResolvedValueOnce(Object.freeze([]));

			const result = await trace('let x = 5;\n', 5);
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('result is frozen on error', async () => {
			const steps: readonly AranStep[] = Object.freeze([
				createExceptionStep(1, 'TypeError', 'oops'),
			]);
			mockedRecord.mockResolvedValueOnce(steps);

			const result = await trace('let x = 5;\n', 5);
			expect(Object.isFrozen(result)).toBe(true);
		});
	});
});

// --- Test helpers ---

function createStep(
	step: number,
	operation: AranStep['operation'],
	name: string | null = null,
): AranStep {
	return {
		step,
		operation,
		name,
		operator: null,
		modifier: null,
		values: [],
		depth: 0,
		scopeType: null,
		nodeType: null,
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
	};
}

function createExceptionStep(
	step: number,
	errorName: string,
	errorMessage: string,
): AranStep {
	return {
		step,
		operation: 'exception',
		name: null,
		operator: null,
		modifier: null,
		values: [errorName, errorMessage],
		depth: 0,
		scopeType: null,
		nodeType: null,
		loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
	};
}
