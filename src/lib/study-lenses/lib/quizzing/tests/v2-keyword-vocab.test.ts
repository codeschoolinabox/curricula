import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Snippet } from '../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import buildContext from '../context/build-context.js';
import v2KeywordVocab from '../generators/v2-keyword-vocab.js';
import runGenerators from '../run-generators.js';
import type { McqQuizItem } from '../types.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
}

function v2ItemsOf(code: string): readonly McqQuizItem[] {
	const snippet = embody(code);
	const items = runGenerators(buildContext(snippet, classifyOf(snippet)), [
		v2KeywordVocab,
	]);
	return items.filter((item): item is McqQuizItem => item.mode === 'mcq');
}

describe('v2KeywordVocab', () => {
	describe('Zero', () => {
		it('emits nothing for a snippet with no tokens', () => {
			expect(v2ItemsOf('')).toEqual([]);
		});

		it('emits nothing for a snippet with no let/const keyword', () => {
			expect(v2ItemsOf('x + 1;')).toEqual([]);
			expect(v2ItemsOf('42;')).toEqual([]);
		});
	});

	describe('One', () => {
		it('emits one item for a single let keyword', () => {
			expect(v2ItemsOf('let x = 1;')).toHaveLength(1);
		});

		it('tags the item with the V2 form and variables family', () => {
			const item = v2ItemsOf('let x = 1;')[0];
			expect(item?.form).toBe('V2');
			expect(item?.family).toBe('variables');
		});

		it('anchors the item to the keyword token range', () => {
			expect(v2ItemsOf('let x = 1;')[0]?.anchorRange).toEqual([0, 3]);
		});

		it('places the item in the text-surface × atom cell', () => {
			expect(v2ItemsOf('let x = 1;')[0]?.cells).toEqual([
				{ dimension: 'text-surface', level: 'atom' },
			]);
		});

		it('keys the propagation group on the keyword element type', () => {
			expect(v2ItemsOf('let x = 1;')[0]?.groupKey).toBe('category:keyword');
		});

		it('sets the authored prompt', () => {
			expect(v2ItemsOf('let x = 1;')[0]?.prompt).toBe(
				'What does this keyword do?',
			);
		});

		it('answers let with the reassignable card', () => {
			expect(v2ItemsOf('let x = 1;')[0]?.answerOptionIds).toEqual([
				'reassignable',
			]);
		});

		it('offers both answer cards plus the var-misconception distractor', () => {
			const ids = v2ItemsOf('let x = 1;')[0]?.options.map(
				(option) => option.id,
			);
			expect(ids).toEqual(['reassignable', 'initialize-once', 'var-scoped']);
		});

		it('answers with an option that exists in the pool', () => {
			const item = v2ItemsOf('let x = 1;')[0];
			const ids = item?.options.map((option) => option.id) ?? [];
			expect(item !== undefined && ids.includes(item.answerOptionIds[0])).toBe(
				true,
			);
		});

		it('derives the id from the form and anchor', () => {
			expect(v2ItemsOf('let x = 1;')[0]?.id).toBe('V2@0-3');
		});
	});

	describe('Many', () => {
		it('emits one item per let/const keyword, each with its own card', () => {
			const items = v2ItemsOf('let a = 1; const b = 2;');
			expect(items.map((item) => item.answerOptionIds)).toEqual([
				['reassignable'],
				['initialize-once'],
			]);
		});

		it('anchors the const keyword to its own range', () => {
			const items = v2ItemsOf('let a = 1; const b = 2;');
			expect(items[1]?.anchorRange).toEqual([11, 16]);
		});

		it('shares one frozen options pool across items by reference', () => {
			const items = v2ItemsOf('let a = 1; const b = 2;');
			expect(items[0]?.options).toBe(items[1]?.options);
		});
	});

	describe('Boundaries', () => {
		it('answers const with the initialize-once card', () => {
			const item = v2ItemsOf('const x = 1;')[0];
			expect(item?.answerOptionIds).toEqual(['initialize-once']);
		});

		it('gives let and const distinct feedback', () => {
			const letItem = v2ItemsOf('let x = 1;')[0];
			const constItem = v2ItemsOf('const x = 1;')[0];
			expect(letItem?.feedback).not.toBe(constItem?.feedback);
		});

		it('does not fire on a non-let/const keyword', () => {
			expect(v2ItemsOf('if (x) {}')).toEqual([]);
		});

		it('fires only on the const keyword in a for-of head, not on for', () => {
			const items = v2ItemsOf("for (const x of 'ab') {}");
			expect(items).toHaveLength(1);
			expect(items[0]?.anchorRange).toEqual([5, 10]);
		});
	});

	describe('Interfaces', () => {
		it('emits only mcq items', () => {
			const snippet = embody('let x = 1;');
			const items = runGenerators(buildContext(snippet, classifyOf(snippet)), [
				v2KeywordVocab,
			]);
			expect(items.every((item) => item.mode === 'mcq')).toBe(true);
		});

		it('carries a non-empty frozen options array and feedback, no anchorPath or unlocks', () => {
			const item = v2ItemsOf('let x = 1;')[0];
			expect(item?.options.length).toBeGreaterThan(0);
			expect(item !== undefined && Object.isFrozen(item.options)).toBe(true);
			expect((item?.feedback.length ?? 0) > 0).toBe(true);
			expect(item?.anchorPath).toBeUndefined();
			expect(item?.unlocks).toBeUndefined();
		});
	});

	describe('Simple', () => {
		it('is deterministic for the same snippet', () => {
			expect(v2ItemsOf('let x = 1;')).toEqual(v2ItemsOf('let x = 1;'));
		});
	});
});
