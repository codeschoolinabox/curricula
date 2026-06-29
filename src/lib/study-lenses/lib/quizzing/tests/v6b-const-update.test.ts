import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Snippet } from '../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import buildContext from '../context/build-context.js';
import v6bConstUpdate from '../generators/v6b-const-update.js';
import runGenerators from '../run-generators.js';
import type { McqQuizItem } from '../types.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
}

function v6bItemsOf(code: string): readonly McqQuizItem[] {
	const snippet = embody(code);
	const items = runGenerators(buildContext(snippet, classifyOf(snippet)), [
		v6bConstUpdate,
	]);
	return items.filter((item): item is McqQuizItem => item.mode === 'mcq');
}

describe('v6bConstUpdate', () => {
	describe('Zero', () => {
		it('emits nothing for an empty snippet', () => {
			expect(v6bItemsOf('')).toEqual([]);
		});

		it('emits nothing for a let binding (const only)', () => {
			expect(v6bItemsOf('let x = 1; x = 2;')).toEqual([]);
		});

		it('emits nothing for an undeclared identifier', () => {
			expect(v6bItemsOf('x;')).toEqual([]);
		});
	});

	describe('One', () => {
		it('emits one item for a single const binding', () => {
			expect(v6bItemsOf('const x = 1;')).toHaveLength(1);
		});

		it('tags the item with the V6b form and variables family', () => {
			const item = v6bItemsOf('const x = 1;')[0];
			expect(item?.form).toBe('V6b');
			expect(item?.family).toBe('variables');
		});

		it('anchors the item at the const declaration', () => {
			expect(v6bItemsOf('const x = 1;')[0]?.anchorRange).toEqual([6, 7]);
		});

		it('places the item in the execution × atom cell', () => {
			expect(v6bItemsOf('const x = 1;')[0]?.cells).toEqual([
				{ dimension: 'execution', level: 'atom' },
			]);
		});

		it('keys the propagation group on the const-update element type', () => {
			// A distinct element-type group — NOT category:keyword (which holds V1's
			// keyword-category and V2's keyword-vocab items, both text-surface × atom).
			// V6b is execution × atom (a runtime-error fact), so it does not share that
			// surface-recognition mastery group.
			expect(v6bItemsOf('const x = 1;')[0]?.groupKey).toBe(
				'element-type:const-update',
			);
		});

		it('gives the item a binding-flavored id', () => {
			expect(v6bItemsOf('const x = 1;')[0]?.id).toBe('V6b/binding:x@6-7');
		});

		it('answers TypeError', () => {
			expect(v6bItemsOf('const x = 1;')[0]?.answerOptionIds).toEqual([
				'TypeError',
			]);
		});

		it('offers TypeError plus the three misconception distractors', () => {
			const ids = v6bItemsOf('const x = 1;')[0]?.options.map(
				(option) => option.id,
			);
			expect(ids).toEqual([
				'TypeError',
				'SyntaxError',
				'ReferenceError',
				'silently-ignored',
			]);
		});

		it('answers with an option that exists in the pool', () => {
			const item = v6bItemsOf('const x = 1;')[0];
			const ids = item?.options.map((option) => option.id) ?? [];
			expect(item !== undefined && ids.includes(item.answerOptionIds[0])).toBe(
				true,
			);
		});

		it('names the binding and const in the prompt', () => {
			const prompt = v6bItemsOf('const x = 1;')[0]?.prompt ?? '';
			expect(prompt).toContain('x');
			expect(prompt).toContain('const');
		});
	});

	describe('Many', () => {
		it('emits one item per const binding', () => {
			const items = v6bItemsOf('const a = 1; const b = 2;');
			expect(items).toHaveLength(2);
		});

		it('names the correct binding in each prompt', () => {
			const items = v6bItemsOf('const a = 1; const b = 2;');
			expect(items[0]?.prompt).toContain('a');
			expect(items[1]?.prompt).toContain('b');
		});

		it('shares one frozen options pool across items by reference', () => {
			const items = v6bItemsOf('const a = 1; const b = 2;');
			expect(items[0]?.options).toBe(items[1]?.options);
		});

		it('emits exactly one item for a reassigned const, not per occurrence', () => {
			// const x = 1; x = 2; x; — three occurrences, one V6b item.
			const items = v6bItemsOf('const x = 1; x = 2; x;');
			expect(items).toHaveLength(1);
			expect(items[0]?.anchorRange).toEqual([6, 7]);
		});
	});

	describe('Boundaries', () => {
		it('fires for the const binding only in a mixed let/const snippet', () => {
			const items = v6bItemsOf('let a = 1; const b = 2;');
			expect(items).toHaveLength(1);
			expect(items[0]?.anchorRange).toEqual([17, 18]);
		});

		it('fires on a const declared inside a nested block scope', () => {
			const items = v6bItemsOf('{ const x = 1; }');
			expect(items).toHaveLength(1);
			expect(items[0]?.anchorRange).toEqual([8, 9]);
		});

		it('fires on a const that is only read, never reassigned', () => {
			expect(v6bItemsOf('const x = 1; x;')).toHaveLength(1);
		});
	});

	describe('Interfaces', () => {
		it('emits only mcq items', () => {
			const snippet = embody('const x = 1;');
			const items = runGenerators(buildContext(snippet, classifyOf(snippet)), [
				v6bConstUpdate,
			]);
			expect(items.every((item) => item.mode === 'mcq')).toBe(true);
		});

		it('carries a frozen four-option pool, non-empty feedback, no unlocks', () => {
			const item = v6bItemsOf('const x = 1;')[0];
			expect(item?.options).toHaveLength(4);
			expect(item !== undefined && Object.isFrozen(item.options)).toBe(true);
			expect((item?.feedback.length ?? 0) > 0).toBe(true);
			expect(item?.unlocks).toBeUndefined();
			expect(item?.anchorPath).toBeUndefined();
		});
	});

	describe('Simple', () => {
		it('is deterministic for the same snippet', () => {
			expect(v6bItemsOf('const x = 1;')).toEqual(v6bItemsOf('const x = 1;'));
		});
	});
});
