/**
 * @file The quiz lens's select-in-code toggle-set — the pure range math behind
 * the answer-phase pending selection for `select-in-code` (V10a/b/c). A click
 * toggles a token range's membership by exact `[start, end]` equality: present →
 * removed, absent → appended (source order preserved). `click-token`'s single-slot
 * path (a click replaces) needs no helper. Pure: no React, no CodeMirror. (inc 6c)
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { PendingSelection } from '../types.js';

// Exact tuple equality — matches `grade`'s `rangeKey` (`${start}-${end}`)
// semantics, so a toggle-set set-equals `targetRanges` iff exactly the targets
// were toggled.
function sameRange(
	a: readonly [number, number],
	b: readonly [number, number],
): boolean {
	return a[0] === b[0] && a[1] === b[1];
}

/**
 * Toggles a range's membership in the pending selection: removes it if already
 * present (exact `[start, end]` equality), otherwise appends it (preserving the
 * order the learner clicked). Returns a frozen selection; never mutates the input.
 *
 * @param pending - The current staged selection.
 * @param range - The clicked token's `[start, end)` range.
 * @returns The next selection, deep-frozen at the boundary.
 */
function toggleRange(
	pending: PendingSelection,
	range: readonly [number, number],
): PendingSelection {
	const next = pending.some((member) => sameRange(member, range))
		? pending.filter((member) => !sameRange(member, range))
		: [...pending, range];
	return freezeInPlace(next);
}

export default toggleRange;
