/**
 * Pure tests for the quiz lens's model builder (`buildQuiz`). No jsdom — it
 * parses with Acorn and delegates to `classifyTokens`. Inc 2 locks the
 * `classified` production (the click → anchor stream); the V1 `items` field is
 * added + tested in inc 3 (see `./README.md` § Form scoping).
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

	describe('items — the V1 quiz questions', () => {
		// A real-composition snippet with `x` declared AND referenced, so the
		// quizzing registry's V7 (usage-kind, per identifier occurrence) and V8
		// (declaration-site, on references) BOTH fire — without the `form === 'V1'`
		// filter, items would exceed classified.length. (embody('OK') has a STUB
		// AST with body:[], so V7/V8 emit nothing and the filter is untestable —
		// AR-3 inc-3 blocker.)
		const CODE = 'let x = 1; x;';

		it('emits one V1 item per classified token (V1 filter removes V7/V8)', () => {
			const model = buildQuiz(embody(CODE));
			const classified = model?.classified ?? [];
			const items = model?.items ?? [];
			expect(items.length).toBe(classified.length);
		});

		it('every item is the V1 category-ID form: mcq, 5 options, the V1 prompt', () => {
			const items = buildQuiz(embody(CODE))?.items ?? [];
			expect(items.length).toBeGreaterThan(0);
			const allV1 = items.every(
				(item) =>
					item.form === 'V1' &&
					item.mode === 'mcq' &&
					item.options.length === 5 &&
					item.prompt === 'What kind of syntax element is this?',
			);
			expect(allV1).toBe(true);
		});

		it('each item anchors to a classified token range (V1 form-scope, no V7/V8)', () => {
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
