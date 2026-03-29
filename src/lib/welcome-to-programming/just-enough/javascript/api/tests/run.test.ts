import { describe, it, expect, vi } from 'vitest';

import type { RunEvent } from '../../evaluating/shared/types.js';
import type { RunResult } from '../types.js';

// WHY: raw createRunGenerator uses Web Workers + SharedArrayBuffer,
// unavailable in Node. Mock it to return a controlled async generator.
vi.mock('../../evaluating/run/run.js', () => ({
	default: vi.fn(),
}));

// WHY: checkFormat uses recast which may produce different results
// across environments. Mock it to isolate execution flow tests.
vi.mock('../format.js', () => ({
	checkFormat: vi.fn(() => ({ formatted: true })),
	format: vi.fn((code: string) => code),
}));

import run from '../run.js';
import createRunGenerator from '../../evaluating/run/run.js';
import { checkFormat } from '../format.js';

const mockedGenerator = vi.mocked(createRunGenerator);
const mockedCheckFormat = vi.mocked(checkFormat);

/**
 * Creates a mock async generator that yields the given events
 * and returns the given result.
 */
function createMockGenerator(
	events: readonly RunEvent[],
	result: RunResult,
): () => AsyncGenerator<RunEvent, RunResult> {
	return async function* () {
		for (const event of events) {
			yield event;
		}
		return result;
	};
}

