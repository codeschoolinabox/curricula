import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Snippet } from '../../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import buildContext from '../context/build-context.js';
import v8DeclarationSite from '../generators/v8-declaration-site.js';
import runGenerators from '../run-generators.js';
import type { CodeSurfaceQuizItem } from '../types.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
}

function v8ItemsOf(code: string): readonly CodeSurfaceQuizItem[] {
	const snippet = embody(code);
	const items = runGenerators(buildContext(snippet, classifyOf(snippet)), [
		v8DeclarationSite,
	]);
	return items.filter(
		(item): item is CodeSurfaceQuizItem =>
			item.mode === 'click-token' || item.mode === 'click-line',
	);
}

describe('v8DeclarationSite', () => {
	describe('Zero', () => {
		it('emits nothing for a declaration with no references', () => {
			expect(v8ItemsOf('let x = 1;')).toEqual([]);
		});

		it('emits nothing for a reference to an undeclared global', () => {
			expect(v8ItemsOf('x;')).toEqual([]);
		});
	});

	describe('One', () => {
		it('emits one item for a reference to a declared binding', () => {
			expect(v8ItemsOf('let n = 1; n;')).toHaveLength(1);
		});

		it('asks where the binding is declared', () => {
			expect(v8ItemsOf('let n = 1; n;')[0]?.mode).toBe('click-token');
		});

		it('tags the item with the V8 form', () => {
			expect(v8ItemsOf('let n = 1; n;')[0]?.form).toBe('V8');
		});

		it('anchors the item to the reference, not the declaration', () => {
			expect(v8ItemsOf('let n = 1; n;')[0]?.anchorRange).toEqual([11, 12]);
		});

		it('targets the declaration span', () => {
			expect(v8ItemsOf('let n = 1; n;')[0]?.targetRanges).toEqual([[4, 5]]);
		});

		it('keys the propagation group on the binding identity', () => {
			expect(v8ItemsOf('let n = 1; n;')[0]?.groupKey).toBe('binding:4-5');
		});

		it('names the binding in the prompt', () => {
			expect(v8ItemsOf('let n = 1; n;')[0]?.prompt).toBe(
				'Click where `n` is declared.',
			);
		});
	});

	describe('Many', () => {
		it('keys every reference to one binding into the same group', () => {
			expect(
				v8ItemsOf('let n = 1; n; n;').map((item) => item.groupKey),
			).toEqual(['binding:4-5', 'binding:4-5']);
		});

		it('anchors each reference distinctly', () => {
			expect(
				v8ItemsOf('let n = 1; n; n;').map((item) => item.anchorRange),
			).toEqual([
				[11, 12],
				[14, 15],
			]);
		});
	});

	describe('Boundaries', () => {
		it('targets the shadowing inner declaration, not the outer', () => {
			expect(
				v8ItemsOf('let x = 1; { let x = 2; x; }')[0]?.targetRanges,
			).toEqual([[17, 18]]);
		});

		it('targets an outer-scope declaration when there is no inner shadow', () => {
			expect(v8ItemsOf('let x = 1; { x; }')[0]?.targetRanges).toEqual([[4, 5]]);
		});

		it('emits an item for an assignment-target reference', () => {
			expect(v8ItemsOf('let x = 1; x = 2;')).toHaveLength(1);
		});

		it('targets the declaration from an assignment-target reference', () => {
			expect(v8ItemsOf('let x = 1; x = 2;')[0]?.targetRanges).toEqual([[4, 5]]);
		});

		it('emits an item for a read-and-assigned reference', () => {
			expect(v8ItemsOf('let x = 1; x += 2;')).toHaveLength(1);
		});

		it('emits exactly one item when a real reference coexists with a same-name property', () => {
			expect(v8ItemsOf('let x = 1; x; o.x;')).toHaveLength(1);
		});

		it('anchors that item to the real reference, not the property name', () => {
			expect(v8ItemsOf('let x = 1; x; o.x;')[0]?.anchorRange).toEqual([11, 12]);
		});
	});

	describe('Interfaces', () => {
		it('emits only click-token items', () => {
			const snippet = embody('let n = 1; n;');
			const items = runGenerators(buildContext(snippet, classifyOf(snippet)), [
				v8DeclarationSite,
			]);
			expect(items.every((item) => item.mode === 'click-token')).toBe(true);
		});

		it('places the item on the text-surface relation cell', () => {
			expect(v8ItemsOf('let n = 1; n;')[0]?.cells).toEqual([
				{ dimension: 'text-surface', level: 'relation' },
			]);
		});

		it('ids the item as V8 at the reference range', () => {
			expect(v8ItemsOf('let n = 1; n;')[0]?.id).toBe('V8@11-12');
		});

		it('sets the family to variables', () => {
			expect(v8ItemsOf('let n = 1; n;')[0]?.family).toBe('variables');
		});

		it('carries non-empty feedback', () => {
			expect(
				v8ItemsOf('let n = 1; n;')[0]?.feedback.length ?? 0,
			).toBeGreaterThan(0);
		});

		it('omits anchorPath this increment', () => {
			expect(v8ItemsOf('let n = 1; n;')[0]).not.toHaveProperty('anchorPath');
		});

		it('omits unlocks', () => {
			expect(v8ItemsOf('let n = 1; n;')[0]).not.toHaveProperty('unlocks');
		});
	});

	describe('Simple', () => {
		it('returns equal output for the same input', () => {
			expect(v8ItemsOf('let n = 1; n;')).toEqual(v8ItemsOf('let n = 1; n;'));
		});
	});
});
