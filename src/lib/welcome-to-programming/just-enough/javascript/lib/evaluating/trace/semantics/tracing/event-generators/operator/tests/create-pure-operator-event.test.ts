import { describe, expect, it } from 'vitest';

import createPureOperatorEvent from '../create-pure-operator-event.js';

describe('createPureOperatorEvent', () => {
	describe('category and kind', () => {
		it('category is operator', () => {
			const event = createPureOperatorEvent({
				subkind: 'arithmetic',
				operator: '+',
				operands: [{ type: 'number', value: 2 }, { type: 'number', value: 3 }],
				result: { type: 'number', value: 5 },
			});
			expect(event.category).toBe('operator');
		});

		it('kind is pure', () => {
			const event = createPureOperatorEvent({
				subkind: 'comparison',
				operator: '===',
				operands: [{ type: 'number', value: 1 }, { type: 'number', value: 1 }],
				result: { type: 'boolean', value: true },
			});
			expect(event.kind).toBe('pure');
		});

		it('subkind matches input', () => {
			const event = createPureOperatorEvent({
				subkind: 'typeof',
				operator: 'typeof',
				operands: [{ type: 'string', value: 'hello' }],
				result: { type: 'string', value: 'string' },
			});
			expect(event.subkind).toBe('typeof');
		});
	});

	describe('operands and result', () => {
		it('preserves operands', () => {
			const operands = [{ type: 'number' as const, value: 10 }, { type: 'number' as const, value: 3 }];
			const event = createPureOperatorEvent({
				subkind: 'arithmetic',
				operator: '%',
				operands,
				result: { type: 'number', value: 1 },
			});
			expect(event.operands).toEqual(operands);
		});

		it('preserves result', () => {
			const result = { type: 'boolean' as const, value: false };
			const event = createPureOperatorEvent({
				subkind: 'negation.logical',
				operator: '!',
				operands: [{ type: 'string', value: 'hello' }],
				result,
			});
			expect(event.result).toEqual(result);
		});
	});

	describe('coercion', () => {
		it('absent when no coercedOperands provided', () => {
			const event = createPureOperatorEvent({
				subkind: 'arithmetic',
				operator: '-',
				operands: [{ type: 'number', value: 5 }, { type: 'number', value: 3 }],
				result: { type: 'number', value: 2 },
			});
			expect(event).not.toHaveProperty('coercion');
		});

		it('absent when coerced values match originals', () => {
			const operands = [{ type: 'number' as const, value: 5 }, { type: 'number' as const, value: 3 }];
			const event = createPureOperatorEvent({
				subkind: 'arithmetic',
				operator: '-',
				operands,
				result: { type: 'number', value: 2 },
				coercedOperands: operands,
			});
			expect(event).not.toHaveProperty('coercion');
		});

		it('present when coerced values differ', () => {
			const event = createPureOperatorEvent({
				subkind: 'addition',
				operator: '+',
				operands: [{ type: 'string', value: '3' }, { type: 'number', value: 4 }],
				result: { type: 'string', value: '34' },
				coercedOperands: [{ type: 'string', value: '3' }, { type: 'string', value: '4' }],
			});
			expect(event.coercion).toEqual([
				{ type: 'string', value: '3' },
				{ type: 'string', value: '4' },
			]);
		});
	});

	describe('errors', () => {
		it('throws on empty operands', () => {
			expect(() =>
				createPureOperatorEvent({
					subkind: 'arithmetic',
					operator: '+',
					operands: [],
					result: { type: 'number', value: 0 },
				}),
			).toThrow();
		});
	});
});
