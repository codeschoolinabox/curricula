import { describe, expect, it } from 'vitest';

import categoryRoleGroupKey from '../keying/classification-group-key.js';

describe('categoryRoleGroupKey', () => {
	describe('Zero', () => {
		it('collapses a null role to the bare category', () => {
			expect(categoryRoleGroupKey('identifier', null)).toBe(
				'category:identifier',
			);
		});
	});

	describe('One', () => {
		it('refines a role-bearing category to category-and-role', () => {
			expect(categoryRoleGroupKey('operator', 'binary')).toBe(
				'category:operator:binary',
			);
		});
	});

	describe('Many', () => {
		it('keeps a second role under one category distinct', () => {
			expect(categoryRoleGroupKey('operator', 'logical')).toBe(
				'category:operator:logical',
			);
		});

		it('keys a string literal on its role', () => {
			expect(categoryRoleGroupKey('literal', 'string')).toBe(
				'category:literal:string',
			);
		});

		it('keys a delimiter on a hyphenated role', () => {
			expect(categoryRoleGroupKey('delimiter', 'call-arguments')).toBe(
				'category:delimiter:call-arguments',
			);
		});
	});

	describe('Boundaries', () => {
		it('collapses a null-role keyword to the bare category', () => {
			expect(categoryRoleGroupKey('keyword', null)).toBe('category:keyword');
		});
	});

	describe('Simple', () => {
		it('keys identically for the same inputs', () => {
			expect(categoryRoleGroupKey('operator', 'binary')).toEqual(
				categoryRoleGroupKey('operator', 'binary'),
			);
		});
	});
});
