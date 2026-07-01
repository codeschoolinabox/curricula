/**
 * Pure tests for the quiz lens's answer-handling transform (`gradeOption`). No
 * jsdom — it builds the mcq response from a clicked option id and delegates to
 * `lib/quizzing`'s `grade`. The fixtures are real V1 items from `buildQuiz`, so
 * the grade integration is exercised end-to-end (real item × real grade). The
 * full click→verdict UI path is verified at the 🔍 sandbox checkpoint (the
 * panel needs a CM click to open — jsdom can't lay out CodeMirror).
 */

import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import type { McqQuizItem } from '../../../lib/quizzing/types.js';
import buildQuiz from '../lib/build-quiz.js';
import gradeOption from '../lib/grade-option.js';

describe('gradeOption — answer → verdict', () => {
	// `let x = 1; x;` → V1 items; take the `x` identifier item. (A mode mismatch
	// can't be tested through the public signature — `gradeOption` requires an
	// McqQuizItem and always builds an mcq response — so only the unknown-id
	// malformed path is reachable here.)
	// `items` is the wide `QuizItem` union (build-quiz filters by mode, not to a
	// narrow type); narrow the lookup to the mcq form so `answerOptionIds` is typed.
	const items = buildQuiz(embody('let x = 1; x;'))?.items ?? [];
	const identifierItem = items.find(
		(item): item is McqQuizItem =>
			item.mode === 'mcq' && item.answerOptionIds.includes('identifier'),
	);

	it('the fixture yields an identifier V1 item (guard)', () => {
		expect(identifierItem).toBeDefined();
	});

	it('grades the correct option as correct', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const verdict = gradeOption(identifierItem, 'identifier');
		expect(verdict.status).toBe('correct');
	});

	it('grades a wrong option as incorrect', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const verdict = gradeOption(identifierItem, 'keyword');
		expect(verdict.status).toBe('incorrect');
	});

	it('grades an unknown option id as malformed (never throws)', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const verdict = gradeOption(identifierItem, 'not-a-category');
		expect(verdict.status).toBe('malformed');
	});

	it('the correct verdict carries the item feedback verbatim (not substituted)', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const verdict = gradeOption(identifierItem, 'identifier');
		if (verdict.status !== 'correct') throw new Error('expected correct');
		expect(verdict.feedback).toBe(identifierItem.feedback);
	});

	it('the incorrect verdict carries the item feedback verbatim (not substituted)', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const verdict = gradeOption(identifierItem, 'keyword');
		if (verdict.status !== 'incorrect') throw new Error('expected incorrect');
		expect(verdict.feedback).toBe(identifierItem.feedback);
	});
});
