import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Snippet } from '../../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import readScopeForest from '../resolving/read-scope-forest.js';
import resolveBinding from '../resolving/resolve-binding.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
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
			const snippet = embody('x');
			expect(
				resolveBinding(
					tokenAt(classifyOf(snippet), 0),
					readScopeForest(snippet),
				),
			).toBeNull();
		});
	});

	describe('One', () => {
		it('resolves a reference to its binding', () => {
			const snippet = embody('let n = 1; n;');
			expect(
				resolveBinding(
					tokenAt(classifyOf(snippet), 11),
					readScopeForest(snippet),
				),
			).toEqual({ name: 'n', declarationRange: [4, 5], kind: 'let' });
		});

		it('resolves a declaration-site occurrence to its own binding', () => {
			const snippet = embody('let n = 1; n;');
			expect(
				resolveBinding(
					tokenAt(classifyOf(snippet), 4),
					readScopeForest(snippet),
				),
			).toEqual({ name: 'n', declarationRange: [4, 5], kind: 'let' });
		});

		it('carries the declaration kind for a let binding', () => {
			const snippet = embody('let n = 1; n;');
			expect(
				resolveBinding(
					tokenAt(classifyOf(snippet), 11),
					readScopeForest(snippet),
				)?.kind,
			).toBe('let');
		});

		it('carries the declaration kind for a const binding', () => {
			const snippet = embody('const n = 1; n;');
			expect(
				resolveBinding(
					tokenAt(classifyOf(snippet), 13),
					readScopeForest(snippet),
				)?.kind,
			).toBe('const');
		});
	});

	describe('Many', () => {
		it('resolves a later reference of one binding to the same declaration', () => {
			const snippet = embody('let n = 1; n; n;');
			expect(
				resolveBinding(
					tokenAt(classifyOf(snippet), 14),
					readScopeForest(snippet),
				),
			).toEqual({ name: 'n', declarationRange: [4, 5], kind: 'let' });
		});
	});

	describe('Boundaries', () => {
		it('resolves an inner reference to the shadowing inner binding', () => {
			const snippet = embody('let x = 1; { let x = 2; x; }');
			expect(
				resolveBinding(
					tokenAt(classifyOf(snippet), 24),
					readScopeForest(snippet),
				),
			).toEqual({ name: 'x', declarationRange: [17, 18], kind: 'let' });
		});

		it('resolves an outer reference to the outer binding despite a later shadow', () => {
			const snippet = embody('let x = 1; x; { let x = 2; }');
			expect(
				resolveBinding(
					tokenAt(classifyOf(snippet), 11),
					readScopeForest(snippet),
				),
			).toEqual({ name: 'x', declarationRange: [4, 5], kind: 'let' });
		});

		it('carries the inner kind, not the outer, when the kinds differ across a shadow', () => {
			// outer `let x`, inner `const x` — the inner reference must report the
			// resolved binding's kind ('const'), not the lexically-outer keyword.
			const snippet = embody('let x = 1; { const x = 2; x; }');
			expect(
				resolveBinding(
					tokenAt(classifyOf(snippet), 26),
					readScopeForest(snippet),
				)?.kind,
			).toBe('const');
		});

		it('resolves a for-of body reference to the iteration binding', () => {
			const snippet = embody('let items = [1]; for (const x of items) { x; }');
			expect(
				resolveBinding(
					tokenAt(classifyOf(snippet), 42),
					readScopeForest(snippet),
				),
			).toEqual({ name: 'x', declarationRange: [28, 29], kind: 'const' });
		});

		it('climbs from the for-of scope to resolve the iterable to its outer binding', () => {
			const snippet = embody('let items = [1]; for (const x of items) { x; }');
			expect(
				resolveBinding(
					tokenAt(classifyOf(snippet), 33),
					readScopeForest(snippet),
				),
			).toEqual({ name: 'items', declarationRange: [4, 9], kind: 'let' });
		});
	});

	describe('Interfaces', () => {
		it('returns a frozen binding', () => {
			const snippet = embody('let n = 1; n;');
			const binding = resolveBinding(
				tokenAt(classifyOf(snippet), 11),
				readScopeForest(snippet),
			);
			expect(binding !== null && Object.isFrozen(binding)).toBe(true);
		});

		it('returns a binding with a frozen range tuple', () => {
			const snippet = embody('let n = 1; n;');
			const binding = resolveBinding(
				tokenAt(classifyOf(snippet), 11),
				readScopeForest(snippet),
			);
			expect(
				binding !== null && Object.isFrozen(binding.declarationRange),
			).toBe(true);
		});

		it('accepts a minimal { start, text } occurrence, not only a ClassifiedToken', () => {
			const snippet = embody('let n = 1; n;');
			expect(
				resolveBinding({ start: 11, text: 'n' }, readScopeForest(snippet)),
			).toEqual({ name: 'n', declarationRange: [4, 5], kind: 'let' });
		});
	});

	describe('Exceptions', () => {
		it('does not throw on a property-name occurrence', () => {
			const snippet = embody('obj.foo');
			expect(() =>
				resolveBinding(
					tokenAt(classifyOf(snippet), 4),
					readScopeForest(snippet),
				),
			).not.toThrow();
		});

		it('resolves a property-name occurrence with no in-scope binding to null', () => {
			const snippet = embody('obj.foo');
			expect(
				resolveBinding(
					tokenAt(classifyOf(snippet), 4),
					readScopeForest(snippet),
				),
			).toBeNull();
		});
	});

	describe('Simple', () => {
		it('resolves deterministically for the same occurrence', () => {
			const snippet = embody('let n = 1; n;');
			const forest = readScopeForest(snippet);
			const occurrence = tokenAt(classifyOf(snippet), 11);
			expect(resolveBinding(occurrence, forest)).toEqual(
				resolveBinding(occurrence, forest),
			);
		});
	});
});
