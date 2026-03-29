import { describe, it, expect } from 'vitest';

import format from '../format.js';

describe('format', () => {
	it('formats a simple variable declaration', () => {
		const result = format('let x=5;');
		expect(result).toContain('let x = 5;');
	});

	it('uses tabs for indentation', () => {
		const result = format('if (true) { console.log(1); }');
		expect(result).toContain('\tconsole.log(1);');
	});

	it('uses single quotes', () => {
		const result = format('let x = "hello";');
		expect(result).toContain("'hello'");
	});

	it('adds semicolons', () => {
		const result = format('let x = 5');
		expect(result).toContain('let x = 5;');
	});

	it('formats multiple statements on separate lines', () => {
		const result = format('let x = 5; let y = 10;');
		const lines = result.split('\n').filter((l: string) => l.trim());
		expect(lines.length).toBeGreaterThanOrEqual(2);
	});

	it('returns original code when code is unparseable', () => {
		const badCode = 'let = ;';
		const result = format(badCode);
		expect(result).toBe(badCode);
	});

	it('works on non-JeJ JavaScript', () => {
		const result = format('class Foo { bar() { return 42; } }');
		expect(result).toContain('class Foo');
	});

	it('is idempotent — formatting twice gives same result', () => {
		const once = format('let x=5;console.log(x);');
		const twice = format(once);
		expect(twice).toBe(once);
	});
});
