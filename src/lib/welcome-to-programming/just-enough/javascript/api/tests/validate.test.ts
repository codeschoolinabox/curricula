import { describe, it, expect } from 'vitest';

import validate from '../validate.js';

describe('validate', () => {
	describe('parse errors', () => {
		it('returns ok false for unparseable code', () => {
			const result = validate('let = ;');
			expect(result.ok).toBe(false);
		});

		it('sets error with kind parse', () => {
			const result = validate('let = ;');
			expect(result.error).toBeDefined();
			expect(result.error!.kind).toBe('parse');
		});

		it('includes error name and message', () => {
			const result = validate('let = ;');
			expect(result.error!.name).toBe('SyntaxError');
			expect(result.error!.message).toBeTruthy();
		});

		it('includes line in parse error', () => {
			const result = validate('let = ;');
			expect(result.error!.line).toBeTypeOf('number');
		});

		it('does not set rejections for parse errors', () => {
			const result = validate('let = ;');
			expect(result.rejections).toBeUndefined();
		});
	});

	describe('rejections', () => {
		it('returns ok false for code with rejections', () => {
			const result = validate('var x = 5;');
			expect(result.ok).toBe(false);
		});

		it('does not set error for rejections', () => {
			const result = validate('var x = 5;');
			expect(result.error).toBeUndefined();
		});

		it('sets rejections array with violations', () => {
			const result = validate('var x = 5;');
			expect(result.rejections).toBeDefined();
			expect(result.rejections!.length).toBeGreaterThan(0);
		});

		it('rejections all have severity rejection', () => {
			const result = validate('var x = 5;');
			for (const violation of result.rejections!) {
				expect(violation.severity).toBe('rejection');
			}
		});
	});

	describe('valid code', () => {
		it('returns ok true for valid JeJ code', () => {
			const result = validate('let x = 5;\n');
			expect(result.ok).toBe(true);
		});

		it('does not set error for valid code', () => {
			const result = validate('let x = 5;\n');
			expect(result.error).toBeUndefined();
		});

		it('does not set rejections for valid code', () => {
			const result = validate('let x = 5;\n');
			expect(result.rejections).toBeUndefined();
		});

		it('returns ok true for empty program', () => {
			const result = validate('');
			expect(result.ok).toBe(true);
		});
	});

	describe('result is frozen', () => {
		it('top-level result is frozen', () => {
			const result = validate('let x = 5;\n');
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('rejections array is frozen when present', () => {
			const result = validate('var x = 5;');
			expect(Object.isFrozen(result.rejections)).toBe(true);
		});

		it('error object is frozen when present', () => {
			const result = validate('let = ;');
			expect(Object.isFrozen(result.error)).toBe(true);
		});
	});

	describe('property assignment blocked', () => {
		it('rejects property assignment', () => {
			const result = validate('console.log = 5;\n');
			expect(result.ok).toBe(false);
			expect(result.rejections).toBeDefined();
			expect(result.rejections![0].message).toContain(
				'property assignment',
			);
		});

		it('rejects computed property assignment', () => {
			const result = validate('let arr = [1];\narr[0] = 5;\n');
			expect(result.ok).toBe(false);
		});

		it('allows simple variable assignment', () => {
			const result = validate('let x = 5;\nx = 10;\n');
			expect(result.ok).toBe(true);
		});
	});

	describe('parentheses allowed', () => {
		it('allows parenthesized expressions', () => {
			const result = validate('let x = (1 + 2) * 3;\n');
			expect(result.ok).toBe(true);
		});
	});
});
