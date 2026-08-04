import { describe, expect, it } from 'vitest';

import jejLevel from '../../../../language-levels/jej/index.js';
import type { LanguageLevel } from '../../../../language-levels/types.js';
import joinLevelRoster from '../join-level-roster.js';

describe('joinLevelRoster', () => {
	describe('no injections', () => {
		it('empty injections → a roster of one', () => {
			expect(joinLevelRoster([])).toHaveLength(1);
		});

		it('empty injections → jej is the sole entry', () => {
			expect(joinLevelRoster([])[0]).toBe(jejLevel);
		});
	});

	describe('appending injections', () => {
		it('one injected level → the built-in precedes it', () => {
			const testA: LanguageLevel = {
				key: 'test-a',
				label: 'Test A',
				validate: () => [],
				snippetTypes: ['module'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			// PINNED(human ruling 2026-07-30 R-8: built-ins-first is this
			// function's current mechanical join order, never a claim that a
			// built-in level outranks an injected one. A later alphabetical or
			// subset-driven order replaces this deliberately, not by accident.)
			expect(joinLevelRoster([testA])).toEqual([jejLevel, testA]);
		});

		it('preserves the given injection order after the built-in', () => {
			const testA: LanguageLevel = {
				key: 'test-a',
				label: 'Test A',
				validate: () => [],
				snippetTypes: ['module'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			const testB: LanguageLevel = {
				key: 'test-b',
				label: 'Test B',
				validate: () => [],
				snippetTypes: ['module'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			// PINNED(human ruling 2026-07-30 R-8: built-ins-first is this
			// function's current mechanical join order, never a claim that a
			// built-in level outranks an injected one. A later alphabetical or
			// subset-driven order replaces this deliberately, not by accident.)
			expect(joinLevelRoster([testA, testB])).toEqual([jejLevel, testA, testB]);
		});
	});

	describe('frozen output', () => {
		it('a populated joined roster is frozen', () => {
			const testA: LanguageLevel = {
				key: 'test-a',
				label: 'Test A',
				validate: () => [],
				snippetTypes: ['module'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			expect(Object.isFrozen(joinLevelRoster([testA]))).toBe(true);
		});

		it('an injected level ref stays unfrozen', () => {
			const testA: LanguageLevel = {
				key: 'test-a',
				label: 'Test A',
				validate: () => [],
				snippetTypes: ['module'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			joinLevelRoster([testA]);
			expect(Object.isFrozen(testA)).toBe(false);
		});
	});

	describe('the built-in roster', () => {
		it('contains no entry keyed "scaffold"', () => {
			expect(
				joinLevelRoster([]).some((level) => level.key === 'scaffold'),
			).toBe(false);
		});

		it("contains no entry keyed ''", () => {
			expect(joinLevelRoster([]).some((level) => level.key === '')).toBe(false);
		});
	});

	describe('key collisions', () => {
		it('a duplicate level key → throws', () => {
			const testA: LanguageLevel = {
				key: 'test-a',
				label: 'Test A',
				validate: () => [],
				snippetTypes: ['module'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			const shadowing: LanguageLevel = {
				key: 'test-a',
				label: 'Shadowing Test A',
				validate: () => [],
				snippetTypes: ['script'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			expect(() => joinLevelRoster([testA, shadowing])).toThrow();
		});

		it('the collision error names the offending key', () => {
			const testA: LanguageLevel = {
				key: 'test-a',
				label: 'Test A',
				validate: () => [],
				snippetTypes: ['module'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			const shadowing: LanguageLevel = {
				key: 'test-a',
				label: 'Shadowing Test A',
				validate: () => [],
				snippetTypes: ['script'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			expect(() => joinLevelRoster([testA, shadowing])).toThrow('test-a');
		});

		it('the same level ref injected twice → throws', () => {
			const testA: LanguageLevel = {
				key: 'test-a',
				label: 'Test A',
				validate: () => [],
				snippetTypes: ['module'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			expect(() => joinLevelRoster([testA, testA])).toThrow();
		});

		it('an injection colliding with a built-in key → throws', () => {
			const shadowingJej: LanguageLevel = {
				key: 'jej',
				label: 'Shadowing JEJ',
				validate: () => [],
				snippetTypes: ['script'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			expect(() => joinLevelRoster([shadowingJej])).toThrow();
		});

		it('the built-in collision error names the offending key', () => {
			const shadowingJej: LanguageLevel = {
				key: 'jej',
				label: 'Shadowing JEJ',
				validate: () => [],
				snippetTypes: ['script'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			expect(() => joinLevelRoster([shadowingJej])).toThrow(
				'duplicate level key "jej"',
			);
		});
	});

	describe('the reserved key', () => {
		it("injecting key '' → throws", () => {
			const noneState: LanguageLevel = {
				key: '',
				label: 'None',
				validate: () => [],
				snippetTypes: ['module'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			expect(() => joinLevelRoster([noneState])).toThrow();
		});

		it('the error mentions the reservation', () => {
			const noneState: LanguageLevel = {
				key: '',
				label: 'None',
				validate: () => [],
				snippetTypes: ['module'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			expect(() => joinLevelRoster([noneState])).toThrow('reserved');
		});

		it("two levels both keyed '' → the reserved-key error, not the collision error", () => {
			const noneState: LanguageLevel = {
				key: '',
				label: 'None',
				validate: () => [],
				snippetTypes: ['module'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			const alsoNoneState: LanguageLevel = {
				key: '',
				label: 'Also None',
				validate: () => [],
				snippetTypes: ['script'],
				docs: { reference: '', notionalMachine: '' },
				editorSupport: { completion: null, hover: null, format: null },
				models: {},
			};
			expect(() => joinLevelRoster([noneState, alsoNoneState])).toThrow(
				'reserved',
			);
		});
	});
});
