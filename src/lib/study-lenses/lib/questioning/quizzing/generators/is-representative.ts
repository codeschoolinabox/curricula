/**
 * @file `isRepresentative` — the representative dedup gate for node-anchored
 * "sameness" select-in-code generators. Returns `true` iff `anchor` is the
 * source-first member of `members`, so a generator that fires once per occurrence
 * (the run phase flat-maps the identifier-anchor stream) emits exactly ONE item
 * per propagation group — at the group's first source position — by returning `[]`
 * for every non-representative occurrence. `members` arrives source-ordered (it is
 * filtered from the source-ordered identifier-anchor stream, never re-sorted), so
 * the representative is `members[0]`; gating on it makes emission deterministic and
 * duplicate-free.
 *
 * Shared by the sameness forms (V10a, V10b, V10c), so the load-bearing dedup
 * logic lives in exactly one place.
 */

import type { IdentifierAnchor } from '../context/types.js';

/**
 * Whether `anchor` is the representative (source-first member) of `members`.
 * Compares ranges directly — two occurrences are the same iff their half-open
 * spans match. `members` is non-empty in practice (the anchor is always one of its
 * own group's members), but an empty group safely returns `false`.
 */
export default function isRepresentative(
	anchor: IdentifierAnchor,
	members: readonly IdentifierAnchor[],
): boolean {
	const first = members[0];
	return (
		first?.range[0] === anchor.range[0] && first?.range[1] === anchor.range[1]
	);
}
