// ported from src/lib/study-lenses--deprecated-architecture/lib/quizzing/tests/generate-quiz.test.ts
// @ blob 36321fc75939a89093b265bab5ea6c13c6ead95f
// rewires: embody-facts fixtures, classifying depth, classify-from-facts, unparseable fixture swap, realm excision (decision 4)
import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Facts } from '../../../../embody/types.js';
import classifyTokens from '../../../classifying/classify-tokens.js';
import type { ClassifiedToken } from '../../../classifying/types.js';
import generateQuiz from '../generate-quiz.js';

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

describe('generateQuiz', () => {
	describe('Zero', () => {
		it('returns an empty array for a snippet with no tokens', () => {
			const facts = embody('').facts;
			expect(generateQuiz(facts, classifyOf(facts))).toEqual([]);
		});
	});

	describe('One', () => {
		it('runs every registered generator over a single identifier', () => {
			const facts = embody('x').facts;
			expect(
				generateQuiz(facts, classifyOf(facts)).map((item) => item.form),
			).toEqual(['V1', 'V7', 'V10c', 'V4']);
		});
	});

	describe('Many', () => {
		it('keeps family variables for every item regardless of generator', () => {
			const facts = embody('a + b').facts;
			expect(
				generateQuiz(facts, classifyOf(facts)).every(
					(item) => item.family === 'variables',
				),
			).toBe(true);
		});

		it('orders token-anchored, then node-anchored, then program-anchored items', () => {
			const facts = embody('a; b').facts;
			expect(
				generateQuiz(facts, classifyOf(facts)).map((item) => item.form),
			).toEqual(['V1', 'V1', 'V1', 'V7', 'V7', 'V10c', 'V4', 'V4']);
		});

		it('runs every applicable registered generator for a declared, referenced binding', () => {
			const facts = embody('let x = 1; x;').facts;
			expect(
				new Set(
					generateQuiz(facts, classifyOf(facts)).map((item) => item.form),
				),
			).toEqual(
				new Set(['V1', 'V2', 'V6', 'V7', 'V8', 'V10a', 'V10b', 'V10c', 'V4']),
			);
		});

		it('adds the const-only V6b form for a declared, referenced const', () => {
			const facts = embody('const x = 1; x;').facts;
			expect(
				new Set(
					generateQuiz(facts, classifyOf(facts)).map((item) => item.form),
				),
			).toEqual(
				new Set([
					'V1',
					'V2',
					'V6',
					'V6b',
					'V7',
					'V8',
					'V10a',
					'V10b',
					'V10c',
					'V4',
				]),
			);
		});

		it('omits the kind-keyword forms (V2/V6/V6b) for a non-JeJ var binding', () => {
			// `var` is outside JeJ but parses, so it reaches the generators. V2 keys off
			// the `let`/`const` keyword text (absent here); V6/V6b guard defensively
			// against the laundered `var` kind. The binding-identity forms still fire.
			const facts = embody('var x = 1; x = 2; x;').facts;
			expect(
				new Set(
					generateQuiz(facts, classifyOf(facts)).map((item) => item.form),
				),
			).toEqual(new Set(['V1', 'V7', 'V8', 'V10a', 'V10b', 'V10c', 'V4']));
		});

		it('emits exactly one V2 item (the declaration) for a contextual keyword as a property', () => {
			// `obj.let` must not add a second V2 card on the property name — only the
			// real `const obj` declaration keyword fires.
			const facts = embody('const obj = {}; obj.let;').facts;
			const v2Count = generateQuiz(facts, classifyOf(facts)).filter(
				(item) => item.form === 'V2',
			).length;
			expect(v2Count).toBe(1);
		});

		it('fires the program-anchored V4 end-to-end for both chains', () => {
			// V4 is the first program-anchored generator to run; confirm both a
			// scope-chain and a prototype-chain item reach generateQuiz output.
			const facts = embody('Math.max;').facts;
			const chainGroupKeys = generateQuiz(facts, classifyOf(facts))
				.filter((item) => item.form === 'V4')
				.map((item) => item.groupKey);
			expect(chainGroupKeys).toContain('chain:scope-chain:Math');
			expect(chainGroupKeys).toContain('chain:prototype-chain:max');
		});
	});

	describe('Interfaces', () => {
		it('emits only the binding-independent forms for an undeclared identifier', () => {
			// V8 / V10a / V10b need a resolvable binding, so they emit nothing for a
			// free global; V10c (cross-variable) fires on any identifier, so an
			// undeclared identifier still yields one code-surface (select-in-code) item.
			const facts = embody('x').facts;
			expect(
				new Set(
					generateQuiz(facts, classifyOf(facts)).map((item) => item.form),
				),
			).toEqual(new Set(['V1', 'V7', 'V10c', 'V4']));
		});

		it('returns a deeply frozen array', () => {
			const facts = embody('x').facts;
			expect(Object.isFrozen(generateQuiz(facts, classifyOf(facts)))).toBe(
				true,
			);
		});

		it('returns frozen items', () => {
			const facts = embody('x').facts;
			expect(Object.isFrozen(generateQuiz(facts, classifyOf(facts))[0])).toBe(
				true,
			);
		});

		it('deeply freezes every nested array of each item', () => {
			const facts = embody('x').facts;
			const item = generateQuiz(facts, classifyOf(facts))[0];
			const arrays = Object.values(item ?? {}).filter((value) =>
				Array.isArray(value),
			);
			expect(arrays.every((array) => Object.isFrozen(array))).toBe(true);
		});

		it('accepts a filter argument as a no-op', () => {
			const facts = embody('x; y').facts;
			expect(generateQuiz(facts, classifyOf(facts), { count: 1 })).toEqual(
				generateQuiz(facts, classifyOf(facts)),
			);
		});
	});

	describe('Exceptions', () => {
		it('throws on an unparsed snippet', () => {
			const facts = embody('let = ;').facts;
			expect(() => generateQuiz(facts, [])).toThrow();
		});

		it('throws on an unparsed snippet even when classified is non-empty', () => {
			const facts = embody('let = ;').facts;
			const classified: readonly ClassifiedToken[] = [
				{
					text: 'x',
					start: 0,
					end: 1,
					categories: ['identifier'],
					role: null,
					partner: null,
				},
			];
			expect(() => generateQuiz(facts, classified)).toThrow();
		});
	});

	describe('Simple', () => {
		it('returns equal output for the same input', () => {
			const facts = embody('x; y').facts;
			expect(generateQuiz(facts, classifyOf(facts))).toEqual(
				generateQuiz(facts, classifyOf(facts)),
			);
		});
	});
});
