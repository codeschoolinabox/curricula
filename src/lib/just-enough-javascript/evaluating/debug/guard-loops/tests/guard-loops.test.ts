import { describe, expect, it } from 'vitest';
import * as recast from 'recast';

import guardLoops from '../guard-loops.js';

describe('guardLoops', () => {
	describe('no loops present', () => {
		it('returns original string unchanged', () => {
			const code = 'let x = 1;';
			expect(guardLoops(code, 100)).toBe(code);
		});

		it('returns original AST node unchanged', () => {
			const ast = recast.parse('let x = 1;');
			expect(guardLoops(ast, 100)).toBe(ast);
		});
	});

	describe('while loops', () => {
		it('inserts counter variable before while loop', () => {
			const code = 'while (true) {\n  console.log(1);\n}';
			const result = guardLoops(code, 100) as string;
			expect(result).toContain('let loopGuard_1 = 0;');
		});

		it('inserts increment and range check inside body', () => {
			const code = 'while (true) {\n  console.log(1);\n}';
			const result = guardLoops(code, 100) as string;
			expect(result).toContain('loopGuard_1++');
			expect(result).toContain('loopGuard_1 > 100');
		});

		it('throws RangeError message referencing the guard number and limit', () => {
			const code = 'while (true) {\n  console.log(1);\n}';
			const result = guardLoops(code, 100) as string;
			expect(result).toContain(
				'throw new RangeError("loopGuard_1 is greater than 100")',
			);
		});

		it('guarded code throws RangeError when limit exceeded', () => {
			const code = 'let i = 0;\nwhile (true) {\n  i++;\n}';
			const guarded = guardLoops(code, 5) as string;
			expect(() => new Function(guarded)()).toThrow(RangeError);
		});

		it('throws after exactly maxIterations + 1 iterations', () => {
			const code = 'let i = 0;\nwhile (i < 100) {\n  i++;\n}';
			const guarded = guardLoops(code, 3) as string;
			const fn = new Function(guarded);
			try {
				fn();
			} catch (e: any) {
				expect(e).toBeInstanceOf(RangeError);
				expect(e.message).toContain('loopGuard_1 is greater than 3');
			}
		});
	});

	describe('for-of loops', () => {
		it('inserts guard for for-of loop', () => {
			const code = "for (const c of 'hello') {\n  console.log(c);\n}";
			const result = guardLoops(code, 100) as string;
			expect(result).toContain('let loopGuard_1 = 0;');
			expect(result).toContain('loopGuard_1++');
		});
	});

	describe('multiple loops', () => {
		it('assigns sequential guard numbers', () => {
			const code = 'while (true) {\n  break;\n}\nwhile (true) {\n  break;\n}';
			const result = guardLoops(code, 100) as string;
			expect(result).toContain('loopGuard_1');
			expect(result).toContain('loopGuard_2');
		});

		it('guards nested loops independently', () => {
			const code =
				'while (true) {\n  while (true) {\n    break;\n  }\n  break;\n}';
			const result = guardLoops(code, 100) as string;
			expect(result).toContain('loopGuard_1');
			expect(result).toContain('loopGuard_2');
		});
	});

	describe('input/output format', () => {
		it('returns string when input is string', () => {
			const code = 'while (true) {\n  break;\n}';
			const result = guardLoops(code, 100);
			expect(typeof result).toBe('string');
		});

		it('returns Node when input is Node', () => {
			const ast = recast.parse('while (true) {\n  break;\n}');
			const result = guardLoops(ast, 100);
			expect(typeof result).toBe('object');
			expect(result).toHaveProperty('type');
		});

		it('returns a frozen AST when input is Node', () => {
			const ast = recast.parse('while (true) {\n  break;\n}');
			const result = guardLoops(ast, 100);
			expect(Object.isFrozen(result)).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('does not double-process visited nodes', () => {
			const code = 'while (true) {\n  break;\n}';
			const result = guardLoops(code, 100) as string;
			const guardCount = (result.match(/loopGuard_1\+\+/g) || []).length;
			expect(guardCount).toBe(1);
		});

		it('does not process generated nodes', () => {
			const code = 'while (true) {\n  break;\n}';
			const result = guardLoops(code, 50) as string;
			const guardVarCount = (result.match(/let loopGuard_/g) || []).length;
			expect(guardVarCount).toBe(1);
		});
	});
});
