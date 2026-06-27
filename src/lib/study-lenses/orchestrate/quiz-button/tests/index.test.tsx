// @vitest-environment jsdom

import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CodeQuestion } from '../../lib/socratizing/types.js';
import QuizButton from '../index.js';

afterEach(cleanup);

// The component reads only `id` (render key) and `context` (node text); the
// rest of the CodeQuestion contract is irrelevant to presentation, so a minimal
// stand-in keeps each render's `questions` prop inline and readable.
function makeQuestion(id: string): CodeQuestion {
	return { id, context: `context for ${id}` } as unknown as CodeQuestion;
}

describe('QuizButton', () => {
	describe('Zero — the button shell', () => {
		it('renders the quiz button', () => {
			const { container } = render(
				<QuizButton questions={null} generating={false} onQuiz={() => {}} />,
			);
			expect(
				container.querySelector('[data-orchestrator-quiz]'),
			).not.toBeNull();
		});

		it('labels the quiz button for assistive technology', () => {
			const { container } = render(
				<QuizButton questions={null} generating={false} onQuiz={() => {}} />,
			);
			expect(
				container
					.querySelector('[data-orchestrator-quiz]')
					?.getAttribute('aria-label'),
			).toBeTruthy();
		});

		it('renders no question nodes before the first run (questions null)', () => {
			const { container } = render(
				<QuizButton questions={null} generating={false} onQuiz={() => {}} />,
			);
			expect(
				container.querySelectorAll('[data-orchestrator-quiz-question]'),
			).toHaveLength(0);
		});

		it('always mounts the surface container, even before the first run', () => {
			const { container } = render(
				<QuizButton questions={null} generating={false} onQuiz={() => {}} />,
			);
			expect(
				container.querySelector('[data-orchestrator-quiz-questions]'),
			).not.toBeNull();
		});

		it('renders no question nodes for an empty run (questions [])', () => {
			const { container } = render(
				<QuizButton questions={[]} generating={false} onQuiz={() => {}} />,
			);
			expect(
				container.querySelectorAll('[data-orchestrator-quiz-question]'),
			).toHaveLength(0);
		});
	});

	describe('One — a single question', () => {
		it('renders the question-surface container when questions are present', () => {
			const { container } = render(
				<QuizButton
					questions={[makeQuestion('q1')]}
					generating={false}
					onQuiz={() => {}}
				/>,
			);
			expect(
				container.querySelector('[data-orchestrator-quiz-questions]'),
			).not.toBeNull();
		});

		it('renders one question when handed a single question', () => {
			const { container } = render(
				<QuizButton
					questions={[makeQuestion('q1')]}
					generating={false}
					onQuiz={() => {}}
				/>,
			);
			expect(
				container.querySelectorAll('[data-orchestrator-quiz-question]'),
			).toHaveLength(1);
		});
	});

	describe('Many — several questions', () => {
		it('renders many questions when handed several', () => {
			const { container } = render(
				<QuizButton
					questions={[
						makeQuestion('q1'),
						makeQuestion('q2'),
						makeQuestion('q3'),
					]}
					generating={false}
					onQuiz={() => {}}
				/>,
			);
			expect(
				container.querySelectorAll('[data-orchestrator-quiz-question]'),
			).toHaveLength(3);
		});
	});

	describe('Boundary — the generating busy state', () => {
		it('shows a busy affordance while generating', () => {
			const { container } = render(
				<QuizButton questions={null} generating={true} onQuiz={() => {}} />,
			);
			expect(
				container.querySelector<HTMLButtonElement>('[data-orchestrator-quiz]')
					?.disabled,
			).toBe(true);
		});

		it('is not busy when not generating', () => {
			const { container } = render(
				<QuizButton questions={null} generating={false} onQuiz={() => {}} />,
			);
			expect(
				container.querySelector<HTMLButtonElement>('[data-orchestrator-quiz]')
					?.disabled,
			).toBe(false);
		});
	});

	describe('Interface — routing the click', () => {
		it('routes a button click up through onQuiz once', () => {
			const onQuiz = vi.fn();
			const { container } = render(
				<QuizButton questions={null} generating={false} onQuiz={onQuiz} />,
			);
			fireEvent.click(container.querySelector('[data-orchestrator-quiz]')!);
			expect(onQuiz).toHaveBeenCalledTimes(1);
		});
	});
});
