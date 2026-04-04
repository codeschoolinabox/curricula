/**
 * @file Layer 4a: operators + literals gating (16 tests).
 *
 * Tests that config booleans for operators (pure subkinds,
 * shortCircuiting, assignment) and literals (flat per kind)
 * correctly gate events through the full Worker pipeline.
 */

import { describe, expect, it, vi } from 'vitest';

import { ALL_ENABLED, withOverride, drainGenerator } from './test-helpers.js';

vi.setConfig({ testTimeout: 60000 });

describe('operators gating', () => {
	describe('pure subkinds', () => {
		it('disabling operators.pure.arithmetic removes arithmetic events', async () => {
			const config = withOverride(ALL_ENABLED, 'operators.pure.arithmetic', false);
			const { events } = await drainGenerator('let x = 5 - 3;\nlet y = 1 + 2;\n', config);
			const arithmeticEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'arithmetic',
			);
			const additionEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'addition',
			);

			expect(arithmeticEvents.length).toBe(0);
			expect(additionEvents.length).toBeGreaterThan(0);
		});

		it('disabling operators.pure.addition removes addition events', async () => {
			const config = withOverride(ALL_ENABLED, 'operators.pure.addition', false);
			const { events } = await drainGenerator('let x = 1 + 2;\nlet y = 5 - 3;\n', config);
			const additionEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'addition',
			);
			const arithmeticEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'arithmetic',
			);

			expect(additionEvents.length).toBe(0);
			expect(arithmeticEvents.length).toBeGreaterThan(0);
		});

		it('disabling operators.pure.comparison removes comparison events', async () => {
			const config = withOverride(ALL_ENABLED, 'operators.pure.comparison', false);
			const { events } = await drainGenerator('let x = 1 === 1;\nlet y = 5 - 3;\n', config);
			const comparisonEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'comparison',
			);
			const arithmeticEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'arithmetic',
			);

			expect(comparisonEvents.length).toBe(0);
			expect(arithmeticEvents.length).toBeGreaterThan(0);
		});

		it('disabling operators.pure.typeof removes typeof events', async () => {
			const config = withOverride(ALL_ENABLED, 'operators.pure.typeof', false);
			const { events } = await drainGenerator('let x = 5;\nlet y = typeof x;\nlet z = 1 + 2;\n', config);
			const typeofEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'typeof',
			);
			const additionEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'addition',
			);

			expect(typeofEvents.length).toBe(0);
			expect(additionEvents.length).toBeGreaterThan(0);
		});

		it('disabling operators.pure.negation.logical removes logical negation events', async () => {
			const config = withOverride(ALL_ENABLED, 'operators.pure.negation.logical', false);
			const { events } = await drainGenerator('let x = true;\nlet y = !x;\nlet z = 1 + 2;\n', config);
			const logicalNegEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'negation.logical',
			);
			const additionEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'addition',
			);

			expect(logicalNegEvents.length).toBe(0);
			expect(additionEvents.length).toBeGreaterThan(0);
		});

		it('disabling operators.pure.negation.bitwise removes bitwise negation events', async () => {
			const config = withOverride(ALL_ENABLED, 'operators.pure.negation.bitwise', false);
			const { events } = await drainGenerator('let x = 5;\nlet y = ~x;\nlet z = 1 + 2;\n', config);
			const bitwiseNegEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'negation.bitwise',
			);
			const additionEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'addition',
			);

			expect(bitwiseNegEvents.length).toBe(0);
			expect(additionEvents.length).toBeGreaterThan(0);
		});

		it('disabling operators.pure.bitwise removes bitwise operator events', async () => {
			const config = withOverride(ALL_ENABLED, 'operators.pure.bitwise', false);
			const { events } = await drainGenerator('let x = 5 & 3;\nlet y = 1 + 2;\n', config);
			const bitwiseEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'bitwise',
			);
			const additionEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'addition',
			);

			expect(bitwiseEvents.length).toBe(0);
			expect(additionEvents.length).toBeGreaterThan(0);
		});
	});

	describe('shortCircuiting', () => {
		it('disabling operators.shortCircuiting removes short-circuit events', async () => {
			const config = withOverride(ALL_ENABLED, 'operators.shortCircuiting', false);
			const { events } = await drainGenerator('let x = true || false;\nlet y = 1 + 2;\n', config);
			const shortCircuitEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).kind === 'shortCircuiting',
			);
			const pureEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).kind === 'pure',
			);

			expect(shortCircuitEvents.length).toBe(0);
			expect(pureEvents.length).toBeGreaterThan(0);
		});
	});

	describe('assignment', () => {
		it('disabling operators.assignment removes assignment operator events', async () => {
			const config = withOverride(ALL_ENABLED, 'operators.assignment', false);
			const { events } = await drainGenerator('let x = 1;\nx += 2;\nlet y = 3 - 1;\n', config);
			const assignmentOpEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).kind === 'assignment',
			);
			const arithmeticEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).subkind === 'arithmetic',
			);

			expect(assignmentOpEvents.length).toBe(0);
			expect(arithmeticEvents.length).toBeGreaterThan(0);
		});
	});

	describe('filter', () => {
		it('filter limits to named operators', async () => {
			const config = withOverride(ALL_ENABLED, 'operators.filter', ['+']);
			const { events } = await drainGenerator('let x = 1 + 2;\nlet y = 3 - 1;\n', config);
			const plusEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).operator === '+',
			);
			const minusEvents = events.filter(
				(e) => e.category === 'operator' && (e as Record<string, unknown>).operator === '-',
			);

			expect(plusEvents.length).toBeGreaterThan(0);
			expect(minusEvents.length).toBe(0);
		});
	});
});

