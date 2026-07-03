import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Snippet } from '../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import generateQuiz from '../generate-quiz.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
}

describe('generateQuiz', () => {
	describe('Zero', () => {
		it('returns an empty array for a snippet with no tokens', () => {
			const snippet = embody('');
			expect(generateQuiz(snippet, classifyOf(snippet))).toEqual([]);
		});
	});

	describe('One', () => {
		it('runs every registered generator over a single identifier', () => {
			const snippet = embody('x');
			expect(
				generateQuiz(snippet, classifyOf(snippet)).map((item) => item.form),
			).toEqual(['V1', 'V7', 'V10c', 'V4']);
		});
	});

	describe('Many', () => {
		it('keeps family variables for every item regardless of generator', () => {
			const snippet = embody('a + b');
			expect(
				generateQuiz(snippet, classifyOf(snippet)).every(
					(item) => item.family === 'variables',
				),
			).toBe(true);
		});

		it('orders token-anchored, then node-anchored, then program-anchored items', () => {
			const snippet = embody('a; b');
			expect(
				generateQuiz(snippet, classifyOf(snippet)).map((item) => item.form),
			).toEqual(['V1', 'V1', 'V1', 'V7', 'V7', 'V10c', 'V4', 'V4']);
		});

		it('runs every applicable registered generator for a declared, referenced binding', () => {
			const snippet = embody('let x = 1; x;');
			expect(
				new Set(
					generateQuiz(snippet, classifyOf(snippet)).map((item) => item.form),
				),
			).toEqual(
				new Set([
					'V1',
					'V2',
					'V3',
					'V6',
					'V7',
					'V8',
					'V10a',
					'V10b',
					'V10c',
					'V4',
				]),
			);
		});

		it('adds the const-only V6b form for a declared, referenced const', () => {
			const snippet = embody('const x = 1; x;');
			expect(
				new Set(
					generateQuiz(snippet, classifyOf(snippet)).map((item) => item.form),
				),
			).toEqual(
				new Set([
					'V1',
					'V2',
					'V3',
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
			const snippet = embody('var x = 1; x = 2; x;');
			expect(
				new Set(
					generateQuiz(snippet, classifyOf(snippet)).map((item) => item.form),
				),
			).toEqual(
				new Set(['V1', 'V3', 'V7', 'V8', 'V10a', 'V10b', 'V10c', 'V4']),
			);
		});

		it('emits exactly one V2 item (the declaration) for a contextual keyword as a property', () => {
			// `obj.let` must not add a second V2 card on the property name — only the
			// real `const obj` declaration keyword fires.
			const snippet = embody('const obj = {}; obj.let;');
			const v2Count = generateQuiz(snippet, classifyOf(snippet)).filter(
				(item) => item.form === 'V2',
			).length;
			expect(v2Count).toBe(1);
		});

		it('fires the program-anchored V4 end-to-end for both chains', () => {
			// V4 is the first program-anchored generator to run; confirm both a
			// scope-chain and a prototype-chain item reach generateQuiz output.
			const snippet = embody('Math.max;');
			const chainGroupKeys = generateQuiz(snippet, classifyOf(snippet))
				.filter((item) => item.form === 'V4')
				.map((item) => item.groupKey);
			expect(chainGroupKeys).toContain('chain:scope-chain:Math');
			expect(chainGroupKeys).toContain('chain:prototype-chain:max');
		});

		it('fires V3 realm provenance end-to-end for a bare intrinsic global', () => {
			// the realm branch (undeclared name → realm-table hit) reaches output
			const snippet = embody('Math;');
			const v3 = generateQuiz(snippet, classifyOf(snippet)).filter(
				(item) => item.form === 'V3',
			);
			expect(v3).toHaveLength(1);
			expect(v3[0]?.groupKey).toBe('realm:Math');
		});

		it('keys V3 on the binding axis when a program decl shadows a realm name', () => {
			// resolveBinding-first: `let Math` wins, so V3 is program-declared, not realm
			const snippet = embody('let Math = 1; Math;');
			const v3GroupKeys = generateQuiz(snippet, classifyOf(snippet))
				.filter((item) => item.form === 'V3')
				.map((item) => item.groupKey);
			expect(v3GroupKeys).toEqual(['binding:4-8', 'binding:4-8']);
		});

		it('fires V5 value-category end-to-end for a bare intrinsic global', () => {
			// the realm value-category form reaches output for an unshadowed global
			const snippet = embody('Math;');
			const v5 = generateQuiz(snippet, classifyOf(snippet)).filter(
				(item) => item.form === 'V5',
			);
			expect(v5).toHaveLength(1);
			expect(v5[0]?.groupKey).toBe('realm:Math');
		});

		it('stays silent (no V5) when a program decl shadows a realm name', () => {
			// resolveBinding hits → V5 is silent; only V3 fires (program-declared)
			const snippet = embody('let Math = 1; Math;');
			const v5 = generateQuiz(snippet, classifyOf(snippet)).filter(
				(item) => item.form === 'V5',
			);
			expect(v5).toEqual([]);
		});
	});

	describe('Interfaces', () => {
		it('emits only the binding-independent forms for an undeclared identifier', () => {
			// V8 / V10a / V10b need a resolvable binding, so they emit nothing for a
			// free global; V10c (cross-variable) fires on any identifier, so an
			// undeclared identifier still yields one code-surface (select-in-code) item.
			const snippet = embody('x');
			expect(
				new Set(
					generateQuiz(snippet, classifyOf(snippet)).map((item) => item.form),
				),
			).toEqual(new Set(['V1', 'V7', 'V10c', 'V4']));
		});

		it('returns a deeply frozen array', () => {
			const snippet = embody('x');
			expect(Object.isFrozen(generateQuiz(snippet, classifyOf(snippet)))).toBe(
				true,
			);
		});

		it('returns frozen items', () => {
			const snippet = embody('x');
			expect(
				Object.isFrozen(generateQuiz(snippet, classifyOf(snippet))[0]),
			).toBe(true);
		});

		it('deeply freezes every nested array of each item', () => {
			const snippet = embody('x');
			const item = generateQuiz(snippet, classifyOf(snippet))[0];
			const arrays = Object.values(item ?? {}).filter((value) =>
				Array.isArray(value),
			);
			expect(arrays.every((array) => Object.isFrozen(array))).toBe(true);
		});

		it('accepts a filter argument as a no-op', () => {
			const snippet = embody('x; y');
			expect(generateQuiz(snippet, classifyOf(snippet), { count: 1 })).toEqual(
				generateQuiz(snippet, classifyOf(snippet)),
			);
		});
	});

	describe('Exceptions', () => {
		it('throws on an unparsed snippet', () => {
			const snippet = embody('FAIL_AT_PARSE');
			expect(() => generateQuiz(snippet, [])).toThrow();
		});

		it('throws on an unparsed snippet even when classified is non-empty', () => {
			const snippet = embody('FAIL_AT_PARSE');
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
			expect(() => generateQuiz(snippet, classified)).toThrow();
		});
	});

	describe('Simple', () => {
		it('returns equal output for the same input', () => {
			const snippet = embody('x; y');
			expect(generateQuiz(snippet, classifyOf(snippet))).toEqual(
				generateQuiz(snippet, classifyOf(snippet)),
			);
		});
	});
});
