import { describe, it, expect } from 'vitest';

import checkFormat from '../check-format.js';
import format from '../format.js';

describe('checkFormat', () => {
	it('returns formatted true for already-formatted code', async () => {
		const code = await format('let x = 5;\n');
		const result = await checkFormat(code);
		expect(result.formatted).toBe(true);
	});

	it('returns formatted false for unformatted code', async () => {
		const result = await checkFormat('let x=5;');
		expect(result.formatted).toBe(false);
	});

	it('returns formatted false for missing semicolons', async () => {
		const result = await checkFormat('let x = 5');
		expect(result.formatted).toBe(false);
	});

	it('returns formatted true for unparseable code (graceful degradation)', async () => {
		const result = await checkFormat('let = ;');
		expect(result.formatted).toBe(true);
	});

	it('returns formatted true for empty string', async () => {
		const result = await checkFormat('');
		expect(result.formatted).toBe(true);
	});

	it('returns formatted true for code with preserved blank lines (formatted output)', async () => {
		const code = await format('function a() {}\n\nfunction b() {}\n');
		const result = await checkFormat(code);
		expect(result.formatted).toBe(true);
	});
});
