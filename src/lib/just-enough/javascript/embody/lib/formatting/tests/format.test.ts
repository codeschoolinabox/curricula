import { describe, it, expect } from 'vitest';

import format from '../format.js';

describe('format', () => {
	describe('happy path', () => {
		it('formats a simple variable declaration', async () => {
			const result = await format('let x=5;');
			expect(result).toContain('let x = 5;');
		});

		it('uses tabs for indentation', async () => {
			const result = await format('if (true) { console.log(1); }');
			expect(result).toContain('\tconsole.log(1);');
		});

		it('uses single quotes', async () => {
			const result = await format('let x = "hello";');
			expect(result).toContain("'hello'");
		});

		it('adds semicolons', async () => {
			const result = await format('let x = 5');
			expect(result).toContain('let x = 5;');
		});

		it('formats multiple statements on separate lines', async () => {
			const result = await format('let x = 5; let y = 10;');
			const lines = result.split('\n').filter((l: string) => l.trim());
			expect(lines.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('blank line preservation', () => {
		it('preserves a blank line between top-level functions', async () => {
			const input =
				'function a() {\n\treturn 1;\n}\n\nfunction b() {\n\treturn 2;\n}\n';
			const result = await format(input);
			expect(result).toContain('}\n\nfunction b()');
		});

		it('preserves a blank line inside a function body', async () => {
			const input =
				'function f() {\n\tconst x = 1;\n\n\tconst y = 2;\n\treturn x + y;\n}\n';
			const result = await format(input);
			expect(result).toContain('const x = 1;\n\n\tconst y = 2;');
		});

		it('collapses 3+ consecutive blank lines to one', async () => {
			const input = 'function a() {}\n\n\n\nfunction b() {}\n';
			const result = await format(input);
			expect(result).not.toMatch(/\n\n\n/);
			expect(result).toContain('}\n\nfunction b()');
		});

		it('strips leading blank lines at start of file', async () => {
			const input = '\n\nlet x = 5;\n';
			const result = await format(input);
			expect(result.startsWith('\n')).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('empty string → empty string', async () => {
			const result = await format('');
			expect(result).toBe('');
		});

		it('returns original code when code is unparseable', async () => {
			const badCode = 'let = ;';
			const result = await format(badCode);
			expect(result).toBe(badCode);
		});

		it('works on non-JeJ JavaScript', async () => {
			const result = await format('class Foo { bar() { return 42; } }');
			expect(result).toContain('class Foo');
		});

		it('is idempotent — formatting twice gives same result', async () => {
			const once = await format('let x=5;console.log(x);');
			const twice = await format(once);
			expect(twice).toBe(once);
		});

		it('is idempotent on input with preserved blank lines', async () => {
			const once = await format('function a() {}\n\nfunction b() {}\n');
			const twice = await format(once);
			expect(twice).toBe(once);
		});
	});

	describe('interface', () => {
		it('returns a Promise', () => {
			const result = format('let x = 5;');
			expect(result).toBeInstanceOf(Promise);
		});

		it('resolves to a string', async () => {
			const result = await format('let x = 5;');
			expect(typeof result).toBe('string');
		});
	});
});
