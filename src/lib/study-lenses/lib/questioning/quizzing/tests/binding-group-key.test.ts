// ported from src/lib/study-lenses--deprecated-architecture/lib/quizzing/tests/binding-group-key.test.ts
// @ blob 541e0a0dfe78fe55c446e5725c9138cc83f1d753
// rewires: embody-facts fixtures, classifying depth, classify-from-facts
import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Facts } from '../../../../embody/types.js';
import classifyTokens from '../../../classifying/classify-tokens.js';
import type { ClassifiedToken } from '../../../classifying/types.js';
import bindingGroupKey from '../keying/binding-group-key.js';
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

describe('bindingGroupKey', () => {
	describe('One', () => {
		it('serializes a declaration range to a binding key', () => {
			expect(
				bindingGroupKey({ name: 'x', declarationRange: [4, 5], kind: 'let' }),
			).toBe('binding:4-5');
		});
	});

	describe('Many', () => {
		it('keys two same-range bindings identically regardless of name', () => {
			expect(
				bindingGroupKey({ name: 'x', declarationRange: [4, 5], kind: 'let' }),
			).toBe(
				bindingGroupKey({
					name: 'other',
					declarationRange: [4, 5],
					kind: 'let',
				}),
			);
		});

		it('serializes a different range to its own key', () => {
			expect(
				bindingGroupKey({ name: 'x', declarationRange: [17, 18], kind: 'let' }),
			).toBe('binding:17-18');
		});

		it('keys two different declaration ranges to different keys', () => {
			expect(
				bindingGroupKey({ name: 'x', declarationRange: [4, 5], kind: 'let' }),
			).not.toBe(
				bindingGroupKey({ name: 'x', declarationRange: [17, 18], kind: 'let' }),
			);
		});

		it('keys two same-range bindings identically regardless of kind', () => {
			// kind is non-identity convenience data — it must never fold into the key.
			expect(
				bindingGroupKey({ name: 'x', declarationRange: [4, 5], kind: 'let' }),
			).toBe(
				bindingGroupKey({ name: 'x', declarationRange: [4, 5], kind: 'const' }),
			);
		});
	});

	describe('Boundaries', () => {
		it('serializes a zero-width range', () => {
			expect(
				bindingGroupKey({ name: 'x', declarationRange: [0, 0], kind: 'let' }),
			).toBe('binding:0-0');
		});
	});

	describe('Interfaces', () => {
		it('keys a real resolved occurrence on its binding identity', () => {
			const { facts } = embody('let n = 1; n;');
			const binding = resolveBinding(
				tokenAt(classifyOf(facts), 11),
				readScopeForest(facts),
			);
			expect(binding !== null && bindingGroupKey(binding)).toBe('binding:4-5');
		});
	});

	describe('Simple', () => {
		it('keys identically for the same binding', () => {
			expect(
				bindingGroupKey({ name: 'x', declarationRange: [4, 5], kind: 'let' }),
			).toEqual(
				bindingGroupKey({ name: 'x', declarationRange: [4, 5], kind: 'let' }),
			);
		});
	});
});
