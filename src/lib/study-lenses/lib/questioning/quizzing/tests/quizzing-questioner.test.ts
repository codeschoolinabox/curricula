// cspell:ignore quizzing socratizing

import { describe, expect, it } from 'vitest';

import embody from '../../../../embody/index.js';
import type { Embodiment } from '../../../../embody/types.js';
import classifyTokens from '../../../classifying/classify-tokens.js';
import generateQuiz from '../generate-quiz.js';
import grade from '../grade.js';
import quizzingQuestioner from '../quizzing-questioner.js';

function withFailedStage(
	embodiment: Embodiment,
	stage: 'tokens' | 'environment',
): Embodiment {
	return {
		...embodiment,
		facts: {
			...embodiment.facts,
			[stage]: {
				ok: false,
				cause: { stage, message: `${stage} exploded`, offset: 3 },
			},
		},
	};
}

describe('quizzingQuestioner', () => {
	it('names itself quizzing', () => {
		expect(quizzingQuestioner.name).toBe('quizzing');
	});

	describe('serves', () => {
		it('serves a parseable snippet', () => {
			expect(quizzingQuestioner.serves(embody('let x = 1;').facts)).toBe(true);
		});

		it('declines facts whose tokens failed', () => {
			expect(
				quizzingQuestioner.serves(
					withFailedStage(embody('let x = 1;'), 'tokens').facts,
				),
			).toBe(false);
		});

		it('declines facts whose ast failed', () => {
			expect(quizzingQuestioner.serves(embody('let = ;').facts)).toBe(false);
		});

		it('declines facts whose environment failed', () => {
			expect(
				quizzingQuestioner.serves(
					withFailedStage(embody('let x = 1;'), 'environment').facts,
				),
			).toBe(false);
		});
	});

	describe('ask', () => {
		it('answers a parseable embodiment with items', () => {
			const answer = quizzingQuestioner.ask(embody('let x = 5;'));
			expect(answer.ok && answer.items.length > 0).toBe(true);
		});

		it('refuses the same embodiment serves declined', () => {
			const declined = withFailedStage(embody('let x = 1;'), 'environment');
			expect([
				quizzingQuestioner.serves(declined.facts),
				quizzingQuestioner.ask(declined).ok,
			]).toEqual([false, false]);
		});

		it("refuses an unparseable embodiment with the parser's cause", () => {
			expect(quizzingQuestioner.ask(embody('let = ;'))).toMatchObject({
				ok: false,
				error: { message: expect.any(String) },
			});
		});

		it("carries the engine's own grade on the answer", () => {
			const answer = quizzingQuestioner.ask(embody('let x = 5;'));
			expect(answer.ok ? answer.grade : null).toBe(grade);
		});

		it('delegates generation to the engine deterministically', () => {
			// PINNED(adapter-only — Stage-3 design, DOCS § Structural
			// constraints + the human-approved plan's envelope spec,
			// 2026-08-18/19: ask is exactly classify → generateQuiz →
			// ok-wrap; logic beyond that seam needs a ruling)
			const embodiment = embody('let x = 5; x;');
			const { facts } = embodiment;
			const independentlyClassified =
				facts.source.ok && facts.tokens.ok && facts.ast.ok
					? classifyTokens({
							code: facts.source.value,
							tokens: facts.tokens.value.tokens,
							ast: facts.ast.value,
						})
					: [];
			const answer = quizzingQuestioner.ask(embodiment);
			expect(answer.ok ? answer.items : null).toEqual(
				generateQuiz(facts, independentlyClassified),
			);
		});

		it('sits in front of an engine that throws on the same defected facts', () => {
			const defected = withFailedStage(embody('let x = 1;'), 'environment');
			expect(() => generateQuiz(defected.facts, [])).toThrow();
		});

		it('refuses that same defected embodiment as data instead', () => {
			const defected = withFailedStage(embody('let x = 1;'), 'environment');
			expect(quizzingQuestioner.ask(defected).ok).toBe(false);
		});

		it('treats config as an accepted no-op', () => {
			const embodiment = embody('let x = 5;');
			const configured = quizzingQuestioner.ask(embodiment, { count: 3 });
			const bare = quizzingQuestioner.ask(embodiment);
			expect(configured.ok ? configured.items : null).toEqual(
				bare.ok ? bare.items : undefined,
			);
		});
	});

	describe('envelope', () => {
		it('is frozen', () => {
			expect(Object.isFrozen(quizzingQuestioner)).toBe(true);
		});
	});
});
