/**
 * @file Layer 5: control flow event correctness.
 *
 * Verifies event sequences for conditionals, loops, break
 * through the full Worker pipeline. Tests based on empirically
 * observed event shapes (trust the code, not the docs).
 */

import { describe, expect, it, vi } from 'vitest';

import { ALL_ENABLED, drainGenerator } from './test-helpers.js';

vi.setConfig({ testTimeout: 60000 });

describe('conditional event correctness', () => {
	it('if with truthy condition produces test event with result true', async () => {
		const { events } = await drainGenerator(
			'let x = 5;\nif (x > 3) {\n\tlet y = 1;\n}\n',
			ALL_ENABLED,
		);
		const testEvents = events.filter(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'test' &&
				(e as Record<string, unknown>).kind === 'conditional',
		) as Record<string, unknown>[];

		expect(testEvents.length).toBeGreaterThan(0);
		expect(testEvents[0].result).toBe(true);
	});

	it('if with truthy condition takes consequent branch', async () => {
		const { events } = await drainGenerator(
			'let x = 5;\nif (x > 3) {\n\tlet y = 1;\n}\n',
			ALL_ENABLED,
		);
		const branchEvents = events.filter(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'branch',
		) as Record<string, unknown>[];

		expect(branchEvents.length).toBeGreaterThan(0);
		expect(branchEvents[0].branch).toBe('consequent');
	});

	it('if with falsy condition produces test with result false', async () => {
		const { events } = await drainGenerator(
			'let x = 1;\nif (x > 3) {\n\tlet y = 1;\n} else {\n\tlet y = 2;\n}\n',
			ALL_ENABLED,
		);
		const testEvents = events.filter(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'test' &&
				(e as Record<string, unknown>).kind === 'conditional',
		) as Record<string, unknown>[];

		expect(testEvents[0].result).toBe(false);
	});

	it('if with falsy condition takes alternate branch', async () => {
		const { events } = await drainGenerator(
			'let x = 1;\nif (x > 3) {\n\tlet y = 1;\n} else {\n\tlet y = 2;\n}\n',
			ALL_ENABLED,
		);
		const branchEvents = events.filter(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'branch',
		) as Record<string, unknown>[];

		expect(branchEvents[0].branch).toBe('alternate');
	});

	it('test event precedes branch event in step order', async () => {
		const { events } = await drainGenerator(
			'let x = 5;\nif (x > 3) {\n\tlet y = 1;\n}\n',
			ALL_ENABLED,
		);
		const testEvent = events.find(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'test',
		)!;
		const branchEvent = events.find(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'branch',
		)!;

		expect(testEvent.step).toBeLessThan(branchEvent.step);
	});
});

describe('while loop event correctness', () => {
	// WHY kind 'conditional' for while tests: Aran emits while-loop test
	// events with kind 'conditional', not 'while'. The iteration events
	// have kind 'while'. This is an Aran implementation detail.

	it('produces 2 iteration events with kind while and ascending index', async () => {
		const { events } = await drainGenerator(
			'let i = 0;\nwhile (i < 2) {\n\ti = i + 1;\n}\n',
			ALL_ENABLED,
		);
		const iterations = events.filter(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'iteration' &&
				(e as Record<string, unknown>).kind === 'while',
		) as Record<string, unknown>[];

		expect(iterations.length).toBe(2);
		expect(iterations[0].index).toBe(0);
		expect(iterations[1].index).toBe(1);
	});

	it('zero-iteration while produces 0 iteration events', async () => {
		const { events } = await drainGenerator(
			'let i = 5;\nwhile (i < 3) {\n\ti = i + 1;\n}\n',
			ALL_ENABLED,
		);
		const iterations = events.filter(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'iteration' &&
				(e as Record<string, unknown>).kind === 'while',
		);

		expect(iterations.length).toBe(0);
	});
});

