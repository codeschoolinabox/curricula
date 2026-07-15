import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Snippet } from '../../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type {
	ClassifiedToken,
	ClassifyInput,
} from '../../classifying/types.js';
import generateQuiz from '../../quizzing/generate-quiz.js';
import quizzingSource from '../sources/quizzing-source.js';
import type {
	ClosedOrchestratedItem,
	CompositionConfig,
	OrchestratedItem,
} from '../types.js';

function classifyOf(snippet: Snippet): readonly ClassifiedToken[] {
	return classifyTokens({
		code: snippet.source.code,
		tokens: snippet.raw.tokens,
		ast: snippet.raw.ast,
	} as unknown as ClassifyInput);
}

function itemsFor(
	code: string,
	config: CompositionConfig = {},
): readonly OrchestratedItem[] {
	const snippet = embody(code);
	return quizzingSource.run({
		embodiment: snippet,
		classified: classifyOf(snippet),
		config,
	});
}

function closedItemsFor(
	code: string,
	config: CompositionConfig = {},
): readonly ClosedOrchestratedItem[] {
	return itemsFor(code, config).filter(
		(item): item is ClosedOrchestratedItem => item.register === 'closed',
	);
}

describe('quizzingSource', () => {
	it('has the source id quizzing', () => {
		expect(quizzingSource.id).toBe('quizzing');
	});

	describe('Zero', () => {
		it('returns [] for a parsed snippet with no items', () => {
			expect(itemsFor('')).toEqual([]);
		});
	});

	describe('One', () => {
		it('preserves the forms and order of generateQuiz output', () => {
			const snippet = embody('x');
			const native = generateQuiz(snippet, classifyOf(snippet));
			expect(closedItemsFor('x').map((item) => item.item.form)).toEqual(
				native.map((item) => item.form),
			);
		});
	});

	describe('Many', () => {
		it('emits more items for two identifiers than for one', () => {
			expect(itemsFor('a; b').length).toBeGreaterThan(itemsFor('a').length);
		});

		it('threads classified through — a binding-only form appears for a real binding', () => {
			expect(
				closedItemsFor('let x = 1; x;').map((item) => item.item.form),
			).toContain('V6');
		});
	});

	describe('field mapping', () => {
		it('tags every emitted item with register closed', () => {
			expect(itemsFor('x').every((item) => item.register === 'closed')).toBe(
				true,
			);
		});

		it('tags every emitted item with sourceId quizzing', () => {
			expect(itemsFor('x').every((item) => item.sourceId === 'quizzing')).toBe(
				true,
			);
		});

		it('namespaces the id as quizzing:<nativeId>', () => {
			expect(
				closedItemsFor('x').every(
					(item) => item.id === `quizzing:${item.item.id}`,
				),
			).toBe(true);
		});

		it('reuses item.cells as cells (same reference)', () => {
			expect(
				closedItemsFor('x').every((item) => item.cells === item.item.cells),
			).toBe(true);
		});

		it('copies the native anchorRange as anchorOffsets (same reference)', () => {
			expect(
				closedItemsFor('x').every(
					(item) => item.anchorOffsets === item.item.anchorRange,
				),
			).toBe(true);
		});

		it('carries the whole native QuizItem on the item arm', () => {
			expect(
				closedItemsFor('x').every(
					(item) => typeof item.item.prompt === 'string',
				),
			).toBe(true);
		});
	});

	describe('anchor (native offsets, no projection)', () => {
		it('anchorOffsets slice the native token span', () => {
			const code = 'x';
			expect(
				closedItemsFor(code)
					.filter((item) => item.item.form === 'V1')
					.map((item) =>
						code.slice(item.anchorOffsets[0], item.anchorOffsets[1]),
					),
			).toEqual(['x']);
		});
	});

	describe('filter forwarding', () => {
		it('accepts the quizzing filter slice as a no-op (upstream stub)', () => {
			expect(itemsFor('x; y', { sources: { quizzing: { count: 1 } } })).toEqual(
				itemsFor('x; y'),
			);
		});
	});

	describe('Exception (generateQuiz throws on unparsed)', () => {
		it('returns [] when the embodiment is unparsed', () => {
			expect(
				quizzingSource.run({
					embodiment: embody('FAIL_AT_PARSE'),
					classified: [],
					config: {},
				}),
			).toEqual([]);
		});

		it('does not throw when generateQuiz throws', () => {
			expect(() =>
				quizzingSource.run({
					embodiment: embody('FAIL_AT_PARSE'),
					classified: [],
					config: {},
				}),
			).not.toThrow();
		});
	});

	describe('freezing', () => {
		it('returns a frozen array', () => {
			expect(Object.isFrozen(itemsFor('x'))).toBe(true);
		});

		it('returns frozen items', () => {
			expect(Object.isFrozen(itemsFor('x')[0])).toBe(true);
		});

		it('freezes each item nested anchorOffsets', () => {
			expect(Object.isFrozen(itemsFor('x')[0]?.anchorOffsets)).toBe(true);
		});
	});

	describe('Simple', () => {
		it('returns equal output for the same input', () => {
			expect(itemsFor('a + b')).toEqual(itemsFor('a + b'));
		});
	});
});
