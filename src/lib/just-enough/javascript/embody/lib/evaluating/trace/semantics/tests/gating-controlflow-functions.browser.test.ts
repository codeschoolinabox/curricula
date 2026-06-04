/**
 * @file Layer 4a: controlFlow + functions + with gating (17 tests).
 *
 * Tests that config booleans for controlFlow (2D: kind × events),
 * functions (flat), and with (top-level boolean) correctly gate
 * events through the full Worker pipeline.
 */

import { describe, expect, it, vi } from 'vitest';

import { ALL_ENABLED, withOverride, drainGenerator } from './test-helpers.js';

vi.setConfig({ testTimeout: 60000 });

describe('controlFlow gating', () => {
	describe('kind gating — conditionals', () => {
		it('disabling controlFlow.kind.conditionals removes conditional events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'controlFlow.kind.conditionals',
				false,
			);
			const { events } = await drainGenerator(
				'let x = 5;\nif (x > 3) {\n  let y = 1;\n}\nlet i = 0;\nwhile (i < 2) {\n  i = i + 1;\n}\n',
				config,
			);
			const conditionalEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).kind === 'conditional',
			);
			const whileEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).kind === 'while',
			);

			expect(conditionalEvents.length).toBe(0);
			expect(whileEvents.length).toBeGreaterThan(0);
		});
	});

	describe('kind gating — loops', () => {
		it('disabling controlFlow.kind.loops.while removes while events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'controlFlow.kind.loops.while',
				false,
			);
			const { events } = await drainGenerator(
				'let i = 0;\nwhile (i < 2) {\n  i = i + 1;\n}\nlet x = 5;\nif (x > 3) {\n  let y = 1;\n}\n',
				config,
			);
			const whileEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).kind === 'while',
			);
			const conditionalEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).kind === 'conditional',
			);

			expect(whileEvents.length).toBe(0);
			expect(conditionalEvents.length).toBeGreaterThan(0);
		});

		it('disabling controlFlow.kind.loops.doWhile removes doWhile events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'controlFlow.kind.loops.doWhile',
				false,
			);
			const { events } = await drainGenerator(
				'let i = 0;\ndo {\n  i = i + 1;\n} while (i < 2);\nlet x = 5;\nif (x > 3) {\n  let y = 1;\n}\n',
				config,
			);
			const doWhileEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).kind === 'doWhile',
			);
			const conditionalEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).kind === 'conditional',
			);

			expect(doWhileEvents.length).toBe(0);
			expect(conditionalEvents.length).toBeGreaterThan(0);
		});

		it('disabling controlFlow.kind.loops.for removes for events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'controlFlow.kind.loops.for',
				false,
			);
			const { events } = await drainGenerator(
				'for (let i = 0; i < 2; i = i + 1) {\n  let x = i;\n}\nlet a = 5;\nif (a > 3) {\n  let b = 1;\n}\n',
				config,
			);
			const forEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).kind === 'for',
			);
			const conditionalEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).kind === 'conditional',
			);

			expect(forEvents.length).toBe(0);
			expect(conditionalEvents.length).toBeGreaterThan(0);
		});

		it('disabling controlFlow.kind.loops.forOf removes forOf events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'controlFlow.kind.loops.forOf',
				false,
			);
			const { events } = await drainGenerator(
				'for (const c of "ab") {\n  let x = c;\n}\nlet a = 5;\nif (a > 3) {\n  let b = 1;\n}\n',
				config,
			);
			const forOfEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).kind === 'forOf',
			);
			const conditionalEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).kind === 'conditional',
			);

			expect(forOfEvents.length).toBe(0);
			expect(conditionalEvents.length).toBeGreaterThan(0);
		});
	});

	describe('event gating', () => {
		it('disabling controlFlow.events.test removes test events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'controlFlow.events.test',
				false,
			);
			const { events } = await drainGenerator(
				'let x = 5;\nif (x > 3) {\n  let y = 1;\n} else {\n  let y = 2;\n}\n',
				config,
			);
			const testEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'test',
			);
			const branchEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'branch',
			);

			expect(testEvents.length).toBe(0);
			expect(branchEvents.length).toBeGreaterThan(0);
		});

		it('disabling controlFlow.events.branch removes branch events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'controlFlow.events.branch',
				false,
			);
			const { events } = await drainGenerator(
				'let x = 5;\nif (x > 3) {\n  let y = 1;\n} else {\n  let y = 2;\n}\n',
				config,
			);
			const branchEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'branch',
			);
			const testEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'test',
			);

			expect(branchEvents.length).toBe(0);
			expect(testEvents.length).toBeGreaterThan(0);
		});

		it('disabling controlFlow.events.iteration removes iteration events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'controlFlow.events.iteration',
				false,
			);
			const { events } = await drainGenerator(
				'let i = 0;\nwhile (i < 2) {\n  i = i + 1;\n}\n',
				config,
			);
			const iterationEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'iteration',
			);
			const testEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'test',
			);

			expect(iterationEvents.length).toBe(0);
			expect(testEvents.length).toBeGreaterThan(0);
		});

		it('disabling controlFlow.events.jump removes jump events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'controlFlow.events.jump',
				false,
			);
			const { events } = await drainGenerator(
				'for (let i = 0; i < 10; i = i + 1) {\n  if (i === 3) {\n    break;\n  }\n}\n',
				config,
			);
			const jumpEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'jump',
			);
			const testEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'test',
			);

			expect(jumpEvents.length).toBe(0);
			expect(testEvents.length).toBeGreaterThan(0);
		});

		it('disabling controlFlow.events.do removes do events', async () => {
			const config = withOverride(ALL_ENABLED, 'controlFlow.events.do', false);
			const { events } = await drainGenerator(
				'let i = 0;\ndo {\n  i = i + 1;\n} while (i < 2);\n',
				config,
			);
			const doEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'do',
			);
			const testEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'test',
			);

			expect(doEvents.length).toBe(0);
			expect(testEvents.length).toBeGreaterThan(0);
		});

		it('disabling controlFlow.events.initialize removes initialize events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'controlFlow.events.initialize',
				false,
			);
			const { events } = await drainGenerator(
				'for (let i = 0; i < 2; i = i + 1) {\n  let x = i;\n}\n',
				config,
			);
			const initEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'initialize',
			);
			const testEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'test',
			);

			expect(initEvents.length).toBe(0);
			expect(testEvents.length).toBeGreaterThan(0);
		});

		it('disabling controlFlow.events.increment removes increment events', async () => {
			const config = withOverride(
				ALL_ENABLED,
				'controlFlow.events.increment',
				false,
			);
			const { events } = await drainGenerator(
				'for (let i = 0; i < 2; i = i + 1) {\n  let x = i;\n}\n',
				config,
			);
			const incrementEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'increment',
			);
			const testEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).event === 'test',
			);

			expect(incrementEvents.length).toBe(0);
			expect(testEvents.length).toBeGreaterThan(0);
		});
	});

	describe('filter', () => {
		it('filter limits to named control flow structures', async () => {
			const config = withOverride(ALL_ENABLED, 'controlFlow.filter', [
				'conditional',
			]);
			const { events } = await drainGenerator(
				'let x = 5;\nif (x > 3) {\n  let y = 1;\n}\nlet i = 0;\nwhile (i < 2) {\n  i = i + 1;\n}\n',
				config,
			);
			const conditionalEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).kind === 'conditional',
			);
			const whileEvents = events.filter(
				(e) =>
					e.category === 'controlFlow' &&
					(e as Record<string, unknown>).kind === 'while',
			);

			expect(conditionalEvents.length).toBeGreaterThan(0);
			expect(whileEvents.length).toBe(0);
		});
	});
});

