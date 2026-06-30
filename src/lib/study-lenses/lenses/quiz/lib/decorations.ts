/**
 * @file The mastery-decoration projector (inc 5) — the pure step that turns the
 * quiz items plus the current `MasteryState` into the two color-free render
 * channels (`MasteryDecos`). Pure and CodeMirror-independent: it emits plain
 * `[start, end)` ranges (and, for the progress channel, a density `bucket`); the
 * wrapper (`../index.tsx`) is the only thing that knows about `Decoration`,
 * `StateField`, and the editor. Extracted here — like `./anchors.ts` and
 * `./grade-option.ts` — so the projection logic is unit-tested without a browser
 * (the painted result is verified at the 🔍 sandbox checkpoint).
 *
 * @remarks Two channels, both keyed off `item.groupKey`: a same-group token earns
 * the decoration its group has earned, so mastery shown on one element spreads to
 * every element sharing its `groupKey` — the propagation the `groupKey` axis exists
 * for. Since inc 6 several forms co-anchor each token, the projector dedupes its
 * output to one entry per token per channel and keeps the lists source-ordered — a
 * token surfaced by several items (co-anchored same-group forms, or several groups
 * mastered at once) is decorated once, not once per item (progress keeps the densest
 * bucket). Channels are independent: channel 1 (progress)
 * renders only where `progress > 0`; channel 2 (wrong) renders wherever the group is
 * flagged `wrong`; a group can be in either, both, or neither.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { QuizItem } from '../../../lib/quizzing/types.js';
import type { MasteryDecos, MasteryState, ProgressBucket } from '../types.js';

/**
 * Project the quiz items and the current mastery state onto the two color-free
 * decoration channels. Each item whose group has `progress > 0` contributes a
 * channel-1 entry (its `anchorRange` + density `bucket`); each item whose group is
 * `wrong` contributes a channel-2 entry (its `anchorRange`); an item whose group is
 * absent from `mastery` contributes nothing. The per-item contributions are then
 * **deduped to one entry per token, sorted by source position** (the `MasteryDecos`
 * contract): since inc 6 several forms co-anchor each token, a token surfaced by
 * multiple items would otherwise be decorated once per item. A token co-anchored
 * by same-group items collapses trivially (identical entries); a token mastered in
 * **several different groups** keeps the **highest** progress bucket (the densest
 * underline — its most-earned mastery), so it still reads as one underline.
 *
 * @param items - The lens's quiz items (co-anchored: several per token); only
 *   `groupKey` and `anchorRange` are read, so the projection is form-agnostic.
 * @param mastery - The current per-`groupKey` mastery state.
 * @returns The render-ready, frozen `MasteryDecos` (deduped, source-ordered).
 */
function masteryDecorations(
	items: readonly QuizItem[],
	mastery: MasteryState,
): MasteryDecos {
	const progress = dedupeProgress(
		items.flatMap((item) => progressEntry(item, mastery)),
	);
	const wrong = dedupeRanges(
		items.flatMap((item) =>
			mastery[item.groupKey]?.wrong ? [item.anchorRange] : [],
		),
	);
	return freezeInPlace({ progress, wrong });
}

export default masteryDecorations;

/**
 * The channel-1 entry (or none) for one item: an empty array unless the item's
 * group is present and has `progress > 0`. A function declaration so the body's
 * intermediate group lookup stays a block (a block-bodied arrow trips
 * `arrow-body-style`); `flatMap` flattens the 0-or-1 result.
 */
function progressEntry(
	item: QuizItem,
	mastery: MasteryState,
): MasteryDecos['progress'] {
	const group = mastery[item.groupKey];
	return group !== undefined && group.progress > 0
		? [{ range: item.anchorRange, bucket: progressBucket(group.progress) }]
		: [];
}

/**
 * Map a group's `0..1` progress to its channel-1 density bucket. The four
 * reachable non-zero values under the `MASTERY_STEP` (`0.25`) grid land on the
 * four buckets 1:1 (`0.25 → 1`, `0.5 → 2`, `0.75 → 3`, `1 → 4`), so the
 * underline reads one distinct density per mastery level. Guard clauses (a
 * block-bodied arrow trips `arrow-body-style` in this repo); the caller only
 * passes `progress > 0`, so there is no zero bucket.
 */
function progressBucket(progress: number): ProgressBucket {
	if (progress >= 1) return 4;
	if (progress >= 0.75) return 3;
	if (progress >= 0.5) return 2;
	return 1;
}

/**
 * Dedupe the channel-1 entries to **one per token** and sort by source position.
 * Sorts by range ascending then bucket **descending**, so the first entry at each
 * range is its highest bucket; the filter then keeps that first entry per range.
 * So co-anchored same-group items (identical entries) collapse, and a token in
 * several mastered groups keeps its densest underline. (`toSorted` + `filter`, not
 * in-place mutation.)
 */
function dedupeProgress(
	entries: MasteryDecos['progress'],
): MasteryDecos['progress'] {
	const sorted = entries.toSorted(
		(a, b) =>
			a.range[0] - b.range[0] || a.range[1] - b.range[1] || b.bucket - a.bucket,
	);
	return sorted.filter(
		(entry, index) =>
			index === 0 || !sameRange(entry.range, sorted[index - 1].range),
	);
}

/**
 * Dedupe the channel-2 ranges to **one per token** and sort by source position —
 * the channel-2 analogue of `dedupeProgress`. No bucket: a token is wrong or not,
 * so range equality alone collapses both co-anchored same-group items and a token
 * flagged `wrong` by several groups.
 */
function dedupeRanges(ranges: MasteryDecos['wrong']): MasteryDecos['wrong'] {
	const sorted = ranges.toSorted((a, b) => a[0] - b[0] || a[1] - b[1]);
	return sorted.filter(
		(range, index) => index === 0 || !sameRange(range, sorted[index - 1]),
	);
}

/** Two half-open ranges are the same token: equal `start` AND equal `end`. */
function sameRange(
	a: readonly [number, number],
	b: readonly [number, number],
): boolean {
	return a[0] === b[0] && a[1] === b[1];
}
