import { describe, it, expect } from 'vitest';

import isJej from '../is-jej.js';
import { format } from '../../api/format.js';

describe('isJej', () => {
	it('returns true for valid, formatted JeJ code', () => {
		const code = format('let x = 5;\n');
		expect(isJej(code)).toBe(true);
	});

	it('returns false for unformatted code', () => {
		expect(isJej('let x=5;')).toBe(false);
	});

	it('returns false for non-JeJ code', () => {
		expect(isJej('var x = 5;\n')).toBe(false);
	});

	it('returns false for property assignment', () => {
		const code = format('console.log = 5;\n');
		expect(isJej(code)).toBe(false);
	});

	it('returns false for parse errors', () => {
		expect(isJej('let = ;')).toBe(false);
	});

	it('returns true for empty program', () => {
		expect(isJej('')).toBe(true);
	});
});
