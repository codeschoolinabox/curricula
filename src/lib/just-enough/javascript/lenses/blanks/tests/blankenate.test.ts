import { describe, expect, it } from 'vitest';

import blankenate from '../lib/blankenate.js';

const ALL_TYPES = {
	keywords: true,
	identifiers: true,
	operators: true,
	literals: true,
};

const NO_TYPES = {
	keywords: false,
	identifiers: false,
	operators: false,
	literals: false,
};

describe('blankenate', () => {
	describe('Zero', () => {
		it('returns blankedCode = "" for an empty source', () => {
			const result = blankenate('', 1, ALL_TYPES);
			expect(result?.blankedCode).toBe('');
		});

		it('returns blanks = [] for an empty source', () => {
			const result = blankenate('', 1, ALL_TYPES);
			expect(result?.blanks).toEqual([]);
		});

		it('returns originalCode = "" for an empty source', () => {
			const result = blankenate('', 1, ALL_TYPES);
			expect(result?.originalCode).toBe('');
		});
	});

	describe('One', () => {
		it('blanks the single identifier at probability 1.0 with identifiers enabled', () => {
			const result = blankenate('let x = 1;', 1, {
				...NO_TYPES,
				identifiers: true,
			});
			expect(result?.blanks.length).toBeGreaterThanOrEqual(1);
		});

		it('replaces the single identifier with __ in the blanked source', () => {
			const result = blankenate('let x = 1;', 1, {
				...NO_TYPES,
				identifiers: true,
			});
			expect(result?.blankedCode).toBe('let __ = 1;');
		});

		it('preserves the original code verbatim in originalCode', () => {
			const code = 'let x = 1;';
			const result = blankenate(code, 1, ALL_TYPES);
			expect(result?.originalCode).toBe(code);
		});
	});

	describe('Many', () => {
		it('blanks both keyword tokens in a two-statement source at probability 1', () => {
			const result = blankenate('let x = 1; let y = 2;', 1, {
				...NO_TYPES,
				keywords: true,
			});
			expect(result?.blanks.length).toBe(2);
		});

		it('returns blanks in ascending source-position order', () => {
			const result = blankenate('let x = 1; let y = 2;', 1, {
				...NO_TYPES,
				keywords: true,
			});
			const blanks = result?.blanks ?? [];
			expect(blanks[0]!.start).toBeLessThan(blanks[1]!.start);
		});

		it('replaces both keywords with __ at the correct positions', () => {
			const result = blankenate('let x = 1; let y = 2;', 1, {
				...NO_TYPES,
				keywords: true,
			});
			expect(result?.blankedCode).toBe('__ x = 1; __ y = 2;');
		});

		it('preserves position integrity for every blank (not just the first)', () => {
			const code = 'let x = 1; let y = 2;';
			const result = blankenate(code, 1, { ...NO_TYPES, keywords: true });
			for (const blank of result?.blanks ?? []) {
				expect(blank.original).toBe(code.slice(blank.start, blank.end));
			}
		});
	});

	describe('Boundaries', () => {
		it('returns blanks = [] at probability 0', () => {
			const result = blankenate('let x = 1;', 0, ALL_TYPES);
			expect(result?.blanks).toEqual([]);
		});

		it('returns the source unblanked at probability 0', () => {
			const code = 'let x = 1;';
			const result = blankenate(code, 0, ALL_TYPES);
			expect(result?.blankedCode).toBe(code);
		});

		it('returns blanks = [] when no content types are enabled', () => {
			const result = blankenate('let x = 1;', 1, NO_TYPES);
			expect(result?.blanks).toEqual([]);
		});
	});

	describe('Interfaces', () => {
		it('each blank carries an id, original, type, start, end', () => {
			const result = blankenate('let x = 1;', 1, {
				...NO_TYPES,
				identifiers: true,
			});
			const blank = result?.blanks[0];
			expect(blank).toMatchObject({
				id: expect.any(String),
				original: expect.any(String),
				type: expect.any(String),
				start: expect.any(Number),
				end: expect.any(Number),
			});
		});

		it('each blank.start/end is a valid half-open range into the original source', () => {
			const code = 'let x = 1;';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				identifiers: true,
			});
			const blank = result?.blanks[0];
			expect(blank?.original).toBe(code.slice(blank?.start, blank?.end));
		});

		it('each blank.type is one of identifier/literal/keyword/operator', () => {
			const result = blankenate('let x = 1 + 2;', 1, ALL_TYPES);
			for (const blank of result?.blanks ?? []) {
				expect(['identifier', 'literal', 'keyword', 'operator']).toContain(
					blank.type,
				);
			}
		});
	});

	describe('Exceptions', () => {
		it('returns null on Acorn parse failure', () => {
			const result = blankenate('let x = ;', 1, ALL_TYPES);
			expect(result).toBeNull();
		});
	});

	describe('Literal blanks preserve quotes (regression: evaluator quote-mismatch)', () => {
		it('string literal stores original WITH quotes (verbatim source slice)', () => {
			// Acorn's node.value for a string literal strips quotes
			// ('hi' for `"hi"`). The blank's source range [start, end)
			// includes the quotes. When the learner types the verbatim
			// source they reproduce the quotes; the evaluator must
			// compare against an original that ALSO has the quotes.
			const code = 'let x = "hi";';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				literals: true,
			});
			const blank = result?.blanks[0];
			expect(blank?.original).toBe('"hi"');
		});

		it('numeric literal stores original verbatim', () => {
			const code = 'let x = 42;';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				literals: true,
			});
			const blank = result?.blanks[0];
			expect(blank?.original).toBe('42');
		});

		it('literal blank.original equals code.slice(blank.start, blank.end) for every literal type', () => {
			const code = 'const a = "hi"; const b = 42; const c = true;';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				literals: true,
			});
			for (const blank of result?.blanks ?? []) {
				expect(blank.original).toBe(code.slice(blank.start, blank.end));
			}
		});
	});
});
