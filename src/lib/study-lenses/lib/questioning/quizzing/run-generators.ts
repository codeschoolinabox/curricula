/**
 * @file `runGenerators` — the run phase of the quizzing pipeline (DOCS § Execution
 * phases). Iterates the registered generators, selecting each one's stream from
 * the generation context by its anchor type, and flat-collects the emitted quiz
 * items. The run phase owns iteration; a generator declares only which stream it
 * binds to and what it builds per item — it never inspects anchor type beyond
 * that stream selection.
 */

import type { GenerationContext } from './context/types.js';
import type { Generator } from './generators/types.js';
import type { QuizItem } from './types.js';

/**
 * Run every generator over the context, returning the concatenated quiz items in
 * registry order, then stream order within each generator. Each generator's
 * stream is selected by its `anchorType`: `token` → the classified tokens,
 * `node` → the identifier anchors, `program` → the whole program once.
 */
export default function runGenerators(
	context: GenerationContext,
	generators: readonly Generator[],
): readonly QuizItem[] {
	return generators.flatMap((generator) => runGenerator(generator, context));
}

/**
 * Run one generator: select its stream from the context by anchor type and
 * flat-collect what it builds. The `program` arm has no stream — its `build`
 * runs once over the whole context. The run phase never inspects anchor type
 * beyond this selection.
 */
function runGenerator(
	generator: Generator,
	context: GenerationContext,
): readonly QuizItem[] {
	if (generator.anchorType === 'token') {
		return context.classified.flatMap((token) =>
			generator.build(token, context),
		);
	}
	if (generator.anchorType === 'node') {
		return context.identifierAnchors.flatMap((anchor) =>
			generator.build(anchor, context),
		);
	}
	return generator.build(context);
}
