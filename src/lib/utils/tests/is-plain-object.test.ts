import { describe, expect, it } from 'vitest';

import isPlainObject from '../is-plain-object.js';

describe('isPlainObject', () => {
	describe('returns true', () => {
		it('returns true for empty object literal', () => {
			expect(isPlainObject({})).toBe(true);
		});

		it('returns true for object literal with properties', () => {
			expect(isPlainObject({ a: 1, b: 2 })).toBe(true);
		});

		it('returns true for nested plain object', () => {
			expect(isPlainObject({ nested: { value: 1 } })).toBe(true);
		});

		it('returns true for Object.create(Object.prototype)', () => {
			expect(isPlainObject(Object.create(Object.prototype))).toBe(true);
		});
	});

	describe('returns false', () => {
		it('returns false for null', () => {
			expect(isPlainObject(null)).toBe(false);
		});

		it('returns false for arrays', () => {
			expect(isPlainObject([1, 2, 3])).toBe(false);
		});

		it('returns false for empty array', () => {
			expect(isPlainObject([])).toBe(false);
		});

		it('returns false for Date instances', () => {
			expect(isPlainObject(new Date())).toBe(false);
		});

		it('returns false for RegExp instances', () => {
			expect(isPlainObject(/pattern/)).toBe(false);
		});

		it('returns false for Set instances', () => {
			expect(isPlainObject(new Set())).toBe(false);
		});

		it('returns false for Map instances', () => {
			expect(isPlainObject(new Map())).toBe(false);
		});

		it('returns false for numbers', () => {
			expect(isPlainObject(42)).toBe(false);
		});

		it('returns false for strings', () => {
			expect(isPlainObject('hello')).toBe(false);
		});

		it('returns false for booleans', () => {
			expect(isPlainObject(true)).toBe(false);
		});

		it('returns false for undefined', () => {
			expect(isPlainObject()).toBe(false);
		});

		it('returns false for functions', () => {
			expect(isPlainObject(() => {})).toBe(false);
		});

		it('returns false for Object.create(null)', () => {
			expect(isPlainObject(Object.create(null))).toBe(false);
		});
	});
});
