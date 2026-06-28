/**
 * @file The quiz lens's model builder — the single Acorn re-parse site. Parses
 * the snippet, delegates token classification to `lib/classifying`, and (inc 3)
 * runs `generateQuiz` filtered to the V1 form. Returns the quiz model the
 * wrapper drives, or `null` on an internal parse failure (defense-in-depth —
 * the `status.parsed` gate should already have prevented the mount). Pure:
 * no React, no CodeMirror.
 *
 * Inc 2 builds only the `classified` anchor stream (the click → highlight needs
 * it); inc 3 widens the model with the V1 `items` (see `./README.md` § Form
 * scoping) — an additive change, not a re-shape.
 */

import * as acorn from 'acorn';

import freezeInPlace from '@utils/freeze-in-place.js';

import classifyTokens from '../../../lib/classifying/classify-tokens.js';
import type { ClassifiedToken } from '../../../lib/classifying/types.js';
import generateQuiz from '../../../lib/quizzing/generate-quiz.js';
import type { McqQuizItem } from '../../../lib/quizzing/types.js';
import type { Snippet } from '../../types.js';

/**
 * The quiz model the wrapper consumes: the classified anchor stream (for click
 * resolution) and the V1 quiz items (one per token; for the panel).
 */
type QuizModel = Readonly<{
	classified: readonly ClassifiedToken[];
	items: readonly McqQuizItem[];
}>;

/**
 * Builds the quiz model from a parseable snippet. Re-parses the source with
 * Acorn (collecting the token stream), hands `{ code, tokens, ast }` to
 * `classifyTokens`, and returns `{ classified }`. Returns `null` on a parse
 * failure (caught before classify — `classifyTokens` throws on null inputs).
 *
 * @param snippet - The frozen embodiment (read for `source.code`; inc 3 also
 *   passes the whole snippet to `generateQuiz`).
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

	// `generateQuiz` runs the full generator registry (V1 + V7 + V8 today), so
	// its output is a mixed-form stream. Slice A scopes to the single V1
	// category-ID form (see `./README.md` § Form scoping): `mode === 'mcq'`
	// narrows the union to `McqQuizItem`, and `form === 'V1'` excludes V7 (also
	// mcq) and V8 (click-token). The pair is the type-safe, V1-isolating filter.
	const items = generateQuiz(snippet, classified).filter(
		(item): item is McqQuizItem => item.mode === 'mcq' && item.form === 'V1',
	);

	// `classified` + the V1 items are already deep-frozen upstream; freeze the
	// wrapper so the whole returned model is immutable at the function boundary.
	return freezeInPlace({ classified, items });
}

export default buildQuiz;
