/**
 * Pure tests for the quiz lens's code-surface answer transform (`gradeRanges`,
 * inc 6b). No jsdom — it builds the `click-token` / `select-in-code`
 * `LearnerResponse` from the ranges the learner staged and delegates to
 * `lib/quizzing`'s total `grade`. The fixture is a REAL V8 (click-token) item
 * from `generateQuiz` (not a hand-rolled literal), so the grade integration is
 * exercised against the live contract. The full click→stage→Confirm UI path is
 * verified at the 🔍 sandbox checkpoint (jsdom can't lay out CodeMirror).
 */

import * as acorn from 'acorn';
import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import classifyTokens from '../../../lib/classifying/classify-tokens.js';
import generateQuiz from '../../../lib/quizzing/generate-quiz.js';
import type { CodeSurfaceQuizItem } from '../../../lib/quizzing/types.js';
import gradeRanges from '../lib/grade-ranges.js';

// Local acorn → classifyTokens helper (the build-quiz recipe, inlined so this
// test does not depend on build-quiz's mode filter — V8 is a code-surface item
// build-quiz does not admit until 6b widens it, so pull it from generateQuiz).
function classify(code: string) {
	const tokens: acorn.Token[] = [];
	const ast = acorn.parse(code, {
		ecmaVersion: 2022,
		sourceType: 'module',
		onToken: (token) => tokens.push(token),
	});
	return classifyTokens({ code, tokens, ast });
}

describe('gradeRanges — code-surface answer → verdict', () => {
	// `let x = 1; x;` → V8 (click-token) fires on the REFERENCE `x` [11,12), with
	// targetRanges = [[4,5)] (the DECLARATION). A real generated item grounds the
	// grade in the live contract, not a fabricated shape.
	const code = 'let x = 1; x;';
	const all = generateQuiz(embody(code), classify(code));
	const v8 = all.find((item) => item.mode === 'click-token') as
		| CodeSurfaceQuizItem
		| undefined;

	it('the fixture yields a click-token V8 item targeting the declaration (guard)', () => {
		expect(v8?.mode).toBe('click-token');
		expect(v8?.targetRanges).toEqual([[4, 5]]);
	});

	// One — the exact target set grades correct.
	it('grades the exact target range as correct', () => {
		if (v8 === undefined) throw new Error('no V8 fixture item');
		expect(gradeRanges(v8, [[4, 5]]).status).toBe('correct');
	});

	// Many / Boundary — a non-target range grades incorrect (set-equality, not
	// membership: clicking the reference itself is wrong).
	it('grades a non-target range as incorrect', () => {
		if (v8 === undefined) throw new Error('no V8 fixture item');
		expect(gradeRanges(v8, [[11, 12]]).status).toBe('incorrect');
	});

	// Zero — an empty selection is incorrect, never malformed (a caller/UI bug is
	// the only path to malformed, and gradeRanges builds the matching-mode
	// response, so normal play never grades malformed).
	it('grades an empty selection as incorrect (not malformed)', () => {
		if (v8 === undefined) throw new Error('no V8 fixture item');
		expect(gradeRanges(v8, []).status).toBe('incorrect');
	});

	// Interface — the verdict carries the item feedback verbatim (not substituted),
	// on BOTH the correct and incorrect paths (parity with grade-option.test.ts).
	it('the correct verdict carries the item feedback verbatim', () => {
		if (v8 === undefined) throw new Error('no V8 fixture item');
		const verdict = gradeRanges(v8, [[4, 5]]);
		if (verdict.status !== 'correct') throw new Error('expected correct');
		expect(verdict.feedback).toBe(v8.feedback);
	});

	it('the incorrect verdict carries the item feedback verbatim', () => {
		if (v8 === undefined) throw new Error('no V8 fixture item');
		const verdict = gradeRanges(v8, [[11, 12]]);
		if (verdict.status !== 'incorrect') throw new Error('expected incorrect');
		expect(verdict.feedback).toBe(v8.feedback);
	});
});
