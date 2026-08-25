// cspell:ignore quizzing socratizing

/**
 * @file The quizzing questioner — the closed register's leaf questioner:
 * the generator engine behind the family's `Questioner` envelope
 * (`../types.ts`). The envelope COMPOSES rather than aliases: `ask`
 * narrows the facts in lifecycle order, classifies once through the
 * sibling, calls the engine, and wraps the frozen
 * `{ ok: true, items, grade }` answer — the carried `grade` IS the
 * engine's own grading entry (identity-pinned in the test cluster).
 * `serves` mirrors ask's three narrows (token, tree, and environment
 * stages), so serves-false predicts exactly the inputs ask would refuse.
 * Where the engine throws (it sits behind its caller's gate), the
 * envelope refuses as data — the family's seam split (README § Public
 * API "Refusal vs throw"). Config is accepted and opaque today: no
 * `QuizzingConfig` field is consumed, and ask does not forward it to the
 * engine's declared no-op `filter` until one is (the engine no-op is
 * oracle-pinned; DOCS § Structural constraints).
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { Embodiment, Facts, StageCause } from '../../../embody/types.js';
import classifyTokens from '../../classifying/classify-tokens.js';
import type { Questioner, QuestionerRefusal } from '../types.js';

import generateQuiz from './generate-quiz.js';
import grade from './grade.js';
import type { QuizzingAnswer, QuizzingConfig } from './types.js';

const quizzingQuestioner = freezeInPlace({
	name: 'quizzing',
	serves: (facts: Facts) =>
		facts.tokens.ok && facts.ast.ok && facts.environment.ok,
	ask,
} satisfies Questioner<QuizzingAnswer, QuizzingConfig>);

export default quizzingQuestioner;

/**
 * The composing ask: narrow → classify → generate → ok-wrap. Exactly
 * those steps — analysis logic in the wrapper needs a ruling (the
 * adapter-only pin in the test cluster). The narrows run in lifecycle
 * order so the refusal carries the FIRST failed stage's cause.
 */
function ask(
	embodiment: Embodiment,
	_config?: QuizzingConfig,
): QuizzingAnswer | QuestionerRefusal {
	const { facts } = embodiment;
	if (!facts.tokens.ok) {
		return refusal(facts.tokens.cause);
	}
	if (!facts.ast.ok) {
		return refusal(facts.ast.cause);
	}
	if (!facts.environment.ok) {
		return refusal(facts.environment.cause);
	}

	const classified = classifyTokens({
		code: facts.source.value,
		tokens: facts.tokens.value.tokens,
		ast: facts.ast.value,
	});

	return freezeInPlace({
		ok: true as const,
		items: generateQuiz(facts, classified),
		grade,
	});
}

/**
 * Builds the frozen refusal from a failed stage's cause — the family's
 * pinned shape, duplicated from the socratizing engine's fold by law
 * (the parent exports no runtime; importing a sibling leaf is banned).
 */
function refusal(cause: StageCause): QuestionerRefusal {
	return freezeInPlace({
		ok: false as const,
		error: {
			message: cause.message,
			// Compared to `undefined`, not truthiness — offset 0 must survive.
			...(cause.offset === undefined ? {} : { offset: cause.offset }),
		},
	});
}
