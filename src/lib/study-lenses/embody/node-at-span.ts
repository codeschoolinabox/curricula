/**
 * Resolve a character-offset span to the deepest entwined node whose span
 * EXACTLY matches it: begin at `byOffset[start]` — already the deepest
 * node covering that offset — and ascend `parent` links, answering the
 * first node with `node.start === start && node.end === end` (by
 * construction the deepest exact match). Contract ratified by the human
 * 2026-08-11 (campaign ② W1.c, folded back by HR-22).
 *
 * @remarks
 * TOTAL — never throws: out-of-range offsets, `start === source.length`,
 * zero-width requests, and no-exact-match ascents all answer `null`. The
 * consumer drives this inside the engine's `onMessage` hook, where a
 * throw is a hook-error that ends the learner's run — a total function is
 * the safe boundary contract at a hot hook.
 *
 * `null` means "no exact match", nothing more — callers own their own
 * fallback. Deliberately NO deepest-enclosing fallback here: enclosing
 * attribution is a different operation (a single-offset `byOffset` read),
 * ruled separately by its consumer; folding it in would make data-absence
 * indistinguishable from fallback attribution.
 *
 * Coordinate space: offsets into the SOURCE THIS `entwined` WAS DERIVED
 * FROM. A consumer instrumenting a spliced text owes its own coordinate
 * reconciliation before calling.
 *
 * Unreachable by design: zero-width nodes cover no offset and never
 * appear on an ascent chain (`byPath` is the route to those). Ties:
 * identical-span relatives resolve by whatever `byOffset` already pinned
 * — the later-enumerated node wins (derive-entwined's tie-break; this
 * helper inherits it rather than re-deciding, so an off-chain
 * identical-span sibling is unreachable here).
 */

import type { Entwined, EntwinedNode } from './types.js';

export default function nodeAtSpan(
	entwined: Entwined,
	start: number,
	end: number,
): EntwinedNode | null {
	// WHY the explicit type and truthy guard: noUncheckedIndexedAccess is
	// off, so an out-of-range read TYPES as EntwinedNode while being
	// undefined at runtime — the honest annotation plus the guard is what
	// keeps totality real.
	let current: EntwinedNode | undefined = entwined.byOffset[start];
	while (current) {
		if (current.node.start === start && current.node.end === end) {
			return current;
		}
		current = current.parent ?? undefined;
	}
	return null;
}
