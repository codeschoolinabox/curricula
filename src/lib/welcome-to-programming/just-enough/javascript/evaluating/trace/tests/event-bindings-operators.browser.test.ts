/**
 * @file Layer 5: binding lifecycle + operator event correctness.
 *
 * Verifies exact event values, ordering, and cross-references for
 * variable bindings and operator evaluations through the full Worker pipeline.
 */

import { describe, expect, it, vi } from 'vitest';

import { ALL_ENABLED, drainGenerator } from './test-helpers.js';

vi.setConfig({ testTimeout: 60000 });

describe('binding event correctness', () => {
	describe('let declaration lifecycle', () => {
		it('produces declare then initialize then available in that order', async () => {
			const { events } = await drainGenerator('let x = 5;\n', ALL_ENABLED);
			const xEvents = events.filter(
				(e) => e.category === 'binding' && (e as Record<string, unknown>).name === 'x',
			);
			const eventTypes = xEvents.map((e) => (e as Record<string, unknown>).event);

			expect(eventTypes.indexOf('declare')).toBeLessThan(eventTypes.indexOf('initialize'));
			expect(eventTypes.indexOf('initialize')).toBeLessThan(eventTypes.indexOf('available'));
		});

		it('declare event has kind let', async () => {
			const { events } = await drainGenerator('let x = 5;\n', ALL_ENABLED);
			const declare = events.find(
				(e) => e.category === 'binding' && (e as Record<string, unknown>).event === 'declare' && (e as Record<string, unknown>).name === 'x',
			) as Record<string, unknown>;

			expect(declare.kind).toBe('let');
		});

		it('initialize event carries value { type: number, value: 5 }', async () => {
			const { events } = await drainGenerator('let x = 5;\n', ALL_ENABLED);
			const init = events.find(
				(e) => e.category === 'binding' && (e as Record<string, unknown>).event === 'initialize' && (e as Record<string, unknown>).name === 'x',
			) as Record<string, unknown>;

			expect(init.value).toEqual({ type: 'number', value: 5 });
		});

		it('initialize and available share the same declarationStep', async () => {
			const { events } = await drainGenerator('let x = 5;\n', ALL_ENABLED);
			const xEvents = events.filter(
				(e) => e.category === 'binding' && (e as Record<string, unknown>).name === 'x',
			) as Record<string, unknown>[];
			const init = xEvents.find((e) => e.event === 'initialize')!;
			const available = xEvents.find((e) => e.event === 'available')!;

			expect(init.declarationStep).toBeDefined();
			expect(available.declarationStep).toBe(init.declarationStep);
		});
	});

	describe('const declaration', () => {
		it('all binding events have kind const', async () => {
			const { events } = await drainGenerator('const y = 10;\n', ALL_ENABLED);
			const yEvents = events.filter(
				(e) => e.category === 'binding' && (e as Record<string, unknown>).name === 'y',
			) as Record<string, unknown>[];

			for (const event of yEvents) {
				expect(event.kind).toBe('const');
			}
		});
	});

	describe('reassignment', () => {
		it('produces assign event for the reassigned variable', async () => {
			const { events } = await drainGenerator('let x = 1;\nx = 2;\n', ALL_ENABLED);
			const assigns = events.filter(
				(e) => e.category === 'binding' && (e as Record<string, unknown>).event === 'assign' && (e as Record<string, unknown>).name === 'x',
			);

			expect(assigns.length).toBeGreaterThan(0);
		});

		it('assign event shares declarationStep with initialize', async () => {
			const { events } = await drainGenerator('let x = 1;\nx = 2;\n', ALL_ENABLED);
			const xEvents = events.filter(
				(e) => e.category === 'binding' && (e as Record<string, unknown>).name === 'x',
			) as Record<string, unknown>[];
			const init = xEvents.find((e) => e.event === 'initialize')!;
			const assign = xEvents.find((e) => e.event === 'assign')!;

			expect(assign.declarationStep).toBe(init.declarationStep);
		});
	});

	describe('variable read', () => {
		it('read event exists when variable is referenced', async () => {
			const { events } = await drainGenerator('let x = 1;\nlet y = x;\n', ALL_ENABLED);
			const reads = events.filter(
				(e) => e.category === 'binding' && (e as Record<string, unknown>).event === 'read' && (e as Record<string, unknown>).name === 'x',
			);

			expect(reads.length).toBeGreaterThan(0);
		});

		it('read event carries the current value', async () => {
			const { events } = await drainGenerator('let x = 1;\nlet y = x;\n', ALL_ENABLED);
			const read = events.find(
				(e) => e.category === 'binding' && (e as Record<string, unknown>).event === 'read' && (e as Record<string, unknown>).name === 'x',
			) as Record<string, unknown>;

			expect(read.value).toEqual({ type: 'number', value: 1 });
		});
	});

	describe('uninitialized let', () => {
		it('let x without initializer has explicit true on initialize', async () => {
			// WHY explicit: true: Aran treats the declaration write as explicit
			// even without an initializer. The value is the TDZ symbol (null).
			const { events } = await drainGenerator('let x;\n', ALL_ENABLED);
			const init = events.find(
				(e) => e.category === 'binding' && (e as Record<string, unknown>).event === 'initialize' && (e as Record<string, unknown>).name === 'x',
			) as Record<string, unknown>;

			expect(init.explicit).toBe(true);
		});
	});
});

