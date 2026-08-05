import { afterEach, describe, expect, it, vi } from 'vitest';

import embody from '../../../../embody/index.js';
import scaffoldLevel from '../../../../language-levels/scaffold/index.js';
import type { LanguageLevel } from '../../../../language-levels/types.js';
import assembleParseFacts from '../assemble-parse-facts.js';
import createMemoizedValidate from '../create-memoized-validate.js';

afterEach(() => {
	vi.restoreAllMocks();
});

function buildLevel(
	key: string,
	validate: LanguageLevel['validate'],
	snippetTypes: LanguageLevel['snippetTypes'] = ['module', 'script'],
): LanguageLevel {
	return {
		key,
		label: key,
		validate,
		snippetTypes,
		docs: { reference: '', notionalMachine: '' },
		editorSupport: { completion: {}, hover: {}, format: {} },
		models: {},
	};
}

describe('createMemoizedValidate', () => {
	describe('zero registered levels (Zero)', () => {
		it('answers the empty record', () => {
			const { facts } = embody('const x = 1;');
			const validate = createMemoizedValidate();
			expect(
				validate(
					{ source: 'const x = 1;', type: 'module' },
					assembleParseFacts(facts),
					[],
				),
			).toEqual({});
		});
	});

	describe('one level consulted (One)', () => {
		it('answers a validated verdict over parsing code', () => {
			const { facts } = embody('const x = 1;');
			const spy = vi.fn(() => []);
			const validate = createMemoizedValidate();
			const record = validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[buildLevel('a', spy)],
			);
			expect(record['a']?.kind).toBe('validated');
		});

		it('carries the level violations by reference, never copied', () => {
			const { facts } = embody('const x = 1;');
			const violations = [
				{
					nodeType: 'VariableDeclaration',
					message: 'no',
					location: { start: 0, end: 1 },
					nodePath: '$.body.0',
				},
			];
			const validate = createMemoizedValidate();
			const record = validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[buildLevel('a', () => violations)],
			);
			const verdict = record['a'];
			expect(verdict?.kind === 'validated' ? verdict.violations : null).toBe(
				violations,
			);
		});

		it('hands the level the assembled facts by reference', () => {
			const { facts } = embody('const x = 1;');
			const assembled = assembleParseFacts(facts);
			const spy = vi.fn<LanguageLevel['validate']>(() => []);
			const validate = createMemoizedValidate();
			validate({ source: 'const x = 1;', type: 'module' }, assembled, [
				buildLevel('a', spy),
			]);
			expect(spy.mock.calls[0]?.[0]).toBe(assembled);
		});
	});

	describe('several levels (Many)', () => {
		it('keys the record by level key', () => {
			const { facts } = embody('const x = 1;');
			const validate = createMemoizedValidate();
			const record = validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[buildLevel('a', () => []), buildLevel('b', () => [])],
			);
			expect(
				Object.keys(record).toSorted((left, right) =>
					left.localeCompare(right),
				),
			).toEqual(['a', 'b']);
		});

		it('consults each level exactly once', () => {
			const { facts } = embody('const x = 1;');
			const spyA = vi.fn(() => []);
			const spyB = vi.fn(() => []);
			const validate = createMemoizedValidate();
			validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[buildLevel('a', spyA), buildLevel('b', spyB)],
			);
			expect([spyA.mock.calls.length, spyB.mock.calls.length]).toEqual([1, 1]);
		});
	});

	describe('the settle identity (Boundaries)', () => {
		it('answers undetermined for every level while unparsed', () => {
			const { facts } = embody('1 +');
			const validate = createMemoizedValidate();
			const record = validate(
				{ source: '1 +', type: 'module' },
				assembleParseFacts(facts),
				[buildLevel('a', () => [])],
			);
			expect(record['a']?.kind).toBe('undetermined');
		});

		it('consults no level while unparsed', () => {
			const { facts } = embody('1 +');
			const spy = vi.fn(() => []);
			const validate = createMemoizedValidate();
			validate({ source: '1 +', type: 'module' }, assembleParseFacts(facts), [
				buildLevel('a', spy),
			]);
			expect(spy).not.toHaveBeenCalled();
		});

		it('consults again when the source changes', () => {
			const { facts } = embody('const x = 1;');
			const assembled = assembleParseFacts(facts);
			const spy = vi.fn(() => []);
			const level = buildLevel('a', spy);
			const validate = createMemoizedValidate();
			validate({ source: 'const x = 1;', type: 'module' }, assembled, [level]);
			validate({ source: 'const y = 2;', type: 'module' }, assembled, [level]);
			expect(spy).toHaveBeenCalledTimes(2);
		});

		it('consults again when the type toggles', () => {
			const { facts } = embody('const x = 1;');
			const assembled = assembleParseFacts(facts);
			const spy = vi.fn(() => []);
			const level = buildLevel('a', spy);
			const validate = createMemoizedValidate();
			validate({ source: 'const x = 1;', type: 'module' }, assembled, [level]);
			validate({ source: 'const x = 1;', type: 'script' }, assembled, [level]);
			expect(spy).toHaveBeenCalledTimes(2);
		});

		it('re-consults a formerly held identity — one slot, replaced wholesale', () => {
			const { facts } = embody('const x = 1;');
			const assembled = assembleParseFacts(facts);
			const spy = vi.fn(() => []);
			const level = buildLevel('a', spy);
			const validate = createMemoizedValidate();
			validate({ source: 'const x = 1;', type: 'module' }, assembled, [level]);
			validate({ source: 'const y = 2;', type: 'module' }, assembled, [level]);
			validate({ source: 'const x = 1;', type: 'module' }, assembled, [level]);
			expect(spy).toHaveBeenCalledTimes(3);
		});

		it('still consults a level whose admitted types exclude the current type', () => {
			const { facts } = embody('const x = 1;');
			const spy = vi.fn(() => []);
			const validate = createMemoizedValidate();
			const record = validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[buildLevel('a', spy, ['script'])],
			);
			expect(record['a']?.kind).toBe('validated');
		});
	});

	describe('the memoized re-read (Interfaces)', () => {
		it('holds no memoized truth across instances', () => {
			const { facts } = embody('const x = 1;');
			const assembled = assembleParseFacts(facts);
			const spy = vi.fn(() => []);
			const level = buildLevel('a', spy);
			createMemoizedValidate()(
				{ source: 'const x = 1;', type: 'module' },
				assembled,
				[level],
			);
			createMemoizedValidate()(
				{ source: 'const x = 1;', type: 'module' },
				assembled,
				[level],
			);
			expect(spy).toHaveBeenCalledTimes(2);
		});

		it('consults once across repeated same-identity reads', () => {
			const { facts } = embody('const x = 1;');
			const assembled = assembleParseFacts(facts);
			const spy = vi.fn(() => []);
			const level = buildLevel('a', spy);
			const validate = createMemoizedValidate();
			validate({ source: 'const x = 1;', type: 'module' }, assembled, [level]);
			validate({ source: 'const x = 1;', type: 'module' }, assembled, [level]);
			validate({ source: 'const x = 1;', type: 'module' }, assembled, [level]);
			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('returns the same record across same-identity reads', () => {
			const { facts } = embody('const x = 1;');
			const assembled = assembleParseFacts(facts);
			const level = buildLevel('a', () => []);
			const validate = createMemoizedValidate();
			const first = validate(
				{ source: 'const x = 1;', type: 'module' },
				assembled,
				[level],
			);
			const second = validate(
				{ source: 'const x = 1;', type: 'module' },
				assembled,
				[level],
			);
			expect(second).toBe(first);
		});

		it('freezes the record', () => {
			const { facts } = embody('const x = 1;');
			const validate = createMemoizedValidate();
			const record = validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[buildLevel('a', () => [])],
			);
			expect(Object.isFrozen(record)).toBe(true);
		});

		it('freezes each verdict', () => {
			const { facts } = embody('const x = 1;');
			const validate = createMemoizedValidate();
			const record = validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[buildLevel('a', () => [])],
			);
			expect(Object.isFrozen(record['a'])).toBe(true);
		});

		it('leaves the level-owned violations unfrozen when they arrive unfrozen', () => {
			const { facts } = embody('const x = 1;');
			const violations: never[] = [];
			const validate = createMemoizedValidate();
			const record = validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[buildLevel('a', () => violations)],
			);
			const verdict = record['a'];
			expect(
				Object.isFrozen(
					verdict?.kind === 'validated' ? verdict.violations : null,
				),
			).toBe(false);
		});
	});

	describe('a throwing validator (Exceptions)', () => {
		it('answers undetermined for the throwing level alone', () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const { facts } = embody('const x = 1;');
			const validate = createMemoizedValidate();
			const record = validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[
					buildLevel('broken', () => {
						throw new Error('validator defect');
					}),
				],
			);
			expect(record['broken']?.kind).toBe('undetermined');
		});

		it('still validates a sibling level', () => {
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const { facts } = embody('const x = 1;');
			const validate = createMemoizedValidate();
			const record = validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[
					buildLevel('broken', () => {
						throw new Error('validator defect');
					}),
					buildLevel('fine', () => []),
				],
			);
			expect(record['fine']?.kind).toBe('validated');
		});

		it('reports the defect once', () => {
			const report = vi.spyOn(console, 'error').mockImplementation(() => {});
			const { facts } = embody('const x = 1;');
			const validate = createMemoizedValidate();
			validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[
					buildLevel('broken', () => {
						throw new Error('validator defect');
					}),
				],
			);
			expect(report).toHaveBeenCalledTimes(1);
		});

		it('names the offending level in the report', () => {
			const report = vi.spyOn(console, 'error').mockImplementation(() => {});
			const { facts } = embody('const x = 1;');
			const validate = createMemoizedValidate();
			validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[
					buildLevel('broken', () => {
						throw new Error('validator defect');
					}),
				],
			);
			expect(String(report.mock.calls[0]?.[0])).toContain('broken');
		});

		it('reports two throwing levels independently', () => {
			const report = vi.spyOn(console, 'error').mockImplementation(() => {});
			const { facts } = embody('const x = 1;');
			const validate = createMemoizedValidate();
			validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[
					buildLevel('first-broken', () => {
						throw new Error('one');
					}),
					buildLevel('second-broken', () => {
						throw new Error('two');
					}),
				],
			);
			expect(report).toHaveBeenCalledTimes(2);
		});

		it('names each throwing level in its own report', () => {
			const report = vi.spyOn(console, 'error').mockImplementation(() => {});
			const { facts } = embody('const x = 1;');
			const validate = createMemoizedValidate();
			validate(
				{ source: 'const x = 1;', type: 'module' },
				assembleParseFacts(facts),
				[
					buildLevel('first-broken', () => {
						throw new Error('one');
					}),
					buildLevel('second-broken', () => {
						throw new Error('two');
					}),
				],
			);
			expect([
				String(report.mock.calls[0]?.[0]).includes('first-broken'),
				String(report.mock.calls[1]?.[0]).includes('second-broken'),
			]).toEqual([true, true]);
		});
	});

	describe('the real scaffold level end-to-end (Simple)', () => {
		it('surfaces a debugger statement as one scaffold violation', () => {
			const { facts } = embody('debugger;');
			const validate = createMemoizedValidate();
			const record = validate(
				{ source: 'debugger;', type: 'module' },
				assembleParseFacts(facts),
				[scaffoldLevel],
			);
			const verdict = record['scaffold'];
			expect(
				verdict?.kind === 'validated'
					? verdict.violations.map((violation) => violation.nodeType)
					: null,
			).toEqual(['DebuggerStatement']);
		});

		it('stamps the violation at its folded path, carrying no wrapper segment', () => {
			const { facts } = embody('const f = (() => { debugger; });');
			const validate = createMemoizedValidate();
			const record = validate(
				{ source: 'const f = (() => { debugger; });', type: 'module' },
				assembleParseFacts(facts),
				[scaffoldLevel],
			);
			const verdict = record['scaffold'];
			// PINNED(human ruling 2026-07-30 Q2: node paths are stable — grouping parentheses never lengthen a path, at any depth; this is where that reaches a level's published violation)
			expect(
				verdict?.kind === 'validated'
					? verdict.violations.map((violation) => violation.nodePath)
					: null,
			).toEqual(['$.body.0.declarations.0.init.body.body.0']);
		});
	});
});
