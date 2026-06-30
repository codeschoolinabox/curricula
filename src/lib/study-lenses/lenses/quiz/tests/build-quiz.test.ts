/**
 * Pure tests for the quiz lens's model builder (`buildQuiz`). No jsdom — it
 * parses with Acorn and delegates to `classifyTokens`. Locks the `classified`
 * production (the click → anchor stream) and the `item.mode` filter that scopes
 * the panel's quiz items (`mcq` in inc 6a; see `./README.md` § Form scoping).
 */

import { describe, expect, it } from 'vitest';

import embody from '../../../embody/index.js';
import buildQuiz from '../lib/build-quiz.js';

describe('buildQuiz — quiz model builder', () => {
	it('returns null for an unparsed snippet (the status.parsed gate)', () => {
		// embody('FAIL_AT_PARSE') has status.parsed=false (its source happens to be
		// a parseable identifier) — buildQuiz must NOT call generateQuiz (which
		// throws on unparsed) and returns null so the wrapper shows the fallback.
		expect(buildQuiz(embody('FAIL_AT_PARSE'))).toBeNull();
	});

	it('returns null when the source is genuinely unparseable', () => {
		// NB: embody('FAIL_AT_PARSE') has status.parsed=false but a PARSEABLE
		// source ("FAIL_AT_PARSE" is a valid identifier) — the component gates on
		// status.parsed, so buildQuiz's null-return is the defense-in-depth guard
		// for genuinely-broken source. Override source.code to exercise it.
		const ok = embody('OK');
		const broken = {
			...ok,
			source: { ...ok.source, code: 'function (' },
		} as typeof ok;
		expect(buildQuiz(broken)).toBeNull();
	});

	it('returns a non-empty classified stream for a parseable snippet', () => {
		const classified = buildQuiz(embody('OK'))?.classified ?? [];
		expect(classified.length).toBeGreaterThan(0);
	});

	it('classified tokens are source-ascending and each text is its source slice', () => {
		const snippet = embody('OK');
		const classified = buildQuiz(snippet)?.classified ?? [];
		expect(classified.length).toBeGreaterThan(0);

		// Each token starts at or after the previous token's end (non-overlapping,
		// source-ascending). `slice(1)[i]` is `classified[i + 1]`.
		const ascending = classified
			.slice(1)
			.every((token, index) => token.start >= classified[index].end);
		expect(ascending).toBe(true);

		// Each token's `text` is exactly the source slice at its half-open range.
		const textMatches = classified.every(
			(token) =>
				snippet.source.code.slice(token.start, token.end) === token.text,
		);
		expect(textMatches).toBe(true);
	});

	describe('items — the admitted quiz questions (the mcq-mode filter)', () => {
		// A real-composition snippet with `x` declared AND referenced, so the
		// quizzing registry emits V1 (every token) plus the node-anchored mcq forms
		// V2/V6/V7 AND the code-answer forms V8 (click-token) / V10a-c
		// (select-in-code). Inc 6a admits by MODE — `mcq` only — so V8/V10 are
		// excluded while every mcq form (not just V1) reaches the panel, and the
		// kept array stays the wide `QuizItem` union. (embody('OK') has a STUB AST
		// with body:[], so only V1 fires and the widen is untestable — use this.)
		const CODE = 'let x = 1; x;';

		it('admits more than one item per token — the mcq forms co-anchor (the widen delta)', () => {
			const model = buildQuiz(embody(CODE));
			const classified = model?.classified ?? [];
			const items = model?.items ?? [];
			expect(items.length).toBeGreaterThan(classified.length);
		});

		it('every admitted item is mcq mode — no code-answer mode leaks through', () => {
			const items = buildQuiz(embody(CODE))?.items ?? [];
			expect(items.length).toBeGreaterThan(0);
			expect(items.every((item) => item.mode === 'mcq')).toBe(true);
		});

		it('admits structurally-distinct mcq forms beyond V1 — the filter is mode-based, not a V1/V7 allowlist', () => {
			// V2 (token-anchored keyword form) AND V7 (node-anchored usage-kind)
			// must BOTH reach the panel. A form allowlist that admitted only
			// `V1 || V7` would pass a V7-only check while silently dropping V2/V6 —
			// requiring both pins the predicate to `mode === 'mcq'`, not a form set.
			const forms =
				buildQuiz(embody(CODE))?.items.map((item) => item.form) ?? [];
			expect(forms).toEqual(expect.arrayContaining(['V2', 'V7']));
		});

		it('each admitted item anchors to a classified token range', () => {
			const model = buildQuiz(embody(CODE));
			const classified = model?.classified ?? [];
			const items = model?.items ?? [];
			const tokenKeys = new Set(
				classified.map((token) => `${token.start}-${token.end}`),
			);
			const allAnchored = items.every((item) =>
				tokenKeys.has(`${item.anchorRange[0]}-${item.anchorRange[1]}`),
			);
			expect(allAnchored).toBe(true);
		});
	});
});
