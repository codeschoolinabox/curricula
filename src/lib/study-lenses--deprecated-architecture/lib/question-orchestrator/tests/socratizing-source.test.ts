import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import socratizingSource from '../sources/socratizing-source.js';
import type {
	CompositionConfig,
	OpenOrchestratedItem,
	OrchestratedItem,
} from '../types.js';

function itemsFor(
	code: string,
	config: CompositionConfig = {},
): readonly OrchestratedItem[] {
	return socratizingSource.run({
		embodiment: embody(code),
		classified: [],
		config,
	});
}

function openItemsFor(
	code: string,
	config: CompositionConfig = {},
): readonly OpenOrchestratedItem[] {
	return itemsFor(code, config).filter(
		(item): item is OpenOrchestratedItem => item.register === 'open',
	);
}

describe('socratizingSource', () => {
	it('has the source id socratizing', () => {
		expect(socratizingSource.id).toBe('socratizing');
	});

	describe('Zero', () => {
		it('returns [] for an unparsed embodiment', () => {
			expect(itemsFor('FAIL_AT_PARSE')).toEqual([]);
		});

		it('does not throw on an unparsed embodiment', () => {
			expect(() => itemsFor('FAIL_AT_PARSE')).not.toThrow();
		});

		it('returns [] for a parsed snippet with no questions', () => {
			expect(itemsFor('')).toEqual([]);
		});
	});

	describe('field mapping', () => {
		it('tags every emitted item with register open', () => {
			expect(
				itemsFor('let x = 1; x;').every((item) => item.register === 'open'),
			).toBe(true);
		});

		it('tags every emitted item with sourceId socratizing', () => {
			expect(
				itemsFor('let x = 1; x;').every(
					(item) => item.sourceId === 'socratizing',
				),
			).toBe(true);
		});

		it('namespaces the id as socratizing:<nativeId>', () => {
			expect(
				openItemsFor('let x = 1;')
					.filter((item) => item.question.id === 'what-is-declared')
					.map((item) => item.id),
			).toEqual(['socratizing:what-is-declared']);
		});

		it('reuses cq.block as cells (same reference)', () => {
			expect(
				openItemsFor('let x = 1;')
					.filter((item) => item.question.id === 'what-is-declared')
					.map((item) => item.cells === item.question.block),
			).toEqual([true]);
		});

		it('carries the whole native CodeQuestion on the question arm', () => {
			expect(
				openItemsFor('let x = 1;')
					.filter((item) => item.question.id === 'what-is-declared')
					.map((item) => Array.isArray(item.question.questions)),
			).toEqual([true]);
		});
	});

	describe('Many (duplicate native ids)', () => {
		it('emits one item per occurrence when the native id repeats', () => {
			expect(
				openItemsFor('let x = 1; let y = 2;').filter(
					(item) => item.question.id === 'what-is-declared',
				).length,
			).toBe(2);
		});
	});

	describe('anchor projection (line/col → half-open offset span)', () => {
		it('projects a program-level location to the whole-source span', () => {
			const code = 'let x = 1; x;';
			expect(
				openItemsFor(code)
					.filter((item) => item.question.id === 'read-aloud')
					.map((item) => item.anchorOffsets),
			).toEqual([[0, code.length]]);
		});

		it('program-level offsets slice the entire source', () => {
			const code = 'let x = 1; x;';
			expect(
				openItemsFor(code)
					.filter((item) => item.question.id === 'read-aloud')
					.map((item) =>
						code.slice(item.anchorOffsets[0], item.anchorOffsets[1]),
					),
			).toEqual([code]);
		});

		it('projects a single-line first-line location to its exact span', () => {
			const code = 'let x = 1; x;';
			expect(
				openItemsFor(code)
					.filter((item) => item.question.id === 'what-is-declared')
					.map((item) =>
						code.slice(item.anchorOffsets[0], item.anchorOffsets[1]),
					),
			).toEqual(['let x = 1;']);
		});

		it('projects a same-line non-zero-column start using the start column', () => {
			const code = 'let x = 1; x = 2;';
			expect(
				openItemsFor(code)
					.filter((item) => item.question.id === 'how-variable-changes')
					.map((item) =>
						code.slice(item.anchorOffsets[0], item.anchorOffsets[1]),
					),
			).toEqual(['x = 2']);
		});

		it('projects a multi-line span across a newline', () => {
			const code = 'let y =\n1 + 2;\ny;';
			expect(
				openItemsFor(code)
					.filter((item) => item.question.id === 'what-value-stored')
					.map((item) =>
						code.slice(item.anchorOffsets[0], item.anchorOffsets[1]),
					),
			).toEqual(['let y =\n1 + 2;']);
		});

		it('computes the multi-line span offsets independently (line-length sum)', () => {
			const code = 'let y =\n1 + 2;\ny;';
			expect(
				openItemsFor(code)
					.filter((item) => item.question.id === 'what-value-stored')
					.map((item) => item.anchorOffsets),
			).toEqual([[0, 14]]);
		});

		it('projects a last-line location using the line offset, not offsets[0]', () => {
			const code = 'let x = 1;\nx = 2;';
			expect(
				openItemsFor(code)
					.filter((item) => item.question.id === 'how-variable-changes')
					.map((item) =>
						code.slice(item.anchorOffsets[0], item.anchorOffsets[1]),
					),
			).toEqual(['x = 2']);
		});

		it('treats the range end as exclusive (no off-by-one over-span)', () => {
			const code = 'let x = 1; y;';
			expect(
				openItemsFor(code)
					.filter((item) => item.question.id === 'what-is-declared')
					.map((item) =>
						code.slice(item.anchorOffsets[0], item.anchorOffsets[1]),
					),
			).toEqual(['let x = 1;']);
		});
	});

	describe('filter forwarding', () => {
		it('emits more than one item unfiltered', () => {
			expect(itemsFor('let x = 1; x;').length).toBeGreaterThan(1);
		});

		it('forwards the socratizing filter slice (count:1 → one item)', () => {
			expect(
				itemsFor('let x = 1; x;', {
					sources: { socratizing: { count: 1 } },
				}).length,
			).toBe(1);
		});

		it('forwards a non-count filter field (features.variables:false suppresses items)', () => {
			const code = 'let x = 1; x;';
			expect(
				itemsFor(code, {
					sources: { socratizing: { features: { variables: false } } },
				}).length,
			).toBeLessThan(itemsFor(code).length);
		});
	});

	describe('freezing', () => {
		it('returns a frozen array', () => {
			expect(Object.isFrozen(itemsFor('let x = 1;'))).toBe(true);
		});

		it('returns frozen items', () => {
			expect(Object.isFrozen(itemsFor('let x = 1;')[0])).toBe(true);
		});

		it('freezes each item nested anchorOffsets', () => {
			expect(Object.isFrozen(itemsFor('let x = 1;')[0]?.anchorOffsets)).toBe(
				true,
			);
		});
	});

	describe('Simple', () => {
		it('returns equal output for the same input', () => {
			expect(itemsFor('let x = 1; x;')).toEqual(itemsFor('let x = 1; x;'));
		});
	});
});
