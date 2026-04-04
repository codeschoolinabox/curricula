/**
 * @file Layer 3 browser integration tests: createTracingGenerator.
 *
 * Tests the async generator directly — Worker spawning, SAB pause protocol,
 * event streaming, timeout, error handling. Runs in a real browser via
 * vitest browser mode (Playwright/Chromium).
 */

import { describe, expect, it } from 'vitest';

import createTracingGenerator from '../index.js';

import type { TraceEvent } from '../types.js';

const ALL_ENABLED: Record<string, unknown> = {
	bindings: {
		kind: { let: true, const: true, global: true },
		events: { declare: true, initialize: true, available: true, assign: true, read: true },
	},
	propertyAccess: { dot: true, bracket: true, optionalChaining: true },
	operators: {
		pure: {
			arithmetic: true, addition: true, comparison: true, typeof: true,
			negation: { logical: true, bitwise: true }, bitwise: true,
		},
		shortCircuiting: true, assignment: true,
	},
	literals: { string: true, boolean: true, number: true, undefined: true, null: true, regex: true },
	templates: { begin: true, evaluation: true, end: true },
	scopes: {
		kind: { script: true, block: true, module: true },
		events: { create: true, enter: true, interrupt: true, completion: true, leave: true },
	},
	controlFlow: {
		kind: { conditionals: true, loops: { while: true, doWhile: true, for: true, forOf: true } },
		events: { test: true, branch: true, iteration: true, jump: true, do: true, initialize: true, increment: true },
	},
	functions: { call: true, return: true },
	with: true,
};

/** Drains the async generator, collecting all yielded events and the return value. */
async function drainGenerator(
	code: string,
	config: Record<string, unknown> = ALL_ENABLED,
	maxMs: number | null = 30000,
): Promise<{ events: TraceEvent[]; result: unknown }> {
	const gen = createTracingGenerator(code, config, maxMs);
	const events: TraceEvent[] = [];

	let next = await gen.next();
	while (!next.done) {
		events.push(next.value);
		next = await gen.next();
	}

	return { events, result: next.value };
}

describe('createTracingGenerator', () => {
	describe('successful execution', () => {
		it('yields events and returns ok result for simple code', async () => {
			const { events, result } = await drainGenerator('let x = 5;\n');
			const r = result as Record<string, unknown>;

			expect(r.ok).toBe(true);
			expect(events.length).toBeGreaterThan(0);
		});

		it('result includes logs array matching yielded events', async () => {
			const { events, result } = await drainGenerator('let x = 5;\n');
			const r = result as Record<string, unknown>;
			const logs = r.logs as TraceEvent[];

			expect(logs).toHaveLength(events.length);
		});

		it('events have contiguous step numbers', async () => {
			const { events } = await drainGenerator('let x = 5;\n');

			for (let i = 0; i < events.length; i++) {
				expect(events[i].step).toBe(i + 1);
			}
		});

		it('events have loc, node, source metadata', async () => {
			const { events } = await drainGenerator('let x = 5;\n');

			for (const event of events) {
				expect(event).toHaveProperty('loc');
				expect(event).toHaveProperty('node');
				expect(event).toHaveProperty('source');
			}
		}, 60000);

		it('events are frozen', async () => {
			const { events } = await drainGenerator('let x = 5;\n');

			for (const event of events) {
				expect(Object.isFrozen(event)).toBe(true);
			}
		});

		it('produces binding lifecycle events', async () => {
			const { events } = await drainGenerator('let x = 5;\n');
			const categories = events.map((e) => e.category);

			expect(categories).toContain('binding');
			expect(categories).toContain('literal');
		});

		it('events match Layer 2 expectations for let x = 5', async () => {
			const { events } = await drainGenerator('let x = 5;\n');
			const bindingForX = events.filter(
				(e) => e.category === 'binding' && (e as Record<string, unknown>).name === 'x',
			);
			const eventTypes = bindingForX.map((e) => (e as Record<string, unknown>).event);

			expect(eventTypes).toContain('declare');
			expect(eventTypes).toContain('initialize');
			expect(eventTypes).toContain('available');
		});
	});

	describe('error handling', () => {
		it('runtime error returns ok: false with error details', async () => {
			// WHY throw not property access: Aran's advice try/catch may
			// swallow some runtime errors (like TypeError on property access).
			// An explicit throw always propagates through new Function().
			const { result } = await drainGenerator(
				'throw new Error("test error");\n',
			);
			const r = result as Record<string, unknown>;

			expect(r.ok).toBe(false);
			expect(r.error).toBeDefined();
			const error = r.error as Record<string, unknown>;
			expect(error.kind).toBe('javascript');
			expect(error.phase).toBe('execution');
		});

		it('syntax error returns ok: false at creation phase', async () => {
			const { result } = await drainGenerator('let x = ;\n');
			const r = result as Record<string, unknown>;

			expect(r.ok).toBe(false);
			expect(r.error).toBeDefined();
			const error = r.error as Record<string, unknown>;
			expect(error.phase).toBe('creation');
		});
	});

	describe('timeout', () => {
		it('timeout returns ok: false with timeout error', async () => {
			const { result } = await drainGenerator(
				'while (true) {}\n',
				ALL_ENABLED,
				100,
			);
			const r = result as Record<string, unknown>;

			expect(r.ok).toBe(false);
			const error = r.error as Record<string, unknown>;
			expect(error.kind).toBe('timeout');
		}, 10000);

		it('partial events preserved on timeout', async () => {
			const { events, result } = await drainGenerator(
				'let i = 0;\nwhile (true) {\n  i = i + 1;\n}\n',
				ALL_ENABLED,
				200,
			);
			const r = result as Record<string, unknown>;

			expect(r.ok).toBe(false);
			expect(events.length).toBeGreaterThan(0);
		}, 10000);
	});

	describe('streaming', () => {
		it('events arrive one at a time (not batched)', async () => {
			const gen = createTracingGenerator('let x = 5;\nlet y = 10;\n', ALL_ENABLED, 5000);
			const steps: number[] = [];

			let next = await gen.next();
			while (!next.done) {
				steps.push(next.value.step);
				next = await gen.next();
			}

			expect(steps.length).toBeGreaterThan(1);
			for (let i = 1; i < steps.length; i++) {
				expect(steps[i]).toBe(steps[i - 1] + 1);
			}
		});
	});

	describe('no timeout', () => {
		it('maxMs null means no timeout', async () => {
			const { result } = await drainGenerator('let x = 5;\n', ALL_ENABLED, null);
			const r = result as Record<string, unknown>;
			expect(r.ok).toBe(true);
		});
	});
});
