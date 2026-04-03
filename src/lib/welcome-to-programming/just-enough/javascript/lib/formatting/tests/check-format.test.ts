import { describe, it, expect } from 'vitest';

import checkFormat from '../check-format.js';
import format from '../format.js';

describe('checkFormat', () => {
	it('returns formatted true for already-formatted code', () => {
		const code = format('let x = 5;\n');
		const result = checkFormat(code);
		expect(result.formatted).toBe(true);
	});

	it('returns formatted false for unformatted code', () => {
		const result = checkFormat('let x=5;');
		expect(result.formatted).toBe(false);
	});

	it('returns formatted false for missing semicolons', () => {
		const result = checkFormat('let x = 5');
		expect(result.formatted).toBe(false);
	});

	it('returns formatted true for unparseable code (graceful degradation)', () => {
		const result = checkFormat('let = ;');
		expect(result.formatted).toBe(true);
	});

	it('returns formatted true for empty string', () => {
		const result = checkFormat('');
		expect(result.formatted).toBe(true);
	});
});
