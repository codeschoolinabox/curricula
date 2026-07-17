import { describe, expect, it } from 'vitest';

import snippetTypes from '../snippet-types.js';

describe('snippetTypes', () => {
	describe('the admitted set', () => {
		it('admits module only', () => {
			expect(snippetTypes).toEqual(['module']);
		});
	});

	describe('the value is deeply frozen', () => {
		it('the array is frozen', () => {
			expect(Object.isFrozen(snippetTypes)).toBe(true);
		});
	});
});
