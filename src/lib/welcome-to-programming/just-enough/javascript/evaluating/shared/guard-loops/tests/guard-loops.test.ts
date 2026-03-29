import { describe, expect, it } from 'vitest';

import guardLoopsCondition from '../guard-loops.js';

const MAX = 100;

describe('guardLoopsCondition', () => {
	describe('no loops', () => {
		it('returns original code unchanged', () => {
			const code = 'let x = 5;\n';
			const result = guardLoopsCondition(code, MAX);
			expect(result.code).toBe(code);
		});

		it('returns loopCount 0', () => {
			const result = guardLoopsCondition('let x = 5;\n', MAX);
			expect(result.loopCount).toBe(0);
		});
	});

	describe('single while loop', () => {
		it('injects guard check after opening brace', () => {
			const code = 'while (x < 10) {\n\tx++;\n}\n';
			const result = guardLoopsCondition(code, MAX);
			expect(result.code).toContain(
				`{ if (++loop1 > ${MAX}) throw new RangeError`,
			);
		});

		it('injects counter reset after closing brace', () => {
			const code = 'while (x < 10) {\n\tx++;\n}\n';
			const result = guardLoopsCondition(code, MAX);
			expect(result.code).toContain('} loop1 = 0;');
		});

		it('preserves original condition unchanged', () => {
			const code = 'while (x < 10) {\n\tx++;\n}\n';
			const result = guardLoopsCondition(code, MAX);
			// Condition is not modified — no comma operator, no prefix
			expect(result.code).toContain('while (x < 10) {');
		});

		it('returns loopCount 1', () => {
			const code = 'while (x < 10) {\n\tx++;\n}\n';
			const result = guardLoopsCondition(code, MAX);
			expect(result.loopCount).toBe(1);
		});

		it('does not shift line numbers', () => {
			const code =
				'let x = 0;\nwhile (x < 10) {\n\tx++;\n}\nconsole.log(x);\n';
			const result = guardLoopsCondition(code, MAX);
			const lines = result.code.split('\n');
			// Line 1: let x = 0;
			expect(lines[0]).toBe('let x = 0;');
			// Line 2: while (...)  — still on line 2
			expect(lines[1]).toMatch(/^while/);
			// Line 4: console.log(x); — still on same line number
			expect(lines[4]).toMatch(/console\.log\(x\)/);
		});

		it('does not shift condition column', () => {
			const code = 'while (x < 10) {\n\tx++;\n}\n';
			const result = guardLoopsCondition(code, MAX);
			// The while line starts with the original text — condition
			// column is unchanged because guard is injected AFTER the {
			const whileLine = result.code.split('\n')[0];
			expect(whileLine).toMatch(/^while \(x < 10\) \{/);
		});
	});

	describe('multiple loops', () => {
		it('numbers loops in reading order', () => {
			const code = 'while (a) {\n\ta++;\n}\nwhile (b) {\n\tb++;\n}\n';
			const result = guardLoopsCondition(code, MAX);
			expect(result.code).toContain('++loop1');
			expect(result.code).toContain('++loop2');
		});

		it('returns correct loopCount', () => {
			const code = 'while (a) {\n\ta++;\n}\nwhile (b) {\n\tb++;\n}\n';
			const result = guardLoopsCondition(code, MAX);
			expect(result.loopCount).toBe(2);
		});

		it('outer loop gets lower number than inner', () => {
			const code =
				'while (a) {\n\twhile (b) {\n\t\tb++;\n\t}\n\ta++;\n}\n';
			const result = guardLoopsCondition(code, MAX);
			const firstGuard = result.code.indexOf('++loop1');
			const secondGuard = result.code.indexOf('++loop2');
			expect(firstGuard).toBeLessThan(secondGuard);
		});
	});

	describe('for-of loops are not guarded', () => {
		it('ignores for-of loops', () => {
			const code =
				'for (const item of items) {\n\tconsole.log(item);\n}\n';
			const result = guardLoopsCondition(code, MAX);
			expect(result.code).not.toContain('++loop');
			expect(result.loopCount).toBe(0);
		});
	});

	describe('guard execution behavior', () => {
		it('guarded code executes correctly with loopN parameters', () => {
			const code = 'while (x < 3) {\n\tx++;\n}\n';
			const result = guardLoopsCondition(code, MAX);

			// Pass loop1 as a parameter initialized to 0
			// eslint-disable-next-line no-new-func
			const fn = new Function(
				'loop1',
				'x',
				result.code + '\nreturn x;',
			);
			const finalX = fn(0, 0);
			expect(finalX).toBe(3);
		});

		it('guard throws RangeError on infinite loop', () => {
			const code = 'while (true) {\n\tx++;\n}\n';
			const result = guardLoopsCondition(code, 5);

			// eslint-disable-next-line no-new-func
			const fn = new Function('loop1', 'x', result.code);
			expect(() => fn(0, 0)).toThrow(RangeError);
			expect(() => fn(0, 0)).toThrow(/Loop 1 exceeded 5 iterations/);
		});

		it('bakes maxIterations into the code', () => {
			const code = 'while (true) {\n\tx++;\n}\n';
			const result = guardLoopsCondition(code, 42);
			expect(result.code).toContain('> 42)');
			expect(result.code).toContain('exceeded 42 iterations');
		});
	});

	describe('counter reset', () => {
		it('resets counter after closing brace', () => {
			const code = 'while (x < 3) {\n\tx++;\n}\n';
			const result = guardLoopsCondition(code, MAX);
			expect(result.code).toContain('} loop1 = 0;');
		});

		it('nested inner loop resets between outer iterations', () => {
			// Outer runs 2 times, inner runs 3 times per outer = 6 total
			// With limit of 5, this should NOT throw because the reset
			// brings the inner counter back to 0 each outer iteration
			const code = [
				'while (outerCount < 2) {',
				'\tlet innerCount = 0;',
				'\twhile (innerCount < 3) {',
				'\t\tinnerCount++;',
				'\t}',
				'\touterCount++;',
				'}',
				'',
			].join('\n');
			const result = guardLoopsCondition(code, 5);

			// eslint-disable-next-line no-new-func
			const fn = new Function(
				'loop1',
				'loop2',
				'outerCount',
				result.code + '\nreturn outerCount;',
			);
			// Should complete without throwing — inner resets each outer iteration
			expect(fn(0, 0, 0)).toBe(2);
		});
	});
});
