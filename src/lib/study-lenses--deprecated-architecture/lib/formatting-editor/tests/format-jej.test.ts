import { describe, expect, it } from 'vitest';

import format from '../../../../embody/lib/formatting/format.js';
import formatJej from '../format-jej.js';

describe('formatJej', () => {
	describe('empty input', () => {
		it('returns an empty string', async () => {
			expect(await formatJej('')).toBe('');
		});
	});

	describe('one statement', () => {
		it('reflows unformatted JEJ to canonical form', async () => {
			expect(await formatJej('let x=5;')).toBe('let x = 5;\n');
		});
	});

	describe('many statements', () => {
		it('reflows every statement, not just the first', async () => {
			expect(await formatJej('let x=5;let y=6;')).toBe(
				'let x = 5;\nlet y = 6;\n',
			);
		});
	});

	describe('boundaries', () => {
		describe('idempotence', () => {
			it('formatting an already-formatted snippet yields the same snippet', async () => {
				const once = await formatJej('let x=5;');
				expect(await formatJej(once)).toBe(once);
			});
		});

		describe('non-JEJ JavaScript', () => {
			it('formats `var` (no JEJ-subset gate)', async () => {
				expect(await formatJej('var x=5;')).toBe('var x = 5;\n');
			});
		});
	});

	describe('exceptions', () => {
		describe('syntax error', () => {
			it('returns the unparseable input unchanged', async () => {
				const code = 'let x = ;';
				expect(await formatJej(code)).toBe(code);
			});
		});
	});

	describe('alignment with the canonical formatter', () => {
		it.each(['', 'let x=5;', 'var x=5;', 'let x = ;'])(
			'matches format() for input %p',
			async (sample) => {
				expect(await formatJej(sample)).toBe(await format(sample));
			},
		);
	});
});
