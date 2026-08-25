/**
 * @file The `generateQuiz` public export — the quizzing module's content entry
 * point. Runs the registered generators over parsed facts and their
 * pre-computed classified tokens through the gate → context → run → freeze
 * pipeline, and returns a frozen array of auto-gradable `QuizItem`s in
 * registry order, then stream order. See `./README.md` for the bounded context
 * and `./DOCS.md` for the pipeline this file realizes.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { Facts } from '../../../embody/types.js';
import type { ClassifiedToken } from '../../classifying/types.js';

import buildContext from './context/build-context.js';
import GENERATORS from './generators/registry.js';
import runGenerators from './run-generators.js';
import type { QuizFilter, QuizItem } from './types.js';

/**
 * Generate the auto-gradable quiz items for parsed facts.
 *
 * The pipeline gates on coherent inputs, establishes the generation context (a
 * single AST descent → per-node anchor streams, joined by the scope forest),
 * runs the registered generators over their anchor-typed streams, and returns
 * the deeply-frozen items in registry order, then stream order — deliberately
 * not source order.
 *
 * @remarks
 * - **Throws** on null, unparsed, or environment-defected input: `generateQuiz`
 *   is called behind its caller's gate (the token, tree, and environment stages
 *   all ok), and a valid `classified` already implies a successful parse, so a
 *   failed stage here is a caller bug to surface (the same posture as the
 *   sibling `classifyTokens`). The environment conjunct is a declared port
 *   widening (AR-2 resolution, 2026-08-18): the prior architecture's scope walk
 *   could not fail on parsed input, while the environment stage can — gating it
 *   keeps the entry total over its widened input surface. This gate is the only
 *   throw reachable through the entry.
 * - **Pure / deterministic / frozen.** No mutation of `facts` or `classified`
 *   (safe on deep-frozen embodiment data); same inputs, same output.
 * - The `filter` parameter is part of the locked contract but is **not yet
 *   consumed** — building the filter is a recorded future design event. It is
 *   accepted and ignored here (no-op), not forgotten.
 *
 * @throws Error when a stage is not ok or `classified` is absent — see
 *   `assertParsed`.
 */
export default function generateQuiz(
	facts: Facts,
	classified: readonly ClassifiedToken[],
	_filter?: QuizFilter,
): readonly QuizItem[] {
	assertParsed(facts, classified);
	const context = buildContext(facts, classified);
	const items = runGenerators(context, GENERATORS);
	return deepFreezeInPlace(items);
}

/**
 * The gate (the only throw reachable through the entry — the context and
 * forest helpers mirror this precondition defensively, unreachable behind
 * it). Coherent inputs are the precondition for generation: the token, tree,
 * and environment stages all ok, and a present `classified` array. The stage
 * reads stay inside this accessor — never inline in the pipeline. The AST is
 * consumed downstream by the generation context (`buildContext`'s single
 * descent); the gate's job is only to surface a caller that invoked
 * `generateQuiz` off its gate, before the context dereferences the `ast`
 * stage.
 */
function assertParsed(
	facts: Facts,
	classified: readonly ClassifiedToken[],
): void {
	const hasOkStages = facts.tokens.ok && facts.ast.ok && facts.environment.ok;
	const hasClassified = classified !== null && classified !== undefined;
	if (!hasOkStages || !hasClassified) {
		throw new Error(
			'generateQuiz requires parsed facts and classified tokens: the tokens, ast, and environment stages must all be ok',
		);
	}
}
