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

		it('does not set warnings for parse errors', () => {
			const result = validate('let = ;');
			expect(result.warnings).toBeUndefined();
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

		it('sets warnings array alongside rejections', () => {
			const result = validate('var x = 5;');
			expect(result.warnings).toBeDefined();
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

		it('sets warnings array for valid code', () => {
			const result = validate('let x = 5;\n');
			expect(result.warnings).toBeDefined();
		});

		it('returns ok true for empty program', () => {
			const result = validate('');
			expect(result.ok).toBe(true);
		});
	});

	describe('warnings only', () => {
		it('returns ok true when all violations are warnings', () => {
			// WHY: tab indentation triggers a warning but not a rejection
			const result = validate('\tlet x = 5;\n');
			expect(result.ok).toBe(true);
			expect(result.warnings!.length).toBeGreaterThan(0);
		});
	});

	describe('result is frozen', () => {
		it('top-level result is frozen', () => {
			const result = validate('let x = 5;\n');
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('warnings array is frozen', () => {
			const result = validate('let x = 5;\n');
			expect(Object.isFrozen(result.warnings)).toBe(true);
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
});
