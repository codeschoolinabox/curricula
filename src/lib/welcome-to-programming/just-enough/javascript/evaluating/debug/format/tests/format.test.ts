import { describe, expect, it } from 'vitest';

import formatCode from '../format.js';

describe('formatCode', () => {
	describe('formatting behavior', () => {
		it('formats messy whitespace into clean output', async () => {
			const messy = 'let   x  =   1  ;';
			const result = await formatCode(messy);
			expect(result.trim()).toBe('let x = 1;');
		});

		it('uses tabs for indentation', async () => {
			const code = 'if (true) { console.log(1); }';
			const result = await formatCode(code);
			expect(result).toContain('\t');
		});

		it('adds trailing commas in multi-line contexts', async () => {
			const code =
				'const a = [\n  "aaaaaaaaaaaa",\n  "bbbbbbbbbbbb",\n  "cccccccccccc",\n  "dddddddddddd",\n  "eeeeeeeeeeee"\n]';
			const result = await formatCode(code);
			expect(result).toContain("'eeeeeeeeeeee',");
		});

		it('uses single quotes', async () => {
			const code = 'let x = "hello";';
			const result = await formatCode(code);
			expect(result).toContain("'hello'");
		});

		it('adds semicolons', async () => {
			const code = 'let x = 1';
			const result = await formatCode(code);
			expect(result.trim()).toBe('let x = 1;');
		});
	});

	describe('options override', () => {
		it('accepts custom printWidth', async () => {
			const longLine =
				'const result = someFunction(argumentOne, argumentTwo, argumentThree);';
			const narrow = await formatCode(longLine, { printWidth: 40 });
			const wide = await formatCode(longLine, { printWidth: 200 });
			expect(narrow.split('\n').length).toBeGreaterThan(
				wide.split('\n').length,
			);
		});

		it('accepts useTabs override', async () => {
			const code = 'if (true) { console.log(1); }';
			const result = await formatCode(code, { useTabs: false });
			expect(result).not.toContain('\t');
		});
	});

	describe('error handling', () => {
		it('returns original code for unparseable input', async () => {
			const broken = 'function { this is not valid javascript !!!';
			const result = await formatCode(broken);
			expect(result).toBe(broken);
		});
	});

	describe('return type', () => {
		it('returns a string', async () => {
			const result = await formatCode('let x = 1;');
			expect(typeof result).toBe('string');
		});

		it('returns a Promise', () => {
			const result = formatCode('let x = 1;');
			expect(result).toBeInstanceOf(Promise);
		});
	});
});
