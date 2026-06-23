import * as acorn from 'acorn';
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

		it('replaces the single identifier with length-matched underscores in the blanked source', () => {
			const result = blankenate('let x = 1;', 1, {
				...NO_TYPES,
				identifiers: true,
			});
			// placeholder is `_` repeated original.length times.
			// `x` is 1 char, so the placeholder is `_` (not `__`).
			expect(result?.blankedCode).toBe('let _ = 1;');
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
			expect(blanks[0].start).toBeLessThan(blanks[1].start);
		});

		it('replaces both keywords with length-matched underscores', () => {
			const result = blankenate('let x = 1; let y = 2;', 1, {
				...NO_TYPES,
				keywords: true,
			});
			// `let` is 3 chars, so each placeholder is `___` (3 underscores).
			expect(result?.blankedCode).toBe('___ x = 1; ___ y = 2;');
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
			expect(blank).toBeDefined();
			expect(blank?.original).toBe(
				code.slice(blank?.start ?? 0, blank?.end ?? 0),
			);
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

	describe('Delimiter blanks — (5th content-type)', () => {
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
			const originals = (result?.blanks ?? [])
				.map((b) => b.original)
				.toSorted((a, b) => a.localeCompare(b));
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

		// spread `...` is now a SINGLE blank (Acorn emits it
		// as one `...`-labeled token via `tokTypes.ellipsis`). Lock
		// that spread produces exactly one 3-char `...` blank per
		// occurrence, and NEVER produces 1- or 2-char `.` blanks from
		// the spread token (those would indicate the token was
		// mis-split).
		it('spread `...` produces a single 3-char `...` blank per occurrence', () => {
			const code = 'function f(a, ...rest) { return [...rest]; }';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			// Two spread sites: the rest param `...rest` and the spread
			// `[...rest]`.
			const spreads = originals.filter((o) => o === '...');
			expect(spreads.length).toBe(2);
			// No partial spread leakage.
			expect(originals).not.toContain('..');
			// No `.` from spread (this source has no member-access dots).
			expect(originals).not.toContain('.');
		});

		// ternary `?` / `:`, optional chaining `?.`, and arrow
		// `=>` are now IN DELIMITER_LABELS (user-directed reversal of
		// AR-3 exclusion). Lock that they are blanked.
		it('ternary `?`/`:`, optional chaining `?.`, and arrow `=>` ARE blanked under delimiters ', () => {
			const code = 'const f = (x) => (x ? x.a : null); const g = obj?.prop;';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('?');
			expect(originals).toContain('=>');
			expect(originals).toContain('?.');
			// `:` is also in the set (covers ternary, object literals,
			// labels — all share the same TokenType).
			expect(originals).toContain(':');
		});

		// AR-3 concern 3: regex literals are emitted by Acorn as a single
		// `regexp`-labeled token, NOT as separate `/` delimiters. Lock
		// that no `/` blanks appear inside a source containing regex
		// literals.
		it('regex-literal slashes are NOT blanked as delimiters', () => {
			const code = String.raw`const re = /\d+/g; const s = re.test("42");`;
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

	describe('comprehensive Acorn-punctuator coverage + user regression', () => {
		// The user's exact source from the post-Inc-7 sandbox: arrow
		// `=>` was visible at difficulty 100 with all categories
		// checked. Lock the fix.
		it('user regression: arrow `=>` IS blanked in `const greeting = (name) => `...``', () => {
			const code = 'const greeting = (name) => `hello, ${name}`;';
			const result = blankenate(code, 1, ALL_TYPES);
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('=>');
		});

		// Optional chaining
		it('optional chaining: `obj?.prop` produces `?.` blank + identifier blanks', () => {
			const result = blankenate('obj?.prop;', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('?.');
			expect(originals).toContain(';');
		});

		// Spread
		it('spread: `[...args]` produces `[`, `...`, `]` delimiter blanks', () => {
			const result = blankenate('[...args];', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('[');
			expect(originals).toContain('...');
			expect(originals).toContain(']');
		});

		// Ternary
		it('ternary: `a ? b : c` produces `?` and `:` blanks; identifiers preserved when delimiters-only', () => {
			const result = blankenate('a ? b : c;', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('?');
			expect(originals).toContain(':');
			// Identifiers a/b/c stay (delimiters-only)
			expect(originals).not.toContain('a');
			expect(originals).not.toContain('b');
			expect(originals).not.toContain('c');
		});

		// Object literal colon (shares the `:` TokenType with ternary)
		it('object literal: `{a: 1}` colon IS blanked under delimiters', () => {
			const result = blankenate('({a: 1});', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain(':');
		});

		// Negative locks: things that must NOT be blanked under delimiters
		// reversed the backtick exclusion — see the
		// `Inc 6.o — backticks blank under delimiters` describe block
		// below for the new positive locks.

		it('regex slashes are NOT blanked as delimiters (regex is one `regexp` token)', () => {
			const result = blankenate(String.raw`const re = /\d+/g;`, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).not.toContain('/');
		});

		// AR-fix: behavioral matrix. For EACH Acorn
		// punctuator label, drive `blankenate` with a source that
		// contains the token and assert it IS or ISN'T in
		// `originals`, per the documented DELIMITER_LABELS contract.
		// Pulls labels from `acorn.tokTypes.*` so a future Acorn rename
		// fails the test at parse time. Each row is a real `blankenate`
		// call — not a hardcoded-set comparison.
		const PUNCTUATOR_MATRIX: ReadonlyArray<
			readonly [label: string, source: string, expected: 'in' | 'out']
		> = [
			[acorn.tokTypes.parenL.label, '(x);', 'in'],
			[acorn.tokTypes.parenR.label, '(x);', 'in'],
			[acorn.tokTypes.braceL.label, '{ a: 1 };', 'in'],
			[acorn.tokTypes.braceR.label, '{ a: 1 };', 'in'],
			[acorn.tokTypes.dollarBraceL.label, 'const s = `a${x}b`;', 'in'],
			[acorn.tokTypes.bracketL.label, '[a];', 'in'],
			[acorn.tokTypes.bracketR.label, '[a];', 'in'],
			[acorn.tokTypes.semi.label, 'a;', 'in'],
			[acorn.tokTypes.comma.label, 'a, b;', 'in'],
			[acorn.tokTypes.dot.label, 'a.b;', 'in'],
			[acorn.tokTypes.arrow.label, 'const f = (x) => x;', 'in'],
			[acorn.tokTypes.question.label, 'a ? b : c;', 'in'],
			[acorn.tokTypes.colon.label, 'a ? b : c;', 'in'],
			[acorn.tokTypes.questionDot.label, 'obj?.prop;', 'in'],
			[acorn.tokTypes.ellipsis.label, '[...rest];', 'in'],
			// backtick now IN (was OUT in era).
			[acorn.tokTypes.backQuote.label, 'const s = `hi`;', 'in'],
			// AR-fix: keep at least one `'out'` row so
			// the matrix test's negative branch stays live. Regex `/` is
			// a permanent exclusion (regex literal is one `regexp` token,
			// not separately tokenized).
			['/', 'const re = /d+/g;', 'out'],
		];

		it.each(PUNCTUATOR_MATRIX)(
			'Acorn label `%s` is %s of DELIMITER_LABELS (source: `%s`)',
			(label, source, expected) => {
				const result = blankenate(source, 1, {
					...NO_TYPES,
					delimiters: true,
				});
				const originals = (result?.blanks ?? []).map((b) => b.original);
				if (expected === 'in') {
					expect(originals).toContain(label);
				} else {
					expect(originals).not.toContain(label);
				}
			},
		);

		// AR-fix: sibling regression with delimiters-only
		// to triangulate that `=>` is caught by the DELIMITER path, not
		// by the operator AST-walk. AR-3 era assertions ran
		// `ALL_TYPES`; this isolates the delimiter contribution.
		it('arrow `=>` IS blanked under delimiters-only (delimiter-path triangulation)', () => {
			const code = 'const f = (x) => x;';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('=>');
		});

		// AR-3 MINOR 5 fix: lock the FULL user source (both lines),
		// not just the first. Member-access + nested call + string
		// literal all in the second line.
		it('user regression (full source, both lines): all delimiters present in blanks', () => {
			const code =
				"const greeting = (name) => `hello, ${name}`;\nconsole.log(greeting('world'));";
			const result = blankenate(code, 1, ALL_TYPES);
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('=>');
			expect(originals).toContain('${');
			// Second-line delimiters: member-access dot, parens, semicolon.
			expect(originals).toContain('.');
			expect(originals).toContain('(');
			expect(originals).toContain(')');
			expect(originals).toContain(';');
		});

		// AR-fix: private-field identifier `#x` uses
		// `tokTypes.privateId` with label `name` (Acorn emits it as a
		// name-class token with `value` carrying the `#` prefix). It
		// is NOT a delimiter and must NOT be blanked under delimiters-
		// only — lock the negative case so a future change adding
		// `'#'` to the set doesn't go silent.
		it('private field `#x` is NOT blanked under delimiters-only', () => {
			const code = 'class C { #x = 1; }';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).not.toContain('#');
			expect(originals).not.toContain('#x');
		});

		// AR-3 MINOR 6 fix: labeled-statement `:` shares `tokTypes.colon`
		// with ternary and object-literal. Confirms blanking applies
		// uniformly to all `:` contexts.
		it('labeled-statement `:` IS blanked (shares TokenType with ternary)', () => {
			const code = 'outer: while (true) { break outer; }';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain(':');
		});

		// AR-3 MINOR 4 fix: compound-label tokens emit as ONE blank, not
		// split. The prior test was vacuous (matched any blank since the
		// position-validity invariant holds for split blanks too).
		// These tests assert the EXPECTED blank LENGTH per label.
		it('compound label `=>` produces one 2-char blank (not split into `=` + `>`)', () => {
			const result = blankenate('const f = (x) => x;', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const arrows = (result?.blanks ?? []).filter((b) => b.original === '=>');
			expect(arrows.length).toBe(1);
			expect(arrows[0].end - arrows[0].start).toBe(2);
		});

		it('compound label `?.` produces one 2-char blank (not split into `?` + `.`)', () => {
			const result = blankenate('obj?.prop;', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const optChain = (result?.blanks ?? []).filter(
				(b) => b.original === '?.',
			);
			expect(optChain.length).toBe(1);
			expect(optChain[0].end - optChain[0].start).toBe(2);
		});

		it('compound label `...` produces one 3-char blank (not split into 3 dots)', () => {
			const result = blankenate('[...rest];', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const spreads = (result?.blanks ?? []).filter(
				(b) => b.original === '...',
			);
			expect(spreads.length).toBe(1);
			expect(spreads[0].end - spreads[0].start).toBe(3);
		});
	});

	describe('Inc 6.k — comprehensive token coverage (keywords, identifiers, operators)', () => {
		it('blanks every reserved keyword Acorn flags as .keyword under keywords=true', () => {
			// Token-stream walk uses Acorn's `tok.type.keyword` flag.
			// Verifies the broad sweep beyond the AST-walk subset
			// that covered (which missed import/from/extends/
			// super/yield/async/await/try/catch/finally/throw/break/
			// continue/typeof/instanceof/delete/void/this/export/etc.).
			//
			// AR-3 expansion: include `null`/`true`/`false` (dedup-trigger
			// group — also Literal nodes), `this` and `new` (commonly
			// taught), and `function`/`if`/`return` (the regression
			// surface from the AST-walk → token-stream replacement).
			const sources: ReadonlyArray<{ code: string; keyword: string }> = [
				{ code: "import x from 'm';", keyword: 'import' },
				{ code: 'class A extends B {}', keyword: 'extends' },
				{ code: 'class A { m() { return super.x; } }', keyword: 'super' },
				{ code: 'function* g() { yield 1; }', keyword: 'yield' },
				{ code: 'try { 1; } catch (e) { 2; }', keyword: 'catch' },
				{ code: 'try { 1; } finally { 2; }', keyword: 'finally' },
				{ code: 'function f() { throw 1; }', keyword: 'throw' },
				{ code: 'for (;;) { break; }', keyword: 'break' },
				{ code: 'for (;;) { continue; }', keyword: 'continue' },
				{ code: 'typeof x;', keyword: 'typeof' },
				{ code: 'x instanceof Y;', keyword: 'instanceof' },
				{ code: 'delete x.y;', keyword: 'delete' },
				{ code: 'void 0;', keyword: 'void' },
				{ code: 'export default 1;', keyword: 'export' },
				// AR-3 IMPORTANT: dedup-trigger group + AST-walk regression surface
				{ code: 'const x = null;', keyword: 'null' },
				{ code: 'const x = true;', keyword: 'true' },
				{ code: 'const x = false;', keyword: 'false' },
				{ code: 'class A { m() { return this.x; } }', keyword: 'this' },
				{ code: 'const x = new Foo();', keyword: 'new' },
				{ code: 'function f() {}', keyword: 'function' },
				{ code: 'if (x) {}', keyword: 'if' },
				{ code: 'function f() { return 1; }', keyword: 'return' },
			];
			for (const { code, keyword } of sources) {
				const result = blankenate(code, 1, { ...NO_TYPES, keywords: true });
				const originals = (result?.blanks ?? []).map((b) => b.original);
				expect(originals, `keyword "${keyword}" in: ${code}`).toContain(
					keyword,
				);
			}
		});

		it('locks CONTEXTUAL_KEYWORDS positional boundary: `get`/`from`/`of` blank even in non-canonical positions (intentional false positive)', () => {
			// AR-fix: lock the documented design decision that
			// CONTEXTUAL_KEYWORDS matches by value only (no syntactic-
			// position check). The implementation comment says:
			// "Acceptable pedagogically: if the learner sees `let` or
			// `static` they should practice the keyword regardless of
			// position." This test locks the BOUNDARY so a future change
			// to add position-checking would fail visibly.
			const sources: ReadonlyArray<{
				code: string;
				keyword: string;
				note: string;
			}> = [
				{
					code: 'obj.get(x);',
					keyword: 'get',
					note: 'method call, not getter declaration',
				},
				{
					code: 'someSet.add(1);',
					keyword: 'set',
					// `set` doesn't appear here — use a different non-canonical:
					note: 'placeholder; verify via the next row',
				},
				{
					code: 'const from = 1;',
					keyword: 'from',
					note: 'variable name, not import-from',
				},
				{
					code: 'const of = 1;',
					keyword: 'of',
					note: 'variable name, not for-of',
				},
				{
					code: 'const set = 1;',
					keyword: 'set',
					note: 'variable name, not setter declaration',
				},
			];
			for (const { code, keyword, note } of sources) {
				if (keyword === 'set' && code.startsWith('someSet')) continue; // skip placeholder row
				const result = blankenate(code, 1, { ...NO_TYPES, keywords: true });
				const originals = (result?.blanks ?? []).map((b) => b.original);
				expect(
					originals,
					`"${keyword}" should blank in "${code}" (${note})`,
				).toContain(keyword);
			}
		});

		it('blanks contextual keywords (let, async, await, of, as, from, static, get, set) under keywords=true', () => {
			// Acorn tokenizes contextual keywords as `name`, not as
			// reserved keywords (.keyword flag is undefined). The
			// CONTEXTUAL_KEYWORDS set picks them up explicitly.
			const sources: ReadonlyArray<{ code: string; keyword: string }> = [
				{ code: 'let x = 1;', keyword: 'let' },
				{ code: 'async function f() {}', keyword: 'async' },
				{ code: 'async function f() { await 1; }', keyword: 'await' },
				{ code: 'for (const x of y) {}', keyword: 'of' },
				{ code: "import { x as y } from 'm';", keyword: 'as' },
				{ code: "import x from 'm';", keyword: 'from' },
				{ code: 'class A { static m() {} }', keyword: 'static' },
				{ code: 'class A { get x() {} }', keyword: 'get' },
				{ code: 'class A { set x(v) {} }', keyword: 'set' },
			];
			for (const { code, keyword } of sources) {
				const result = blankenate(code, 1, { ...NO_TYPES, keywords: true });
				const originals = (result?.blanks ?? []).map((b) => b.original);
				expect(originals, `keyword "${keyword}" in: ${code}`).toContain(
					keyword,
				);
			}
		});

		it('blanks private field identifier `#count` under identifiers=true (added PrivateIdentifier walker)', () => {
			// AR-3 IMPORTANT + AR-4 IMPORTANT: tighten to the source-slice
			// form the implementation actually emits. The PrivateIdentifier
			// blank's `original` is `code.substring(node.start, node.end)`
			// where node.start points at the `#`. If Acorn ever changes
			// `node.start` to point after the `#`, this test fails loudly
			// rather than silently masking the regression.
			const result = blankenate('class A { #count = 0; }', 1, {
				...NO_TYPES,
				identifiers: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('#count');
		});

		it('blanks AssignmentPattern default-parameter `=` under operators=true', () => {
			// `function f(x = 0) {}` has an AssignmentPattern node where
			// node.left is the param `x` and node.right is the default `0`,
			// with the `=` literal in source between them. No .operator field
			// — adds the AssignmentPattern branch to the operator
			// AST walker explicitly.
			const result = blankenate('function f(x = 0) {}', 1, {
				...NO_TYPES,
				operators: true,
			});
			const equals = (result?.blanks ?? []).filter((b) => b.original === '=');
			expect(equals.length).toBeGreaterThanOrEqual(1);
		});

		it('blanks destructuring default `{ a = 1 } = {}` AssignmentPattern `=` under operators=true', () => {
			const result = blankenate('const { a = 1 } = {};', 1, {
				...NO_TYPES,
				operators: true,
			});
			const equals = (result?.blanks ?? []).filter((b) => b.original === '=');
			// Two `=`: the AssignmentPattern inside, plus the VariableDeclarator's.
			expect(equals.length).toBeGreaterThanOrEqual(2);
		});

		it('dedup collapses keyword/operator collision: `typeof` (keyword + unary) and `null`/`true` (keyword + Literal)', () => {
			// AR-fix: the prior dedup test source produced no
			// classifier collisions and so trivially passed without ever
			// invoking the dedup path. This source DOES trigger overlaps:
			// - `typeof` — emitted by keyword token-stream walk
			// AND visited as UnaryExpression operator by the AST walk
			// - `null`, `true` — emitted by keyword token-stream walk
			// AND visited as Literal nodes by the AST walk
			// With ALL_TYPES, every classifier fires; dedup is the only
			// thing preventing duplicate (start,end) entries.
			const result = blankenate('typeof null === true;', 1, ALL_TYPES);
			const keys = (result?.blanks ?? []).map((b) => `${b.start}:${b.end}`);
			expect(new Set(keys).size).toBe(keys.length);
			// Also verify the collision targets actually appear (dedup
			// preserves at least one entry per position).
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('typeof');
			expect(originals).toContain('null');
			expect(originals).toContain('true');
		});
	});

	describe('Inc 6.l — gap closures from the sandbox comprehensive snippet', () => {
		// User pasted the difficulty-100/all-categories blanked output of
		// the comprehensive preview snippet. Three gaps showed
		// literal characters where blanks were expected:
		// - PropertyDefinition `=` (class field initializer)
		// - LogicalExpression operators `&&`, `||`, `??`
		// - Generator `*` (deferred — see AR notes)
		// The first two are real pedagogical surfaces; locks below.

		it('blanks PropertyDefinition `=` in class-field initializer (instance field) under operators=true', () => {
			// `class A { x = 1; }` produces a PropertyDefinition node where
			// node.key is the field name and node.value is the initializer.
			// The `=` lives in source between them with NO AssignmentExpression
			// or AssignmentPattern wrapping it. AssignmentPattern fix
			// did NOT cover this case.
			const result = blankenate('class A { x = 1; }', 1, {
				...NO_TYPES,
				operators: true,
			});
			const equals = (result?.blanks ?? []).filter((b) => b.original === '=');
			expect(equals.length).toBeGreaterThanOrEqual(1);
		});

		it('blanks PropertyDefinition `=` in private-field initializer (`#count = 0`) under operators=true', () => {
			// Same as instance field but key is a PrivateIdentifier.
			const result = blankenate('class A { #count = 0; }', 1, {
				...NO_TYPES,
				operators: true,
			});
			const equals = (result?.blanks ?? []).filter((b) => b.original === '=');
			expect(equals.length).toBeGreaterThanOrEqual(1);
		});

		it('blanks PropertyDefinition `=` in static-field initializer (`static MAX = 100`) under operators=true', () => {
			// `static` is the only PropertyDefinition variant where
			// node.static === true; same node shape otherwise.
			const result = blankenate('class A { static MAX = 100; }', 1, {
				...NO_TYPES,
				operators: true,
			});
			const equals = (result?.blanks ?? []).filter((b) => b.original === '=');
			expect(equals.length).toBeGreaterThanOrEqual(1);
		});

		it('blanks LogicalExpression `&&` under operators=true', () => {
			// Acorn produces a LogicalExpression (NOT BinaryExpression) for
			// `&&`, `||`, `??`. Same `node.operator` shape as BinaryExpression
			// but the type-discriminator differs; operator walker
			// only handled BinaryExpression.
			const result = blankenate('a && b;', 1, {
				...NO_TYPES,
				operators: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('&&');
		});

		it('blanks LogicalExpression `||` under operators=true', () => {
			const result = blankenate('a || b;', 1, {
				...NO_TYPES,
				operators: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('||');
		});

		it('blanks LogicalExpression `??` (nullish coalescing) under operators=true', () => {
			const result = blankenate('a ?? b;', 1, {
				...NO_TYPES,
				operators: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('??');
		});

		it('end-to-end regression: `items?.[0] ?? "default"` blanks `??` under operators=true', () => {
			// The exact user-pasted failing case (simplified).
			const result = blankenate("const first = items?.[0] ?? 'default';", 1, {
				...NO_TYPES,
				operators: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('??');
		});

		// AR-fix: lock that BinaryExpression operators still
		// blank after the LogicalExpression `||` widening of the shared
		// branch. Without this, a future refactor that drops
		// BinaryExpression from the gate would be invisible to the
		// suite.
		it('regression lock: BinaryExpression `+` still blanks after LogicalExpression widening', () => {
			const result = blankenate('1 + 2;', 1, {
				...NO_TYPES,
				operators: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('+');
		});

		// AR-fix: triangulate the LogicalExpression branch
		// against a string-scan shortcut. A fake impl that scans the
		// source text for `&&`/`||`/`??` would pass the three single-
		// operator tests above; only a real AST walk locates all three
		// distinct positions correctly in a chained source. Note: JS
		// disallows `??` mixed with `&&`/`||` without grouping parens
		// (spec-level SyntaxError) — chain `&&`/`||` in one source and
		// parenthesize `??` to test all three.
		it('chained logical expression `(a ?? b) && c || d` blanks all three operators', () => {
			const result = blankenate('(a ?? b) && c || d;', 1, {
				...NO_TYPES,
				operators: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('&&');
			expect(originals).toContain('||');
			expect(originals).toContain('??');
		});

		// AR-fix: negative lock that MethodDefinition (e.g.
		// `class A { m() {} }`) does NOT produce a spurious `=` blank.
		// PropertyDefinition and MethodDefinition are different Acorn
		// node types; the gate explicitly checks PropertyDefinition.
		it('negative lock: MethodDefinition `class A { m() {} }` does NOT blank `=` under operators=true', () => {
			const result = blankenate('class A { m() { return 1; } }', 1, {
				...NO_TYPES,
				operators: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).not.toContain('=');
		});

		it('blanks computed-key class field `class A { [k] = 1 }` `=` under operators=true', () => {
			const result = blankenate('class A { [k] = 1; }', 1, {
				...NO_TYPES,
				operators: true,
			});
			const equals = (result?.blanks ?? []).filter((b) => b.original === '=');
			expect(equals.length).toBeGreaterThanOrEqual(1);
		});

		it('blanks generator `*` in `function* g() {}` declaration under delimiters=true', () => {
			const result = blankenate('function* g() { yield 1; }', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const stars = (result?.blanks ?? []).filter((b) => b.original === '*');
			expect(stars.length).toBe(1);
		});

		it('blanks generator method `*method() {}` under delimiters=true', () => {
			const result = blankenate('class A { *gen() { yield 1; } }', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const stars = (result?.blanks ?? []).filter((b) => b.original === '*');
			expect(stars.length).toBe(1);
		});

		it('does NOT blank arithmetic `*` as delimiter (operators-only blanking path)', () => {
			// Negative lock: the generator-`*` branch must NOT fire on
			// BinaryExpression `*`. With delimiters=true alone, no `*`
			// should appear (arithmetic `*` is an operator, not a
			// delimiter; only generator `*` reaches the delimiter branch).
			const result = blankenate('const x = a * b;', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const stars = (result?.blanks ?? []).filter((b) => b.original === '*');
			expect(stars.length).toBe(0);
		});

		// AR-fix: mixed source — arithmetic `*` AND
		// generator `*` in the same source. A string-scan fake would
		// push both; only the AST-detection path produces exactly one
		// blank at the generator position.
		it('mixed source: `a * b; function* g() {}` blanks only the generator `*` at its source position', () => {
			const code = 'const x = a * b; function* g() { yield 1; }';
			const result = blankenate(code, 1, { ...NO_TYPES, delimiters: true });
			const stars = (result?.blanks ?? []).filter((b) => b.original === '*');
			expect(stars.length).toBe(1);
			// Positional triangulation: the blank is at the generator
			// position, not the arithmetic position. `function*` puts
			// the `*` at index `code.indexOf('function')` + 8.
			const generatorStarPosition =
				code.indexOf('function') + 'function'.length;
			expect(stars[0].start).toBe(generatorStarPosition);
		});

		// AR-fix: static class generator method
		// `static *gen()` — `*` lives between `static` and `gen`.
		it('blanks `static *gen()` class generator method `*` under delimiters=true', () => {
			const result = blankenate('class A { static *gen() { yield 1; } }', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const stars = (result?.blanks ?? []).filter((b) => b.original === '*');
			expect(stars.length).toBe(1);
		});

		// AR-fix: anonymous generator FunctionExpression
		// `const f = function*() {}` — exercises the fallback ladder
		// (no id, no params → boundary is body.start).
		it('blanks anonymous generator `const f = function*() {}` `*` under delimiters=true', () => {
			const result = blankenate('const f = function*() { yield 1; };', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const stars = (result?.blanks ?? []).filter((b) => b.original === '*');
			expect(stars.length).toBe(1);
		});

		// AR-fix: object-literal generator shorthand
		// `{ *gen() {} }` — Property node with .value.generator true.
		it('blanks object-literal shorthand `{ *gen() {} }` generator `*` under delimiters=true', () => {
			const result = blankenate('const o = { *gen() { yield 1; } };', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const stars = (result?.blanks ?? []).filter((b) => b.original === '*');
			expect(stars.length).toBe(1);
		});

		// AR-fix: negative — object-literal getter
		// `{ get foo() {} }` must NOT push a `*` blank. The Property
		// branch guards on `.value.generator === true`, so getters
		// (which have `.kind === 'get'` and `.value.generator === false`)
		// should be skipped.
		it('does NOT blank getter `{ get foo() {} }` as a generator', () => {
			const result = blankenate('const o = { get foo() { return 1; } };', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const stars = (result?.blanks ?? []).filter((b) => b.original === '*');
			expect(stars.length).toBe(0);
		});
	});

	describe('Inc 6.n — TemplateLiteral content blanks under literals', () => {
		// User-reported gap: in `\`Failed: \${error.message}\``, the
		// `Failed: ` content showed up literal in the sandbox output
		// even with `literals: true` at difficulty 1.0. had
		// deferred this with the comment "would join literals not
		// delimiters if blanked" — makes good on that.

		it('blanks the template-element string content `Failed: ` under literals=true', () => {
			const result = blankenate('const m = `Failed: ${err.message}`;', 1, {
				...NO_TYPES,
				literals: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('Failed: ');
		});

		it('blanks every non-empty TemplateElement chunk in a multi-interpolation literal', () => {
			// `start ${x} mid ${y} end` has THREE non-empty chunks:
			// 'start ', ' mid ', ' end'. All three should blank.
			const result = blankenate('const s = `start ${x} mid ${y} end`;', 1, {
				...NO_TYPES,
				literals: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('start ');
			expect(originals).toContain(' mid ');
			expect(originals).toContain(' end');
		});

		it('blanks an interpolation-free template literal (`noInterp`)', () => {
			const result = blankenate('const s = `noInterp`;', 1, {
				...NO_TYPES,
				literals: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('noInterp');
		});

		it('does NOT blank empty TemplateElement chunks (e.g. between `${a}${b}`)', () => {
			// In `${a}${b}` the chunk between `}` and `${` is empty
			// (raw === ''). Blanking it would produce a zero-length
			// blank — meaningless. Skip these.
			const result = blankenate('const s = `${a}${b}`;', 1, {
				...NO_TYPES,
				literals: true,
			});
			const blanks = result?.blanks ?? [];
			// No zero-length blank should appear.
			for (const b of blanks) {
				expect(b.end - b.start).toBeGreaterThan(0);
			}
		});

		it('classifies TemplateElement blanks as `literal` type and `original` is the source slice (AR-3 IMPORTANT)', () => {
			// AR-3 IMPORTANT: piggyback the type-lock with a
			// position-integrity assertion. Locks that the impl uses
			// `code.substring(node.start, node.end)` for `original` —
			// not `node.value.raw` or `node.value.cooked`. The two
			// agree for plain text but diverge on escape sequences;
			// the source slice is canonical because the learner
			// reproduces the source verbatim when typing.
			const code = 'const m = `hello ${x}!`;';
			const result = blankenate(code, 1, {
				...NO_TYPES,
				literals: true,
			});
			const helloBlank = (result?.blanks ?? []).find(
				(b) => b.original === 'hello ',
			);
			expect(helloBlank).toBeDefined();
			expect(helloBlank!.type).toBe('literal');
			expect(helloBlank!.original).toBe(
				code.slice(helloBlank!.start, helloBlank!.end),
			);
		});

		it('TemplateElement chunks remain literal when literals=false (negative lock)', () => {
			// AR-fix: use a source where the chunk text
			// (`hello `, ` world`) cannot be confused for a unary
			// operator — earlier draft used `!` inside the template
			// which a reader might misread as testing the
			// UnaryExpression path under operators=true.
			const result = blankenate('const m = `hello ${x} world`;', 1, {
				...NO_TYPES,
				literals: false,
				// All other categories on — chunks should NOT blank
				// when literals=false even with everything else enabled.
				identifiers: true,
				operators: true,
				delimiters: true,
				keywords: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).not.toContain('hello ');
			expect(originals).not.toContain(' world');
		});

		it('end-to-end regression: `\\`Failed: \\${error.message}\\`` blanks `Failed: `', () => {
			// The exact user-pasted gap (simplified).
			const result = blankenate(
				'throw new Error(`Failed: ${error.message}`);',
				1,
				{ ...NO_TYPES, literals: true },
			);
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('Failed: ');
		});

		it('nested template blanks both outer and inner TemplateElement chunks under literals=true', () => {
			// `outer ${`inner ${x}`}` — outer TemplateLiteral has one
			// non-empty quasi 'outer '; inner TemplateLiteral has one
			// non-empty quasi 'inner '. The recursive AST walker visits
			// both via TemplateLiteral.expressions → TemplateLiteral →
			// quasis.
			const result = blankenate('const s = `outer ${`inner ${x}`}`;', 1, {
				...NO_TYPES,
				literals: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('outer ');
			expect(originals).toContain('inner ');
		});

		it('tagged template `tag\\`hello ${x}!\\`` blanks TemplateElement chunks under literals=true', () => {
			// TaggedTemplateExpression contains a `.quasi` of type
			// TemplateLiteral; the walker recurses through it to the
			// quasis. Both `hello ` and `!` should blank.
			const result = blankenate('const s = tag`hello ${x}!`;', 1, {
				...NO_TYPES,
				literals: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('hello ');
			expect(originals).toContain('!');
		});
	});

	describe('Inc 6.o — backticks blank under delimiters (Inc 6.k reversal)', () => {
		// excluded `` ` `` from DELIMITER_LABELS with the
		// rationale "analogous to `'`/`"` quotes for string literals
		// (part of the literal token, not separately blanked)." User
		// browser-sandboxed the post-Inc-6.n output and reported the
		// backticks remained literal in template-literal lines. Inc
		// 6.o reverses the exclusion — backticks now blank under
		// delimiters (same as `${` already does).

		it('blanks the opening and closing backticks of an interpolation-free template literal', () => {
			const result = blankenate('const m = `hello`;', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			const backticks = (result?.blanks ?? []).filter(
				(b) => b.original === '`',
			);
			expect(originals).toContain('`');
			expect(backticks.length).toBe(2);
		});

		it('blanks all four backticks across two template literals in one source (positions distinct)', () => {
			// AR-fix: assert all four backticks are at
			// distinct source positions — a fake impl that pushed the
			// same blank object 4 times would otherwise pass the count.
			const result = blankenate('const a = `one`; const b = `two`;', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const backticks = (result?.blanks ?? []).filter(
				(b) => b.original === '`',
			);
			expect(backticks.length).toBe(4);
			expect(new Set(backticks.map((b) => b.start)).size).toBe(4);
		});

		it('backtick blank is exactly 1 char wide and classified as delimiter', () => {
			const result = blankenate('const s = `x`;', 1, {
				...NO_TYPES,
				delimiters: true,
			});
			const backtick = (result?.blanks ?? []).find((b) => b.original === '`');
			expect(backtick).toBeDefined();
			expect(backtick!.end - backtick!.start).toBe(1);
			expect(backtick!.type).toBe('delimiter');
		});

		it('backticks remain literal when delimiters=false (negative lock; assert other categories actually fired)', () => {
			// AR-fix: prove the "other categories on" claim is
			// not vacuous by asserting literals/identifiers/keywords
			// blanks actually appeared in the result. Without these,
			// `not.toContain` would pass even if the flag combination
			// silently dropped everything.
			const result = blankenate('const m = `hello`;', 1, {
				...NO_TYPES,
				delimiters: false,
				keywords: true,
				identifiers: true,
				operators: true,
				literals: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).not.toContain('`');
			// Other categories actually fired:
			expect(originals).toContain('const'); // keyword
			expect(originals).toContain('m'); // identifier
			expect(originals).toContain('hello'); // TemplateElement (literal)
		});

		it('end-to-end regression: full template-literal `\\`Failed: ${error.message}\\`` blanks both backticks under delimiters=true', () => {
			const result = blankenate(
				'throw new Error(`Failed: ${error.message}`);',
				1,
				{ ...NO_TYPES, delimiters: true },
			);
			const backticks = (result?.blanks ?? []).filter(
				(b) => b.original === '`',
			);
			expect(backticks.length).toBe(2);
		});
	});

	// ─── lib/classifying adoption — partial-config overlap matrix ───
	//
	// Characterizes TODAY's legacy blankenate under partial content-type
	// configs (GREEN against current code). The next increment refactors
	// blankenate onto `lib/classifying`; the rows whose name says `FLIPS`
	// change then — a visible, intentional test-diff rather than a silent
	// regression. probability=1 neutralizes `Math.random()` so every eligible
	// token blanks deterministically. Assertions are on `original`/position
	// only (never `type`, never blank order) so they survive the
	// re-categorization (a token's home category changes; its bytes do not).
	describe('lib/classifying adoption — partial-config overlap matrix (characterization)', () => {
		it('cell 1 PIN: `typeof` blanks under keywords-only today [FLIPS in→out: becomes operator]', () => {
			const result = blankenate('typeof x;', 1, {
				...NO_TYPES,
				keywords: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('typeof');
		});

		it('cell 1 triangulation: `typeof` blanks under operators-only [GREEN both increments]', () => {
			const result = blankenate('typeof x;', 1, {
				...NO_TYPES,
				operators: true,
			});
			const originals = (result?.blanks ?? []).map((b) => b.original);
			expect(originals).toContain('typeof');
		});

		const OVERLAP_MATRIX: ReadonlyArray<
			readonly [
				label: string,
				code: string,
				flags: {
					keywords: boolean;
					identifiers: boolean;
					operators: boolean;
					literals: boolean;
					delimiters: boolean;
				},
				token: string,
				expected: 'in' | 'out',
			]
		> = [
			[
				'cell 1 PIN: `instanceof` under keywords-only [FLIPS in→out]',
				'x instanceof Y;',
				{ ...NO_TYPES, keywords: true },
				'instanceof',
				'in',
			],
			[
				'cell 1 triangulation: `instanceof` under operators-only [GREEN both]',
				'x instanceof Y;',
				{ ...NO_TYPES, operators: true },
				'instanceof',
				'in',
			],
			[
				'cell 1 PIN: `void` under keywords-only [FLIPS in→out]',
				'void 0;',
				{ ...NO_TYPES, keywords: true },
				'void',
				'in',
			],
			[
				'cell 1 triangulation: `void` under operators-only [GREEN both]',
				'void 0;',
				{ ...NO_TYPES, operators: true },
				'void',
				'in',
			],
			[
				'cell 1 PIN: `delete` under keywords-only [FLIPS in→out]',
				'delete x.y;',
				{ ...NO_TYPES, keywords: true },
				'delete',
				'in',
			],
			[
				'cell 1 triangulation: `delete` under operators-only [GREEN both]',
				'delete x.y;',
				{ ...NO_TYPES, operators: true },
				'delete',
				'in',
			],
			[
				'cell 2 PIN: `null` under keywords-only [FLIPS in→out: becomes literal]',
				'const x = null;',
				{ ...NO_TYPES, keywords: true },
				'null',
				'in',
			],
			[
				'cell 2 triangulation: `null` under literals-only [GREEN both]',
				'const x = null;',
				{ ...NO_TYPES, literals: true },
				'null',
				'in',
			],
			[
				'cell 2 PIN: `true` under keywords-only [FLIPS in→out]',
				'const x = true;',
				{ ...NO_TYPES, keywords: true },
				'true',
				'in',
			],
			[
				'cell 2 triangulation: `true` under literals-only [GREEN both]',
				'const x = true;',
				{ ...NO_TYPES, literals: true },
				'true',
				'in',
			],
			[
				'cell 2 PIN: `false` under keywords-only [FLIPS in→out]',
				'const x = false;',
				{ ...NO_TYPES, keywords: true },
				'false',
				'in',
			],
			[
				'cell 2 triangulation: `false` under literals-only [GREEN both]',
				'const x = false;',
				{ ...NO_TYPES, literals: true },
				'false',
				'in',
			],
			[
				'cell 3 PIN: `import *` star under operators-only [FLIPS out→in: totality add]',
				'import * as ns from "m";',
				{ ...NO_TYPES, operators: true },
				'*',
				'out',
			],
			[
				'cell 4 PIN: `from`-as-name under identifiers-only [FLIPS in→out: becomes keyword]',
				'const from = 1;',
				{ ...NO_TYPES, identifiers: true },
				'from',
				'in',
			],
			[
				'cell 4 triangulation: `from`-as-name under keywords-only [GREEN both]',
				'const from = 1;',
				{ ...NO_TYPES, keywords: true },
				'from',
				'in',
			],
			[
				'cell 4 PIN: `of`-as-name under identifiers-only [FLIPS in→out]',
				'let of = 2;',
				{ ...NO_TYPES, identifiers: true },
				'of',
				'in',
			],
			[
				'cell 4 triangulation: `of`-as-name under keywords-only [GREEN both]',
				'let of = 2;',
				{ ...NO_TYPES, keywords: true },
				'of',
				'in',
			],
			[
				'cell 4 PIN: `as`-as-name under identifiers-only [FLIPS in→out]',
				'const as = 3;',
				{ ...NO_TYPES, identifiers: true },
				'as',
				'in',
			],
			[
				'cell 4 triangulation: `as`-as-name under keywords-only [GREEN both]',
				'const as = 3;',
				{ ...NO_TYPES, keywords: true },
				'as',
				'in',
			],
			[
				'cell 5 PIN: for-in `in` under keywords-only [FLIPS in→out: becomes operator]',
				'for (const x in y) {}',
				{ ...NO_TYPES, keywords: true },
				'in',
				'in',
			],
			[
				'cell 5 PIN: for-in `in` under operators-only [FLIPS out→in: totality add]',
				'for (const x in y) {}',
				{ ...NO_TYPES, operators: true },
				'in',
				'out',
			],
			[
				'cell 5 contrast: binary `a in b` under operators-only [GREEN both: not for-in-specific]',
				'a in b;',
				{ ...NO_TYPES, operators: true },
				'in',
				'in',
			],
			[
				'union reassurance: `typeof` under keywords+operators [GREEN both: never disappears]',
				'typeof x;',
				{ ...NO_TYPES, keywords: true, operators: true },
				'typeof',
				'in',
			],
		];

		it.each(OVERLAP_MATRIX)('%s', (_label, code, flags, token, expected) => {
			const result = blankenate(code, 1, flags);
			const originals = (result?.blanks ?? []).map((b) => b.original);
			if (expected === 'in') {
				expect(originals).toContain(token);
			} else {
				expect(originals).not.toContain(token);
			}
		});

		it('cell 3 PIN: `yield*` star is NOT blanked under operators-only today [FLIPS out→in]', () => {
			// `return 1 + 2` adds a live operator (`+`) so the operators path is
			// provably exercised — the yield-star absence is then a real exclusion,
			// not a dead-path artefact. The generator `function*` star is a
			// delimiter, so it never appears under operators-only either.
			const code = 'function* g() { yield* h(); return 1 + 2; }';
			const starPosition = code.indexOf('yield') + 'yield'.length;
			const result = blankenate(code, 1, { ...NO_TYPES, operators: true });
			const originals = (result?.blanks ?? []).map((b) => b.original);
			const yieldStar = (result?.blanks ?? []).find(
				(b) => b.original === '*' && b.start === starPosition,
			);
			expect(originals).toContain('+');
			expect(yieldStar).toBeUndefined();
		});

		it('parity gate: ALL_TYPES blanks exactly every non-trivial Acorn token [position-diff; GREEN both increments]', () => {
			// The snippet deliberately omits the cell-3/cell-5 totality tokens
			// (`import *`, `yield*`, for-in `in`) — those ADD positions under
			// classifying's ALL_TYPES, which would move the set and break the
			// gate. The `b * 3` star is arithmetic (a BinaryExpression operator
			// in both legacy and classifying), so it is safe to include. The
			// gate compares positions only; cells 1/2/4 re-categorize the same
			// bytes, so they never move the set.
			const code = [
				'const greeting = `hi ${name}!`;',
				'let count = 0;',
				'class Box { #id = 1; static MAX = 100; get size() { return this.#id; } }',
				'const f = (a, b = 2) => a + b * 3 - 1;',
				'const ok = a && b || !c;',
				'const v = obj?.prop ?? [1, 2, ...rest];',
				'const t = cond ? x : y;',
				'count++;',
				'arr.map(n => n);',
			].join('\n');
			const tokens: acorn.Token[] = [];
			acorn.parse(code, {
				ecmaVersion: 2022,
				sourceType: 'module',
				onToken: (token) => tokens.push(token),
			});
			const tokenPositions = new Set(
				tokens
					.filter(
						(token) =>
							token.type !== acorn.tokTypes.eof && token.end > token.start,
					)
					.map((token) => `${token.start}:${token.end}`),
			);
			const blankPositions = new Set(
				(blankenate(code, 1, ALL_TYPES)?.blanks ?? []).map(
					(b) => `${b.start}:${b.end}`,
				),
			);
			expect(blankPositions).toEqual(tokenPositions);
		});
	});
});
