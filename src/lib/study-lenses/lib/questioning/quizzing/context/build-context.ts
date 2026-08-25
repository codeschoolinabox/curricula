// cspell:ignore chokepoint

/**
 * @file `buildContext` — the generation-context phase of the quizzing
 * pipeline (see `../DOCS.md` § Execution phases). Assembles the single
 * read-only bundle every generator receives: the pre-computed `classified`
 * token stream and the two anchor streams (`identifierAnchors` +
 * `propertyAccessAnchors`) from one AST descent. The chokepoint that owns
 * "what a generator sees" — later forms' binding / scope views join this
 * bundle here.
 */

import type { Node } from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { Facts } from '../../../../embody/types.js';
import type { ClassifiedToken } from '../../../classifying/types.js';
import readScopeForest from '../resolving/read-scope-forest.js';

import descendIdentifiers from './descend-identifiers.js';
import type { GenerationContext } from './types.js';

/**
 * Build the generation context for parsed facts and their classified tokens:
 * the `classified` stream passed through, the two anchor streams
 * (`identifierAnchors` + `propertyAccessAnchors`) collected in a single AST
 * descent, and the lexical scope `forest` the binding-aware generators resolve
 * through. The returned bundle is frozen.
 *
 * @remarks
 * - **Precondition:** parsed facts. The caller (`generateQuiz`) sits behind
 *   the parse gate, so a failed `tokens` or `ast` stage here is a caller bug
 *   to surface — both this accessor and `readScopeForest` throw on it,
 *   mirroring `generateQuiz`'s gate.
 * - **One AST descent.** The two per-node anchor streams are collected once, here;
 *   generators consume the streams rather than re-walking the AST. The scope
 *   `forest` is a separate read through the accessor seam (`readScopeForest`,
 *   the `facts.environment` projection), answering a different question than
 *   the descent.
 * - **Pure / frozen / deterministic.** Each of the two freshly-collected anchor
 *   streams is deep-frozen and the bundle is frozen; `classified` (from
 *   `classifyTokens`) and `forest` (from `readScopeForest`) arrive already
 *   deep-frozen, so they are borrowed by reference, not re-frozen (freeze what
 *   you build).
 *
 * @throws Error when the `tokens` or `ast` stage is not ok (unparsed facts).
 */
export default function buildContext(
	facts: Facts,
	classified: readonly ClassifiedToken[],
): GenerationContext {
	const { identifierAnchors, propertyAccessAnchors } = descendIdentifiers(
		readParsedAst(facts),
	);
	const context: GenerationContext = {
		classified,
		identifierAnchors: deepFreezeInPlace(identifierAnchors),
		propertyAccessAnchors: deepFreezeInPlace(propertyAccessAnchors),
		forest: readScopeForest(facts),
	};
	return Object.freeze(context);
}

/** Accessor seam: the parsed AST, or throw if the facts are unparsed. */
function readParsedAst(facts: Facts): Node {
	const ast: Node | null =
		facts.tokens.ok && facts.ast.ok ? facts.ast.value : null;
	if (ast === null) {
		throw new Error(
			'buildContext requires parsed facts: the tokens and ast stages must both be ok',
		);
	}
	return ast;
}