describe('operator event correctness', () => {
	describe('pure operators', () => {
		it('addition has operands [1, 2] and result 3', async () => {
			const { events } = await drainGenerator('let x = 1 + 2;\n', ALL_ENABLED);
			const opEvent = events.find(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).operator === '+',
			) as Record<string, unknown>;

			expect(opEvent.kind).toBe('pure');
			expect(opEvent.subkind).toBe('addition');
			expect(opEvent.operands).toEqual([
				{ type: 'number', value: 1 },
				{ type: 'number', value: 2 },
			]);
			expect(opEvent.result).toEqual({ type: 'number', value: 3 });
		});

		it('subtraction is arithmetic subkind with result 2', async () => {
			const { events } = await drainGenerator('let x = 5 - 3;\n', ALL_ENABLED);
			const opEvent = events.find(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).operator === '-',
			) as Record<string, unknown>;

			expect(opEvent.subkind).toBe('arithmetic');
			expect(opEvent.result).toEqual({ type: 'number', value: 2 });
		});

		it('strict equality is comparison subkind with boolean result', async () => {
			const { events } = await drainGenerator('let x = 5 === 5;\n', ALL_ENABLED);
			const opEvent = events.find(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).operator === '===',
			) as Record<string, unknown>;

			expect(opEvent.subkind).toBe('comparison');
			expect(opEvent.result).toEqual({ type: 'boolean', value: true });
		});

		it('logical negation has result false for true input', async () => {
			const { events } = await drainGenerator('let x = true;\nlet y = !x;\n', ALL_ENABLED);
			const opEvent = events.find(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).operator === '!',
			) as Record<string, unknown>;

			expect(opEvent.subkind).toBe('negation.logical');
			expect(opEvent.result).toEqual({ type: 'boolean', value: false });
		});

		it('compound += decomposes into pure addition', async () => {
			// WHY pure not assignment: Aran decomposes x += 2 into read(x) + add + write(x).
			// The operator event is a pure addition, not an assignment operator.
			const { events } = await drainGenerator('let x = 1;\nx += 2;\n', ALL_ENABLED);
			const ops = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).operator === '+',
			) as Record<string, unknown>[];

			expect(ops.length).toBeGreaterThan(0);
			expect(ops[0].result).toEqual({ type: 'number', value: 3 });
		});
	});

	describe('short-circuiting operators', () => {
		it('OR with truthy left short-circuits: no right field', async () => {
			const { events } = await drainGenerator('let x = true || false;\n', ALL_ENABLED);
			const opEvent = events.find(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).kind === 'shortCircuiting' && (e as Record<string, unknown>).operator === '||',
			) as Record<string, unknown>;

			expect(opEvent.shortCircuited).toBe(true);
			expect(opEvent.right).toBeUndefined();
			expect(opEvent.result).toEqual({ type: 'boolean', value: true });
		});

		it('OR with falsy left still produces result true', async () => {
			const { events } = await drainGenerator('let x = false || true;\n', ALL_ENABLED);
			const opEvent = events.find(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).kind === 'shortCircuiting' && (e as Record<string, unknown>).operator === '||',
			) as Record<string, unknown>;

			expect(opEvent).toBeDefined();
			expect(opEvent.result).toEqual({ type: 'boolean', value: true });
		});
	});
});
