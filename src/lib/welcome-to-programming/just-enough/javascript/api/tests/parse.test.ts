import { describe, it, expect } from 'vitest';

import parse from '../parse.js';

describe('parse', () => {
	describe('valid code', () => {
		it('returns ok true for valid JS', () => {
			const result = parse('let x = 5;\n');
			expect(result.ok).toBe(true);
		});

		it('includes the ast with type Program', () => {
			const result = parse('let x = 5;\n');
			if (!result.ok) throw new Error('expected ok');
			expect(result.ast.type).toBe('Program');
		});

		it('echoes back the code', () => {
			const code = 'let x = 5;\n';
			const result = parse(code);
			expect(result.code).toBe(code);
		});

		it('does not set error', () => {
			const result = parse('let x = 5;\n');
			if (result.ok) {
				expect('error' in result).toBe(false);
			}
		});

		it('returns ok true for empty program', () => {
			const result = parse('');
			expect(result.ok).toBe(true);
		});

		it('ast has location data', () => {
			const result = parse('let x = 5;\n');
			if (!result.ok) throw new Error('expected ok');
			expect(result.ast.loc).toBeDefined();
		});
	});

	describe('parse errors', () => {
		it('returns ok false for unparseable code', () => {
			const result = parse('let = ;');
			expect(result.ok).toBe(false);
		});

		it('sets error with kind parse', () => {
			const result = parse('let = ;');
			if (result.ok) throw new Error('expected not ok');
			expect(result.error.kind).toBe('parse');
		});

		it('includes error name SyntaxError and message', () => {
			const result = parse('let = ;');
			if (result.ok) throw new Error('expected not ok');
			expect(result.error.name).toBe('SyntaxError');
			expect(result.error.message).toBeTruthy();
		});

		it('includes line in parse error', () => {
			const result = parse('let = ;');
			if (result.ok) throw new Error('expected not ok');
			expect(result.error.line).toBeTypeOf('number');
		});

		it('echoes back the code', () => {
			const code = 'let = ;';
			const result = parse(code);
			expect(result.code).toBe(code);
		});

		it('does not set ast', () => {
			const result = parse('let = ;');
			if (!result.ok) {
				expect('ast' in result).toBe(false);
			}
		});
	});

	describe('module mode', () => {
		it('allows import declarations', () => {
			const result = parse('import x from "y";\n');
			expect(result.ok).toBe(true);
		});

		it('allows export declarations', () => {
			const result = parse('export let x = 5;\n');
			expect(result.ok).toBe(true);
		});
	});

	describe('with statement fallback', () => {
		it('returns ok true for code with with statement', () => {
			const result = parse('with (Math) { let x = PI; }\n');
			expect(result.ok).toBe(true);
		});

		it('sets with to true for with statement code', () => {
			const result = parse('with (Math) { let x = PI; }\n');
			if (!result.ok) throw new Error('expected ok');
			expect(result.with).toBe(true);
		});

		it('reports module error when script parses but no with', () => {
			// Octal literals are valid in script mode but not module mode.
			// No `with` statement, so the module error should be reported.
			const result = parse('let x = 010;\n');
			expect(result.ok).toBe(false);
		});
	});

	describe('result freezing', () => {
		it('result is frozen', () => {
			const result = parse('let x = 5;\n');
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('error object is frozen when present', () => {
			const result = parse('let = ;');
			if (result.ok) throw new Error('expected not ok');
			expect(Object.isFrozen(result.error)).toBe(true);
		});

		it('ast is frozen', () => {
			const result = parse('let x = 5;\n');
			if (!result.ok) throw new Error('expected ok');
			expect(Object.isFrozen(result.ast)).toBe(true);
		});
	});
});
