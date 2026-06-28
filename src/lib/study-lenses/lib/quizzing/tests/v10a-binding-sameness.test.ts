import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { Snippet } from '../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import buildContext from '../context/build-context.js';
import v10aBindingSameness from '../generators/v10a-binding-sameness.js';
import runGenerators from '../run-generators.js';
import type { SelectInCodeQuizItem } from '../types.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
}

function v10aItemsOf(code: string): readonly SelectInCodeQuizItem[] {
	const snippet = embody(code);
	const items = runGenerators(buildContext(snippet, classifyOf(snippet)), [
		v10aBindingSameness,
	]);
	return items.filter(
		(item): item is SelectInCodeQuizItem => item.mode === 'select-in-code',
	);
}

describe('v10aBindingSameness', () => {
	describe('Zero', () => {
		it('emits nothing for a snippet with no identifier occurrences', () => {
			expect(v10aItemsOf('1 + 2;')).toEqual([]);
		});

		it('emits nothing for a free global with no resolvable binding', () => {
			expect(v10aItemsOf('x;')).toEqual([]);
		});
	});

	describe('One', () => {
		it('emits one item for a single-occurrence binding', () => {
			expect(v10aItemsOf('let x = 1;')).toHaveLength(1);
		});

		it('targets the lone occurrence (a non-empty, degenerate set)', () => {
			expect(v10aItemsOf('let x = 1;')[0]?.targetRanges).toEqual([[4, 5]]);
		});

		it('is a select-in-code item tagged with the V10a form', () => {
			const item = v10aItemsOf('let x = 1;')[0];
			expect(item?.mode).toBe('select-in-code');
			expect(item?.form).toBe('V10a');
		});

		it('keys and unlocks the binding identity (member of its own group)', () => {
			const item = v10aItemsOf('let x = 1;')[0];
			expect(item?.groupKey).toBe('binding:4-5');
			expect(item?.unlocks).toEqual(['binding:4-5']);
		});
	});

	describe('Many', () => {
		it('emits exactly ONE item for a binding with three occurrences', () => {
			expect(v10aItemsOf('let n = 1; n; n;')).toHaveLength(1);
		});

		it('targets every occurrence of the binding, source-ordered', () => {
			expect(v10aItemsOf('let n = 1; n; n;')[0]?.targetRanges).toEqual([
				[4, 5],
				[11, 12],
				[14, 15],
			]);
		});

		it('anchors the item at the source-first occurrence (the representative)', () => {
			expect(v10aItemsOf('let n = 1; n; n;')[0]?.anchorRange).toEqual([4, 5]);
		});

		it('emits one item per distinct binding', () => {
			expect(
				v10aItemsOf('let a = 1; a; let b = 2; b;').map((item) => item.groupKey),
			).toEqual(['binding:4-5', 'binding:18-19']);
		});

		it('unlocks each item the binding group it belongs to', () => {
			expect(
				v10aItemsOf('let a = 1; a; let b = 2; b;').map((item) => item.unlocks),
			).toEqual([['binding:4-5'], ['binding:18-19']]);
		});
	});

	describe('Boundaries', () => {
		it('keys two shadowing bindings of one name into distinct groups', () => {
			const items = v10aItemsOf('let x = 1; { let x = 2; x; }');
			expect(items.map((item) => item.groupKey)).toEqual([
				'binding:4-5',
				'binding:17-18',
			]);
			expect(items[1]?.unlocks).toEqual(['binding:17-18']);
		});

		it('keys two same-name bindings in sequential scopes into distinct groups', () => {
			expect(
				v10aItemsOf('{ let x = 1; x; } { let x = 2; x; }').map(
					(item) => item.groupKey,
				),
			).toEqual(['binding:6-7', 'binding:24-25']);
		});

		it('includes assignment-target occurrences as members (use-type agnostic)', () => {
			expect(v10aItemsOf('let x = 1; x; x = 2;')[0]?.targetRanges).toEqual([
				[4, 5],
				[11, 12],
				[14, 15],
			]);
		});

		it('targets only the inner binding for the shadowed inner group', () => {
			expect(
				v10aItemsOf('let x = 1; { let x = 2; x; }')[1]?.targetRanges,
			).toEqual([
				[17, 18],
				[24, 25],
			]);
		});

		it('anchors at the source-first occurrence even when it is a reference (TDZ ordering)', () => {
			const item = v10aItemsOf('{ x; let x = 1; }')[0];
			expect(item?.anchorRange).toEqual([2, 3]);
			expect(item?.targetRanges).toEqual([
				[2, 3],
				[9, 10],
			]);
		});

		it('ids the item on the binding identity, independent of the representative', () => {
			expect(v10aItemsOf('{ x; let x = 1; }')[0]?.id).toBe(
				'V10a/binding:x@9-10',
			);
		});

		it('never targets a same-name property occurrence', () => {
			expect(v10aItemsOf('let x = 1; x; o.x;')[0]?.targetRanges).toEqual([
				[4, 5],
				[11, 12],
			]);
		});
	});

	describe('Interfaces', () => {
		it('places the item on the execution relation cell, not text-surface', () => {
			expect(v10aItemsOf('let x = 1;')[0]?.cells).toEqual([
				{ dimension: 'execution', level: 'relation' },
			]);
		});

		it('sets the family to variables', () => {
			expect(v10aItemsOf('let x = 1;')[0]?.family).toBe('variables');
		});

		it('ids the item on the binding declaration span (occurrence-independent)', () => {
			expect(v10aItemsOf('let x = 1;')[0]?.id).toBe('V10a/binding:x@4-5');
		});

		it('names the binding in the prompt', () => {
			expect(v10aItemsOf('let x = 1;')[0]?.prompt).toBe(
				'Click every occurrence of `x`.',
			);
		});

		it('carries non-empty feedback', () => {
			expect(
				v10aItemsOf('let x = 1;')[0]?.feedback.length ?? 0,
			).toBeGreaterThan(0);
		});

		it('omits anchorPath this increment', () => {
			expect(v10aItemsOf('let x = 1;')[0]).not.toHaveProperty('anchorPath');
		});
	});

	describe('Simple', () => {
		it('returns equal output for the same input', () => {
			expect(v10aItemsOf('let n = 1; n; n;')).toEqual(
				v10aItemsOf('let n = 1; n; n;'),
			);
		});
	});
});
