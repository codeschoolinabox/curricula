/**
 * @file Layer 4b: trace() successful execution, consumption patterns,
 * config, runtime errors, timeout.
 *
 * Tests the full pipeline through real Workers with SAB pause protocol.
 */

import { describe, expect, it, vi } from 'vitest';

import trace from '../trace.js';

import type { TraceEvent } from '../../evaluating/trace/record/tracing/types.js';

vi.setConfig({ testTimeout: 60000 });

describe('trace successful execution', () => {
	describe('batch consumption (await)', () => {
		it('returns ok true for valid formatted JeJ code', async () => {
			const result = await trace('let x = 5;\n');

			expect(result.ok).toBe(true);
		});

		it('result includes logs array', async () => {
			const result = await trace('let x = 5;\n');

			expect(result.logs).toBeDefined();
			expect(result.logs!.length).toBeGreaterThan(0);
		});

		it('logs contain events with step and category', async () => {
			const result = await trace('let x = 5;\n');

			for (const event of result.logs!) {
				expect(event).toHaveProperty('step');
				expect(event).toHaveProperty('category');
			}
		});

		it('logs contain events with source metadata', async () => {
			const result = await trace('let x = 5;\n');

			for (const event of result.logs!) {
				expect(event).toHaveProperty('loc');
				expect(event).toHaveProperty('node');
				expect(event).toHaveProperty('source');
			}
		});

		it('has no error or rejections on success', async () => {
			const result = await trace('let x = 5;\n');

			expect(result.error).toBeUndefined();
			expect(result.rejections).toBeUndefined();
		});
	});

	describe('.result property', () => {
		it('.result is a Promise', () => {
			const execution = trace('let x = 5;\n');

			expect(execution.result).toBeInstanceOf(Promise);
		});

		it('.result resolves to TraceResult', async () => {
			const execution = trace('let x = 5;\n');
			const result = await execution.result;

			expect(result.ok).toBe(true);
		});
	});

	describe('step-through consumption (for-await)', () => {
		it('yields TraceEvents one at a time', async () => {
			const collected: TraceEvent[] = [];
			for await (const event of trace('let x = 5;\n')) {
				collected.push(event);
			}

			expect(collected.length).toBeGreaterThan(0);
		});

		it('yielded events have contiguous step numbers', async () => {
			const collected: TraceEvent[] = [];
			for await (const event of trace('let x = 5;\n')) {
				collected.push(event);
			}

			for (let i = 0; i < collected.length; i++) {
				expect(collected[i].step).toBe(i + 1);
			}
		});

		it('yielded event count matches result.logs', async () => {
			const execution = trace('let x = 5;\nlet y = 10;\n');
			const collected: TraceEvent[] = [];
			for await (const event of execution) {
				collected.push(event);
			}
			const result = await execution.result;

			expect(collected.length).toBe(result.logs!.length);
		});
	});

	describe('config', () => {
		it('default timeout does not fire on trivial code', async () => {
			const result = await trace('let x = 5;\n');

			expect(result.ok).toBe(true);
		});

		it('custom seconds config triggers timeout on infinite loop', async () => {
			// WHY extra blank line: recast adds \n\n between statements
			// with different node types (let vs while). Must match exactly
			// to pass the format gate.
			const result = await trace(
				'let i = 0;\n\nwhile (true) {\n\ti = i + 1;\n}\n',
				{ seconds: 0.2 },
			);

			expect(result.ok).toBe(false);
			expect(result.error!.kind).toBe('timeout');
		});

		it('timeout error includes limit value from config', async () => {
			const result = await trace(
				'let i = 0;\n\nwhile (true) {\n\ti = i + 1;\n}\n',
				{ seconds: 0.2 },
			);
			const error = result.error as Record<string, unknown>;

			expect(error.limit).toBe(0.2);
		});

		it('options config gates events through prepareConfig', async () => {
			const result = await trace('let x = 5;\n', {
				options: { bindings: false },
			});
			const bindingEvents = result.logs!.filter(
				(e) => e.category === 'binding',
			);

			expect(bindingEvents.length).toBe(0);
		});
	});
});

describe('trace error results', () => {
	describe('runtime errors', () => {
		it('returns ok false for runtime error', async () => {
			const result = await trace('throw new Error('test');\n');

			expect(result.ok).toBe(false);
		});

		it('sets error with kind javascript', async () => {
			const result = await trace('throw new Error('test');\n');

			expect(result.error!.kind).toBe('javascript');
		});
	});

	describe('timeout', () => {
		it('partial events preserved on timeout', async () => {
			const result = await trace(
				'let i = 0;\n\nwhile (true) {\n\ti = i + 1;\n}\n',
				{ seconds: 0.3 },
			);

			expect(result.ok).toBe(false);
			expect(result.logs!.length).toBeGreaterThan(0);
		});
	});
});