describe('do-while loop event correctness', () => {
	it('produces iteration events with ascending index', async () => {
		const { events } = await drainGenerator(
			'let i = 0;\ndo {\n\ti = i + 1;\n} while (i < 2);\n',
			ALL_ENABLED,
		);
		// WHY kind 'while': Aran emits do-while iteration events with kind
		// 'while', not 'doWhile'. The test events have kind 'doWhile'.
		const iterations = events.filter(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'iteration',
		) as Record<string, unknown>[];

		expect(iterations.length).toBe(2);
		expect(iterations[0].index).toBe(0);
		expect(iterations[1].index).toBe(1);
	});

	it('test events have kind doWhile', async () => {
		const { events } = await drainGenerator(
			'let i = 0;\ndo {\n\ti = i + 1;\n} while (i < 2);\n',
			ALL_ENABLED,
		);
		const tests = events.filter(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'test' &&
				(e as Record<string, unknown>).kind === 'doWhile',
		);

		expect(tests.length).toBeGreaterThan(0);
	});
});

describe('for loop event correctness', () => {
	it('produces iteration events with kind for', async () => {
		const { events } = await drainGenerator(
			'for (let i = 0; i < 2; i = i + 1) {\n\tlet x = i;\n}\n',
			ALL_ENABLED,
		);
		const iterations = events.filter(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'iteration' &&
				(e as Record<string, unknown>).kind === 'for',
		) as Record<string, unknown>[];

		expect(iterations.length).toBeGreaterThanOrEqual(2);
		expect(iterations[0].index).toBe(0);
		expect(iterations[1].index).toBe(1);
	});

	it('test events have kind for', async () => {
		const { events } = await drainGenerator(
			'for (let i = 0; i < 2; i = i + 1) {\n\tlet x = i;\n}\n',
			ALL_ENABLED,
		);
		const tests = events.filter(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'test' &&
				(e as Record<string, unknown>).kind === 'for',
		);

		expect(tests.length).toBeGreaterThan(0);
	});
});

describe('for-of loop event correctness', () => {
	it('produces iteration events with kind forOf and ascending index', async () => {
		const { events } = await drainGenerator(
			"for (const c of 'ab') {\n\tlet x = c;\n}\n",
			ALL_ENABLED,
		);
		const iterations = events.filter(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'iteration' &&
				(e as Record<string, unknown>).kind === 'forOf',
		) as Record<string, unknown>[];

		expect(iterations.length).toBe(2);
		expect(iterations[0].index).toBe(0);
		expect(iterations[1].index).toBe(1);
	});
});

describe('break event correctness', () => {
	it('break produces jump event with kind break', async () => {
		const { events } = await drainGenerator(
			'let i = 0;\nwhile (i < 10) {\n\ti = i + 1;\n\tif (i === 3) {\n\t\tbreak;\n\t}\n}\n',
			ALL_ENABLED,
		);
		const jumpEvents = events.filter(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'jump',
		) as Record<string, unknown>[];

		expect(jumpEvents.length).toBe(1);
		expect(jumpEvents[0].kind).toBe('break');
	});

	it('break jump target is the loop kind', async () => {
		const { events } = await drainGenerator(
			'let i = 0;\nwhile (i < 10) {\n\ti = i + 1;\n\tif (i === 3) {\n\t\tbreak;\n\t}\n}\n',
			ALL_ENABLED,
		);
		const jumpEvent = events.find(
			(e) =>
				e.category === 'controlFlow' &&
				(e as Record<string, unknown>).event === 'jump',
		) as Record<string, unknown>;

		expect(jumpEvent.target).toBe('while');
	});
});

describe('nullish coalescing', () => {
	it('null ?? 5 produces short-circuiting operator event with result 5', async () => {
		const { events } = await drainGenerator(
			'let x = null ?? 5;\n',
			ALL_ENABLED,
		);
		const opEvent = events.find(
			(e) =>
				e.category === 'operator' &&
				(e as Record<string, unknown>).operator === '??',
		) as Record<string, unknown>;

		expect(opEvent).toBeDefined();
		expect(opEvent.kind).toBe('shortCircuiting');
		expect(opEvent.result).toEqual({ type: 'number', value: 5 });
	});
});
