import { describe, it, expect, vi } from 'vitest';

import type { AranStep } from '../../evaluating/trace/record/types.js';
import type { TraceResult } from '../types.js';

// WHY: createRecordGenerator uses Web Workers + SharedArrayBuffer,
// unavailable in Node. Mock it to return a controlled async generator.
vi.mock('../../evaluating/trace/record/record.js', () => ({
	default: vi.fn(),
}));

vi.mock('../format.js', () => ({
	checkFormat: vi.fn(() => ({ formatted: true })),
	format: vi.fn((code: string) => code),
}));

import trace from '../trace.js';
import createRecordGenerator from '../../evaluating/trace/record/record.js';
import { checkFormat } from '../format.js';

const mockedGenerator = vi.mocked(createRecordGenerator);
const mockedCheckFormat = vi.mocked(checkFormat);

/**
 * Creates a mock async generator that yields the given steps
 * and returns the given result.
 */
function createMockGenerator(
	steps: readonly AranStep[],
	result: TraceResult,
): () => AsyncGenerator<AranStep, TraceResult> {
	return async function* () {
		for (const step of steps) {
			yield step;
		}
		return result;
	};
}

describe('trace', () => {
	describe('validation failures', () => {
		it('returns ok false for unparseable code', async () => {
			const result = await trace('let = ;', { seconds: 5 });
			expect(result.ok).toBe(false);
		});

		it('sets parse error for unparseable code', async () => {
			const result = await trace('let = ;', { seconds: 5 });
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('parse');
		});

		it('does not call generator for unparseable code', async () => {
			await trace('let = ;', { seconds: 5 });
			expect(mockedGenerator).not.toHaveBeenCalled();
		});

		it('returns ok false for code with rejections', async () => {
			const result = await trace('var x = 5;', { seconds: 5 });
			expect(result.ok).toBe(false);
		});

		it('sets rejections for code with rejections', async () => {
			const result = await trace('var x = 5;', { seconds: 5 });
			expect(result.rejections).toBeDefined();
			expect(result.rejections!.length).toBeGreaterThan(0);
		});

		it('does not call generator for code with rejections', async () => {
			await trace('var x = 5;', { seconds: 5 });
			expect(mockedGenerator).not.toHaveBeenCalled();
		});

		it('does not set logs for validation failures', async () => {
			const result = await trace('let = ;', { seconds: 5 });
			expect(result.logs).toBeUndefined();
		});
	});

	describe('successful execution', () => {
		it('returns ok true when code traces without errors', async () => {
			const steps: AranStep[] = [createStep('declare', 'x')];
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(steps, { ok: true, logs: steps })(),
			);

			const result = await trace('let x = 5;\n', { seconds: 5 });
			expect(result.ok).toBe(true);
		});

		it('includes logs in the result', async () => {
			const steps: AranStep[] = [
				createStep('declare', 'x'),
				createStep('initialize', 'x'),
			];
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(steps, { ok: true, logs: steps })(),
			);

			const result = await trace('let x = 5;\n', { seconds: 5 });
			expect(result.logs).toBeDefined();
			expect(result.logs).toHaveLength(2);
		});

		it('passes code and seconds to generator', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			await trace('let x = 5;\n', { seconds: 3 });
			expect(mockedGenerator).toHaveBeenCalledWith(
				'let x = 5;\n',
				3,
				undefined,
				undefined,
			);
		});

		it('defaults to 5 seconds when no config provided', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			await trace('let x = 5;\n');
			expect(mockedGenerator).toHaveBeenCalledWith(
				'let x = 5;\n',
				5,
				undefined,
				undefined,
			);
		});

		it('passes options to generator', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);
			const options = { variables: false };

			await trace('let x = 5;\n', { seconds: 3, options });
			expect(mockedGenerator).toHaveBeenCalledWith(
				'let x = 5;\n',
				3,
				options,
				undefined,
			);
		});

		it('passes iterations to generator', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			await trace('let x = 5;\n', { seconds: 3, iterations: 100 });
			expect(mockedGenerator).toHaveBeenCalledWith(
				'let x = 5;\n',
				3,
				undefined,
				100,
			);
		});

		it('does not set error for successful execution', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const result = await trace('let x = 5;\n', { seconds: 5 });
			expect(result.error).toBeUndefined();
		});

		it('does not set rejections for successful execution', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const result = await trace('let x = 5;\n', { seconds: 5 });
			expect(result.rejections).toBeUndefined();
		});
	});

	describe('runtime errors', () => {
		it('returns ok false when trace contains exception', async () => {
			const steps: AranStep[] = [
				createExceptionStep('ReferenceError', 'x is not defined'),
			];
			const result: TraceResult = {
				ok: false,
				error: {
					kind: 'javascript',
					name: 'ReferenceError',
					message: 'x is not defined',
					phase: 'execution',
				},
				logs: steps,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(steps, result)(),
			);

			const actual = await trace('let x = 5;\n', { seconds: 5 });
			expect(actual.ok).toBe(false);
		});

		it('sets error with kind javascript', async () => {
			const steps: AranStep[] = [
				createExceptionStep('ReferenceError', 'x is not defined'),
			];
			const result: TraceResult = {
				ok: false,
				error: {
					kind: 'javascript',
					name: 'ReferenceError',
					message: 'x is not defined',
					phase: 'execution',
				},
				logs: steps,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(steps, result)(),
			);

			const actual = await trace('let x = 5;\n', { seconds: 5 });
			expect(actual.error).toBeDefined();
			expect(actual.error!.kind).toBe('javascript');
		});

		it('includes logs alongside error', async () => {
			const steps: AranStep[] = [
				createStep('declare', 'x'),
				createExceptionStep('TypeError', 'oops'),
			];
			const result: TraceResult = {
				ok: false,
				error: {
					kind: 'javascript',
					name: 'TypeError',
					message: 'oops',
					phase: 'execution',
				},
				logs: steps,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(steps, result)(),
			);

			const actual = await trace('let x = 5;\n', { seconds: 5 });
			expect(actual.logs).toHaveLength(2);
		});

		it('detects last exception from generator result', async () => {
			const steps: AranStep[] = [
				createExceptionStep('TypeError', 'first'),
				createExceptionStep('ReferenceError', 'second'),
			];
			const result: TraceResult = {
				ok: false,
				error: {
					kind: 'javascript',
					name: 'ReferenceError',
					message: 'second',
					phase: 'execution',
				},
				logs: steps,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(steps, result)(),
			);

			const actual = await trace('let x = 5;\n', { seconds: 5 });
			expect(actual.error!.name).toBe('ReferenceError');
		});
	});

	describe('timeout errors', () => {
		it('returns ok false on timeout', async () => {
			const steps: AranStep[] = [
				createExceptionStep(
					'TimeoutError',
					'Execution exceeded 5 second time limit',
				),
			];
			const result: TraceResult = {
				ok: false,
				error: {
					kind: 'timeout',
					name: 'TimeoutError',
					message: 'Execution exceeded 5 second time limit',
					phase: 'execution',
					limit: 5,
				},
				logs: steps,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(steps, result)(),
			);

			const actual = await trace('let x = 5;\n', { seconds: 5 });
			expect(actual.ok).toBe(false);
		});

		it('sets error with kind timeout', async () => {
			const steps: AranStep[] = [
				createExceptionStep(
					'TimeoutError',
					'Execution exceeded 5 second time limit',
				),
			];
			const result: TraceResult = {
				ok: false,
				error: {
					kind: 'timeout',
					name: 'TimeoutError',
					message: 'Execution exceeded 5 second time limit',
					phase: 'execution',
					limit: 5,
				},
				logs: steps,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(steps, result)(),
			);

			const actual = await trace('let x = 5;\n', { seconds: 5 });
			expect(actual.error!.kind).toBe('timeout');
		});

		it('includes limit value on timeout error', async () => {
			const steps: AranStep[] = [
				createExceptionStep(
					'TimeoutError',
					'Execution exceeded 3 second time limit',
				),
			];
			const result: TraceResult = {
				ok: false,
				error: {
					kind: 'timeout',
					name: 'TimeoutError',
					message: 'Execution exceeded 3 second time limit',
					phase: 'execution',
					limit: 3,
				},
				logs: steps,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(steps, result)(),
			);

			const actual = await trace('let x = 5;\n', { seconds: 3 });
			expect((actual.error as { limit: number }).limit).toBe(3);
		});
	});

	describe('iteration limit', () => {
		it('returns iteration-limit error from generator', async () => {
			const result: TraceResult = {
				ok: false,
				error: {
					kind: 'iteration-limit',
					name: 'RangeError',
					message: 'Loop exceeded 50 iterations',
					phase: 'execution',
					limit: 50,
				},
				logs: [],
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], result)(),
			);

			const actual = await trace('let x = 5;\n', {
				seconds: 5,
				iterations: 50,
			});
			expect(actual.ok).toBe(false);
			expect(actual.error!.kind).toBe('iteration-limit');
			expect((actual.error as { limit: number }).limit).toBe(50);
		});
	});

	describe('absence of fields', () => {
		it('does not set logs for parse errors', async () => {
			const result = await trace('let = ;', { seconds: 5 });
			expect(result.logs).toBeUndefined();
		});

		it('does not set rejections for parse errors', async () => {
			const result = await trace('let = ;', { seconds: 5 });
			expect(result.rejections).toBeUndefined();
		});

		it('does not set error for rejections', async () => {
			const result = await trace('var x = 5;', { seconds: 5 });
			expect(result.error).toBeUndefined();
		});

		it('does not set logs for rejections', async () => {
			const result = await trace('var x = 5;', { seconds: 5 });
			expect(result.logs).toBeUndefined();
		});
	});

	describe('Execution interface', () => {
		it('is PromiseLike — await resolves to TraceResult', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const execution = trace('let x = 5;\n', { seconds: 5 });
			const result = await execution;
			expect(result.ok).toBe(true);
		});

		it('has .result Promise', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const execution = trace('let x = 5;\n', { seconds: 5 });
			expect(execution.result).toBeInstanceOf(Promise);
			const result = await execution.result;
			expect(result.ok).toBe(true);
		});

		it('has .cancel() method', () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const execution = trace('let x = 5;\n', { seconds: 5 });
			expect(typeof execution.cancel).toBe('function');
		});

		it('is AsyncIterable — yields steps', async () => {
			const steps: AranStep[] = [
				createStep('declare', 'x'),
				createStep('initialize', 'x'),
			];
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(steps, { ok: true, logs: steps })(),
			);

			const execution = trace('let x = 5;\n', { seconds: 5 });
			const collected: AranStep[] = [];
			for await (const step of execution) {
				collected.push(step);
			}

			expect(collected).toHaveLength(2);
			expect(collected[0].operation).toBe('declare');
			expect(collected[1].operation).toBe('initialize');
		});

		it('validation failure resolves immediately via PromiseLike', async () => {
			const result = await trace('let = ;', { seconds: 5 });
			expect(result.ok).toBe(false);
			expect(result.error!.kind).toBe('parse');
		});

		it('validation failure yields no steps', async () => {
			const execution = trace('let = ;', { seconds: 5 });
			const collected: AranStep[] = [];
			for await (const step of execution) {
				collected.push(step);
			}
			expect(collected).toHaveLength(0);
		});

		it('.cancel() on blocked execution does not throw', () => {
			const execution = trace('let = ;', { seconds: 5 });
			expect(() => execution.cancel()).not.toThrow();
		});
	});

	describe('format gate', () => {
		it('returns ok false with formatting error for unformatted code', async () => {
			mockedCheckFormat.mockReturnValueOnce({ formatted: false });

			const result = await trace('let x = 5;\n', { seconds: 5 });
			expect(result.ok).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('formatting');
		});

		it('does not call generator for unformatted code', async () => {
			mockedGenerator.mockClear();
			mockedCheckFormat.mockReturnValueOnce({ formatted: false });

			await trace('let x = 5;\n', { seconds: 5 });
			expect(mockedGenerator).not.toHaveBeenCalled();
		});
	});

	describe('result immutability', () => {
		it('validation failure result is frozen', async () => {
			const result = await trace('let = ;', { seconds: 5 });
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('format gate result is frozen', async () => {
			mockedCheckFormat.mockReturnValueOnce({ formatted: false });

			const result = await trace('let x = 5;\n', { seconds: 5 });
			expect(Object.isFrozen(result)).toBe(true);
		});
	});
});

// --- Test helpers ---

function createStep(
	operation: AranStep['operation'],
	name: string | null = null,
): AranStep {
	return {
		step: 0,
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
	errorName: string,
	errorMessage: string,
): AranStep {
	return {
		step: 0,
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
