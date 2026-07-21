import type { Program } from 'acorn';
import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Facts } from '../../../../embody/types.js';
import assembleParseFacts from '../assemble-parse-facts.js';

describe('assembleParseFacts', () => {
	describe('the program does not tokenize (Zero)', () => {
		it('yields the undetermined signal', () => {
			const { facts } = embody('"unterminated');
			expect(assembleParseFacts(facts)).toBeNull();
		});
	});

	describe('the empty program (Zero)', () => {
		it('assembles — empty is parsed, never undetermined', () => {
			const { facts } = embody('');
			expect(assembleParseFacts(facts)).not.toBeNull();
		});
	});

	describe('values by reference (One)', () => {
		it('carries the token stream by reference', () => {
			const { facts } = embody('// a note\nconst x = 1;\n');
			if (!facts.tokens.ok) throw new Error('expected tokens to derive');
			expect(assembleParseFacts(facts)?.tokens).toBe(facts.tokens.value.tokens);
		});

		it('carries the set-aside comments by reference', () => {
			const { facts } = embody('// a note\nconst x = 1;\n');
			if (!facts.tokens.ok) throw new Error('expected tokens to derive');
			expect(assembleParseFacts(facts)?.comments).toBe(
				facts.tokens.value.comments,
			);
		});

		it('carries the syntax tree by reference', () => {
			const { facts } = embody('// a note\nconst x = 1;\n');
			if (!facts.ast.ok) throw new Error('expected the ast to derive');
			expect(assembleParseFacts(facts)?.ast).toBe(facts.ast.value);
		});
	});

	describe('the grammar-only failure (Boundaries)', () => {
		it('yields the undetermined signal when only the ast stage failed', () => {
			const { facts } = embody('1 +');
			expect(assembleParseFacts(facts)).toBeNull();
		});
	});

	describe('the escape list (Many)', () => {
		it('projects each unresolved reference by name', () => {
			const { facts } = embody('const x = document;');
			expect(
				assembleParseFacts(facts)?.unresolvedReferences.map(
					(reference) => reference.name,
				),
			).toEqual(['document']);
		});

		it('stamps the unresolved reference with its canonical node path', () => {
			const { facts } = embody('const x = document;');
			expect(assembleParseFacts(facts)?.unresolvedReferences[0]?.nodePath).toBe(
				'$.body.0.declarations.0.init',
			);
		});

		it('a fully resolved program carries an empty escape list', () => {
			const { facts } = embody('const x = 1; const y = x;');
			expect(assembleParseFacts(facts)?.unresolvedReferences).toEqual([]);
		});
	});

	describe('the scope-analysis failure (Boundaries)', () => {
		it('yields the undetermined signal when the environment stage failed', () => {
			const facts: Facts = {
				source: { ok: true, value: '' },
				tokens: { ok: true, value: { comments: [], tokens: [] } },
				ast: {
					ok: true,
					value: {
						type: 'Program',
						body: [],
						sourceType: 'module',
						start: 0,
						end: 0,
					},
				},
				entwined: {
					ok: false,
					cause: { stage: 'entwined', message: 'not derived' },
				},
				environment: {
					ok: false,
					cause: { stage: 'environment', message: 'not derived' },
				},
				type: { ok: true, value: 'module' },
			};
			expect(assembleParseFacts(facts)).toBeNull();
		});
	});

	describe('the assembled shape (Interfaces)', () => {
		it('carries exactly the four parse-facts keys, no envelope residue', () => {
			const { facts } = embody('const x = 1;');
			const assembled = assembleParseFacts(facts);
			expect(
				Object.keys(assembled ?? {}).toSorted((a, b) => a.localeCompare(b)),
			).toEqual(['ast', 'comments', 'tokens', 'unresolvedReferences']);
		});

		it('freezes the assembled envelope', () => {
			const { facts } = embody('const x = 1;');
			expect(Object.isFrozen(assembleParseFacts(facts))).toBe(true);
		});

		it('leaves the carried values unfrozen when they arrive unfrozen', () => {
			const program: Program = {
				type: 'Program',
				body: [],
				sourceType: 'module',
				start: 0,
				end: 0,
			};
			const entwinedRoot = {
				node: program,
				path: '$',
				parent: null,
				children: [],
				tokens: [],
				comments: [],
			};
			const environmentRoot = {
				type: 'module',
				block: program,
				variables: [],
				references: [],
				childScopes: [],
				through: [],
				isStrict: true,
				upper: null,
			};
			const facts: Facts = {
				source: { ok: true, value: '' },
				tokens: { ok: true, value: { comments: [], tokens: [] } },
				ast: { ok: true, value: program },
				entwined: {
					ok: true,
					value: {
						root: entwinedRoot,
						byPath: { $: entwinedRoot },
						byOffset: [],
					},
				},
				environment: {
					ok: true,
					value: { root: environmentRoot, byPath: { $: environmentRoot } },
				},
				type: { ok: true, value: 'module' },
			};
			expect(Object.isFrozen(assembleParseFacts(facts)?.tokens)).toBe(false);
		});
	});
});
