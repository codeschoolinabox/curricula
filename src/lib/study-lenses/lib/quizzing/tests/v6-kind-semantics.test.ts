import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Snippet } from '../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import buildContext from '../context/build-context.js';
import v6KindSemantics from '../generators/v6-kind-semantics.js';
import runGenerators from '../run-generators.js';
import type { McqQuizItem } from '../types.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
}

function v6ItemsOf(code: string): readonly McqQuizItem[] {
	const snippet = embody(code);
	const items = runGenerators(buildContext(snippet, classifyOf(snippet)), [
		v6KindSemantics,
	]);
	return items.filter((item): item is McqQuizItem => item.mode === 'mcq');
}

describe('v6KindSemantics', () => {
	describe('Zero', () => {
		it('emits nothing for an empty snippet', () => {
			expect(v6ItemsOf('')).toEqual([]);
		});

		it('emits nothing for an undeclared identifier (no resolvable binding)', () => {
			expect(v6ItemsOf('x;')).toEqual([]);
		});
	});

	describe('One', () => {
		it('emits one item for a single binding', () => {
			expect(v6ItemsOf('let x = 1;')).toHaveLength(1);
		});

		it('tags the item with the V6 form and variables family', () => {
			const item = v6ItemsOf('let x = 1;')[0];
			expect(item?.form).toBe('V6');
			expect(item?.family).toBe('variables');
		});

		it('anchors the item at the declaration occurrence', () => {
			expect(v6ItemsOf('let x = 1;')[0]?.anchorRange).toEqual([4, 5]);
		});

		it('places the item in the execution × atom cell', () => {
			expect(v6ItemsOf('let x = 1;')[0]?.cells).toEqual([
				{ dimension: 'execution', level: 'atom' },
			]);
		});

		it('keys the propagation group on the binding identity', () => {
			expect(v6ItemsOf('let x = 1;')[0]?.groupKey).toBe('binding:4-5');
		});

		it('gives the item a binding-flavored id', () => {
			expect(v6ItemsOf('let x = 1;')[0]?.id).toBe('V6/binding:x@4-5');
		});

		it('names the binding in the prompt', () => {
			expect(v6ItemsOf('let x = 1;')[0]?.prompt).toContain('x');
		});

		it('answers yes for a let binding', () => {
			expect(v6ItemsOf('let x = 1;')[0]?.answerOptionIds).toEqual(['yes']);
		});

		it('answers with an option that exists in the pool', () => {
			const item = v6ItemsOf('let x = 1;')[0];
			const ids = item?.options.map((option) => option.id) ?? [];
			expect(item !== undefined && ids.includes(item.answerOptionIds[0])).toBe(
				true,
			);
		});
	});

	describe('Many', () => {
		it('emits exactly one item per binding, not per occurrence', () => {
			// three occurrences of x (declared, assigned, read) — one V6 item.
			expect(v6ItemsOf('let x = 1; x = 2; x;')).toHaveLength(1);
		});

		it('anchors the one item at the declaration, not a later occurrence', () => {
			expect(v6ItemsOf('let x = 1; x = 2; x;')[0]?.anchorRange).toEqual([4, 5]);
		});

		it('emits one item for a const binding with multiple occurrences', () => {
			const items = v6ItemsOf('const c = 1; c; c;');
			expect(items).toHaveLength(1);
			expect(items[0]?.answerOptionIds).toEqual(['no']);
		});

		it('answers each binding by its own kind', () => {
			const items = v6ItemsOf('let a = 1; const b = 2;');
			expect(items.map((item) => item.answerOptionIds)).toEqual([
				['yes'],
				['no'],
			]);
		});
	});

	describe('Boundaries', () => {
		it('answers no for a const binding', () => {
			expect(v6ItemsOf('const x = 1;')[0]?.answerOptionIds).toEqual(['no']);
		});

		it('emits one item for a let declaration with no initializer', () => {
			const items = v6ItemsOf('let x;');
			expect(items).toHaveLength(1);
			expect(items[0]?.answerOptionIds).toEqual(['yes']);
		});

		it('keys shadowing bindings on their own identities with their own kinds', () => {
			const items = v6ItemsOf('let x = 1; { const x = 2; x; }');
			expect(items.map((item) => item.groupKey)).toEqual([
				'binding:4-5',
				'binding:19-20',
			]);
			expect(items.map((item) => item.anchorRange)).toEqual([
				[4, 5],
				[19, 20],
			]);
			expect(items.map((item) => item.answerOptionIds)).toEqual([
				['yes'],
				['no'],
			]);
		});

		it('does not fire on a property name (never anchored)', () => {
			// `o.x`'s `x` is excluded from the descent, so only the `o` binding fires.
			const items = v6ItemsOf('let o = {}; o.x;');
			expect(items).toHaveLength(1);
			expect(items[0]?.anchorRange).toEqual([4, 5]);
		});
	});

	describe('Interfaces', () => {
		it('emits only mcq items', () => {
			const snippet = embody('let x = 1;');
			const items = runGenerators(buildContext(snippet, classifyOf(snippet)), [
				v6KindSemantics,
			]);
			expect(items.every((item) => item.mode === 'mcq')).toBe(true);
		});

		it('carries a frozen two-option pool, distinct per-kind feedback, no unlocks', () => {
			const letItem = v6ItemsOf('let x = 1;')[0];
			const constItem = v6ItemsOf('const x = 1;')[0];
			expect(letItem?.options).toHaveLength(2);
			expect(letItem !== undefined && Object.isFrozen(letItem.options)).toBe(
				true,
			);
			expect(letItem?.feedback).not.toBe(constItem?.feedback);
			expect(letItem?.unlocks).toBeUndefined();
			expect(letItem?.anchorPath).toBeUndefined();
		});
	});

	describe('Simple', () => {
		it('is deterministic for the same snippet', () => {
			expect(v6ItemsOf('let x = 1;')).toEqual(v6ItemsOf('let x = 1;'));
		});
	});
});
