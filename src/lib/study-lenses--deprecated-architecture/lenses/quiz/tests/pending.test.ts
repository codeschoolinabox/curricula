/**
 * Pure tests for the quiz lens's select-in-code toggle-set (`toggleRange`, inc
 * 6c). No jsdom, no CodeMirror — exact `[start, end]` membership math. A click
 * adds a range if absent, removes it if present; appends preserve source order.
 * `grade` compares select-in-code by exhaustive set-equality (a `rangeKey` of
 * `${start}-${end}`), so `toggleRange`'s exact-tuple equality matches grade's
 * semantics — a toggle-set set-equals `targetRanges` iff exactly the targets
 * were toggled.
 */

import { describe, expect, it } from 'vitest';

import toggleRange from '../lib/pending.js';
import type { PendingSelection } from '../types.js';

describe('toggleRange — select-in-code membership toggle', () => {
	// Zero — from empty, a toggle ADDS.
	it('adds a range to an empty selection', () => {
		expect(toggleRange([], [4, 5])).toEqual([[4, 5]]);
	});

	// One → Many — a second, distinct range appends (source order preserved).
	it('appends a second, distinct range (order preserved)', () => {
		expect(toggleRange([[4, 5]], [11, 12])).toEqual([
			[4, 5],
			[11, 12],
		]);
	});

	// Many → toggle-off — an already-present range is REMOVED.
	it('removes a range that is already present (toggle off)', () => {
		expect(
			toggleRange(
				[
					[4, 5],
					[11, 12],
				],
				[4, 5],
			),
		).toEqual([[11, 12]]);
	});

	// Many → remove the MIDDLE element — pins order-preservation on removal and
	// rejects an index-0-specific deletion (every other removal case matches at
	// index 0, so a buggy "delete index 0 on match" would pass them all).
	it('removing a middle element preserves the remaining order (not index-0-specific)', () => {
		expect(
			toggleRange(
				[
					[4, 5],
					[11, 12],
					[20, 21],
				],
				[11, 12],
			),
		).toEqual([
			[4, 5],
			[20, 21],
		]);
	});

	// Boundary — EXACT equality: an adjacent-but-not-equal range is a DISTINCT
	// member (not a match), so it appends rather than toggling anything off.
	it('treats a non-equal range as distinct (exact [start,end] membership)', () => {
		expect(toggleRange([[4, 5]], [4, 6])).toEqual([
			[4, 5],
			[4, 6],
		]);
	});

	// Interface — toggling the only member off returns to empty.
	it('toggles the last member off to an empty selection', () => {
		expect(toggleRange([[4, 5]], [4, 5])).toEqual([]);
	});

	// A double toggle of the same range is the identity (on, then off) — the
	// set-membership property; guards against an on-toggle that appends a duplicate.
	it('a double toggle of the same range is the identity', () => {
		expect(toggleRange(toggleRange([], [4, 5]), [4, 5])).toEqual([]);
	});

	// Exceptions — the returned selection is frozen (immutable at the boundary,
	// like every other pure boundary in this lens).
	it('returns a frozen selection', () => {
		expect(Object.isFrozen(toggleRange([], [4, 5]))).toBe(true);
	});

	it('does not mutate the input selection', () => {
		const input: PendingSelection = [[4, 5]];
		toggleRange(input, [11, 12]);
		expect(input).toEqual([[4, 5]]);
	});
});
