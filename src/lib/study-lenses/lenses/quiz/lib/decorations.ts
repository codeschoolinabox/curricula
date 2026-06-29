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
 * the decoration its group has earned. Because the lens holds one item per token,
 * mastery shown on one element spreads to every element sharing its `groupKey` —
 * the propagation the `groupKey` axis exists for. Channels are independent:
 * channel 1 (progress) renders only where `progress > 0`; channel 2 (wrong)
 * renders wherever the group is flagged `wrong`; a group can be in either, both,
 * or neither.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { QuizItem } from '../../../lib/quizzing/types.js';
import type { MasteryDecos, MasteryState, ProgressBucket } from '../types.js';

/**
 * Project the quiz items and the current mastery state onto the two color-free
 * decoration channels. Iterates the items in source order, looking each item's
 * group up in `mastery`: an item whose group has `progress > 0` contributes a
 * channel-1 entry (its `anchorRange` + density `bucket`); an item whose group is
 * `wrong` contributes a channel-2 entry (its `anchorRange`). An item whose group
 * is absent from `mastery` contributes nothing. One entry per token, so every
 * same-group token is decorated.
 *
 * @param items - The lens's quiz items (one per token); only `groupKey` and
 *   `anchorRange` are read, so the projection is form-agnostic.
 * @param mastery - The current per-`groupKey` mastery state.
 * @returns The render-ready, frozen `MasteryDecos` (source-ordered range lists).
 */
function masteryDecorations(
	items: readonly QuizItem[],
	mastery: MasteryState,
): MasteryDecos {
	const progress = items.flatMap((item) => progressEntry(item, mastery));
	const wrong = items.flatMap((item) =>
		mastery[item.groupKey]?.wrong ? [item.anchorRange] : [],
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
