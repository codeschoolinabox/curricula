import { describe, it, expect, vi } from 'vitest';

import type { DebugEvent, DebugResult } from '../types.js';

// WHY: createDebugGenerator uses iframe + DOM APIs, unavailable in Node.
// Mock it to return a controlled async generator.
vi.mock('../../evaluating/debug/index.js', () => ({
	default: vi.fn(),
}));

vi.mock('../format.js', () => ({
	checkFormat: vi.fn(() => ({ formatted: true })),
	format: vi.fn((code: string) => code),
}));

import debug from '../debug.js';
import createDebugGenerator from '../../evaluating/debug/index.js';
import { checkFormat } from '../format.js';

const mockedGenerator = vi.mocked(createDebugGenerator);
const mockedCheckFormat = vi.mocked(checkFormat);

/**
 * Creates a mock async generator that yields the given events
 * and returns the given result.
 */
function createMockGenerator(
	events: readonly DebugEvent[],
	result: DebugResult,
): () => AsyncGenerator<DebugEvent, DebugResult> {
	return async function* () {
		for (const event of events) {
			yield event;
		}
		return result;
	};
}

describe('debug', () => {
	describe('validation failures', () => {
		it('returns ok false for unparseable code', async () => {
			const result = await debug('let = ;', { iterations: 100 });
			expect(result.ok).toBe(false);
		});

		it('sets parse error for unparseable code', async () => {
			const result = await debug('let = ;', { iterations: 100 });
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('parse');
		});

		it('does not call generator for unparseable code', async () => {
			await debug('let = ;', { iterations: 100 });
			expect(mockedGenerator).not.toHaveBeenCalled();
		});

		it('returns ok false for code with rejections', async () => {
			const result = await debug('var x = 5;', { iterations: 100 });
			expect(result.ok).toBe(false);
		});

		it('sets rejections for code with rejections', async () => {
			const result = await debug('var x = 5;', { iterations: 100 });
			expect(result.rejections).toBeDefined();
			expect(result.rejections!.length).toBeGreaterThan(0);
		});

		it('does not call generator for code with rejections', async () => {
			await debug('var x = 5;', { iterations: 100 });
			expect(mockedGenerator).not.toHaveBeenCalled();
		});
	});

	describe('successful execution', () => {
		it('returns ok true when debug completes', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const result = await debug('let x = 5;\n', { iterations: 100 });
			expect(result.ok).toBe(true);
		});

		it('passes code and iterations to generator', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			await debug('let x = 5;\n', { iterations: 50 });
			expect(mockedGenerator).toHaveBeenCalledWith('let x = 5;\n', 50);
		});

		it('passes undefined iterations when not configured', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			await debug('let x = 5;\n');
			expect(mockedGenerator).toHaveBeenCalledWith(
				'let x = 5;\n',
				undefined,
			);
		});
	});

	describe('execution errors', () => {
		it('returns ok false when generator returns error result', async () => {
			const errorEvent: DebugEvent = {
				event: 'error',
				name: 'Error',
				message: 'Failed to access iframe document',
			};
			const result: DebugResult = {
				ok: false,
				error: {
					kind: 'javascript',
					name: 'Error',
					message: 'Failed to access iframe document',
					phase: 'creation',
				},
				logs: [errorEvent],
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([errorEvent], result)(),
			);

			const actual = await debug('let x = 5;\n', { iterations: 100 });
			expect(actual.ok).toBe(false);
		});

		it('sets error with kind javascript on failure', async () => {
			const errorEvent: DebugEvent = {
				event: 'error',
				name: 'Error',
				message: 'Failed to access iframe document',
			};
			const result: DebugResult = {
				ok: false,
				error: {
					kind: 'javascript',
					name: 'Error',
					message: 'Failed to access iframe document',
					phase: 'creation',
				},
				logs: [errorEvent],
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([errorEvent], result)(),
			);

			const actual = await debug('let x = 5;\n', { iterations: 100 });
			expect(actual.error).toBeDefined();
			expect(actual.error!.kind).toBe('javascript');
		});

		it('includes error name and message', async () => {
			const errorEvent: DebugEvent = {
				event: 'error',
				name: 'Error',
				message: 'Failed to access iframe document',
			};
			const result: DebugResult = {
				ok: false,
				error: {
					kind: 'javascript',
					name: 'Error',
					message: 'Failed to access iframe document',
					phase: 'creation',
				},
				logs: [errorEvent],
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([errorEvent], result)(),
			);

			const actual = await debug('let x = 5;\n', { iterations: 100 });
			expect(actual.error!.name).toBe('Error');
			expect(actual.error!.message).toBe(
				'Failed to access iframe document',
			);
		});
	});

	describe('iteration limit errors', () => {
		it('returns ok false on iteration limit', async () => {
			const errorEvent: DebugEvent = {
				event: 'error',
				name: 'RangeError',
				message: 'loop 1 exceeded 100 iterations',
			};
			const result: DebugResult = {
				ok: false,
				error: {
					kind: 'iteration-limit',
					name: 'RangeError',
					message: 'loop 1 exceeded 100 iterations',
					phase: 'execution',
					limit: 100,
				},
				logs: [errorEvent],
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([errorEvent], result)(),
			);

			const actual = await debug('let x = 5;\n', { iterations: 100 });
			expect(actual.ok).toBe(false);
		});

		it('sets error with kind iteration-limit', async () => {
			const errorEvent: DebugEvent = {
				event: 'error',
				name: 'RangeError',
				message: 'loop 1 exceeded 100 iterations',
			};
			const result: DebugResult = {
				ok: false,
				error: {
					kind: 'iteration-limit',
					name: 'RangeError',
					message: 'loop 1 exceeded 100 iterations',
					phase: 'execution',
					limit: 100,
				},
				logs: [errorEvent],
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([errorEvent], result)(),
			);

			const actual = await debug('let x = 5;\n', { iterations: 100 });
			expect(actual.error!.kind).toBe('iteration-limit');
		});

		it('includes limit value from config', async () => {
			const errorEvent: DebugEvent = {
				event: 'error',
				name: 'RangeError',
				message: 'loop 1 exceeded 50 iterations',
			};
			const result: DebugResult = {
				ok: false,
				error: {
					kind: 'iteration-limit',
					name: 'RangeError',
					message: 'loop 1 exceeded 50 iterations',
					phase: 'execution',
					limit: 50,
				},
				logs: [errorEvent],
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([errorEvent], result)(),
			);

			const actual = await debug('let x = 5;\n', { iterations: 50 });
			expect((actual.error as { limit: number }).limit).toBe(50);
		});

		it('sets phase to execution for iteration limit', async () => {
			const errorEvent: DebugEvent = {
				event: 'error',
				name: 'RangeError',
				message: 'loop 1 exceeded 100 iterations',
			};
			const result: DebugResult = {
				ok: false,
				error: {
					kind: 'iteration-limit',
					name: 'RangeError',
					message: 'loop 1 exceeded 100 iterations',
					phase: 'execution',
					limit: 100,
				},
				logs: [errorEvent],
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([errorEvent], result)(),
			);

			const actual = await debug('let x = 5;\n', { iterations: 100 });
			expect(
				(actual.error as { phase: string }).phase,
			).toBe('execution');
		});
	});

	describe('absence of fields', () => {
		it('does not set logs for parse errors', async () => {
			const result = await debug('let = ;', { iterations: 100 });
			expect(result.logs).toBeUndefined();
		});

		it('does not set rejections for parse errors', async () => {
			const result = await debug('let = ;', { iterations: 100 });
			expect(result.rejections).toBeUndefined();
		});

		it('does not set error for rejections', async () => {
			const result = await debug('var x = 5;', { iterations: 100 });
			expect(result.error).toBeUndefined();
		});

		it('does not set logs for rejections', async () => {
			const result = await debug('var x = 5;', { iterations: 100 });
			expect(result.logs).toBeUndefined();
		});

		it('does not set error for successful execution', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const result = await debug('let x = 5;\n', { iterations: 100 });
			expect(result.error).toBeUndefined();
		});

		it('does not set rejections for successful execution', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const result = await debug('let x = 5;\n', { iterations: 100 });
			expect(result.rejections).toBeUndefined();
		});
	});

	describe('Execution interface', () => {
		it('is PromiseLike — await resolves to DebugResult', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const execution = debug('let x = 5;\n', { iterations: 100 });
			const result = await execution;
			expect(result.ok).toBe(true);
		});

		it('has .result Promise', async () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const execution = debug('let x = 5;\n', { iterations: 100 });
			expect(execution.result).toBeInstanceOf(Promise);
			const result = await execution.result;
			expect(result.ok).toBe(true);
		});

		it('has .cancel() method', () => {
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([], { ok: true, logs: [] })(),
			);

			const execution = debug('let x = 5;\n', { iterations: 100 });
			expect(typeof execution.cancel).toBe('function');
		});

		it('is AsyncIterable — yields events on error', async () => {
			const errorEvent: DebugEvent = {
				event: 'error',
				name: 'Error',
				message: 'boom',
			};
			const result: DebugResult = {
				ok: false,
				error: {
					kind: 'javascript',
					name: 'Error',
					message: 'boom',
					phase: 'creation',
				},
				logs: [errorEvent],
			};
			mockedGenerator.mockReturnValueOnce(
				createMockGenerator([errorEvent], result)(),
			);

			const execution = debug('let x = 5;\n', { iterations: 100 });
			const collected: DebugEvent[] = [];
			for await (const event of execution) {
				collected.push(event);
			}
			expect(collected).toHaveLength(1);
			expect(collected[0].name).toBe('Error');
		});

		it('validation failure resolves immediately via PromiseLike', async () => {
			const result = await debug('let = ;', { iterations: 100 });
			expect(result.ok).toBe(false);
			expect(result.error!.kind).toBe('parse');
		});

		it('validation failure yields no events', async () => {
			const execution = debug('let = ;', { iterations: 100 });
			const collected: DebugEvent[] = [];
			for await (const event of execution) {
				collected.push(event);
			}
			expect(collected).toHaveLength(0);
		});

		it('.cancel() on blocked execution does not throw', () => {
			const execution = debug('let = ;', { iterations: 100 });
			expect(() => execution.cancel()).not.toThrow();
		});
	});

	describe('format gate', () => {
		it('returns ok false with formatting error for unformatted code', async () => {
			mockedCheckFormat.mockReturnValueOnce({ formatted: false });

			const result = await debug('let x = 5;\n', { iterations: 100 });
			expect(result.ok).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('formatting');
		});

		it('does not call generator for unformatted code', async () => {
			mockedGenerator.mockClear();
			mockedCheckFormat.mockReturnValueOnce({ formatted: false });

			await debug('let x = 5;\n', { iterations: 100 });
			expect(mockedGenerator).not.toHaveBeenCalled();
		});
	});

	describe('result immutability', () => {
		it('validation failure result is frozen', async () => {
			const result = await debug('let = ;', { iterations: 100 });
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('format gate result is frozen', async () => {
			mockedCheckFormat.mockReturnValueOnce({ formatted: false });

			const result = await debug('let x = 5;\n', { iterations: 100 });
			expect(Object.isFrozen(result)).toBe(true);
		});
	});
});
