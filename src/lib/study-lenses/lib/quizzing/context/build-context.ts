/**
 * @file `buildContext` — Phase 2 of the quizzing pipeline (see `../DOCS.md`
 * § Execution phases). Assembles the single read-only bundle every generator
 * receives: the pre-computed `classified` token stream and the per-node
 * identifier-anchor stream from one AST descent. The chokepoint that owns "what a
 * generator sees" — later forms' binding / scope views join this bundle here.
 */

import type { Node } from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { Snippet } from '../../../embody/types.js';
import type { ClassifiedToken } from '../../classifying/types.js';

import descendIdentifiers from './descend-identifiers.js';
import type { GenerationContext } from './types.js';

/**
 * Build the generation context for a parsed snippet and its classified tokens:
 * the `classified` stream passed through, plus the `identifierAnchors` stream
 * collected in a single AST descent. The returned bundle is deeply frozen.
 *
 * @remarks
 * - **Precondition:** a parsed snippet. The caller (`generateQuiz`) sits behind
 *   the parse gate, so a missing AST here is a caller bug to surface — this
 *   throws, mirroring `generateQuiz`'s gate and the sibling `readScopeForest`.
 * - **One AST descent.** The per-node anchor stream is collected once, here;
 *   generators consume the stream rather than re-walking the AST.
 * - **Pure / frozen / deterministic.** The freshly-collected anchors are
 *   deep-frozen and the bundle is frozen; `classified` arrives already
 *   deep-frozen from `classifyTokens`, so it is borrowed by reference, not
 *   re-frozen (freeze what you build).
 *
 * @throws Error when the snippet is unparsed (no AST).
 */
export default function buildContext(
	snippet: Snippet,
	classified: readonly ClassifiedToken[],
): GenerationContext {
	const identifierAnchors = deepFreezeInPlace(
		descendIdentifiers(readParsedAst(snippet)),
	);
	const context: GenerationContext = { classified, identifierAnchors };
	return Object.freeze(context);
}

/** Accessor seam (Class A): the parsed AST, or throw if the snippet is unparsed. */
function readParsedAst(snippet: Snippet): Node {
	const ast: Node | null =
		snippet.status.parsed && snippet.raw.ast ? snippet.raw.ast : null;
	if (ast === null) {
		throw new Error(
			'buildContext requires a parsed snippet: status.parsed must be true and raw.ast present',
		);
	}
	return ast;
}
