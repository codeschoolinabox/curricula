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
import type { Snippet } from '../../types.js';

/**
 * The quiz model the wrapper consumes. Inc 2: the classified anchor stream.
 * Inc 3 adds `items: readonly McqQuizItem[]` (V1-filtered).
 */
type QuizModel = Readonly<{
	classified: readonly ClassifiedToken[];
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
	// `classified` is already deep-frozen by classifyTokens; freeze the wrapper
	// so the whole returned model is immutable at the function boundary.
	return freezeInPlace({ classified });
}

export default buildQuiz;
