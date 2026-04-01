import { describe, expect, it } from 'vitest';

import blockPointcut from '../block-pointcut.js';

const tag = {
	loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 5 } },
	node: 'BlockStatement',
	source: '{ }',
};

describe('blockPointcut', () => {
	describe('always matches', () => {
		it('matches block inside WhileStatement', () => {
			const result = blockPointcut(
				{ tag },
				{ type: 'WhileStatement', test: { type: 'ReadExpression', tag }, body: { tag } },
				null,
			);
			expect(result).not.toBeNull();
		});

		it('matches block inside Program', () => {
			const result = blockPointcut(
				{ tag },
				{ type: 'Program', kind: 'module' },
				null,
			);
			expect(result).not.toBeNull();
		});
	});

	describe('scope kind derivation', () => {
		it('Program module → scopeKind module', () => {
			const result = blockPointcut({ tag }, { type: 'Program', kind: 'module' }, null);
			expect(result[1]).toBe('module');
		});

		it('Program script → scopeKind script', () => {
			const result = blockPointcut({ tag }, { type: 'Program', kind: 'script' }, null);
			expect(result[1]).toBe('script');
		});

		it('ClosureExpression → scopeKind closure', () => {
			const result = blockPointcut({ tag }, { type: 'ClosureExpression' }, null);
			expect(result[1]).toBe('closure');
		});

		it('WhileStatement → scopeKind block', () => {
			const result = blockPointcut(
				{ tag },
				{ type: 'WhileStatement', test: { type: 'ReadExpression', tag }, body: { tag } },
				null,
			);
			expect(result[1]).toBe('block');
		});
	});

	describe('segment kind derivation', () => {
		it('WhileStatement → segmentKind while', () => {
			const result = blockPointcut(
				{ tag },
				{ type: 'WhileStatement', test: { type: 'ReadExpression', tag }, body: { tag } },
				null,
			);
			expect(result[2]).toBe('while');
		});

		it('IfStatement then branch', () => {
			const thenBlock = { tag };
			const elseBlock = { tag: { ...tag, source: 'else' } };
			const result = blockPointcut(
				thenBlock,
				{ type: 'IfStatement', then: thenBlock, else: elseBlock },
				null,
			);
			expect(result[2]).toBe('then');
		});

		it('IfStatement else branch', () => {
			const thenBlock = { tag: { ...tag, source: 'then' } };
			const elseBlock = { tag };
			const result = blockPointcut(
				elseBlock,
				{ type: 'IfStatement', then: thenBlock, else: elseBlock },
				null,
			);
			expect(result[2]).toBe('else');
		});

		it('BlockStatement → segmentKind bare', () => {
			const result = blockPointcut({ tag }, { type: 'BlockStatement' }, null);
			expect(result[2]).toBe('bare');
		});
	});

	describe('point data shape', () => {
		it('returns [parentType, scopeKind, segmentKind, tag]', () => {
			const result = blockPointcut({ tag }, { type: 'Program', kind: 'module' }, null);
			expect(result).toHaveLength(4);
			expect(result[0]).toBe('Program');
			expect(result[3]).toBe(tag);
		});
	});
});
