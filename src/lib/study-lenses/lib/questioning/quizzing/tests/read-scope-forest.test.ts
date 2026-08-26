// ported from src/lib/study-lenses--deprecated-architecture/lib/quizzing/tests/read-scope-forest.test.ts
// @ blob bef8039d5ac7cf960b76f76866b938c814d28ca2
// rewires: embody-facts fixtures, unparseable fixture swap
import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import readScopeForest from '../resolving/read-scope-forest.js';

describe('readScopeForest', () => {
	describe('Zero', () => {
		it('roots an empty program at the program scope', () => {
			expect(readScopeForest(embody('').facts).root.kind).toBe('program');
		});

		it('declares nothing for an empty program', () => {
			expect(
				Object.keys(readScopeForest(embody('').facts).root.declarations).length,
			).toBe(0);
		});
	});

	describe('One', () => {
		it('keeps a top-level declaration in the root scope', () => {
			expect(
				Object.hasOwn(
					readScopeForest(embody('let x = 1;').facts).root.declarations,
					'x',
				),
			).toBe(true);
		});
	});

	describe('Many', () => {
		it('produces a multi-scope forest for a nested block', () => {
			expect(
				readScopeForest(embody('let x = 1; { let y = 2; }').facts).root
					.children[0]?.kind,
			).toBe('block');
		});

		it('keeps two distinct declarations in the same scope', () => {
			expect(
				Object.keys(
					readScopeForest(embody('let x = 1; let y = 2;').facts).root
						.declarations,
				).length,
			).toBe(2);
		});
	});

	describe('Boundaries', () => {
		it('keeps a declared __proto__ binding as an ordinary own key', () => {
			expect(
				Object.hasOwn(
					readScopeForest(embody('let __proto__ = 1;').facts).root.declarations,
					'__proto__',
				),
			).toBe(true);
		});

		it('does not corrupt the record prototype when a program declares __proto__', () => {
			expect(
				Object.getPrototypeOf(
					readScopeForest(embody('let __proto__ = 1;').facts).root.declarations,
				),
			).toBe(null);
		});

		it('exposes no Map-style set method on the declarations record', () => {
			expect(
				'set' in readScopeForest(embody('let x = 1;').facts).root.declarations,
			).toBe(false);
		});

		it('rejects a membership write', () => {
			const { declarations } = readScopeForest(embody('let x = 1;').facts).root;
			expect(() => {
				(declarations as Record<string, unknown>).y = {};
			}).toThrow();
		});
	});

	describe('Interfaces', () => {
		it('returns a frozen scope analysis', () => {
			expect(Object.isFrozen(readScopeForest(embody('let x = 1;').facts))).toBe(
				true,
			);
		});

		it('freezes the declarations record itself', () => {
			expect(
				Object.isFrozen(
					readScopeForest(embody('let x = 1;').facts).root.declarations,
				),
			).toBe(true);
		});

		it('freezes a declaration value reached through the record', () => {
			expect(
				Object.isFrozen(
					readScopeForest(embody('let x = 1;').facts).root.declarations.x,
				),
			).toBe(true);
		});
	});

	describe('Exceptions', () => {
		it('throws a parse-precondition error on an unparsed snippet', () => {
			expect(() => readScopeForest(embody('let = ;').facts)).toThrow(
				/parsed|unparsed|ast/i,
			);
		});
	});
});
