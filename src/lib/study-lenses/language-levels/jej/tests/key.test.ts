import { describe, expect, it } from 'vitest';

import key from '../key.js';

describe('key', () => {
	it('is the registry identity "jej"', () => {
		expect(key).toBe('jej');
	});
});
