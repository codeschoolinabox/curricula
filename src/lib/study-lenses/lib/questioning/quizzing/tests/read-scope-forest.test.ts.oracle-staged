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
			expect(readScopeForest(embody('').facts).root.declarations.size).toBe(0);
		});
	});

	describe('One', () => {
		it('keeps a top-level declaration in the root scope', () => {
			expect(
				readScopeForest(embody('let x = 1;').facts).root.declarations.has('x'),
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
	});

	describe('Interfaces', () => {
		it('returns a frozen scope analysis', () => {
			expect(Object.isFrozen(readScopeForest(embody('let x = 1;').facts))).toBe(
				true,
			);
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
