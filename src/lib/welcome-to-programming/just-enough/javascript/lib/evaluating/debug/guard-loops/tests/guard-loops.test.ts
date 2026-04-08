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

		it('does not guard for-of loops', () => {
			const code = "for (const c of 'hello') {\n  console.log(c);\n}";
			expect(guardLoops(code, 100)).toBe(code);
		});
	});

	describe('while loops', () => {
		it('inserts counter variable before while loop', () => {
			const code = 'while (true) {\n  console.log(1);\n}';
			const result = guardLoops(code, 100) as string;
			expect(result).toContain('let loop1 = 0;');
		});

		it('inserts check inside body', () => {
			const code = 'while (true) {\n  console.log(1);\n}';
			const result = guardLoops(code, 100) as string;
			expect(result).toContain('++loop1 > 100');
		});

		it('throws RangeError with human-readable message', () => {
			const code = 'while (true) {\n  console.log(1);\n}';
			const result = guardLoops(code, 100) as string;
			expect(result).toContain(
				'throw new RangeError("Loop 1 exceeded 100 iterations.")',
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
			try {
				new Function(guarded)();
			} catch (e: any) {
				expect(e).toBeInstanceOf(RangeError);
				expect(e.message).toContain('Loop 1 exceeded 3 iterations.');
			}
		});

		it('inserts blank line between guard check and original code', () => {
			const code = 'while (true) {\n  console.log(1);\n}';
			const result = guardLoops(code, 100) as string;
			expect(result).toMatch(/iterations\."\);\n\n/);
		});
	});

	describe('multiple loops', () => {
		it('assigns sequential guard numbers', () => {
			const code = 'while (true) {\n  break;\n}\nwhile (true) {\n  break;\n}';
			const result = guardLoops(code, 100) as string;
			expect(result).toContain('loop1');
			expect(result).toContain('loop2');
		});

		it('numbers outer loops before inner loops', () => {
			const code =
				'while (true) {\n  while (true) {\n    break;\n  }\n  break;\n}';
			const result = guardLoops(code, 100) as string;
			const loop1Pos = result.indexOf('let loop1');
			const loop2Pos = result.indexOf('let loop2');
			expect(loop1Pos).toBeLessThan(loop2Pos);
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
		it('produces exactly one guard per while loop', () => {
			const code = 'while (true) {\n  break;\n}';
			const result = guardLoops(code, 100) as string;
			const guardVarCount = (result.match(/let loop/g) || []).length;
			expect(guardVarCount).toBe(1);
		});
	});
});
