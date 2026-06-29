/**
 * Pure tests for the quiz lens's mastery fold (`quizCore.masteryFold`, inc 5).
 * No jsdom — the fold is a pure reducer `(prior, item, verdict) → MasteryState`,
 * keyed per `groupKey`. Fixtures are real V1 items from `buildQuiz` and real
 * verdicts from `gradeOption`, so the fold is exercised against the live
 * `lib/quizzing` contract, not hand-rolled literals. The two-channel decoration
 * that renders this state is wired in `index.tsx` and verified at the 🔍 sandbox
 * checkpoint (the paint needs a real browser; jsdom can't lay out CodeMirror).
 */

import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import quizCore from '../core.js';
import buildQuiz from '../lib/build-quiz.js';
import gradeOption from '../lib/grade-option.js';
import type { MasteryState } from '../types.js';

describe('masteryFold — fold a graded verdict into MasteryState', () => {
	// `let x = 1; x;` → V1 items. The two `x` tokens are role-less identifiers, so
	// both carry the bare groupKey `category:identifier` (see
	// `lib/quizzing/keying/classification-group-key.ts`); `let` is the keyword item
	// on `category:keyword`. Real items + real verdicts ground the fold in the live
	// contract.
	const items = buildQuiz(embody('let x = 1; x;'))?.items ?? [];
	const identifierItem = items.find((item) =>
		item.answerOptionIds.includes('identifier'),
	);
	const keywordItem = items.find((item) =>
		item.answerOptionIds.includes('keyword'),
	);

	it('the fixture yields the identifier V1 item on category:identifier (guard)', () => {
		expect(identifierItem?.groupKey).toBe('category:identifier');
	});

	it('the fixture yields the keyword V1 item on category:keyword (guard)', () => {
		expect(keywordItem?.groupKey).toBe('category:keyword');
	});

	// ── Z — zero / new group ────────────────────────────────────

	it('a first correct answer accrues progress one step on the item groupKey', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const next = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		expect(next).toEqual({
			[identifierItem.groupKey]: { progress: 0.25, wrong: false },
		});
	});

	it('a first incorrect answer marks the new group wrong at zero progress', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const next = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'keyword'),
		);
		expect(next).toEqual({
			[identifierItem.groupKey]: { progress: 0, wrong: true },
		});
	});

	// ── O — one more step ───────────────────────────────────────

	it('a correct answer on an existing group accrues one more step', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const correct = gradeOption(identifierItem, 'identifier');
		const afterFirst = quizCore.masteryFold({}, identifierItem, correct);
		const afterSecond = quizCore.masteryFold(
			afterFirst,
			identifierItem,
			correct,
		);
		expect(afterSecond).toEqual({
			[identifierItem.groupKey]: { progress: 0.5, wrong: false },
		});
	});

	// ── M — many / monotonic saturation ─────────────────────────

	it('saturates progress at 1 after four correct answers and never exceeds it', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const correct = gradeOption(identifierItem, 'identifier');
		let state: MasteryState = {};
		for (const verdict of [correct, correct, correct, correct, correct]) {
			state = quizCore.masteryFold(state, identifierItem, verdict);
		}
		expect(state[identifierItem.groupKey].progress).toBe(1);
	});

	// ── B — boundaries / two-channel interaction ────────────────

	it('an incorrect answer sets wrong and leaves progress unchanged (monotonic)', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const correct = gradeOption(identifierItem, 'identifier');
		let atThreeQuarters: MasteryState = {};
		for (const verdict of [correct, correct, correct]) {
			atThreeQuarters = quizCore.masteryFold(
				atThreeQuarters,
				identifierItem,
				verdict,
			);
		}
		const afterWrong = quizCore.masteryFold(
			atThreeQuarters,
			identifierItem,
			gradeOption(identifierItem, 'keyword'),
		);
		expect(afterWrong).toEqual({
			[identifierItem.groupKey]: { progress: 0.75, wrong: true },
		});
	});

	it('a correct answer clears the wrong flag and accrues (re-mastery)', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const correct = gradeOption(identifierItem, 'identifier');
		const incorrect = gradeOption(identifierItem, 'keyword');
		let wrongAtHalf: MasteryState = {};
		for (const verdict of [correct, correct, incorrect]) {
			wrongAtHalf = quizCore.masteryFold(wrongAtHalf, identifierItem, verdict);
		}
		const reMastered = quizCore.masteryFold(
			wrongAtHalf,
			identifierItem,
			correct,
		);
		expect(reMastered).toEqual({
			[identifierItem.groupKey]: { progress: 0.75, wrong: false },
		});
	});

	// ── I — interface / malformed no-op + independence ──────────

	it('a malformed verdict is a no-op — returns the prior state by reference', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const prior = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		const afterMalformed = quizCore.masteryFold(
			prior,
			identifierItem,
			gradeOption(identifierItem, 'not-a-category'),
		);
		expect(afterMalformed).toBe(prior);
	});

	it('accumulates two distinct groups independently', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		if (keywordItem === undefined) throw new Error('no keyword fixture item');
		const afterId = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		const afterBoth = quizCore.masteryFold(
			afterId,
			keywordItem,
			gradeOption(keywordItem, 'keyword'),
		);
		expect(afterBoth).toEqual({
			[identifierItem.groupKey]: { progress: 0.25, wrong: false },
			[keywordItem.groupKey]: { progress: 0.25, wrong: false },
		});
	});

	// ── E — exceptions / immutability ───────────────────────────

	it('returns a frozen MasteryState', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const next = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		expect(Object.isFrozen(next)).toBe(true);
	});

	it('freezes each GroupMastery entry', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const next = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		expect(Object.isFrozen(next[identifierItem.groupKey])).toBe(true);
	});

	it('does not mutate the prior state when folding a different group', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		if (keywordItem === undefined) throw new Error('no keyword fixture item');
		const prior = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		const priorGroup = prior[identifierItem.groupKey];
		quizCore.masteryFold(
			prior,
			keywordItem,
			gradeOption(keywordItem, 'keyword'),
		);
		expect(prior[identifierItem.groupKey]).toBe(priorGroup);
	});

	// ── S — strings / keying ────────────────────────────────────

	it('keys mastery on the item groupKey, never the item id', () => {
		if (identifierItem === undefined) throw new Error('no fixture item');
		const next = quizCore.masteryFold(
			{},
			identifierItem,
			gradeOption(identifierItem, 'identifier'),
		);
		expect(Object.keys(next)).toEqual([identifierItem.groupKey]);
	});
});
