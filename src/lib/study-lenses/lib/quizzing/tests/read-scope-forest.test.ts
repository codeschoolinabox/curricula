import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import readScopeForest from '../resolving/read-scope-forest.js';

describe('readScopeForest', () => {
	describe('Zero', () => {
		it('roots an empty program at the program scope', () => {
			expect(readScopeForest(embody('')).root.kind).toBe('program');
		});

		it('declares nothing for an empty program', () => {
			expect(readScopeForest(embody('')).root.declarations.size).toBe(0);
		});
	});

	describe('One', () => {
		it('keeps a top-level declaration in the root scope', () => {
			expect(
				readScopeForest(embody('let x = 1;')).root.declarations.has('x'),
			).toBe(true);
		});
	});

	describe('Many', () => {
		it('produces a multi-scope forest for a nested block', () => {
			expect(
				readScopeForest(embody('let x = 1; { let y = 2; }')).root.children[0]
					?.kind,
			).toBe('block');
		});
	});

	describe('Interfaces', () => {
		it('returns a frozen scope analysis', () => {
			expect(Object.isFrozen(readScopeForest(embody('let x = 1;')))).toBe(true);
		});
	});

	describe('Exceptions', () => {
		it('throws a parse-precondition error on an unparsed snippet', () => {
			expect(() => readScopeForest(embody('FAIL_AT_PARSE'))).toThrow(
				/parsed|unparsed|ast/i,
			);
		});
	});
});
