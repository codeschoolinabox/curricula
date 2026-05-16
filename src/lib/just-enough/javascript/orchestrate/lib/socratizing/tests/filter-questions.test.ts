import { describe, it, expect } from 'vitest';

import filterQuestions from '../filter-questions.js';
import createCodeQuestion from '../create-code-question.js';
import type { CodeQuestion, CodeQuestionInput, MicroDecisionConfig } from '../types.js';

// ─── Test helper ────────────────────────────────────────────

function makeQuestion(overrides: Partial<CodeQuestionInput> = {}): CodeQuestion {
	return createCodeQuestion({
		id: 'test-question',
		kind: 'micro-decision',
		category: 'voice',
		feature: 'variables',
		levels: ['syntax'],
		location: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } },
		nodeType: 'VariableDeclaration',
		context: 'test context',
		questions: [{ register: 'open', text: 'test question?' }],
		block: [{ dimension: 'text-surface', level: 'atom' }],
		pbsi: ['implementation'],
		audiences: ['developers'],
		...overrides,
	});
}

// ─── Tests ──────────────────────────────────────────────────

describe('filterQuestions', () => {
	// ─── Kind filter ────────────────────────────────────────

	describe('kind filter', () => {
		it('omitted kind config passes all kinds', () => {
			const micro = makeQuestion({ id: 'micro', kind: 'micro-decision' });
			const comp = makeQuestion({ id: 'comp', kind: 'comprehension' });

			const result = filterQuestions([micro, comp], {});
			expect(result).toHaveLength(2);
		});

		it('filters out comprehension questions when comprehension is false', () => {
			const micro = makeQuestion({ id: 'micro', kind: 'micro-decision' });
			const comp = makeQuestion({ id: 'comp', kind: 'comprehension' });

			const result = filterQuestions([micro, comp], {
				kind: { comprehension: false },
			});
			expect(result).toHaveLength(1);
			expect(result[0]!.kind).toBe('micro-decision');
		});

		it('filters out micro-decision questions when microDecision is false', () => {
			const micro = makeQuestion({ id: 'micro', kind: 'micro-decision' });
			const comp = makeQuestion({ id: 'comp', kind: 'comprehension' });

			const result = filterQuestions([micro, comp], {
				kind: { microDecision: false },
			});
			expect(result).toHaveLength(1);
			expect(result[0]!.kind).toBe('comprehension');
		});
	});

	// ─── Feature filter ─────────────────────────────────────

	describe('feature filter', () => {
		it('filters out variable questions when variables is false', () => {
			const q = makeQuestion({ feature: 'variables' });

			const result = filterQuestions([q], {
				features: { variables: false },
			});
			expect(result).toHaveLength(0);
		});

		it('all-false features result in empty output', () => {
			const q1 = makeQuestion({ id: 'q1', feature: 'variables' });
			const q2 = makeQuestion({ id: 'q2', feature: 'data' });

			const result = filterQuestions([q1, q2], {
				features: {
					variables: false,
					data: false,
					operators: false,
					controlFlow: false,
					functions: false,
					userInteraction: false,
					reading: false,
				},
			});
			expect(result).toHaveLength(0);
		});
	});

	// ─── Levels filter (multi-value) ────────────────────────

	describe('levels filter', () => {
		it('passes if any of the question levels is enabled', () => {
			const q = makeQuestion({ levels: ['syntax', 'semantics'] });

			const result = filterQuestions([q], {
				levels: { syntax: false, semantics: true },
			});
			expect(result).toHaveLength(1);
		});

		it('filters out when all question levels are disabled', () => {
			const q = makeQuestion({ levels: ['syntax'] });

			const result = filterQuestions([q], {
				levels: { syntax: false },
			});
			expect(result).toHaveLength(0);
		});
	});

	// ─── Audiences filter (multi-value) ─────────────────────

	describe('audiences filter', () => {
		it('passes if any of the question audiences is enabled', () => {
			const q = makeQuestion({ audiences: ['developers', 'computer'] });

			const result = filterQuestions([q], {
				audiences: { developers: false, computer: true },
			});
			expect(result).toHaveLength(1);
		});
	});

	// ─── Categories filter ──────────────────────────────────

	describe('categories filter', () => {
		it('filters out voice questions when voice is false', () => {
			const q = makeQuestion({ category: 'voice' });

			const result = filterQuestions([q], {
				categories: { voice: false },
			});
			expect(result).toHaveLength(0);
		});

		it('filters out easter-egg questions via the easterEgg config key', () => {
			const q = makeQuestion({ category: 'easter-egg' });

			const result = filterQuestions([q], {
				categories: { easterEgg: false },
			});
			expect(result).toHaveLength(0);
		});
	});

	// ─── Range filter ───────────────────────────────────────

	describe('range filter', () => {
		it('keeps a question whose location is inside the range', () => {
			const q = makeQuestion({
				location: { start: { line: 5, column: 0 }, end: { line: 10, column: 5 } },
			});

			const result = filterQuestions([q], {
				range: { start: 1, end: 20 },
			});
			expect(result).toHaveLength(1);
		});

		it('removes a question whose location is entirely outside the range', () => {
			const q = makeQuestion({
				location: { start: { line: 5, column: 0 }, end: { line: 10, column: 5 } },
			});

			const result = filterQuestions([q], {
				range: { start: 11, end: 20 },
			});
			expect(result).toHaveLength(0);
		});

		it('keeps a question that partially overlaps the range', () => {
			const q = makeQuestion({
				location: { start: { line: 5, column: 0 }, end: { line: 10, column: 5 } },
			});

			const result = filterQuestions([q], {
				range: { start: 8, end: 12 },
			});
			expect(result).toHaveLength(1);
		});
	});

	// ─── Register filter ────────────────────────────────────

	describe('register filter', () => {
		it('removes comparative entries from questions array', () => {
			const q = makeQuestion({
				questions: [
					{ register: 'open', text: 'open question?' },
					{ register: 'comparative', text: 'comparative question?' },
				],
			});

			const result = filterQuestions([q], {
				register: { comparative: false },
			});
			expect(result).toHaveLength(1);
			expect(result[0]!.questions).toHaveLength(1);
			expect(result[0]!.questions[0]!.register).toBe('open');
		});

		it('removes the entire CodeQuestion if all entries are pruned', () => {
			const q = makeQuestion({
				questions: [
					{ register: 'comparative', text: 'only comparative' },
				],
			});

			const result = filterQuestions([q], {
				register: { comparative: false },
			});
			expect(result).toHaveLength(0);
		});

		it('keeps the CodeQuestion with remaining entries when some survive', () => {
			const q = makeQuestion({
				questions: [
					{ register: 'open', text: 'open question?' },
					{ register: 'pointed', text: 'pointed question?' },
					{ register: 'comparative', text: 'comparative question?' },
				],
			});

			const result = filterQuestions([q], {
				register: { comparative: false },
			});
			expect(result).toHaveLength(1);
			expect(result[0]!.questions).toHaveLength(2);
		});
	});

	// ─── Count cap ──────────────────────────────────────────

	describe('count cap', () => {
		it('caps the result at the given count', () => {
			const q1 = makeQuestion({ id: 'q1' });
			const q2 = makeQuestion({ id: 'q2' });
			const q3 = makeQuestion({ id: 'q3' });

			const result = filterQuestions([q1, q2, q3], { count: 2 });
			expect(result).toHaveLength(2);
		});

		it('count 0 means no limit', () => {
			const q1 = makeQuestion({ id: 'q1' });
			const q2 = makeQuestion({ id: 'q2' });
			const q3 = makeQuestion({ id: 'q3' });

			const result = filterQuestions([q1, q2, q3], { count: 0 });
			expect(result).toHaveLength(3);
		});
	});

	// ─── Sorting ────────────────────────────────────────────

	describe('sorting', () => {
		it('sorts questions by start line ascending', () => {
			const late = makeQuestion({
				id: 'late',
				location: { start: { line: 10, column: 0 }, end: { line: 10, column: 5 } },
			});
			const early = makeQuestion({
				id: 'early',
				location: { start: { line: 2, column: 0 }, end: { line: 2, column: 5 } },
			});
			const mid = makeQuestion({
				id: 'mid',
				location: { start: { line: 5, column: 0 }, end: { line: 5, column: 5 } },
			});

			// Pass in unsorted order
			const result = filterQuestions([late, early, mid], {});
			expect(result[0]!.id).toBe('early');
			expect(result[1]!.id).toBe('mid');
			expect(result[2]!.id).toBe('late');
		});
	});

	// ─── Combined filters ───────────────────────────────────

	describe('combined filters (AND between groups)', () => {
		it('a question must pass ALL filter groups', () => {
			const q = makeQuestion({
				kind: 'micro-decision',
				feature: 'variables',
				category: 'voice',
			});

			// Passes kind, fails feature
			const result = filterQuestions([q], {
				kind: { microDecision: true },
				features: { variables: false },
			});
			expect(result).toHaveLength(0);
		});
	});
});
