// ported from src/lib/study-lenses--deprecated-architecture/lib/quizzing/tests/resolve-binding.test.ts
// @ blob 2709ef68a06577699e0ba17ad4f7ce881b0121ab
// rewires: embody-facts fixtures, classifying depth, classify-from-facts
import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Facts } from '../../../../embody/types.js';
import classifyTokens from '../../../classifying/classify-tokens.js';
import type { ClassifiedToken } from '../../../classifying/types.js';
import readScopeForest from '../resolving/read-scope-forest.js';
import resolveBinding from '../resolving/resolve-binding.js';

function classifyOf(facts: Facts): readonly ClassifiedToken[] {
	if (!facts.tokens.ok || !facts.ast.ok) {
		throw new Error('classifyOf requires parsed facts');
	}
	return classifyTokens({
		code: facts.source.value,
		tokens: facts.tokens.value.tokens,
		ast: facts.ast.value,
	});
}

function tokenAt(
	occurrences: readonly ClassifiedToken[],
	start: number,
): ClassifiedToken {
	const token = occurrences.find((occurrence) => occurrence.start === start);
	if (token === undefined) {
		throw new Error(`no token at offset ${start}`);
	}
	return token;
}

describe('resolveBinding', () => {
	describe('Zero', () => {
		it('resolves an undeclared name to null', () => {
			const { facts } = embody('x');
			expect(
				resolveBinding(tokenAt(classifyOf(facts), 0), readScopeForest(facts)),
			).toBeNull();
		});
	});

	describe('One', () => {
		it('resolves a reference to its binding', () => {
			const { facts } = embody('let n = 1; n;');
			expect(
				resolveBinding(tokenAt(classifyOf(facts), 11), readScopeForest(facts)),
			).toEqual({ name: 'n', declarationRange: [4, 5], kind: 'let' });
		});

		it('resolves a declaration-site occurrence to its own binding', () => {
			const { facts } = embody('let n = 1; n;');
			expect(
				resolveBinding(tokenAt(classifyOf(facts), 4), readScopeForest(facts)),
			).toEqual({ name: 'n', declarationRange: [4, 5], kind: 'let' });
		});

		it('carries the declaration kind for a let binding', () => {
			const { facts } = embody('let n = 1; n;');
			expect(
				resolveBinding(tokenAt(classifyOf(facts), 11), readScopeForest(facts))
					?.kind,
			).toBe('let');
		});

		it('carries the declaration kind for a const binding', () => {
			const { facts } = embody('const n = 1; n;');
			expect(
				resolveBinding(tokenAt(classifyOf(facts), 13), readScopeForest(facts))
					?.kind,
			).toBe('const');
		});
	});

	describe('Many', () => {
		it('resolves a later reference of one binding to the same declaration', () => {
			const { facts } = embody('let n = 1; n; n;');
			expect(
				resolveBinding(tokenAt(classifyOf(facts), 14), readScopeForest(facts)),
			).toEqual({ name: 'n', declarationRange: [4, 5], kind: 'let' });
		});
	});

	describe('Boundaries', () => {
		it('resolves null for a prototype-named occurrence', () => {
			expect(
				resolveBinding(
					{ start: 0, text: 'toString' },
					readScopeForest(embody('toString;').facts),
				),
			).toBeNull();
		});

		it('resolves an inner reference to the shadowing inner binding', () => {
			const { facts } = embody('let x = 1; { let x = 2; x; }');
			expect(
				resolveBinding(tokenAt(classifyOf(facts), 24), readScopeForest(facts)),
			).toEqual({ name: 'x', declarationRange: [17, 18], kind: 'let' });
		});

		it('resolves an outer reference to the outer binding despite a later shadow', () => {
			const { facts } = embody('let x = 1; x; { let x = 2; }');
			expect(
				resolveBinding(tokenAt(classifyOf(facts), 11), readScopeForest(facts)),
			).toEqual({ name: 'x', declarationRange: [4, 5], kind: 'let' });
		});

		it('carries the inner kind, not the outer, when the kinds differ across a shadow', () => {
			// outer `let x`, inner `const x` — the inner reference must report the
			// resolved binding's kind ('const'), not the lexically-outer keyword.
			const { facts } = embody('let x = 1; { const x = 2; x; }');
			expect(
				resolveBinding(tokenAt(classifyOf(facts), 26), readScopeForest(facts))
					?.kind,
			).toBe('const');
		});

		it('resolves a for-of body reference to the iteration binding', () => {
			const { facts } = embody(
				'let items = [1]; for (const x of items) { x; }',
			);
			expect(
				resolveBinding(tokenAt(classifyOf(facts), 42), readScopeForest(facts)),
			).toEqual({ name: 'x', declarationRange: [28, 29], kind: 'const' });
		});

		it('climbs from the for-of scope to resolve the iterable to its outer binding', () => {
			const { facts } = embody(
				'let items = [1]; for (const x of items) { x; }',
			);
			expect(
				resolveBinding(tokenAt(classifyOf(facts), 33), readScopeForest(facts)),
			).toEqual({ name: 'items', declarationRange: [4, 9], kind: 'let' });
		});
	});

	describe('Interfaces', () => {
		it('returns a frozen binding', () => {
			const { facts } = embody('let n = 1; n;');
			const binding = resolveBinding(
				tokenAt(classifyOf(facts), 11),
				readScopeForest(facts),
			);
			expect(binding !== null && Object.isFrozen(binding)).toBe(true);
		});

		it('returns a binding with a frozen range tuple', () => {
			const { facts } = embody('let n = 1; n;');
			const binding = resolveBinding(
				tokenAt(classifyOf(facts), 11),
				readScopeForest(facts),
			);
			expect(
				binding !== null && Object.isFrozen(binding.declarationRange),
			).toBe(true);
		});

		it('accepts a minimal { start, text } occurrence, not only a ClassifiedToken', () => {
			const { facts } = embody('let n = 1; n;');
			expect(
				resolveBinding({ start: 11, text: 'n' }, readScopeForest(facts)),
			).toEqual({ name: 'n', declarationRange: [4, 5], kind: 'let' });
		});
	});

	describe('Exceptions', () => {
		it('does not throw on a property-name occurrence', () => {
			const { facts } = embody('obj.foo');
			expect(() =>
				resolveBinding(tokenAt(classifyOf(facts), 4), readScopeForest(facts)),
			).not.toThrow();
		});

		it('resolves a property-name occurrence with no in-scope binding to null', () => {
			const { facts } = embody('obj.foo');
			expect(
				resolveBinding(tokenAt(classifyOf(facts), 4), readScopeForest(facts)),
			).toBeNull();
		});
	});

	describe('Simple', () => {
		it('resolves deterministically for the same occurrence', () => {
			const { facts } = embody('let n = 1; n;');
			const forest = readScopeForest(facts);
			const occurrence = tokenAt(classifyOf(facts), 11);
			expect(resolveBinding(occurrence, forest)).toEqual(
				resolveBinding(occurrence, forest),
			);
		});
	});
});
