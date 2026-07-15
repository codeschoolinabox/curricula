import { describe, expect, it } from 'vitest';

import applyPointcut from '../apply-pointcut.js';

const tag = {
	loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
	node: 'CallExpression',
	source: 'prompt("hi")',
};

const templateTag = {
	...tag,
	node: 'TemplateLiteral',
	source: '`hello ${name}`',
	templateStrings: ['hello ', ''],
	templateExpressionCount: 1,
};

describe('applyPointcut', () => {
	describe('always matches', () => {
		it('returns non-null for function call', () => {
			const result = applyPointcut({ tag }, null, null);
			expect(result).not.toBeNull();
		});

		it('returns non-null for intrinsic call', () => {
			const node = {
				tag,
				callee: {
					type: 'IntrinsicExpression',
					intrinsic: 'aran.performBinaryOperation',
				},
			};
			expect(applyPointcut(node, null, null)).not.toBeNull();
		});
	});

	describe('intrinsic detection', () => {
		it('returns intrinsic name as discriminant for IntrinsicExpression callee', () => {
			const node = {
				tag,
				callee: {
					type: 'IntrinsicExpression',
					intrinsic: 'aran.performBinaryOperation',
				},
			};
			const [discriminant] = applyPointcut(node, null, null);
			expect(discriminant).toBe('aran.performBinaryOperation');
		});

		it('returns tag as second element for intrinsic', () => {
			const node = {
				tag,
				callee: {
					type: 'IntrinsicExpression',
					intrinsic: 'aran.getValueProperty',
				},
			};
			const [, resultTag] = applyPointcut(node, null, null);
			expect(resultTag).toBe(tag);
		});
	});

	describe('template detection', () => {
		it('returns template discriminant when tag has templateStrings', () => {
			const node = { tag: templateTag };
			const [discriminant] = applyPointcut(node, null, null);
			expect(discriminant).toBe('template');
		});
	});

	describe('regular function call', () => {
		it('returns call discriminant for non-intrinsic callee', () => {
			const node = { tag, callee: { type: 'ReadExpression' } };
			const [discriminant] = applyPointcut(node, null, null);
			expect(discriminant).toBe('call');
		});

		it('returns call when no callee property', () => {
			const [discriminant] = applyPointcut({ tag }, null, null);
			expect(discriminant).toBe('call');
		});

		it('returns tag as second element', () => {
			const [, resultTag] = applyPointcut({ tag }, null, null);
			expect(resultTag).toBe(tag);
		});
	});
});
