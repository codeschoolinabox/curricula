// ported from src/lib/study-lenses--deprecated-architecture/lib/quizzing/tests/v10b-binding-use-type.test.ts
// @ blob f2fa8192835725401ecc1dd59f5a2c461a9b6c1b
// rewires: embody-facts fixtures, classifying depth, classify-from-facts
import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Facts } from '../../../../embody/types.js';
import classifyTokens from '../../../classifying/classify-tokens.js';
import type { ClassifiedToken } from '../../../classifying/types.js';
import buildContext from '../context/build-context.js';
import v10bBindingUseType from '../generators/v10b-binding-use-type.js';
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

function v10bItemsOf(code: string): readonly SelectInCodeQuizItem[] {
	const facts = embody(code).facts;
	const items = runGenerators(buildContext(facts, classifyOf(facts)), [
		v10bBindingUseType,
	]);
	return items.filter(
		(item): item is SelectInCodeQuizItem => item.mode === 'select-in-code',
	);
}

describe('v10bBindingUseType', () => {
	describe('Zero', () => {
		it('emits nothing for a snippet with no identifier occurrences', () => {
			expect(v10bItemsOf('1 + 2;')).toEqual([]);
		});

		it('emits nothing for a free global with no resolvable binding', () => {
			expect(v10bItemsOf('x;')).toEqual([]);
		});
	});

	describe('One', () => {
		it('emits one item for a binding used a single way', () => {
			expect(v10bItemsOf('let x = 1;')).toHaveLength(1);
		});

		it('targets the lone occurrence of that use-type', () => {
			expect(v10bItemsOf('let x = 1;')[0]?.targetRanges).toEqual([[4, 5]]);
		});

		it('keys and unlocks the binding × use-type group (member of its own group)', () => {
			const item = v10bItemsOf('let x = 1;')[0];
			expect(item?.groupKey).toBe('usage:4-5:declared');
			expect(item?.unlocks).toEqual(['usage:4-5:declared']);
		});

		it('is a select-in-code item tagged with the V10b form', () => {
			const item = v10bItemsOf('let x = 1;')[0];
			expect(item?.mode).toBe('select-in-code');
			expect(item?.form).toBe('V10b');
		});
	});

	describe('Many', () => {
		it('emits one item per use-type of a binding', () => {
			expect(
				v10bItemsOf('let x = 1; x; x = 2;').map((item) => item.groupKey),
			).toEqual(['usage:4-5:declared', 'usage:4-5:read', 'usage:4-5:assigned']);
		});

		it('keys a read-and-assigned occurrence on its own use-type group', () => {
			expect(
				v10bItemsOf('let x = 0; x += 1;').map((item) => item.groupKey),
			).toEqual(['usage:4-5:declared', 'usage:4-5:read-and-assigned']);
		});

		it('anchors each use-type group at its own source-first occurrence', () => {
			expect(
				v10bItemsOf('let x = 1; x; x = 2;').map((item) => item.anchorRange),
			).toEqual([
				[4, 5],
				[11, 12],
				[14, 15],
			]);
		});

		it('emits exactly ONE item for two same-use occurrences of a binding', () => {
			const reads = v10bItemsOf('let x = 1; x; x;').filter(
				(item) => item.groupKey === 'usage:4-5:read',
			);
			expect(reads).toHaveLength(1);
		});

		it('targets every same-use occurrence of the binding, source-ordered', () => {
			const read = v10bItemsOf('let x = 1; x; x;').find(
				(item) => item.groupKey === 'usage:4-5:read',
			);
			expect(read?.targetRanges).toEqual([
				[11, 12],
				[14, 15],
			]);
		});

		it('anchors a use-type group at its source-first occurrence', () => {
			const read = v10bItemsOf('let x = 1; x; x;').find(
				(item) => item.groupKey === 'usage:4-5:read',
			);
			expect(read?.anchorRange).toEqual([11, 12]);
		});
	});

	describe('Boundaries', () => {
		it('separates use-types of one binding into distinct groups', () => {
			expect(
				v10bItemsOf('let x = 1; x; x;').map((item) => item.groupKey),
			).toEqual(['usage:4-5:declared', 'usage:4-5:read']);
		});

		it('keys shadowing bindings on their own binding × use-type groups', () => {
			expect(
				v10bItemsOf('let x = 1; { let x = 2; x; }').map(
					(item) => item.groupKey,
				),
			).toEqual([
				'usage:4-5:declared',
				'usage:17-18:declared',
				'usage:17-18:read',
			]);
		});

		it('does not merge the same use-type across two distinct bindings', () => {
			expect(
				v10bItemsOf('let a = 1; a; let b = 2; b;').map((item) => item.groupKey),
			).toEqual([
				'usage:4-5:declared',
				'usage:4-5:read',
				'usage:18-19:declared',
				'usage:18-19:read',
			]);
		});

		it('never targets a same-name property occurrence', () => {
			const read = v10bItemsOf('let x = 1; x; o.x;').find(
				(item) => item.groupKey === 'usage:4-5:read',
			);
			expect(read?.targetRanges).toEqual([[11, 12]]);
		});

		it('unlocks the re-keyed V7 usage-kind key (bulk-credit linkage)', () => {
			const read = v10bItemsOf('let x = 1; x; x;').find(
				(item) => item.groupKey === 'usage:4-5:read',
			);
			expect(read?.unlocks).toEqual(['usage:4-5:read']);
		});
	});

	describe('Interfaces', () => {
		it('places the item on the execution relation cell, not text-surface', () => {
			expect(v10bItemsOf('let x = 1;')[0]?.cells).toEqual([
				{ dimension: 'execution', level: 'relation' },
			]);
		});

		it('sets the family to variables', () => {
			expect(v10bItemsOf('let x = 1;')[0]?.family).toBe('variables');
		});

		it('ids the item on the binding declaration span and use-type', () => {
			expect(v10bItemsOf('let x = 1;')[0]?.id).toBe(
				'V10b/binding:x@4-5:declared',
			);
		});

		it('names the binding in the prompt', () => {
			expect(v10bItemsOf('let x = 1;')[0]?.prompt).toBe(
				'Click every occurrence where `x` is used the same way as here.',
			);
		});

		it('carries non-empty feedback', () => {
			expect(
				v10bItemsOf('let x = 1;')[0]?.feedback.length ?? 0,
			).toBeGreaterThan(0);
		});

		it('omits anchorPath this increment', () => {
			expect(v10bItemsOf('let x = 1;')[0]).not.toHaveProperty('anchorPath');
		});
	});

	describe('Simple', () => {
		it('returns equal output for the same input', () => {
			expect(v10bItemsOf('let x = 1; x; x;')).toEqual(
				v10bItemsOf('let x = 1; x; x;'),
			);
		});
	});
});
