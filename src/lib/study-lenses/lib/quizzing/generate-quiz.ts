/**
 * @file The `generateQuiz` public export — the quizzing module's content entry
 * point. Runs the registered generators over a parsed snippet and its
 * pre-computed classified tokens through the gate → context → run → freeze
 * pipeline, and returns a frozen, source-ordered array of auto-gradable
 * `QuizItem`s. See `./README.md` for the bounded context and `./DOCS.md` for the
 * pipeline this file realizes.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { Snippet } from '../../embody/types.js';
import type { ClassifiedToken } from '../classifying/types.js';

import buildContext from './context/build-context.js';
import GENERATORS from './generators/registry.js';
import runGenerators from './run-generators.js';
import type { QuizFilter, QuizItem } from './types.js';

/**
 * Generate the auto-gradable quiz items for a parsed snippet.
 *
 * The pipeline gates on a parsed snippet, establishes the generation context (a
 * single AST descent → per-node anchor streams), runs the registered generators
 * over their anchor-typed streams, and returns the source-ordered, deeply-frozen
 * items.
 *
 * @remarks
 * - **Throws** on null / unparsed input: `generateQuiz` is called behind the
 *   consumer's `status.parsed` gate, and a valid `classified` already implies a
 *   successful parse, so a missing AST here is a caller bug to surface (the same
 *   posture as the sibling `classifyTokens`). This is the module's only throw
 *   site.
 * - **Pure / deterministic / frozen.** No mutation of `snippet` or `classified`
 *   (safe on deep-frozen embodiment data); same inputs, same output.
 * - The `filter` parameter is part of the locked contract but is **not yet
 *   consumed** — post-generation filtering lands with its own increment. It is
 *   accepted and ignored here (no-op), not forgotten.
 *
 * @throws Error when the snippet is unparsed (no AST) — see `assertParsed`.
 */
export default function generateQuiz(
	snippet: Snippet,
	classified: readonly ClassifiedToken[],
	_filter?: QuizFilter,
): readonly QuizItem[] {
	assertParsed(snippet);
	const context = buildContext(snippet, classified);
	const items = runGenerators(context, GENERATORS);
	return deepFreezeInPlace(items);
}

/**
 * The gate (the module's only throw site). A parsed snippet is the precondition
 * for generation: `status.parsed` and a present `raw.ast`. Both are read through
 * the accessor seam — never inline. The AST is consumed downstream by the
 * generation context (`buildContext`'s single descent); the gate's job is only to
 * surface a caller that invoked `generateQuiz` off the parse gate, before the
 * context dereferences `raw.ast`.
 */
function assertParsed(snippet: Snippet): void {
	if (!isParsed(snippet) || readParsedAst(snippet) === null) {
		throw new Error(
			'generateQuiz requires a parsed snippet: status.parsed must be true and raw.ast present',
		);
	}
}

/** Accessor seam (Class A): is this snippet's source successfully parsed? */
function isParsed(snippet: Snippet): boolean {
	return snippet.status.parsed;
}

/** Accessor seam (Class A): the AST this snippet produced, or null if absent. */
function readParsedAst(snippet: Snippet): Snippet['raw']['ast'] {
	return snippet.raw.ast;
}
