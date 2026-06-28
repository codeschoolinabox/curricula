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
});
