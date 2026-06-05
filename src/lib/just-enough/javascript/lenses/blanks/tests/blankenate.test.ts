import { describe, expect, it } from 'vitest';

import blankenate from '../lib/blankenate.js';

const ALL_TYPES = {
	keywords: true,
	identifiers: true,
	operators: true,
	literals: true,
	delimiters: true,
};

const NO_TYPES = {
	keywords: false,
	identifiers: false,
	operators: false,
	literals: false,
	delimiters: false,
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

		it('each blank.type is one of identifier/literal/keyword/operator/delimiter', () => {
			const result = blankenate('let x = 1 + 2;', 1, ALL_TYPES);
			for (const blank of result?.blanks ?? []) {
				expect([
					'identifier',
					'literal',
					'keyword',
					'operator',
					'delimiter',
				]).toContain(blank.type);
			}
		});
	});

	describe('Exceptions', () => {
		it('returns null on Acorn parse failure', () => {
			const result = blankenate('let x = ;', 1, ALL_TYPES);
			expect(result).toBeNull();
		});
	});

	describe('Delimiter blanks — Inc 6.6 (5th content-type)', () => {
		it('blanks parentheses when delimiters is enabled', () => {
			const result = blankenate('foo();', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('(');
			expect(originals).toContain(')');
		});

		it('blanks brackets, semicolons, commas, dots', () => {
			const code = 'x = [a, b.c];';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original).sort();
			expect(originals).toContain('[');
			expect(originals).toContain(']');
			expect(originals).toContain(';');
			expect(originals).toContain(',');
			expect(originals).toContain('.');
		});

		it('blanks block/object braces `{` and `}`', () => {
			const code = 'function f() { return { a: 1 }; }';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('{');
			expect(originals).toContain('}');
		});

		// Template-literal: Acorn shares `tokTypes.braceR` (label `}`)
		// between block-close, object-close, AND template-expression-close.
		// Both forms blank as `}`; the learner types `}` either way, so
		// the label-only filter is pedagogically sound. The
		// template-expression OPENER `${` is its own TokenType
		// (`tokTypes.dollarBraceL`, label `${`) — a single 2-char token
		// — and is also blank-eligible under delimiters.
		it('blanks `${` as a single 2-char delimiter inside a template literal', () => {
			const code = 'const s = `a${x}b`;';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('${');
			// The matching template-close `}` is also blank-eligible
			// (same label as block-close; both blank as `}`).
			expect(originals).toContain('}');
			// Defensive: `${` blank position spans exactly 2 chars
			// AND the label matches the source slice at those bytes
			// (AR-3 concern 1: tightens the `original === label` shortcut
			// for the template-open token specifically, since the
			// general position-integrity test below uses a source
			// without `${`).
			const dollarBlank = (result?.blanks ?? []).find(
				(b) => b.original === '${',
			);
			expect(dollarBlank).toBeDefined();
			expect(dollarBlank!.end - dollarBlank!.start).toBe(2);
			expect(code.slice(dollarBlank!.start, dollarBlank!.end)).toBe('${');
			expect(dollarBlank!.original).toBe(
				code.slice(dollarBlank!.start, dollarBlank!.end),
			);
		});

		// `${` must NOT split into separate `$` and `{` blanks (would
		// occur if the algorithm tokenized character-by-character
		// instead of using Acorn's compound `tokTypes.dollarBraceL`).
		//
		// Note (AR-3 concern 3 — deferred): nested template literals
		// (`` `${`${x}`}` ``) are not specifically tested. The
		// algorithm's token-walk is flat (not recursive) and
		// label-based, so nesting should work by construction —
		// but the edge case is uncovered. Low pedagogical value
		// for v1; revisit if/when learners encounter the case.
		it('does NOT split `${` into separate `$` and `{` blanks', () => {
			const code = 'const s = `a${x}b`;';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).not.toContain('$');
			// AR-3 concern 2: `${` must not also produce a SEPARATE
			// `{` blank. Acorn correctly emits `${` as one compound
			// token, so the `{` from `${` should never appear as its
			// own blank. The block/object braces in this snippet are
			// zero (no `{` outside the template), so any `{` in
			// originals would indicate the algorithm wrongly split
			// `${` into a `$` (suppressed by the previous assertion)
			// AND a `{` (this assertion).
			expect(originals.filter((o) => o === '{').length).toBe(0);
		});

		it('produces ZERO delimiter blanks when only delimiters is disabled', () => {
			const code = 'foo(a, b);';
			const result = blankenate(code, 1, {
				keywords: true,
				identifiers: true,
				operators: true,
				literals: true,
				delimiters: false,
			});
			const delimiterBlanks = (result?.blanks ?? []).filter(
				(b) => b.type === 'delimiter',
			);
			expect(delimiterBlanks).toEqual([]);
		});

		it('every delimiter blank has type === "delimiter"', () => {
			const result = blankenate('foo();', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			for (const blank of result?.blanks ?? []) {
				expect(blank.type).toBe('delimiter');
			}
		});

		it('delimiter blank position is valid: original === source.slice(start, end)', () => {
			const code = 'foo(a, b);';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			for (const blank of result?.blanks ?? []) {
				expect(blank.original).toBe(code.slice(blank.start, blank.end));
			}
		});

		// AR-3 concern 1: spread `...` must NOT produce `.` blanks. Acorn
		// emits spread as a single `...`-labeled token (NOT three dots);
		// the DELIMITER_LABELS filter excludes it because `'...'` is not
		// in the set. Lock this with a test so a future change to the set
		// (e.g. someone adds `'...'`) does not silently mis-blank spread.
		it('spread `...` does NOT produce `.` blanks', () => {
			const code = 'function f(a, ...rest) { return [...rest]; }';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			// Both spread positions in the source must NOT appear as `.`
			// blanks. The originals array should contain dots only from
			// member-access (none in this source) and never from spread.
			const dotOriginals = (result?.blanks ?? []).filter(
				(b) => b.original === '.',
			);
			expect(dotOriginals).toEqual([]);
			// Defensively also assert no `..` or `...` slipped through.
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).not.toContain('..');
			expect(originals).not.toContain('...');
		});

		// AR-3 concern 2: ternary `?` / `:`, optional chaining `?.`, and
		// arrow `=>` are deliberately EXCLUDED from DELIMITER_LABELS.
		// Their labels are `?`, `:`, `?.`, `=>` — none are in the set.
		// Lock the exclusion behaviorally so the decision boundary is
		// documented in test, not just in code.
		it('ternary `?`/`:`, optional chaining `?.`, and arrow `=>` are NOT blanked under delimiters', () => {
			const code = 'const f = (x) => (x ? x.a : null); const g = obj?.prop;';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).not.toContain('?');
			expect(originals).not.toContain('=>');
			expect(originals).not.toContain('?.');
			// Note: `:` inside object literals is also out-of-set; the
			// ternary colon shares the label so both are excluded.
			expect(originals).not.toContain(':');
		});

		// AR-3 concern 3: regex literals are emitted by Acorn as a single
		// `regexp`-labeled token, NOT as separate `/` delimiters. Lock
		// that no `/` blanks appear inside a source containing regex
		// literals.
		it('regex-literal slashes are NOT blanked as delimiters', () => {
			const code = 'const re = /\\d+/g; const s = re.test("42");';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).not.toContain('/');
		});

		// AR-3 concern 6: a source where ONLY a delimiter should be
		// blanked under {delimiters: true} (other tokens exist but
		// are de-flagged). Confirms the token-walk runs independently
		// of the AST walk and produces the expected single blank.
		it('isolates the token-walk path: source with only one eligible delimiter', () => {
			const code = 'a;';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const blanks = result?.blanks ?? [];
			expect(blanks.length).toBe(1);
			expect(blanks[0]?.type).toBe('delimiter');
			expect(blanks[0]?.original).toBe(';');
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
