import { describe, it, expect } from 'vitest';

import interpretError from '../interpret-error.js';

describe('interpretError', () => {
	describe('unknown error type', () => {
		it('returns a generic fallback for unknown errors', () => {
			const result = interpretError('let x = 5;', {
				name: 'WeirdError',
				message: 'something completely unknown',
				line: 1,
			});
			expect(result.whatWentWrong).toContain('WeirdError');
		});
	});

	describe('frozen output', () => {
		it('returns a frozen object', () => {
			const result = interpretError('let x = 5;', {
				name: 'ReferenceError',
				message: 'y is not defined',
				line: 1,
			});
			expect(Object.isFrozen(result)).toBe(true);
		});
	});

	describe('all fields populated', () => {
		it('returns non-empty strings for all four text fields', () => {
			const result = interpretError('let x = 5;', {
				name: 'ReferenceError',
				message: 'y is not defined',
				line: 1,
			});
			expect(result.whatWentWrong.length).toBeGreaterThan(0);
			expect(result.howToFix.length).toBeGreaterThan(0);
			expect(result.likelyMisunderstanding.length).toBeGreaterThan(0);
			expect(result.howToAdjust.length).toBeGreaterThan(0);
		});
	});

	describe('context included', () => {
		it('includes context with extracted identifier', () => {
			const result = interpretError('console.log(myVar);', {
				name: 'ReferenceError',
				message: 'myVar is not defined',
				line: 1,
			});
			expect(result.context?.name).toBe('myVar');
		});
	});

	describe('handles missing line number', () => {
		it('returns a result without crashing when line is absent', () => {
			const result = interpretError('let x = 5;', {
				name: 'TypeError',
				message: 'something broke',
			});
			expect(result.whatWentWrong).toBeDefined();
		});
	});

	describe('handles empty source', () => {
		it('returns a result for empty source string', () => {
			const result = interpretError('', {
				name: 'SyntaxError',
				message: 'Unexpected end of input',
				line: 1,
			});
			expect(result.whatWentWrong).toBeDefined();
		});
	});

	describe('never throws', () => {
		it('handles pathological input without throwing', () => {
			expect(() =>
				interpretError('}{}{}{!@#', {
					name: '',
					message: '',
				}),
			).not.toThrow();
		});
	});
});
