import { describe, expect, it } from 'vitest';

import createExpressionPointcut from '../expression-pointcut.js';

const baseLoc = { start: { line: 1, column: 0 }, end: { line: 1, column: 5 } };

function makeTag(overrides = {}) {
	return { loc: baseLoc, node: 'Literal', source: '42', ...overrides };
}

describe('createExpressionPointcut', () => {
	describe('PrimitiveExpression → LiteralEvent', () => {
		it('matches when literal kind is enabled', () => {
			const pointcut = createExpressionPointcut({ literals: { number: true } });
			const result = pointcut(
				{ type: 'PrimitiveExpression', tag: makeTag({ literalKind: 'number' }), primitive: 42 },
				{ type: 'EffectStatement' },
				null,
			);
			expect(result).not.toBeNull();
		});

		it('discriminant is literal', () => {
			const pointcut = createExpressionPointcut({ literals: { string: true } });
			const result = pointcut(
				{ type: 'PrimitiveExpression', tag: makeTag({ literalKind: 'string' }), primitive: 'hi' },
				{ type: 'EffectStatement' },
				null,
			);
			expect(result![0]).toBe('literal');
		});

		it('skips when literal kind is disabled', () => {
			const pointcut = createExpressionPointcut({ literals: { number: false } });
			const result = pointcut(
				{ type: 'PrimitiveExpression', tag: makeTag({ literalKind: 'number' }), primitive: 42 },
				{ type: 'EffectStatement' },
				null,
			);
			expect(result).toBeNull();
		});
	});

	describe('ReadExpression → BindingEvent(read)', () => {
		it('matches when bindings.events.read is enabled', () => {
			const pointcut = createExpressionPointcut({ bindings: { events: { read: true } } });
			const result = pointcut(
				{ type: 'ReadExpression', tag: makeTag({ node: 'Identifier' }), variable: 'x' },
				{ type: 'EffectStatement' },
				null,
			);
			expect(result).not.toBeNull();
		});

		it('discriminant is read', () => {
			const pointcut = createExpressionPointcut({ bindings: { events: { read: true } } });
			const result = pointcut(
				{ type: 'ReadExpression', tag: makeTag(), variable: 'myVar' },
				{ type: 'EffectStatement' },
				null,
			);
			expect(result![0]).toBe('read');
			expect(result![1]).toBe('myVar');
		});

		it('skips when read is disabled', () => {
			const pointcut = createExpressionPointcut({ bindings: { events: { read: false } } });
			const result = pointcut(
				{ type: 'ReadExpression', tag: makeTag(), variable: 'x' },
				{ type: 'EffectStatement' },
				null,
			);
			expect(result).toBeNull();
		});

		it('skips Aran internal parameters', () => {
			const pointcut = createExpressionPointcut({ bindings: { events: { read: true } } });
			const result = pointcut(
				{ type: 'ReadExpression', tag: makeTag(), variable: 'this' },
				{ type: 'EffectStatement' },
				null,
			);
			expect(result).toBeNull();
		});

		it('skips scope.read parameter', () => {
			const pointcut = createExpressionPointcut({ bindings: { events: { read: true } } });
			const result = pointcut(
				{ type: 'ReadExpression', tag: makeTag(), variable: 'scope.read' },
				{ type: 'EffectStatement' },
				null,
			);
			expect(result).toBeNull();
		});
	});

	describe('ConditionalExpression → ShortCircuitingOperatorEvent', () => {
		it('matches when shortCircuiting is enabled', () => {
			const pointcut = createExpressionPointcut({ operators: { shortCircuiting: true } });
			const result = pointcut(
				{ type: 'ConditionalExpression', tag: makeTag({ operator: '&&' }) },
				{ type: 'EffectStatement' },
				null,
			);
			expect(result).not.toBeNull();
		});

		it('discriminant is shortCircuiting', () => {
			const pointcut = createExpressionPointcut({ operators: { shortCircuiting: true } });
			const result = pointcut(
				{ type: 'ConditionalExpression', tag: makeTag({ operator: '??' }) },
				{ type: 'EffectStatement' },
				null,
			);
			expect(result![0]).toBe('shortCircuiting');
			expect(result![1]).toBe('??');
		});
	});

	describe('test position detection → TestEvent', () => {
		it('matches expression in IfStatement test position', () => {
			const pointcut = createExpressionPointcut({ controlFlow: { events: { test: true } } });
			const node = { type: 'ReadExpression', tag: makeTag(), variable: 'x' };
			const parent = { type: 'IfStatement', test: node };
			const result = pointcut(node, parent, null);
			expect(result).not.toBeNull();
			expect(result![0]).toBe('test');
		});

		it('matches expression in WhileStatement test position', () => {
			const pointcut = createExpressionPointcut({ controlFlow: { events: { test: true } } });
			const node = { type: 'ReadExpression', tag: makeTag({ loopKind: 'while' }), variable: 'cond' };
			const parent = { type: 'WhileStatement', test: node };
			const result = pointcut(node, parent, null);
			expect(result).toEqual(['test', 'while', node.tag]);
		});

		it('uses conditional as default testSource', () => {
			const pointcut = createExpressionPointcut({ controlFlow: { events: { test: true } } });
			const node = { type: 'ReadExpression', tag: makeTag(), variable: 'x' };
			const parent = { type: 'IfStatement', test: node };
			const result = pointcut(node, parent, null);
			expect(result![1]).toBe('conditional');
		});

		it('skips when test event disabled', () => {
			const pointcut = createExpressionPointcut({ controlFlow: { events: { test: false } } });
			const node = { type: 'ReadExpression', tag: makeTag(), variable: 'x' };
			const parent = { type: 'IfStatement', test: node };
			const result = pointcut(node, parent, null);
			expect(result).toBeNull();
		});
	});

	describe('unmatched expressions', () => {
		it('returns null for IntrinsicExpression', () => {
			const pointcut = createExpressionPointcut({ literals: { string: true } });
			const result = pointcut(
				{ type: 'IntrinsicExpression', tag: makeTag() },
				{ type: 'EffectStatement' },
				null,
			);
			expect(result).toBeNull();
		});
	});
});
