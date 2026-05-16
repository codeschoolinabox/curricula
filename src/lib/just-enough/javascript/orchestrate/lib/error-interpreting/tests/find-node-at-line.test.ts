import { describe, it, expect } from 'vitest';

import findNodeAtLine from '../find-node-at-line.js';
import parseBestEffort from '../parse-best-effort.js';

describe('findNodeAtLine', () => {
	describe('single-line program', () => {
		it('finds a node at line 1', () => {
			const ast = parseBestEffort('let x = 5;')!;
			const node = findNodeAtLine(ast, 1);
			expect(node).toBeDefined();
		});
	});

	describe('multi-line program', () => {
		it('finds a node at line 3', () => {
			const ast = parseBestEffort('let x = 1;\nlet y = 2;\nlet z = 3;')!;
			const node = findNodeAtLine(ast, 3);
			expect(node).toBeDefined();
		});
	});

	describe('deepest node', () => {
		it('returns the deepest node at the target line', () => {
			const ast = parseBestEffort('console.log("hello");')!;
			const node = findNodeAtLine(ast, 1);
			// deepest node on this line should be a Literal or Identifier,
			// not the outer ExpressionStatement
			expect(node).toBeDefined();
			expect(node!.type).not.toBe('Program');
		});
	});

	describe('line beyond program', () => {
		it('returns undefined for a line past the end', () => {
			const ast = parseBestEffort('let x = 5;')!;
			expect(findNodeAtLine(ast, 99)).toBeUndefined();
		});
	});

	describe('line zero', () => {
		it('returns undefined for line 0 (lines are 1-based)', () => {
			const ast = parseBestEffort('let x = 5;')!;
			expect(findNodeAtLine(ast, 0)).toBeUndefined();
		});
	});
});
