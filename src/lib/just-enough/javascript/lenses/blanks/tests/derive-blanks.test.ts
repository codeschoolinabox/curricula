/**
 * @file Pure-TS tests for the `blanks` lens's two-pass derivation. No
 * React, no jsdom. ZOMBIES coverage of `derive-blanks` per `../README.md`
 * § Token categorization and `../DOCS.md` § Execution phases 3.
 */

import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import deriveBlanks from '../derive-blanks.js';
import type { TokenCategory } from '../types.js';

const ALL_CATEGORIES: ReadonlyArray<TokenCategory> = [
	'keywords',
	'identifiers',
	'operators',
	'literals',
];

describe('deriveBlanks', () => {
	describe('degenerate inputs', () => {
		it('empty source → empty fragments and empty blanks', () => {
			const derivation = deriveBlanks(embody(''), 100, ALL_CATEGORIES, 1);
			expect(derivation.fragments).toEqual([]);
		});

		it('empty source → empty blanks', () => {
			const derivation = deriveBlanks(embody(''), 100, ALL_CATEGORIES, 1);
			expect(derivation.blanks).toEqual([]);
		});

		it('whitespace-only source → empty blanks', () => {
			const derivation = deriveBlanks(embody('   \n  '), 100, ALL_CATEGORIES, 1);
			expect(derivation.blanks).toEqual([]);
		});

		it('whitespace-only source → single text fragment for the whitespace', () => {
			const derivation = deriveBlanks(embody('   \n  '), 100, ALL_CATEGORIES, 1);
			expect(derivation.fragments).toEqual([{ kind: 'text', text: '   \n  ' }]);
		});
	});

	describe('difficulty boundaries', () => {
		it('difficulty 0 → zero blanks', () => {
			const derivation = deriveBlanks(
				embody('let x = 42;'),
				0,
				ALL_CATEGORIES,
				1,
			);
			expect(derivation.blanks).toEqual([]);
		});

		it('difficulty 0 → fragments are single text covering whole source', () => {
			const derivation = deriveBlanks(
				embody('let x = 42;'),
				0,
				ALL_CATEGORIES,
				1,
			);
			expect(derivation.fragments).toEqual([
				{ kind: 'text', text: 'let x = 42;' },
			]);
		});

		it('difficulty 100 → every eligible token is blanked', () => {
			const derivation = deriveBlanks(
				embody('let x = 42;'),
				100,
				ALL_CATEGORIES,
				1,
			);
			// `let`, `x`, `=`, `42` → 4 blanks (`;` is punctuation, not eligible)
			expect(derivation.blanks).toHaveLength(4);
		});

		it('negative difficulty is clamped to 0', () => {
			const derivation = deriveBlanks(
				embody('let x = 42;'),
				-50,
				ALL_CATEGORIES,
				1,
			);
			expect(derivation.blanks).toEqual([]);
		});

		it('difficulty > 100 is clamped to 100', () => {
			const derivation = deriveBlanks(
				embody('let x = 42;'),
				500,
				ALL_CATEGORIES,
				1,
			);
			expect(derivation.blanks).toHaveLength(4);
		});
	});

	describe('category filtering', () => {
		it('tokenCategories: [] → zero blanks at any difficulty', () => {
			const derivation = deriveBlanks(embody('let x = 42;'), 100, [], 1);
			expect(derivation.blanks).toEqual([]);
		});

		it('tokenCategories: ["keywords"] → only the `let` keyword is blanked', () => {
			const derivation = deriveBlanks(
				embody('let x = 42;'),
				100,
				['keywords'],
				1,
			);
			expect(derivation.blanks.map((b) => b.answer)).toEqual(['let']);
		});

		it('tokenCategories: ["identifiers"] → only `x` is blanked', () => {
			const derivation = deriveBlanks(
				embody('let x = 42;'),
				100,
				['identifiers'],
				1,
			);
			expect(derivation.blanks.map((b) => b.answer)).toEqual(['x']);
		});

		it('tokenCategories: ["literals"] → only `42` is blanked', () => {
			const derivation = deriveBlanks(
				embody('let x = 42;'),
				100,
				['literals'],
				1,
			);
			expect(derivation.blanks.map((b) => b.answer)).toEqual(['42']);
		});

		it('tokenCategories: ["operators"] → only `=` is blanked', () => {
			const derivation = deriveBlanks(
				embody('let x = 42;'),
				100,
				['operators'],
				1,
			);
			expect(derivation.blanks.map((b) => b.answer)).toEqual(['=']);
		});

		it('multi-character operator (`===`) is one blank with the full operator as answer', () => {
			const derivation = deriveBlanks(
				embody('let x = a === b;'),
				100,
				['operators'],
				1,
			);
			// The `===` operator is a single Acorn token; its answer is
			// the full three-character operator string.
			expect(derivation.blanks.map((b) => b.answer)).toContain('===');
		});

		it('string-literal answer includes its delimiters', () => {
			const derivation = deriveBlanks(
				embody("let x = 'hi';"),
				100,
				['literals'],
				1,
			);
			// Acorn's token range for a string literal includes the quote
			// characters; the answer matches the verbatim source slice.
			expect(derivation.blanks.map((b) => b.answer)).toEqual(["'hi'"]);
		});
	});

	describe('AST overrides over token-type classification', () => {
		it('`true` is classified as literals (not keywords) per AST Literal node', () => {
			const derivation = deriveBlanks(
				embody('let x = true;'),
				100,
				['literals'],
				1,
			);
			expect(derivation.blanks.map((b) => b.answer)).toEqual(['true']);
		});

		it('`null` is classified as literals (not keywords) per AST Literal node', () => {
			const derivation = deriveBlanks(
				embody('let x = null;'),
				100,
				['literals'],
				1,
			);
			expect(derivation.blanks.map((b) => b.answer)).toEqual(['null']);
		});

		it('`false` is classified as literals (not keywords)', () => {
			const derivation = deriveBlanks(
				embody('let x = false;'),
				100,
				['literals'],
				1,
			);
			expect(derivation.blanks.map((b) => b.answer)).toEqual(['false']);
		});

		it('`true` is NOT classified as keywords (when categories include keywords only)', () => {
			const derivation = deriveBlanks(
				embody('let x = true;'),
				100,
				['keywords'],
				1,
			);
			expect(derivation.blanks.map((b) => b.answer)).toEqual(['let']);
		});

		it('contextual keyword used as identifier is classified as identifiers (AST override over text-match)', () => {
			// `async` is a contextual keyword (lexed as `name`); when used
			// as a variable name it's an Identifier AST node. The override
			// pass should reclassify the text-matched `async` from
			// `keywords` to `identifiers`.
			const derivation = deriveBlanks(
				embody('let async = 1;'),
				100,
				['keywords'],
				1,
			);
			// `let` is a keyword; `async` is an Identifier (override) →
			// only `let` should remain.
			expect(derivation.blanks.map((b) => b.answer)).toEqual(['let']);
		});
	});

	describe('non-node-start keywords (the AR-1 BLOCKER resolution)', () => {
		it('`else` is blanked when categories include keywords', () => {
			const derivation = deriveBlanks(
				embody('if (x) { return 1; } else { return 2; }'),
				100,
				['keywords'],
				1,
			);
			const answers = derivation.blanks.map((b) => b.answer);
			expect(answers).toContain('else');
		});

		it('`return` is blanked when categories include keywords', () => {
			const derivation = deriveBlanks(
				embody('let f = () => { return 1; };'),
				100,
				['keywords'],
				1,
			);
			const answers = derivation.blanks.map((b) => b.answer);
			expect(answers).toContain('return');
		});
	});

	describe('seeded determinism', () => {
		it('same seed → same blank positions', () => {
			const source = 'let a = 1; let b = 2; let c = 3;';
			const first = deriveBlanks(embody(source), 50, ALL_CATEGORIES, 42);
			const second = deriveBlanks(embody(source), 50, ALL_CATEGORIES, 42);
			expect(first.blanks.map((b) => b.start)).toEqual(
				second.blanks.map((b) => b.start),
			);
		});

		it('different seeds → different blank positions (probabilistic)', () => {
			// With many tokens at difficulty 50 the seeded sample diverges
			// across these two seed values for this snippet (verified empirically).
			const source = 'let a = 1; let b = 2; let c = 3;';
			const first = deriveBlanks(embody(source), 50, ALL_CATEGORIES, 1);
			const second = deriveBlanks(embody(source), 50, ALL_CATEGORIES, 999);
			expect(first.blanks.map((b) => b.start)).not.toEqual(
				second.blanks.map((b) => b.start),
			);
		});
	});

	describe('BlanksDerivation invariants', () => {
		it('blanks[i].index === i (contiguous 0-based)', () => {
			const derivation = deriveBlanks(
				embody('let a = 1; let b = 2; let c = 3;'),
				100,
				ALL_CATEGORIES,
				1,
			);
			for (const [index, blank] of derivation.blanks.entries()) {
				expect(blank.index).toBe(index);
			}
		});

		it('returned derivation is frozen', () => {
			const derivation = deriveBlanks(
				embody('let x = 42;'),
				100,
				ALL_CATEGORIES,
				1,
			);
			expect(Object.isFrozen(derivation)).toBe(true);
		});

		it('fragments concatenation reconstructs source byte-for-byte', () => {
			const source = 'if (x) { return 1; } else { return 2; }';
			const derivation = deriveBlanks(embody(source), 50, ALL_CATEGORIES, 7);
			const reconstructed = derivation.fragments
				.map((fragment) =>
					fragment.kind === 'text' ? fragment.text : fragment.answer,
				)
				.join('');
			expect(reconstructed).toBe(source);
		});

		it('every blank fragment count equals blanks length', () => {
			const derivation = deriveBlanks(
				embody('let x = 42; let y = 7;'),
				100,
				ALL_CATEGORIES,
				1,
			);
			const blankFragments = derivation.fragments.filter(
				(fragment) => fragment.kind === 'blank',
			);
			expect(blankFragments).toHaveLength(derivation.blanks.length);
		});

		it('blank fragment answer matches the corresponding blank entry', () => {
			const derivation = deriveBlanks(
				embody('let x = 42; let y = 7;'),
				100,
				ALL_CATEGORIES,
				1,
			);
			const blankFragments = derivation.fragments.filter(
				(fragment) => fragment.kind === 'blank',
			);
			for (const [index, fragment] of blankFragments.entries()) {
				if (fragment.kind !== 'blank') continue;
				expect(fragment.answer).toBe(derivation.blanks[index].answer);
			}
		});

		it('blank fragment index matches its source-order position', () => {
			const derivation = deriveBlanks(
				embody('let x = 42; let y = 7;'),
				100,
				ALL_CATEGORIES,
				1,
			);
			const blankFragments = derivation.fragments.filter(
				(fragment) => fragment.kind === 'blank',
			);
			for (const [index, fragment] of blankFragments.entries()) {
				if (fragment.kind !== 'blank') continue;
				expect(fragment.index).toBe(index);
			}
		});

		it('comments inside the source land in text fragments verbatim', () => {
			const source = 'let x = /* note */ 1;';
			const derivation = deriveBlanks(embody(source), 0, ALL_CATEGORIES, 1);
			// difficulty 0 → no blanks; the entire source (including the
			// block comment) reconstructs from a single text fragment.
			expect(derivation.fragments).toEqual([{ kind: 'text', text: source }]);
		});
	});

	describe('simple realistic snippets', () => {
		it('`for-of` loop blanks both `for` and `of` keywords', () => {
			const derivation = deriveBlanks(
				embody('for (let item of items) { console.log(item); }'),
				100,
				['keywords'],
				1,
			);
			const answers = derivation.blanks.map((b) => b.answer);
			expect(answers).toContain('for');
		});

		it('`for-of` loop blanks `of` (the AR-1 example)', () => {
			const derivation = deriveBlanks(
				embody('for (let item of items) { console.log(item); }'),
				100,
				['keywords'],
				1,
			);
			const answers = derivation.blanks.map((b) => b.answer);
			expect(answers).toContain('of');
		});
	});
});
