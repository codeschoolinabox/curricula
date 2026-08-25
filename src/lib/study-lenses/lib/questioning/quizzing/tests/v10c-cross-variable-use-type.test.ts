// ported from src/lib/study-lenses--deprecated-architecture/lib/quizzing/tests/v10c-cross-variable-use-type.test.ts
// @ blob 2884382ef47cb84246ebe35cf0775f8063a23d06
// rewires: embody-facts fixtures, classifying depth, classify-from-facts
// cspell:ignore dedups
import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Facts } from '../../../../embody/types.js';
import classifyTokens from '../../../classifying/classify-tokens.js';
import type { ClassifiedToken } from '../../../classifying/types.js';
import buildContext from '../context/build-context.js';
import v10cCrossVariableUseType from '../generators/v10c-cross-variable-use-type.js';
import runGenerators from '../run-generators.js';
import type { SelectInCodeQuizItem } from '../types.js';

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

function v10cItemsOf(code: string): readonly SelectInCodeQuizItem[] {
	const facts = embody(code).facts;
	const items = runGenerators(buildContext(facts, classifyOf(facts)), [
		v10cCrossVariableUseType,
	]);
	return items.filter(
		(item): item is SelectInCodeQuizItem => item.mode === 'select-in-code',
	);
}

describe('v10cCrossVariableUseType', () => {
	describe('Zero', () => {
		it('emits nothing for a snippet with no identifier occurrences', () => {
			expect(v10cItemsOf('1 + 2;')).toEqual([]);
		});
	});

	describe('One', () => {
		it('emits one item even for a lone free global (cross-variable fires on globals)', () => {
			expect(v10cItemsOf('g;')).toHaveLength(1);
		});

		it('targets the global occurrence but unlocks nothing (no binding)', () => {
			const item = v10cItemsOf('g;')[0];
			expect(item?.targetRanges).toEqual([[0, 1]]);
			expect(item?.unlocks).toEqual([]);
		});

		it('keys the global on the cross-variable use-type axis', () => {
			expect(v10cItemsOf('g;')[0]?.groupKey).toBe('usage-kind:read');
		});

		it('is a select-in-code item tagged with the V10c form', () => {
			const item = v10cItemsOf('g;')[0];
			expect(item?.mode).toBe('select-in-code');
			expect(item?.form).toBe('V10c');
		});
	});

	describe('Many', () => {
		it('spans every variable used the same way, across bindings', () => {
			const declared = v10cItemsOf('let a = 1; let b = 2;')[0];
			expect(declared?.groupKey).toBe('usage-kind:declared');
			expect(declared?.anchorRange).toEqual([4, 5]);
			expect(declared?.targetRanges).toEqual([
				[4, 5],
				[15, 16],
			]);
		});

		it('groups read-and-assigned occurrences across bindings', () => {
			const item = v10cItemsOf('let a = 0; a += 1; let b = 0; b += 1;').find(
				(candidate) => candidate.groupKey === 'usage-kind:read-and-assigned',
			);
			expect(item?.targetRanges).toEqual([
				[11, 12],
				[30, 31],
			]);
			expect(item?.unlocks).toEqual([
				'usage:4-5:read-and-assigned',
				'usage:23-24:read-and-assigned',
			]);
		});

		it('unlocks one binding × use-type group per distinct binding, source-ordered', () => {
			expect(v10cItemsOf('let a = 1; let b = 2;')[0]?.unlocks).toEqual([
				'usage:4-5:declared',
				'usage:15-16:declared',
			]);
		});

		it('emits one item per use-type across all variables', () => {
			expect(
				v10cItemsOf('let a = 1; a; let b = 2; b;').map((item) => item.groupKey),
			).toEqual(['usage-kind:declared', 'usage-kind:read']);
		});

		it('emits exactly ONE item per use-type even with many occurrences', () => {
			const reads = v10cItemsOf('let a = 1; a; let b = 2; b;').filter(
				(item) => item.groupKey === 'usage-kind:read',
			);
			expect(reads).toHaveLength(1);
		});
	});

	describe('Boundaries', () => {
		it('targets a global but omits it from unlocks (global contributes a target, not an unlock)', () => {
			const read = v10cItemsOf('let a = 1; a; g;').find(
				(item) => item.groupKey === 'usage-kind:read',
			);
			expect(read?.targetRanges).toEqual([
				[11, 12],
				[14, 15],
			]);
			expect(read?.unlocks).toEqual(['usage:4-5:read']);
		});

		it('dedups the unlock for two same-use occurrences of one binding', () => {
			const read = v10cItemsOf('let a = 1; a; a;').find(
				(item) => item.groupKey === 'usage-kind:read',
			);
			expect(read?.unlocks).toEqual(['usage:4-5:read']);
		});

		it('does not list its own groupKey among its unlocks (the deliberate exception)', () => {
			const read = v10cItemsOf('let a = 1; a; let b = 2; b;').find(
				(item) => item.groupKey === 'usage-kind:read',
			);
			expect(read?.unlocks).not.toContain('usage-kind:read');
		});

		it('anchors the use-type group at its source-first occurrence', () => {
			const read = v10cItemsOf('let a = 1; a; let b = 2; b;').find(
				(item) => item.groupKey === 'usage-kind:read',
			);
			expect(read?.anchorRange).toEqual([11, 12]);
		});

		it('anchors at a global when it is the source-first occurrence of its kind', () => {
			const read = v10cItemsOf('g; let a = 1; a;').find(
				(item) => item.groupKey === 'usage-kind:read',
			);
			expect(read?.anchorRange).toEqual([0, 1]);
			expect(read?.targetRanges).toEqual([
				[0, 1],
				[14, 15],
			]);
			expect(read?.unlocks).toEqual(['usage:7-8:read']);
		});

		it('lists unlocks in source-declaration order, not alphabetical order', () => {
			expect(v10cItemsOf('let b = 2; let a = 1;')[0]?.unlocks).toEqual([
				'usage:4-5:declared',
				'usage:15-16:declared',
			]);
		});
	});

	describe('Interfaces', () => {
		it('places the item on the execution relation cell, not text-surface', () => {
			expect(v10cItemsOf('g;')[0]?.cells).toEqual([
				{ dimension: 'execution', level: 'relation' },
			]);
		});

		it('sets the family to variables', () => {
			expect(v10cItemsOf('g;')[0]?.family).toBe('variables');
		});

		it('ids the item on the cross-variable use-type', () => {
			expect(v10cItemsOf('g;')[0]?.id).toBe('V10c/use-type:read');
		});

		it('uses a fixed cross-variable prompt', () => {
			expect(v10cItemsOf('g;')[0]?.prompt).toBe(
				'Click every place a variable is used the same way as here.',
			);
		});

		it('carries non-empty feedback', () => {
			expect(v10cItemsOf('g;')[0]?.feedback.length ?? 0).toBeGreaterThan(0);
		});

		it('omits anchorPath this increment', () => {
			expect(v10cItemsOf('g;')[0]).not.toHaveProperty('anchorPath');
		});
	});

	describe('Simple', () => {
		it('returns equal output for the same input', () => {
			expect(v10cItemsOf('let a = 1; a; let b = 2; b;')).toEqual(
				v10cItemsOf('let a = 1; a; let b = 2; b;'),
			);
		});
	});
});
