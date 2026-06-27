/**
 * @file `<QuizButton>` — the omnipresent region's generative affordance: a
 * button that asks the orchestrator to socratize the live program, plus the
 * surface that renders the resulting Socratic questions. **Presentation only.**
 * The orchestrator ([`../index.tsx`](../index.tsx)) owns the call into the real
 * socratizing library ([`../lib/socratizing/`](../lib/socratizing/)), the
 * `questions`/`generating` state slots, and the bus dispatch. This module
 * imports no `embody`, dispatches no bus events, and holds no orchestrator
 * state — it never sees the `Snippet`. It renders what it is handed and routes
 * the click up through `onQuiz`.
 *
 * Selector contract (locked — [`../README.md` § Data attributes](../README.md)):
 * `data-orchestrator-quiz` on the Quiz button itself. The question-render
 * surface is a Phase-1 presentational choice ("panel" stays reserved for the
 * phases panel): the surface container carries `data-orchestrator-quiz-questions`
 * and each rendered question carries `data-orchestrator-quiz-question`. Tests
 * anchor on these attributes and node counts, never on prose text.
 */

import React from 'react';

import type { CodeQuestion } from '../lib/socratizing/types.js';

type QuizButtonProperties = Readonly<{
	/**
	 * The socratize output to render, or `null` before the first run — the
	 * orchestrator supplies it from the real socratizing library. Both `null`
	 * (not yet run) and `[]` (ran, no questions) render an empty surface.
	 */
	readonly questions: readonly CodeQuestion[] | null;

	/** Whether a generation is in flight — drives the button's busy affordance. */
	readonly generating: boolean;

	/** Called when the learner clicks the Quiz button (a kick; takes no argument). */
	readonly onQuiz: () => void;
}>;

/**
 * Renders the Quiz button + the question-render surface. The button carries the
 * locked `data-orchestrator-quiz` selector and routes its click up through
 * `onQuiz`; while `generating` it shows a busy affordance and blocks re-entry.
 * The surface lists each handed question as a `data-orchestrator-quiz-question`
 * node (none before the first run, when `questions` is `null`).
 */
function QuizButton({
	questions,
	generating,
	onQuiz,
}: QuizButtonProperties): React.JSX.Element {
	return (
		<div>
			<button
				type="button"
				data-orchestrator-quiz
				aria-label="generate quiz questions about the program"
				disabled={generating}
				onClick={onQuiz}
			>
				{generating ? 'Generating…' : 'Quiz'}
			</button>
			<div data-orchestrator-quiz-questions>
				{(questions ?? []).map((question) => (
					<div key={question.id} data-orchestrator-quiz-question>
						{question.context}
					</div>
				))}
			</div>
		</div>
	);
}

export default QuizButton;
