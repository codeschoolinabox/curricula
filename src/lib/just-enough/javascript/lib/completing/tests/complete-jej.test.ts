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
			expect(labels).toEqual(expect.arrayContaining(['const', 'console', 'continue']));
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
			it('emits a blocked item with the curated info and apply: noop', () => {
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
				expect(typeof variableItem?.info).toBe('string');
				expect(variableItem?.info?.length ?? 0).toBeGreaterThan(0);
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

	describe('advisory stumbling — JEJ-valid with curated info', () => {
		describe('null advisory', () => {
			it('appears with source-derived type keyword and curated info', () => {
				const item = completeJej({
					prefix: 'nu',
					precedingText: '',
					fullText: '',
				}).find((candidate) => candidate.label === 'null');
				expect(item).toMatchObject({ label: 'null', type: 'keyword' });
				expect(typeof item?.info).toBe('string');
			});

			it('does not carry apply: noop (advisory keystroke lands normally)', () => {
				const item = completeJej({
					prefix: 'nu',
					precedingText: '',
					fullText: '',
				}).find((candidate) => candidate.label === 'null');
				expect(item?.apply).toBeUndefined();
			});
		});

		describe('new advisory', () => {
			it('appears with source-derived type keyword and curated info', () => {
				const item = completeJej({
					prefix: 'ne',
					precedingText: '',
					fullText: '',
				}).find((candidate) => candidate.label === 'new');
				expect(item).toMatchObject({ label: 'new', type: 'keyword' });
				expect(typeof item?.info).toBe('string');
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
				}).filter((candidate) => candidate.label === 'x' || candidate.label === 'y');
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
				expect(
					result.every((candidate) => candidate.type !== 'local'),
				).toBe(true);
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
});
