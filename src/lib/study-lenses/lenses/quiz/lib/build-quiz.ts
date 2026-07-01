/**
 * @file The quiz lens's model builder — the single Acorn re-parse site. Parses
 * the snippet, delegates token classification to `lib/classifying`, runs
 * `generateQuiz`, and filters the mixed-mode stream by `item.mode` (the staged
 * inc-6 filter — `mcq` + `click-token` + `select-in-code`; see `./README.md`
 * § Form scoping). Returns the quiz model the wrapper drives, or `null` on an
 * internal parse failure (defense-in-depth — the `status.parsed` gate should
 * already have prevented the mount). Pure: no React, no CodeMirror.
 *
 * The filter is a plain boolean predicate (not a type-predicate), so the kept
 * `items` stay the wide `QuizItem` union — the panel discriminates on `mode`,
 * not the filter.
 */

import * as acorn from 'acorn';

import freezeInPlace from '@utils/freeze-in-place.js';

import classifyTokens from '../../../lib/classifying/classify-tokens.js';
import type { ClassifiedToken } from '../../../lib/classifying/types.js';
import generateQuiz from '../../../lib/quizzing/generate-quiz.js';
import type { QuizItem } from '../../../lib/quizzing/types.js';
import type { Snippet } from '../../types.js';

/**
 * The quiz model the wrapper consumes: the classified anchor stream (for click
 * resolution) and the admitted quiz items — the mcq forms co-anchored across the
 * snippet (the panel resolves a picked range to its bundle via `itemsAt`).
 */
type QuizModel = Readonly<{
	classified: readonly ClassifiedToken[];
	items: readonly QuizItem[];
}>;

/**
 * Builds the quiz model from a parseable snippet. Re-parses the source with
 * Acorn (collecting the token stream), hands `{ code, tokens, ast }` to
 * `classifyTokens`, calls `generateQuiz`, filters by `item.mode`, and returns
 * `{ classified, items }`. Returns `null` on a parse failure (caught before
 * classify — `classifyTokens` throws on null inputs).
 *
 * @param snippet - The frozen embodiment (read for `source.code`; passed whole
 *   to `generateQuiz`, which reads `raw.ast` behind its own seam).
 * @returns The quiz model, or `null` on internal parse failure.
 */
function buildQuiz(snippet: Snippet): QuizModel | null {
	// `generateQuiz` throws on an unparsed snippet, and the wrapper runs this in
	// a `useMemo` that fires UNCONDITIONALLY (before the render gate) — so gate
	// here too: an unparsed snippet yields no model (the wrapper renders the
	// fallback). This is the canonical `status.parsed` gate; the re-parse `null`
	// below is the defense-in-depth guard for the parsed-but-unparseable edge.
	if (!snippet.status.parsed) return null;

	const { code } = snippet.source;

	// Re-parse with Acorn (collecting the token stream) rather than consuming
	// `snippet.raw.{tokens,ast}` (nullable `RawAcorn` — consuming them needs a
	// narrowing cast; see `./README.md` § Future direction). Return `null` BEFORE
	// classify on a parse failure: `classifyTokens` throws on null inputs.
	const tokens: acorn.Token[] = [];
	let ast: acorn.Node;
	try {
		ast = acorn.parse(code, {
			ecmaVersion: 2022,
			sourceType: 'module',
			// eslint-disable-next-line functional/immutable-data -- local stream, never escapes
			onToken: (token) => tokens.push(token),
		});
	} catch {
		return null;
	}

	const classified = classifyTokens({ code, tokens, ast });

	// `generateQuiz` runs the full generator registry, so its output is a
	// mixed-mode stream. Inc 6 admits by `item.mode` (see `./README.md` § Form
	// scoping): `mcq` + `click-token` + `select-in-code` (the full 6c set). The
	// predicate is a plain boolean, not a type-predicate, so the kept array stays
	// the wide `QuizItem` union — the panel discriminates on `mode`, not the filter.
	const items = generateQuiz(snippet, classified).filter(
		(item) =>
			item.mode === 'mcq' ||
			item.mode === 'click-token' ||
			item.mode === 'select-in-code',
	);

	// `classified` + the V1 items are already deep-frozen upstream; freeze the
	// wrapper so the whole returned model is immutable at the function boundary.
	return freezeInPlace({ classified, items });
}

export default buildQuiz;