describe('literals gating', () => {
	it('disabling literals.string removes string literal events', async () => {
		const config = withOverride(ALL_ENABLED, 'literals.string', false);
		const { events } = await drainGenerator('let a = "hello";\nlet b = 42;\n', config);
		const stringLiterals = events.filter(
			(e) => e.category === 'literal' && (e as Record<string, unknown>).kind === 'string',
		);
		const numberLiterals = events.filter(
			(e) => e.category === 'literal' && (e as Record<string, unknown>).kind === 'number',
		);

		expect(stringLiterals.length).toBe(0);
		expect(numberLiterals.length).toBeGreaterThan(0);
	});

	it('disabling literals.boolean removes boolean literal events', async () => {
		const config = withOverride(ALL_ENABLED, 'literals.boolean', false);
		const { events } = await drainGenerator('let a = true;\nlet b = 42;\n', config);
		const boolLiterals = events.filter(
			(e) => e.category === 'literal' && (e as Record<string, unknown>).kind === 'boolean',
		);
		const numberLiterals = events.filter(
			(e) => e.category === 'literal' && (e as Record<string, unknown>).kind === 'number',
		);

		expect(boolLiterals.length).toBe(0);
		expect(numberLiterals.length).toBeGreaterThan(0);
	});

	it('disabling literals.number removes number literal events', async () => {
		const config = withOverride(ALL_ENABLED, 'literals.number', false);
		const { events } = await drainGenerator('let a = 42;\nlet b = "hello";\n', config);
		const numberLiterals = events.filter(
			(e) => e.category === 'literal' && (e as Record<string, unknown>).kind === 'number',
		);
		const stringLiterals = events.filter(
			(e) => e.category === 'literal' && (e as Record<string, unknown>).kind === 'string',
		);

		expect(numberLiterals.length).toBe(0);
		expect(stringLiterals.length).toBeGreaterThan(0);
	});

	it('disabling literals.undefined removes undefined literal events', async () => {
		const config = withOverride(ALL_ENABLED, 'literals.undefined', false);
		const { events } = await drainGenerator('let a = undefined;\nlet b = 42;\n', config);
		const undefinedLiterals = events.filter(
			(e) => e.category === 'literal' && (e as Record<string, unknown>).kind === 'undefined',
		);
		const numberLiterals = events.filter(
			(e) => e.category === 'literal' && (e as Record<string, unknown>).kind === 'number',
		);

		expect(undefinedLiterals.length).toBe(0);
		expect(numberLiterals.length).toBeGreaterThan(0);
	});

	it('disabling literals.null removes null literal events', async () => {
		const config = withOverride(ALL_ENABLED, 'literals.null', false);
		const { events } = await drainGenerator('let a = null;\nlet b = 42;\n', config);
		const nullLiterals = events.filter(
			(e) => e.category === 'literal' && (e as Record<string, unknown>).kind === 'null',
		);
		const numberLiterals = events.filter(
			(e) => e.category === 'literal' && (e as Record<string, unknown>).kind === 'number',
		);

		expect(nullLiterals.length).toBe(0);
		expect(numberLiterals.length).toBeGreaterThan(0);
	});

	it('disabling literals.regex removes regex literal events', async () => {
		const config = withOverride(ALL_ENABLED, 'literals.regex', false);
		const { events } = await drainGenerator('let a = /abc/;\nlet b = 42;\n', config);
		const regexLiterals = events.filter(
			(e) => e.category === 'literal' && (e as Record<string, unknown>).kind === 'regex',
		);
		const numberLiterals = events.filter(
			(e) => e.category === 'literal' && (e as Record<string, unknown>).kind === 'number',
		);

		expect(regexLiterals.length).toBe(0);
		expect(numberLiterals.length).toBeGreaterThan(0);
	});
});
