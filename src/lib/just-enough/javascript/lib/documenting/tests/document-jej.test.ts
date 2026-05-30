import { describe, it, expect } from 'vitest';

import justEnoughJs from '../../../embody/lib/validating/just-enough-js.js';
import {
	KEYWORDS,
	SUPPRESSED_GLOBALS,
	CURATED_MEMBERS,
} from '../../completing/collect-jej-surface.js';
import { BLOCKED_STUMBLES } from '../../completing/stumbling-list.js';

import documentJej from '../document-jej.js';
import DOC_TABLE, { assembleDocTable } from '../doc-table.js';
import { KEYWORD_LABELS } from '../keywords.js';
import { GLOBAL_LABELS } from '../globals.js';
import { MEMBER_LABELS } from '../members.js';
import { NOT_IN_JEJ_LABELS } from '../not-in-jej.js';

describe('documentJej', () => {
	describe('unknown words yield null', () => {
		it('empty string yields null', () => {
			expect(documentJej('')).toBeNull();
		});

		it('whitespace-only yields null', () => {
			expect(documentJej(' ')).toBeNull();
		});

		it('unknown identifier yields null', () => {
			expect(documentJej('unknownWord123')).toBeNull();
		});

		it('capitalized variant of a known keyword yields null', () => {
			expect(documentJej('Let')).toBeNull();
		});
	});

	describe('JEJ keywords return DocEntry', () => {
		it('let returns a non-null entry', () => {
			expect(documentJej('let')).not.toBeNull();
		});

		it('let entry has non-empty description', () => {
			expect(documentJej('let')?.description).toBeTruthy();
		});

		it('const returns a non-null entry', () => {
			expect(documentJej('const')).not.toBeNull();
		});
	});

	describe('JEJ allowed globals return DocEntry', () => {
		it('console returns a non-null entry', () => {
			expect(documentJej('console')).not.toBeNull();
		});

		it('console entry has non-empty description', () => {
			expect(documentJej('console')?.description).toBeTruthy();
		});

		it('Math returns a non-null entry', () => {
			expect(documentJej('Math')).not.toBeNull();
		});
	});

	describe('JEJ curated member methods return DocEntry', () => {
		it('charAt returns a non-null entry', () => {
			expect(documentJej('charAt')).not.toBeNull();
		});

		it('charAt entry has non-empty description', () => {
			expect(documentJej('charAt')?.description).toBeTruthy();
		});
	});

	describe('blocked stumbles return DocEntry with not-in-JEJ badge', () => {
		it('var returns a non-null entry', () => {
			expect(documentJej('var')).not.toBeNull();
		});

		it("var entry category equals 'not in JEJ'", () => {
			expect(documentJej('var')?.category).toBe('not in JEJ');
		});

		it('var entry has non-empty description', () => {
			expect(documentJej('var')?.description).toBeTruthy();
		});
	});
});

describe('assembleDocTable', () => {
	it('rejects duplicate keys across category partitions with a throw', () => {
		expect(function callAssembleWithDuplicates() {
			assembleDocTable(
				{ let: { description: 'first' } },
				{ let: { description: 'second' } },
			);
		}).toThrow(/duplicate key/i);
	});

	it('names the duplicate key in the error message', () => {
		expect(function callAssembleWithDuplicates() {
			assembleDocTable(
				{ collidingWord: { description: 'first' } },
				{ collidingWord: { description: 'second' } },
			);
		}).toThrow(/collidingWord/);
	});
});

describe('documentJej — immutability', () => {
	it('returns the same object reference on repeated calls', () => {
		expect(documentJej('let')).toBe(documentJej('let'));
	});

	it('returned entry is frozen', () => {
		const entry = documentJej('var');
		expect(Object.isFrozen(entry)).toBe(true);
	});

	it('every entry with a commonMistakes array has it frozen', () => {
		const entriesWithUnfrozenMistakes = Object.entries(
			DOC_TABLE,
		).filter(function unfrozen([_word, entry]) {
			return (
				entry.commonMistakes !== undefined &&
				!Object.isFrozen(entry.commonMistakes)
			);
		});
		expect(entriesWithUnfrozenMistakes).toEqual([]);
	});
});

