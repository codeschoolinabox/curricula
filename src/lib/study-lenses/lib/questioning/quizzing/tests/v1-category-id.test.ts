// ported from src/lib/study-lenses--deprecated-architecture/lib/quizzing/tests/v1-category-id.test.ts
// @ blob 9d3114a8eb015887af51519bd576c9d3a5ba423e
// rewires: embody-facts fixtures, classifying depth, classify-from-facts
import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Facts } from '../../../../embody/types.js';
import classifyTokens from '../../../classifying/classify-tokens.js';
import type { ClassifiedToken } from '../../../classifying/types.js';
import buildContext from '../context/build-context.js';
import v1CategoryId from '../generators/v1-category-id.js';
import runGenerators from '../run-generators.js';
import type { McqQuizItem } from '../types.js';

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

function v1ItemsOf(code: string): readonly McqQuizItem[] {
	const { facts } = embody(code);
	const items = runGenerators(buildContext(facts, classifyOf(facts)), [
		v1CategoryId,
	]);
	return items.filter((item): item is McqQuizItem => item.mode === 'mcq');
}

describe('v1CategoryId', () => {
	describe('Zero', () => {
		it('emits nothing for a snippet with no tokens', () => {
			expect(v1ItemsOf('')).toEqual([]);
		});
	});

	describe('One', () => {
		it('emits only mcq items', () => {
			const { facts } = embody('x');
			const items = runGenerators(buildContext(facts, classifyOf(facts)), [
				v1CategoryId,
			]);
			expect(items.every((item) => item.mode === 'mcq')).toBe(true);
		});

		it('emits one item per token', () => {
			expect(v1ItemsOf('x')).toHaveLength(1);
		});

		it('tags the item with the V1 form', () => {
			expect(v1ItemsOf('x')[0]?.form).toBe('V1');
		});

		it('sets the family to variables', () => {
			expect(v1ItemsOf('x')[0]?.family).toBe('variables');
		});

		it('anchors the item to the token range', () => {
			expect(v1ItemsOf('x')[0]?.anchorRange).toEqual([0, 1]);
		});

		it('keys the answer to the token primary category', () => {
			expect(v1ItemsOf('x')[0]?.answerOptionIds).toEqual(['identifier']);
		});

		it('ids the item as V1 at the token range', () => {
			expect(v1ItemsOf('x')[0]?.id).toBe('V1@0-1');
		});

		it('keys the propagation group on the bare category for a role-less token', () => {
			expect(v1ItemsOf('x')[0]?.groupKey).toBe('category:identifier');
		});

		it('places the item on the text-surface atom cell', () => {
			expect(v1ItemsOf('x')[0]?.cells).toEqual([
				{ dimension: 'text-surface', level: 'atom' },
			]);
		});

		it('omits anchorPath for a token-anchored item', () => {
			expect(v1ItemsOf('x')[0]).not.toHaveProperty('anchorPath');
		});

		it('omits unlocks for the V1 form', () => {
			expect(v1ItemsOf('x')[0]).not.toHaveProperty('unlocks');
		});

		it('offers the five category options in order', () => {
			expect(v1ItemsOf('x')[0]?.options.map((option) => option.id)).toEqual([
				'identifier',
				'keyword',
				'operator',
				'literal',
				'delimiter',
			]);
		});

		it('labels every option with non-empty text', () => {
			const options = v1ItemsOf('x')[0]?.options;
			expect(options?.every((option) => option.text.length > 0)).toBe(true);
		});

		it('prompts for the syntax-element category', () => {
			expect(v1ItemsOf('x')[0]?.prompt).toBe(
				'What kind of syntax element is this?',
			);
		});

		it('carries non-empty feedback', () => {
			expect(v1ItemsOf('x')[0]?.feedback.length ?? 0).toBeGreaterThan(0);
		});
	});

	describe('Many', () => {
		it('emits one source-ordered item per token with its half-open range', () => {
			expect(v1ItemsOf('x; y').map((item) => item.anchorRange)).toEqual([
				[0, 1],
				[1, 2],
				[3, 4],
			]);
		});

		it('refines the propagation group with the role for a role-bearing token', () => {
			expect(v1ItemsOf('a + b')[1]?.groupKey).toBe('category:operator:binary');
		});
	});

	describe('Boundaries', () => {
		it('covers every category present in the snippet', () => {
			const answered = new Set(
				v1ItemsOf('let x = null;').flatMap((item) => item.answerOptionIds),
			);
			expect(answered).toEqual(
				new Set(['keyword', 'identifier', 'operator', 'literal', 'delimiter']),
			);
		});

		it('refines the propagation group for a role-bearing delimiter', () => {
			expect(v1ItemsOf('let x = null;')[4]?.groupKey).toBe(
				'category:delimiter:statement-end',
			);
		});
	});

	describe('Simple', () => {
		it('returns equal output for the same input', () => {
			expect(v1ItemsOf('x; y')).toEqual(v1ItemsOf('x; y'));
		});
	});
});
