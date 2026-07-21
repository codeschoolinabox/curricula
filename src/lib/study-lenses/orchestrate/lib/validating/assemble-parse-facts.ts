import type { Identifier } from 'acorn';

import deepFreezeExcept from '@utils/deep-freeze-except.js';

import type {
	EntwinedNode,
	Facts,
	ScopeReference,
} from '../../../embody/types.js';
import type { UnresolvedReference } from '../../../language-levels/types.js';

import type { AssembledParseFacts } from './types.js';

/**
 * Assemble the parse facts a level consumes — once per settle — from the
 * embodiment's parse and scope-analysis stages, or yield the undetermined
 * signal when the program did not parse or its scope analysis did not
 * complete.
 *
 * @remarks
 * Values, never envelopes: the assembly projects the stage values (the token
 * stream, the set-aside comments, the syntax tree) and the scope
 * resolution's escape list — each unresolved reference as its name, its
 * identifier node, and that node's canonical path — and no stage envelope,
 * cause, or embody type crosses into a level. When the tokens, ast,
 * entwined, or environment stage failed there is nothing to assemble — the
 * result is `null`, and no level is ever consulted about it (the
 * undetermined verdict is the caller's own). Freeze-what-you-own: the
 * assembled envelope and its reference entries are frozen; the carried
 * values and the borrowed identifier nodes are the embodiment's, left
 * untouched.
 *
 * @param facts - The embodiment's fact slice for the settled snippet.
 * @returns The assembled parse facts, or `null` — the undetermined signal.
 */
export default function assembleParseFacts(facts: Facts): AssembledParseFacts {
	// 1. A failed parse or scope-analysis stage: nothing to assemble, no
	// level consulted.
	if (
		!facts.tokens.ok ||
		!facts.ast.ok ||
		!facts.entwined.ok ||
		!facts.environment.ok
	) {
		return null;
	}

	// 2. Project the stage values — the envelope is owned here, the values
	// stay the embodiment's (freeze-what-you-own).
	const { tokens, comments } = facts.tokens.value;
	const ast = facts.ast.value;
	const { byOffset } = facts.entwined.value;

	// 3. Project the escape list: the references no program scope resolves,
	// read off the root scope's `through`.
	const unresolvedReferences = facts.environment.value.root.through.map(
		(reference) => projectReference(reference, byOffset),
	);

	return deepFreezeExcept(
		{ ast, comments, tokens, unresolvedReferences },
		new Set<object>([
			ast,
			comments,
			tokens,
			...unresolvedReferences.map((reference) => reference.node),
		]),
	);
}

/**
 * One through-reference as the level-facing escape-list entry. A
 * through-reference's identifier is an identifier node by construction
 * (embody's projection types it as the generic node, so the read narrows
 * here); its path resolves through the entwined graph — the deepest node at
 * an identifier's start offset is the identifier itself, since identifiers
 * have no children.
 */
function projectReference(
	reference: ScopeReference,
	byOffset: ReadonlyArray<EntwinedNode>,
): UnresolvedReference {
	const identifier = reference.identifier as Identifier;
	return {
		name: identifier.name,
		node: identifier,
		nodePath: byOffset[identifier.start].path,
	};
}
