/**
 * @file `buildContext` — Phase 2 of the quizzing pipeline (see `../DOCS.md`
 * § Execution phases). Assembles the single read-only bundle every generator
 * receives: the pre-computed `classified` token stream and the two anchor streams
 * (`identifierAnchors` + `propertyAccessAnchors`) from one AST descent. The
 * chokepoint that owns "what a generator sees" — later forms' binding / scope views
 * join this bundle here.
 */

import type { Node } from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { Snippet } from '../../../../embody/types.js';
import type { ClassifiedToken } from '../../classifying/types.js';
import readScopeForest from '../resolving/read-scope-forest.js';

import descendIdentifiers from './descend-identifiers.js';
import type { GenerationContext } from './types.js';

/**
 * Build the generation context for a parsed snippet and its classified tokens:
 * the `classified` stream passed through, the two anchor streams
 * (`identifierAnchors` + `propertyAccessAnchors`) collected in a single AST
 * descent, and the lexical scope `forest` the binding-aware generators resolve
 * through. The returned bundle is frozen.
 *
 * @remarks
 * - **Precondition:** a parsed snippet. The caller (`generateQuiz`) sits behind
 *   the parse gate, so a missing AST here is a caller bug to surface — both this
 *   accessor and `readScopeForest` throw on it, mirroring `generateQuiz`'s gate.
 * - **One AST descent.** The two per-node anchor streams are collected once, here;
 *   generators consume the streams rather than re-walking the AST. The scope
 *   `forest` is a separate Class-B read (`readScopeForest` → `buildScope`),
 *   answering a different question than the descent.
 * - **Pure / frozen / deterministic.** Each of the two freshly-collected anchor
 *   streams is deep-frozen and the bundle is frozen; `classified` (from
 *   `classifyTokens`) and `forest` (from `buildScope`) arrive already deep-frozen,
 *   so they are borrowed by reference, not re-frozen (freeze what you build).
 *
 * @throws Error when the snippet is unparsed (no AST).
 */
export default function buildContext(
	snippet: Snippet,
	classified: readonly ClassifiedToken[],
): GenerationContext {
	const { identifierAnchors, propertyAccessAnchors } = descendIdentifiers(
		readParsedAst(snippet),
	);
	const context: GenerationContext = {
		classified,
		identifierAnchors: deepFreezeInPlace(identifierAnchors),
		propertyAccessAnchors: deepFreezeInPlace(propertyAccessAnchors),
		forest: readScopeForest(snippet),
	};
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