describe('run', () => {
	describe('validation failures', () => {
		it('returns ok false for unparseable code', async () => {
			const result = await run('let = ;', { seconds: 5 });
			expect(result.ok).toBe(false);
		});

		it('sets parse error for unparseable code', async () => {
			const result = await run('let = ;', { seconds: 5 });
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('parse');
		});

		it('does not call generator for unparseable code', async () => {
			await run('let = ;', { seconds: 5 });
			expect(mockedGenerator).not.toHaveBeenCalled();
		});

		it('returns ok false for code with rejections', async () => {
			const result = await run('var x = 5;', { seconds: 5 });
			expect(result.ok).toBe(false);
		});

		it('sets rejections for code with rejections', async () => {
			const result = await run('var x = 5;', { seconds: 5 });
			expect(result.rejections).toBeDefined();
			expect(result.rejections!.length).toBeGreaterThan(0);
		});

		it('does not call generator for code with rejections', async () => {
			await run('var x = 5;', { seconds: 5 });
			expect(mockedGenerator).not.toHaveBeenCalled();
		});

		it('does not set logs for validation failures', async () => {
			const result = await run('let = ;', { seconds: 5 });
			expect(result.logs).toBeUndefined();
		});
	});

	describe('successful execution', () => {
		it('returns ok true when code runs without errors', async () => {
			const logs: RunEvent[] = [
				{ event: 'log' as const, args: ['hello'], line: 1 },
			];
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(logs, { ok: true, logs })(),
			);

			const result = await run('let x = 5;\n', { seconds: 5 });
			expect(result.ok).toBe(true);
		});

		it('includes logs in the result', async () => {
			const logs: RunEvent[] = [
				{ event: 'log' as const, args: ['hello'], line: 1 },
			];
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(logs, { ok: true, logs })(),
			);

			const result = await run('let x = 5;\n', { seconds: 5 });
			expect(result.logs).toBeDefined();
			expect(result.logs).toHaveLength(1);
		});

		it('passes seconds to generator', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			await run('let x = 5;\n', { seconds: 3 });
			expect(mockedGenerator).toHaveBeenCalledWith(
				'let x = 5;\n',
				3,
				undefined,
			);
		});

		it('defaults to 5 seconds when no config provided', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			await run('let x = 5;\n');
			expect(mockedGenerator).toHaveBeenCalledWith(
				'let x = 5;\n',
				5,
				undefined,
			);
		});

		it('passes iterations to generator', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			await run('let x = 5;\n', { seconds: 5, iterations: 100 });
			expect(mockedGenerator).toHaveBeenCalledWith(
				'let x = 5;\n',
				5,
				100,
			);
		});
	});

	describe('runtime errors', () => {
		it('returns ok false when code throws', async () => {
			const logs: RunEvent[] = [
				{
					event: 'error' as const,
					name: 'ReferenceError',
					message: 'x is not defined',
					line: 1,
					phase: 'execution' as const,
				},
			];
			const result: RunResult = {
				ok: false,
				error: {
					kind: 'javascript',
					name: 'ReferenceError',
					message: 'x is not defined',
					line: 1,
					phase: 'execution',
				},
				logs,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(logs, result)(),
			);

			const actual = await run('let x = 5;\n', { seconds: 5 });
			expect(actual.ok).toBe(false);
		});

		it('sets error with kind javascript', async () => {
			const logs: RunEvent[] = [
				{
					event: 'error' as const,
					name: 'ReferenceError',
					message: 'x is not defined',
					line: 1,
					phase: 'execution' as const,
				},
			];
			const result: RunResult = {
				ok: false,
				error: {
					kind: 'javascript',
					name: 'ReferenceError',
					message: 'x is not defined',
					line: 1,
					phase: 'execution',
				},
				logs,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(logs, result)(),
			);

			const actual = await run('let x = 5;\n', { seconds: 5 });
			expect(actual.error).toBeDefined();
			expect(actual.error!.kind).toBe('javascript');
		});

		it('includes logs alongside error', async () => {
			const logs: RunEvent[] = [
				{ event: 'log' as const, args: ['before'], line: 1 },
				{
					event: 'error' as const,
					name: 'TypeError',
					message: 'oops',
					phase: 'execution' as const,
				},
			];
			const result: RunResult = {
				ok: false,
				error: {
					kind: 'javascript',
					name: 'TypeError',
					message: 'oops',
					phase: 'execution',
				},
				logs,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(logs, result)(),
			);

			const actual = await run('let x = 5;\n', { seconds: 5 });
			expect(actual.logs).toHaveLength(2);
		});
	});

	describe('timeout errors', () => {
		it('returns ok false on timeout', async () => {
			const logs: RunEvent[] = [
				{
					event: 'error' as const,
					name: 'TimeoutError',
					message: 'Execution exceeded 5 second time limit',
					phase: 'execution' as const,
				},
			];
			const result: RunResult = {
				ok: false,
				error: {
					kind: 'timeout',
					name: 'TimeoutError',
					message: 'Execution exceeded 5 second time limit',
					phase: 'execution',
					limit: 5,
				},
				logs,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(logs, result)(),
			);

			const actual = await run('let x = 5;\n', { seconds: 5 });
			expect(actual.ok).toBe(false);
		});

		it('sets error with kind timeout', async () => {
			const logs: RunEvent[] = [
				{
					event: 'error' as const,
					name: 'TimeoutError',
					message: 'Execution exceeded 5 second time limit',
					phase: 'execution' as const,
				},
			];
			const result: RunResult = {
				ok: false,
				error: {
					kind: 'timeout',
					name: 'TimeoutError',
					message: 'Execution exceeded 5 second time limit',
					phase: 'execution',
					limit: 5,
				},
				logs,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(logs, result)(),
			);

			const actual = await run('let x = 5;\n', { seconds: 5 });
			expect(actual.error!.kind).toBe('timeout');
		});

		it('includes limit value on timeout error', async () => {
			const logs: RunEvent[] = [
				{
					event: 'error' as const,
					name: 'TimeoutError',
					message: 'Execution exceeded 3 second time limit',
					phase: 'execution' as const,
				},
			];
			const result: RunResult = {
				ok: false,
				error: {
					kind: 'timeout',
					name: 'TimeoutError',
					message: 'Execution exceeded 3 second time limit',
					phase: 'execution',
					limit: 3,
				},
				logs,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(logs, result)(),
			);

			const actual = await run('let x = 5;\n', { seconds: 3 });
			expect((actual.error as { limit: number }).limit).toBe(3);
		});
	});

	describe('absence of fields', () => {
		it('does not set logs for parse errors', async () => {
			const result = await run('let = ;', { seconds: 5 });
			expect(result.logs).toBeUndefined();
		});

		it('does not set rejections for parse errors', async () => {
			const result = await run('let = ;', { seconds: 5 });
			expect(result.rejections).toBeUndefined();
		});

		it('does not set error for rejections', async () => {
			const result = await run('var x = 5;', { seconds: 5 });
			expect(result.error).toBeUndefined();
		});

		it('does not set logs for rejections', async () => {
			const result = await run('var x = 5;', { seconds: 5 });
			expect(result.logs).toBeUndefined();
		});

		it('does not set error for successful execution', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const result = await run('let x = 5;\n', { seconds: 5 });
			expect(result.error).toBeUndefined();
		});

		it('does not set rejections for successful execution', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const result = await run('let x = 5;\n', { seconds: 5 });
			expect(result.rejections).toBeUndefined();
		});
	});

	describe('multi-error detection', () => {
		it('detects last error from generator result', async () => {
			const logs: RunEvent[] = [
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
			];
			const result: RunResult = {
				ok: false,
				error: {
					kind: 'javascript',
					name: 'ReferenceError',
					message: 'second',
					phase: 'execution',
				},
				logs,
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(logs, result)(),
			);

			const actual = await run('let x = 5;\n', { seconds: 5 });
			expect(actual.error!.name).toBe('ReferenceError');
			expect(actual.error!.message).toBe('second');
		});
	});

	describe('Execution interface', () => {
		it('is PromiseLike — await resolves to RunResult', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const execution = run('let x = 5;\n', { seconds: 5 });
			const result = await execution;
			expect(result.ok).toBe(true);
		});

		it('has .result Promise', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const execution = run('let x = 5;\n', { seconds: 5 });
			expect(execution.result).toBeInstanceOf(Promise);
			const result = await execution.result;
			expect(result.ok).toBe(true);
		});

		it('has .cancel() method', () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const execution = run('let x = 5;\n', { seconds: 5 });
			expect(typeof execution.cancel).toBe('function');
		});

		it('is AsyncIterable — yields events', async () => {
			const logs: RunEvent[] = [
				{ event: 'log' as const, args: ['a'], line: 1 },
				{ event: 'log' as const, args: ['b'], line: 2 },
			];
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(logs, { ok: true, logs })(),
			);

			const execution = run('let x = 5;\n', { seconds: 5 });
			const collected: RunEvent[] = [];
			for await (const event of execution) {
				collected.push(event);
			}

			expect(collected).toHaveLength(2);
			expect(collected[0].args).toEqual(['a']);
			expect(collected[1].args).toEqual(['b']);
		});

		it('validation failure resolves immediately via PromiseLike', async () => {
			const result = await run('let = ;', { seconds: 5 });
			expect(result.ok).toBe(false);
			expect(result.error!.kind).toBe('parse');
		});

		it('validation failure yields no events', async () => {
			const execution = run('let = ;', { seconds: 5 });
			const collected: RunEvent[] = [];
			for await (const event of execution) {
				collected.push(event);
			}
			expect(collected).toHaveLength(0);
		});

		it('.cancel() on blocked execution does not throw', () => {
			const execution = run('let = ;', { seconds: 5 });
			expect(() => execution.cancel()).not.toThrow();
		});
	});

	describe('format gate', () => {
		it('returns ok false with formatting error for unformatted code', async () => {
			mockedCheckFormat.mockReturnValueOnce({ formatted: false });

			const result = await run('let x = 5;\n', { seconds: 5 });
			expect(result.ok).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('formatting');
		});

		it('does not call generator for unformatted code', async () => {
			mockedGenerator.mockClear();
			mockedCheckFormat.mockReturnValueOnce({ formatted: false });

			await run('let x = 5;\n', { seconds: 5 });
			expect(mockedGenerator).not.toHaveBeenCalled();
		});

		it('passes through to execution when formatted', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const result = await run('let x = 5;\n', { seconds: 5 });
			expect(result.ok).toBe(true);
			expect(mockedGenerator).toHaveBeenCalled();
		});
	});

	describe('re-iteration', () => {
		it('second for-await replays cached events without re-execution', async () => {
			const events: readonly RunEvent[] = [
				{ event: 'log', args: ['hello'], line: 1 },
				{ event: 'log', args: ['world'], line: 2 },
			];
			const result: RunResult = { ok: true, logs: events };

			mockedGenerator.mockReturnValueOnce(
				createMockGenerator(events, result)(),
			);

			const execution = run('let x = 5;\n', { seconds: 5 });

			// First iteration — live
			const firstPass: RunEvent[] = [];
			for await (const event of execution) {
				firstPass.push(event);
			}
			expect(firstPass).toHaveLength(2);
			expect(firstPass[0].args).toEqual(['hello']);
			expect(firstPass[1].args).toEqual(['world']);

			// Capture call count after first iteration
			const callsAfterFirst = mockedGenerator.mock.calls.length;

			// Second iteration — replay from cache (generator NOT called again)
			const secondPass: RunEvent[] = [];
			for await (const event of execution) {
				secondPass.push(event);
			}
			expect(secondPass).toHaveLength(2);
			expect(secondPass[0].args).toEqual(['hello']);
			expect(secondPass[1].args).toEqual(['world']);

			// Generator factory was not called again for replay
			expect(mockedGenerator.mock.calls.length).toBe(callsAfterFirst);
		});
	});

	describe('result immutability', () => {
		it('validation failure result is frozen', async () => {
			const result = await run('let = ;', { seconds: 5 });
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('format gate result is frozen', async () => {
			mockedCheckFormat.mockReturnValueOnce({ formatted: false });

			const result = await run('let x = 5;\n', { seconds: 5 });
			expect(Object.isFrozen(result)).toBe(true);
		});
	});
});
