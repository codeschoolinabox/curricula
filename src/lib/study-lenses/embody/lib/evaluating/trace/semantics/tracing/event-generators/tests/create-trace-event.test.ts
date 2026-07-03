import { describe, expect, it } from 'vitest';

import createTraceEvent from '../create-trace-event.js';

const metadata = {
	semantics: 'expression' as const,
	loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 5 } },
	node: 'Literal',
	source: "'hello'",
};

describe('createTraceEvent', () => {
	describe('combines metadata with generator output', () => {
		it('literal event has metadata fields', () => {
			const event = createTraceEvent(metadata, 'literals.string', {
				kind: 'string',
				value: { type: 'string', value: 'hello' },
			});
			expect(event.semantics).toBe('expression');
			expect(event.loc).toEqual(metadata.loc);
			expect(event.node).toBe('Literal');
			expect(event.source).toBe("'hello'");
		});

		it('literal event has domain fields', () => {
			const event = createTraceEvent(metadata, 'literals.string', {
				kind: 'string',
				value: { type: 'string', value: 'hello' },
			});
			expect(event.category).toBe('literal');
		});
	});

	describe('deep freezes the result', () => {
		it('returned object is frozen', () => {
			const event = createTraceEvent(metadata, 'literals.number', {
				kind: 'number',
				value: { type: 'number', value: 42 },
			});
			expect(Object.isFrozen(event)).toBe(true);
		});
	});

	describe('resolves nested paths', () => {
		it('operators.pure.arithmetic', () => {
			const event = createTraceEvent(
				{ ...metadata, node: 'BinaryExpression', source: '2 + 3' },
				'operators.pure.arithmetic',
				{
					subkind: 'arithmetic',
					operator: '-',
					operands: [
						{ type: 'number', value: 5 },
						{ type: 'number', value: 3 },
					],
					result: { type: 'number', value: 2 },
				},
			);
			expect(event.category).toBe('operator');
		});

		it('operators.pure.negation.logical', () => {
			const event = createTraceEvent(
				{ ...metadata, node: 'UnaryExpression', source: '!x' },
				'operators.pure.negation.logical',
				{
					subkind: 'negation.logical',
					operator: '!',
					operands: [{ type: 'boolean', value: true }],
					result: { type: 'boolean', value: false },
				},
			);
			expect(event.category).toBe('operator');
		});

		it('controlFlow.test', () => {
			const event = createTraceEvent(
				{
					...metadata,
					semantics: 'statement' as const,
					node: 'IfStatement',
					source: 'if (x)',
				},
				'controlFlow.test',
				{
					kind: 'if',
					value: { type: 'string', value: 'hello' },
					result: true,
					coercion: { type: 'boolean', value: true },
					scopeCreationStep: 0,
				},
			);
			expect(event.category).toBe('conditional');
		});
	});

	describe('errors', () => {
		it('throws on invalid path', () => {
			expect(() => createTraceEvent(metadata, 'nonexistent.path', {})).toThrow(
				'no generator found',
			);
		});

		it('throws on partial path (resolves to object, not function)', () => {
			expect(() => createTraceEvent(metadata, 'operators.pure', {})).toThrow(
				'no generator found',
			);
		});
	});
});