describe('drift guard against upstream JEJ surface', () => {
	it('KEYWORD_LABELS matches KEYWORDS from collect-jej-surface', () => {
		expect([...KEYWORD_LABELS].sort()).toEqual([...KEYWORDS].sort());
	});

	it('GLOBAL_LABELS matches allowedGlobals minus SUPPRESSED_GLOBALS and minus KEYWORDS', () => {
		const keywordSet = new Set(KEYWORDS);
		const expected = [...justEnoughJs.allowedGlobals].filter(
			function notSuppressedOrKeyword(g: string) {
				return !SUPPRESSED_GLOBALS.has(g) && !keywordSet.has(g);
			},
		);
		expect([...GLOBAL_LABELS].sort()).toEqual(expected.sort());
	});

	it('MEMBER_LABELS matches CURATED_MEMBERS from collect-jej-surface', () => {
		expect([...MEMBER_LABELS].sort()).toEqual(
			[...CURATED_MEMBERS].sort(),
		);
	});

	it('NOT_IN_JEJ_LABELS equals the blocked-stumble partition of stumbling-list', () => {
		expect([...NOT_IN_JEJ_LABELS].sort()).toEqual(
			[...BLOCKED_STUMBLES].sort(),
		);
	});
});

describe('shape compliance — field presence across the full table', () => {
	it('every entry has a non-empty description', () => {
		const entriesWithEmptyDescription = Object.entries(
			DOC_TABLE,
		).filter(function isEmpty([_word, entry]) {
			return !entry.description.trim();
		});
		expect(entriesWithEmptyDescription).toEqual([]);
	});

	it("every blocked entry has category 'not in JEJ'", () => {
		const blockedWithWrongCategory = [...NOT_IN_JEJ_LABELS]
			.map(function withEntry(word: string) {
				return { word, entry: documentJej(word) };
			})
			.filter(function categoryNotInJej({ entry }) {
				return entry?.category !== 'not in JEJ';
			});
		expect(blockedWithWrongCategory).toEqual([]);
	});

	it('every blocked entry has at least 2 of (example, whenToUse, commonMistakes) populated', () => {
		// Content quality (real pedagogical prose vs stub placeholders)
		// is enforced by AR-4 code review, not by this assertion.
		// The test only checks field presence — an entry with
		// example: 'x' technically passes here. The review boundary
		// is documented in DOCS.md § Decisions § Voice convention.
		const blockedWithInsufficientContent = [...NOT_IN_JEJ_LABELS]
			.map(function withEntry(word: string) {
				return { word, entry: documentJej(word) };
			})
			.filter(function insufficient({ entry }) {
				const populated = [
					Boolean(entry?.example),
					Boolean(entry?.whenToUse),
					(entry?.commonMistakes?.length ?? 0) > 0,
				].filter(Boolean).length;
				return populated < 2;
			});
		expect(blockedWithInsufficientContent).toEqual([]);
	});
});

describe('advisory stumble caveats live in keyword section', () => {
	it('null entry exists in the table (not blocked)', () => {
		expect(documentJej('null')).not.toBeNull();
	});

	it("null entry is NOT categorized as 'not in JEJ'", () => {
		expect(documentJej('null')?.category).not.toBe('not in JEJ');
	});

	it('null entry carries its advisory caveat in whenToUse or commonMistakes', () => {
		const entry = documentJej('null');
		const hasWhenToUse = Boolean(entry?.whenToUse?.trim());
		const hasMistakes = (entry?.commonMistakes?.length ?? 0) > 0;
		expect(hasWhenToUse || hasMistakes).toBe(true);
	});

	it('new entry exists in the table (not blocked)', () => {
		expect(documentJej('new')).not.toBeNull();
	});

	it("new entry is NOT categorized as 'not in JEJ'", () => {
		expect(documentJej('new')?.category).not.toBe('not in JEJ');
	});

	it('new entry carries its advisory caveat in whenToUse or commonMistakes', () => {
		const entry = documentJej('new');
		const hasWhenToUse = Boolean(entry?.whenToUse?.trim());
		const hasMistakes = (entry?.commonMistakes?.length ?? 0) > 0;
		expect(hasWhenToUse || hasMistakes).toBe(true);
	});
});