describe('functions gating', () => {
	const CODE =
		'function add(a, b) {\n  return a + b;\n}\nlet result = add(1, 2);\n';

	describe('flat gating', () => {
		it('disabling functions.call removes call events', async () => {
			const config = withOverride(ALL_ENABLED, 'functions.call', false);
			const { events } = await drainGenerator(CODE, config);
			const callEvents = events.filter(
				(e) =>
					e.category === 'function' &&
					(e as Record<string, unknown>).event === 'call',
			);
			const returnEvents = events.filter(
				(e) =>
					e.category === 'function' &&
					(e as Record<string, unknown>).event === 'return',
			);

			expect(callEvents.length).toBe(0);
			expect(returnEvents.length).toBeGreaterThan(0);
		});

		it('disabling functions.return removes return events', async () => {
			const config = withOverride(ALL_ENABLED, 'functions.return', false);
			const { events } = await drainGenerator(CODE, config);
			const returnEvents = events.filter(
				(e) =>
					e.category === 'function' &&
					(e as Record<string, unknown>).event === 'return',
			);
			const callEvents = events.filter(
				(e) =>
					e.category === 'function' &&
					(e as Record<string, unknown>).event === 'call',
			);

			expect(returnEvents.length).toBe(0);
			expect(callEvents.length).toBeGreaterThan(0);
		});
	});

	describe('filter', () => {
		it('filter limits to named functions', async () => {
			const config = withOverride(ALL_ENABLED, 'functions.filter', ['add']);
			const { events } = await drainGenerator(
				'function add(a, b) {\n  return a + b;\n}\nfunction sub(a, b) {\n  return a - b;\n}\nlet r1 = add(1, 2);\nlet r2 = sub(5, 3);\n',
				config,
			);
			const addEvents = events.filter(
				(e) =>
					e.category === 'function' &&
					(e as Record<string, unknown>).name === 'add',
			);
			const subEvents = events.filter(
				(e) =>
					e.category === 'function' &&
					(e as Record<string, unknown>).name === 'sub',
			);

			expect(addEvents.length).toBeGreaterThan(0);
			expect(subEvents.length).toBe(0);
		});
	});
});

describe('with gating', () => {
	it('disabling with does not crash', async () => {
		const config = withOverride(ALL_ENABLED, 'with', false);
		const { result } = await drainGenerator('let x = 5;\n', config);

		expect(result.ok).toBe(true);
	});
});
