import { describe, expect, it } from 'vitest';

import completeJej from '../complete-jej.js';

describe('completeJej', () => {
	describe('prefix matches nothing in the JEJ surface', () => {
		it('returns an empty array', () => {
			expect(
				completeJej({ prefix: 'zz', precedingText: '', fullText: '' }),
			).toEqual([]);
		});
	});

	describe('one matching keyword', () => {
		it('contains exactly one let entry for prefix "le"', () => {
			const result = completeJej({
				prefix: 'le',
				precedingText: '',
				fullText: '',
			});
			const lets = result.filter((item) => item.label === 'let');
			expect(lets).toEqual([{ label: 'let', type: 'keyword' }]);
		});
	});

	describe('many matching items', () => {
		it('contains const, console, and continue for prefix "co"', () => {
			const labels = completeJej({
				prefix: 'co',
				precedingText: '',
				fullText: '',
			}).map((item) => item.label);
			expect(labels).toEqual(
				expect.arrayContaining(['const', 'console', 'continue']),
			);
		});
	});

	describe('boundaries', () => {
		describe('case-insensitive prefix-filter', () => {
			it('uppercase prefix "LET" matches let', () => {
				const labels = completeJej({
					prefix: 'LET',
					precedingText: '',
					fullText: '',
				}).map((item) => item.label);
				expect(labels).toContain('let');
			});
		});

		describe('exact-match prefix', () => {
			it('prefix "undefined" includes undefined', () => {
				const labels = completeJej({
					prefix: 'undefined',
					precedingText: '',
					fullText: '',
				}).map((item) => item.label);
				expect(labels).toContain('undefined');
			});
		});
	});

	describe('interfaces — frozen output', () => {
		it('the array is frozen', () => {
			const result = completeJej({
				prefix: 'zz',
				precedingText: '',
				fullText: '',
			});
			expect(Object.isFrozen(result)).toBe(true);
		});

		it('each item is frozen', () => {
			const result = completeJej({
				prefix: 'le',
				precedingText: '',
				fullText: '',
			});
			expect(result.every((item) => Object.isFrozen(item))).toBe(true);
		});
	});

	describe('blocked stumbling — synthesized for labels NOT in JEJ surface', () => {
		describe('prefix matches "var" exactly', () => {
			it('emits a blocked item with the rich DocEntry and apply: noop', () => {
				const result = completeJej({
					prefix: 'var',
					precedingText: '',
					fullText: '',
				});
				const variableItem = result.find((item) => item.label === 'var');
				expect(variableItem).toMatchObject({
					label: 'var',
					type: 'blocked',
					detail: '(not in JEJ)',
					apply: 'noop',
				});
				expect(variableItem?.entry).toBeUndefined();
			});
		});

		describe('prefix matches blocked-stumble partially', () => {
			it('prefix "va" surfaces var as blocked', () => {
				const labels = completeJej({
					prefix: 'va',
					precedingText: '',
					fullText: '',
				}).map((item) => item.label);
				expect(labels).toContain('var');
			});
		});

		describe('class is synthesized as blocked', () => {
			it('prefix "cla" surfaces class as type blocked', () => {
				const item = completeJej({
					prefix: 'cla',
					precedingText: '',
					fullText: '',
				}).find((candidate) => candidate.label === 'class');
				expect(item?.type).toBe('blocked');
			});
		});
	});

	describe('advisory stumbling — JEJ-valid keywords without blocked markers', () => {
		// Advisory caveats for null/new are surfaced on hover (their
		// documenting/keywords.ts entries); the autocomplete adapter no
		// longer attaches per-suggestion info to JEJ-valid items.
		describe('null advisory', () => {
			it('appears with source-derived type keyword and no blocked marker', () => {
				const item = completeJej({
					prefix: 'nu',
					precedingText: '',
					fullText: '',
				}).find((candidate) => candidate.label === 'null');
				expect(item).toMatchObject({ label: 'null', type: 'keyword' });
				expect(item?.apply).toBeUndefined();
				expect(item?.entry).toBeUndefined();
			});
		});

		describe('new advisory', () => {
			it('appears with source-derived type keyword and no blocked marker', () => {
				const item = completeJej({
					prefix: 'ne',
					precedingText: '',
					fullText: '',
				}).find((candidate) => candidate.label === 'new');
				expect(item).toMatchObject({ label: 'new', type: 'keyword' });
				expect(item?.apply).toBeUndefined();
				expect(item?.entry).toBeUndefined();
			});
		});
	});

	describe('simple — global suggestions round-trip', () => {
		it.each(['NaN', 'Math', 'parseInt', 'console', 'Date', 'BigInt'])(
			'%s appears as type global',
			(label) => {
				const item = completeJej({
					prefix: label,
					precedingText: '',
					fullText: '',
				}).find((candidate) => candidate.label === label);
				expect(item).toEqual({ label, type: 'global' });
			},
		);
	});

	describe('easter-egg suppression', () => {
		it('eval does NOT appear even on exact-match prefix', () => {
			const labels = completeJej({
				prefix: 'eval',
				precedingText: '',
				fullText: '',
			}).map((item) => item.label);
			expect(labels).not.toContain('eval');
		});
	});

	describe('scope-aware locals — Inc B', () => {
		describe('single declaration', () => {
			it('contains x as a local for `let x = 5`', () => {
				const result = completeJej({
					prefix: 'x',
					precedingText: '',
					fullText: 'let x = 5',
				});
				const xItem = result.find((candidate) => candidate.label === 'x');
				expect(xItem).toEqual({ label: 'x', type: 'local' });
			});
		});

		describe('multiple declarations', () => {
			it('contains both x and y for `let x = 5; const y = 10`', () => {
				const items = completeJej({
					prefix: '',
					precedingText: '',
					fullText: 'let x = 5; const y = 10',
				}).filter(
					(candidate) => candidate.label === 'x' || candidate.label === 'y',
				);
				expect(items).toEqual([
					{ label: 'x', type: 'local' },
					{ label: 'y', type: 'local' },
				]);
			});
		});

		describe('shadowed declarations (insertion-order dedup)', () => {
			it('inner-shadowing x appears once (outer wins per allDeclarations insertion order)', () => {
				const xItems = completeJej({
					prefix: 'x',
					precedingText: '',
					fullText: 'let x = 1; { let x = 2 }',
				}).filter((candidate) => candidate.label === 'x');
				expect(xItems).toHaveLength(1);
			});
		});

		describe('no declarations in snippet', () => {
			it('emits only keywords + globals, no locals', () => {
				const result = completeJej({
					prefix: 'co',
					precedingText: '',
					fullText: 'console.log(42)',
				});
				expect(result.every((candidate) => candidate.type !== 'local')).toBe(
					true,
				);
			});
		});

		describe('parse-error graceful degradation', () => {
			it('keywords still come through on broken code', () => {
				const labels = completeJej({
					prefix: 'le',
					precedingText: '',
					fullText: 'let',
				}).map((candidate) => candidate.label);
				expect(labels).toContain('let');
			});
		});

		describe('rejected-but-parsed code', () => {
			it('learner identifiers from `var x = 1` appear as locals', () => {
				const xItem = completeJej({
					prefix: 'x',
					precedingText: '',
					fullText: 'var x = 1',
				}).find((candidate) => candidate.label === 'x');
				expect(xItem).toEqual({ label: 'x', type: 'local' });
			});
		});
	});

	describe('dot-member context — Inc C', () => {
		describe('curated member union emitted on dot-receiver', () => {
			it('precedingText `str.` + empty prefix emits at least one member item', () => {
				const result = completeJej({
					prefix: '',
					precedingText: 'str.',
					fullText: 'let str = "hi"',
				});
				const memberItems = result.filter((item) => item.type === 'member');
				expect(memberItems.length).toBeGreaterThan(0);
			});

			it('prefix `to` on dot context returns toString, toUpperCase, toLowerCase, toFixed', () => {
				const labels = completeJej({
					prefix: 'to',
					precedingText: 'str.',
					fullText: 'let str = "hi"',
				}).map((item) => item.label);
				expect(labels).toEqual(
					expect.arrayContaining([
						'toString',
						'toUpperCase',
						'toLowerCase',
						'toFixed',
					]),
				);
			});
		});

		describe('member-only blocked synthesis in dot context', () => {
			it('prefix `sp` on dot context emits split as type blocked', () => {
				const splitItem = completeJej({
					prefix: 'sp',
					precedingText: 'str.',
					fullText: '',
				}).find((item) => item.label === 'split');
				expect(splitItem?.type).toBe('blocked');
			});

			it('prefix `ma` on dot context emits match as type blocked', () => {
				const matchItem = completeJej({
					prefix: 'ma',
					precedingText: 'str.',
					fullText: '',
				}).find((item) => item.label === 'match');
				expect(matchItem?.type).toBe('blocked');
			});

			it('prefix `con` on dot context emits constructor as blocked (from BLOCKED_MEMBER_NAMES)', () => {
				const item = completeJej({
					prefix: 'con',
					precedingText: 'str.',
					fullText: '',
				}).find((c) => c.label === 'constructor');
				expect(item).toMatchObject({
					label: 'constructor',
					type: 'blocked',
					detail: '(not in JEJ)',
					apply: 'noop',
				});
				expect(item?.entry).toBeUndefined();
			});

			it('prefix `__proto__` on dot context emits __proto__ as blocked', () => {
				const item = completeJej({
					prefix: '__proto__',
					precedingText: 'obj.',
					fullText: '',
				}).find((c) => c.label === '__proto__');
				expect(item?.type).toBe('blocked');
			});
		});

		describe('whitespace around dot detected', () => {
			it('`str . ` (space before AND after dot) detected as dot-receiver context', () => {
				const result = completeJej({
					prefix: '',
					precedingText: 'str . ',
					fullText: '',
				});
				const memberItems = result.filter((item) => item.type === 'member');
				expect(memberItems.length).toBeGreaterThan(0);
			});
		});

		describe('identifier-context suppression of member-only labels (regression guard)', () => {
			it('prefix `sp` in identifier context does NOT emit split', () => {
				const labels = completeJej({
					prefix: 'sp',
					precedingText: '',
					fullText: '',
				}).map((item) => item.label);
				expect(labels).not.toContain('split');
			});
		});

		describe('dot-context suppression of identifier-only labels (regression guard)', () => {
			it('prefix `va` in dot context does NOT emit var', () => {
				const labels = completeJej({
					prefix: 'va',
					precedingText: 'str.',
					fullText: '',
				}).map((item) => item.label);
				expect(labels).not.toContain('var');
			});

			it('prefix `cl` in dot context does NOT emit class', () => {
				const labels = completeJej({
					prefix: 'cl',
					precedingText: 'str.',
					fullText: '',
				}).map((item) => item.label);
				expect(labels).not.toContain('class');
			});
		});

		describe('chained dot-access falls through to identifier context', () => {
			it('precedingText `str.charAt(0).` emits no member items', () => {
				const result = completeJej({
					prefix: '',
					precedingText: 'str.charAt(0).',
					fullText: '',
				});
				expect(result.every((item) => item.type !== 'member')).toBe(true);
			});
		});

		describe('dot-context result is frozen', () => {
			it('the returned array is frozen', () => {
				const result = completeJej({
					prefix: '',
					precedingText: 'str.',
					fullText: '',
				});
				expect(Object.isFrozen(result)).toBe(true);
			});
		});
	});
});
