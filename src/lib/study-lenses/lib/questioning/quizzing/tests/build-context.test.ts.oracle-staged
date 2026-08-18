// ported from src/lib/study-lenses--deprecated-architecture/lib/quizzing/tests/build-context.test.ts
// @ blob 8b051d0d87586b656a26a98a3bf4c224800ed984
// rewires: embody-facts fixtures, classifying depth, classify-from-facts, unparseable fixture swap
import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Facts } from '../../../../embody/types.js';
import classifyTokens from '../../../classifying/classify-tokens.js';
import type { ClassifiedToken } from '../../../classifying/types.js';
import buildContext from '../context/build-context.js';

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

describe('buildContext', () => {
	describe('Zero', () => {
		it('carries an empty anchor stream for a program with no occurrences', () => {
			const facts = embody('').facts;
			expect(buildContext(facts, classifyOf(facts)).identifierAnchors).toEqual(
				[],
			);
		});

		it('carries an empty property-access stream for a program with no member access', () => {
			const facts = embody('let x = 1; x;').facts;
			expect(
				buildContext(facts, classifyOf(facts)).propertyAccessAnchors,
			).toEqual([]);
		});
	});

	describe('One', () => {
		it('collects the identifier anchors from a single AST descent', () => {
			const facts = embody('let x = 1; x;').facts;
			expect(buildContext(facts, classifyOf(facts)).identifierAnchors).toEqual([
				{ range: [4, 5], name: 'x', usageKind: 'declared' },
				{ range: [11, 12], name: 'x', usageKind: 'read' },
			]);
		});

		it('passes the classified token stream through unchanged', () => {
			const facts = embody('let x = 1;').facts;
			const classified = classifyOf(facts);
			expect(buildContext(facts, classified).classified).toBe(classified);
		});

		it('carries the scope forest for binding-aware generators', () => {
			const facts = embody('let x = 1;').facts;
			expect(
				buildContext(facts, classifyOf(facts)).forest.root.declarations.has(
					'x',
				),
			).toBe(true);
		});

		it('collects the property-access anchors from a single AST descent', () => {
			const facts = embody('o.x;').facts;
			expect(
				buildContext(facts, classifyOf(facts)).propertyAccessAnchors,
			).toEqual([{ range: [2, 3], name: 'x' }]);
		});
	});

	describe('Interfaces', () => {
		it('returns a frozen context bundle', () => {
			const facts = embody('let x = 1;').facts;
			expect(Object.isFrozen(buildContext(facts, classifyOf(facts)))).toBe(
				true,
			);
		});

		it('deeply freezes the collected anchor stream', () => {
			const facts = embody('let x = 1;').facts;
			expect(
				Object.isFrozen(
					buildContext(facts, classifyOf(facts)).identifierAnchors,
				),
			).toBe(true);
		});

		it('freezes each collected anchor object', () => {
			const facts = embody('let x = 1;').facts;
			expect(
				Object.isFrozen(
					buildContext(facts, classifyOf(facts)).identifierAnchors[0],
				),
			).toBe(true);
		});

		it('deeply freezes the collected property-access stream', () => {
			const facts = embody('o.x;').facts;
			expect(
				Object.isFrozen(
					buildContext(facts, classifyOf(facts)).propertyAccessAnchors,
				),
			).toBe(true);
		});

		it('freezes each collected property-access anchor object', () => {
			const facts = embody('o.x;').facts;
			expect(
				Object.isFrozen(
					buildContext(facts, classifyOf(facts)).propertyAccessAnchors[0],
				),
			).toBe(true);
		});
	});

	describe('Exceptions', () => {
		it('throws a parse-precondition error on an unparsed snippet', () => {
			expect(() => buildContext(embody('let = ;').facts, [])).toThrow(
				/parsed|unparsed|ast/i,
			);
		});
	});

	describe('Simple', () => {
		it('is deterministic across repeated builds', () => {
			const facts = embody('let x = 1; x;').facts;
			const classified = classifyOf(facts);
			expect(buildContext(facts, classified)).toEqual(
				buildContext(facts, classified),
			);
		});
	});
});
