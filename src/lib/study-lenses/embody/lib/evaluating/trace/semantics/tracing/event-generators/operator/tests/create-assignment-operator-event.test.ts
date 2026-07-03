import { describe, expect, it } from 'vitest';

import createAssignmentOperatorEvent from '../create-assignment-operator-event.js';

describe('createAssignmentOperatorEvent', () => {
	describe('category and kind', () => {
		it('category is assignment', () => {
			const event = createAssignmentOperatorEvent({
				operator: '=',
				target: 'x',
				operands: [{ type: 'number', value: 5 }],
				result: { type: 'number', value: 5 },
				scopeCreationStep: 0,
			});
			expect(event.category).toBe('assignment');
		});

		it('kind is assignment', () => {
			const event = createAssignmentOperatorEvent({
				operator: '+=',
				target: 'x',
				operands: [
					{ type: 'number', value: 10 },
					{ type: 'number', value: 5 },
				],
				result: { type: 'number', value: 15 },
				scopeCreationStep: 0,
			});
			expect(event.kind).toBe('assignment');
		});
	});

	describe('plain assignment', () => {
		it('operands has rhs only', () => {
			const event = createAssignmentOperatorEvent({
				operator: '=',
				target: 'name',
				operands: [{ type: 'string', value: 'Alice' }],
				result: { type: 'string', value: 'Alice' },
				scopeCreationStep: 0,
			});
			expect(event.operands).toEqual([{ type: 'string', value: 'Alice' }]);
		});
	});

	describe('compound assignment', () => {
		it('operands has currentValue and rhs', () => {
			const event = createAssignmentOperatorEvent({
				operator: '+=',
				target: 'count',
				operands: [
					{ type: 'number', value: 10 },
					{ type: 'number', value: 5 },
				],
				result: { type: 'number', value: 15 },
				scopeCreationStep: 0,
			});
			expect(event.operands).toHaveLength(2);
		});
	});

	describe('coercion', () => {
		it('absent when no coercedOperands', () => {
			const event = createAssignmentOperatorEvent({
				operator: '+=',
				target: 'x',
				operands: [
					{ type: 'number', value: 1 },
					{ type: 'number', value: 2 },
				],
				result: { type: 'number', value: 3 },
				scopeCreationStep: 0,
			});
			expect(event).not.toHaveProperty('coercion');
		});

		it('present when coerced values differ', () => {
			const event = createAssignmentOperatorEvent({
				operator: '+=',
				target: 'x',
				operands: [
					{ type: 'string', value: 'hi' },
					{ type: 'number', value: 5 },
				],
				result: { type: 'string', value: 'hi5' },
				scopeCreationStep: 0,
				coercedOperands: [
					{ type: 'string', value: 'hi' },
					{ type: 'string', value: '5' },
				],
			});
			expect(event.coercion).toBeDefined();
		});
	});

	describe('shortCircuited', () => {
		it('absent on normal assignment', () => {
			const event = createAssignmentOperatorEvent({
				operator: '=',
				target: 'x',
				operands: [{ type: 'number', value: 5 }],
				result: { type: 'number', value: 5 },
				scopeCreationStep: 0,
			});
			expect(event).not.toHaveProperty('shortCircuited');
		});

		it('present on shortCircuited ??=', () => {
			const event = createAssignmentOperatorEvent({
				operator: '??=',
				target: 'name',
				operands: [{ type: 'string', value: 'Alice' }],
				result: { type: 'string', value: 'Alice' },
				scopeCreationStep: 0,
				shortCircuited: true,
			});
			expect(event.shortCircuited).toBe(true);
		});
	});

	describe('errors', () => {
		it('throws on empty target', () => {
			expect(() =>
				createAssignmentOperatorEvent({
					operator: '=',
					target: '',
					operands: [{ type: 'number', value: 5 }],
					result: { type: 'number', value: 5 },
					scopeCreationStep: 0,
				}),
			).toThrow();
		});
	});
});
