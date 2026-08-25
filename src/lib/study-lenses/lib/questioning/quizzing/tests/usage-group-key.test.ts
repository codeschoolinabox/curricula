// ported from src/lib/study-lenses--deprecated-architecture/lib/quizzing/tests/usage-group-key.test.ts
// @ blob 9ba4fe290c8a52e81c69147e5adcbefe304c2a1c
// rewires: embody-facts fixtures, classifying depth, classify-from-facts
import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Facts } from '../../../../embody/types.js';
import classifyTokens from '../../../classifying/classify-tokens.js';
import type { ClassifiedToken } from '../../../classifying/types.js';
import bindingGroupKey from '../keying/binding-group-key.js';
import usageGroupKey from '../keying/usage-group-key.js';
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

describe('usageGroupKey', () => {
	describe('One', () => {
		it('serializes a (binding, use-type) to a usage key', () => {
			expect(
				usageGroupKey(
					{ name: 'x', declarationRange: [4, 5], kind: 'let' },
					'read',
				),
			).toBe('usage:4-5:read');
		});
	});

	describe('Many', () => {
		it('keys two same-(range, kind) pairs identically regardless of name', () => {
			expect(
				usageGroupKey(
					{ name: 'x', declarationRange: [4, 5], kind: 'let' },
					'read',
				),
			).toBe(
				usageGroupKey(
					{ name: 'other', declarationRange: [4, 5], kind: 'let' },
					'read',
				),
			);
		});

		it('keys one binding used two ways into distinct groups', () => {
			expect(
				usageGroupKey(
					{ name: 'x', declarationRange: [4, 5], kind: 'let' },
					'declared',
				),
			).not.toBe(
				usageGroupKey(
					{ name: 'x', declarationRange: [4, 5], kind: 'let' },
					'read',
				),
			);
		});

		it('serializes a different binding-and-kind to its own distinct key', () => {
			expect(
				usageGroupKey(
					{ name: 'y', declarationRange: [17, 18], kind: 'let' },
					'read',
				),
			).toBe('usage:17-18:read');
		});

		it('keys two different bindings used the same way into distinct groups', () => {
			expect(
				usageGroupKey(
					{ name: 'x', declarationRange: [4, 5], kind: 'let' },
					'read',
				),
			).not.toBe(
				usageGroupKey(
					{ name: 'y', declarationRange: [17, 18], kind: 'let' },
					'read',
				),
			);
		});
	});

	describe('Boundaries', () => {
		it('serializes each of the four usage kinds', () => {
			const binding = {
				name: 'x',
				declarationRange: [0, 1],
				kind: 'let',
			} as const;
			expect([
				usageGroupKey(binding, 'declared'),
				usageGroupKey(binding, 'read'),
				usageGroupKey(binding, 'assigned'),
				usageGroupKey(binding, 'read-and-assigned'),
			]).toEqual([
				'usage:0-1:declared',
				'usage:0-1:read',
				'usage:0-1:assigned',
				'usage:0-1:read-and-assigned',
			]);
		});

		it('never collides with the two-segment binding key for the same binding', () => {
			const binding = {
				name: 'x',
				declarationRange: [4, 5],
				kind: 'let',
			} as const;
			expect(usageGroupKey(binding, 'read')).not.toBe(bindingGroupKey(binding));
		});

		it('never starts with the occ-fallback prefix (usage:occ:)', () => {
			const binding = {
				name: 'x',
				declarationRange: [4, 5],
				kind: 'let',
			} as const;
			expect(usageGroupKey(binding, 'read').startsWith('usage:occ:')).toBe(
				false,
			);
		});
	});

	describe('Interfaces', () => {
		it('keys a real resolved occurrence on its binding-and-use-type', () => {
			const facts = embody('let n = 1; n;').facts;
			const binding = resolveBinding(
				tokenAt(classifyOf(facts), 11),
				readScopeForest(facts),
			);
			expect(binding !== null && usageGroupKey(binding, 'read')).toBe(
				'usage:4-5:read',
			);
		});
	});

	describe('Simple', () => {
		it('keys identically for the same inputs', () => {
			expect(
				usageGroupKey(
					{ name: 'x', declarationRange: [4, 5], kind: 'let' },
					'assigned',
				),
			).toEqual(
				usageGroupKey(
					{ name: 'x', declarationRange: [4, 5], kind: 'let' },
					'assigned',
				),
			);
		});
	});
});
