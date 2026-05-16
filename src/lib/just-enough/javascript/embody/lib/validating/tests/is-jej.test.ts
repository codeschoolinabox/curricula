import { describe, it, expect } from 'vitest';

import isJej from '../is-jej.js';
import format from '../../formatting/format.js';

describe('isJej', () => {
	it('returns true for valid, formatted JeJ code', async () => {
		const code = await format('let x = 5;\n');
		expect(await isJej(code)).toBe(true);
	});

	it('returns false for unformatted code', async () => {
		expect(await isJej('let x=5;')).toBe(false);
	});

	it('returns false for non-JeJ code', async () => {
		expect(await isJej('var x = 5;\n')).toBe(false);
	});

	it('returns false for property assignment', async () => {
		const code = await format('console.log = 5;\n');
		expect(await isJej(code)).toBe(false);
	});

	it('returns false for parse errors', async () => {
		expect(await isJej('let = ;')).toBe(false);
	});

	it('returns true for empty program', async () => {
		expect(await isJej('')).toBe(true);
	});
});
