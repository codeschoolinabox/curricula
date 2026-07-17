import { describe, expect, it } from 'vitest';

import label from '../label.js';

describe('label', () => {
	it('is the display name "Just Enough JavaScript"', () => {
		expect(label).toBe('Just Enough JavaScript');
	});
});
