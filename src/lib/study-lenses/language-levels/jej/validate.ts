import freezeInPlace from '@utils/freeze-in-place.js';

import collectViolations from '../../lib/screening/collect-violations.js';
import type { ParseFacts, Violation } from '../types.js';

import checkUndeclaredGlobals from './check-undeclared-globals.js';
import justEnoughJs from './just-enough-js.js';

/**
 * Answers a consultation: every place a program steps outside the level, as
 * one frozen list in reading order.
 *
 * @remarks
 * The level's two phases joined: the grammar screen (every node of the tree
 * met by the allowlist's node rules) and the vocabulary ruling (every escaped
 * reference met by the admitted globals). Neither phase reads the other's
 * result; the answer is their union, ordered by source position — `location.start`,
 * stable, so two findings at one offset keep grammar before vocabulary — and
 * frozen, so a gutter renders every finding in reading order. Pure and
 * synchronous: the same facts always produce the same violations. The level
 * never parses and derives no scopes — it reads only the facts' syntax tree
 * and escape list, never the tokens, comments, or source text.
 *
 * @param facts - The program's parse facts: syntax tree and the scope
 *   resolution's escape list (the token stream and comments are carried but
 *   not read).
 * @returns A frozen array of violations, ordered by source position.
 */
export default function validate(facts: ParseFacts): ReadonlyArray<Violation> {
	// 1. Screen the grammar (pure)
	const grammar = collectViolations(facts.ast, justEnoughJs.nodes);

	// 2. Resolve the vocabulary (pure)
	const vocabulary = checkUndeclaredGlobals(
		facts.unresolvedReferences,
		justEnoughJs.admittedGlobals,
	);

	// the union, in reading order — sort is stable, so two findings at one
	// offset keep grammar before vocabulary
	const union = [...grammar, ...vocabulary].toSorted(
		(a, b) => a.location.start - b.location.start,
	);
	return freezeInPlace(union);
}
