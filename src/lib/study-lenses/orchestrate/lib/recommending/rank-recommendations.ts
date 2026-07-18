import deepFreezeExcept from '@utils/deep-freeze-except.js';

import type { Recommendation } from '../../../lenses/types.js';

import type { RankedRecommendations } from './types.js';

/**
 * Orders collected proposals for rendering: relevance descending on the lens
 * contract's shared 0–1 scale, equal relevance keeping the collected order
 * (stable ties). The returned list is frozen.
 *
 * @remarks
 * The scale is trusted — an out-of-range `relevance` is the proposing lens's
 * contract bug, never clamped or repaired here. Ranking changes order and
 * nothing else: no proposal is added, dropped, deduplicated, or altered.
 *
 * @param proposals - Each fitting lens's proposal, in collection order.
 * @returns The proposals ranked by relevance, frozen.
 */
export default function rankRecommendations(
	proposals: ReadonlyArray<Recommendation>,
): RankedRecommendations {
	// toSorted: non-mutating (the caller's array is untouched) and spec-stable
	// (equal relevance keeps the collected order).
	const ranked = proposals.toSorted(
		(left, right) => right.relevance - left.relevance,
	);

	// WHY deepFreezeExcept, excepting every proposal: the ranked array is the
	// only thing this function owns (freeze-what-you-own, DEV.md § 13). The
	// Recommendation objects — and the React lens components they reference —
	// are lens-owned foreign objects; freezing or cloning them here would
	// reach into another module's property (composing's lens-refs-excepted
	// precedent). The Set is transient computation, never frozen or kept.
	return deepFreezeExcept(ranked, new Set(proposals));
}
