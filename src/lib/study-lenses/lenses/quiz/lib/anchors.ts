/**
 * @file Pure anchor / item resolution for the quiz lens — CM-independent so it
 * serves both the CodeMirror click path and the span-render fallback unchanged
 * (no React, no `@codemirror/*`). `anchorAt` resolves a document offset to the
 * classified token under it (the click → highlight step, inc 2); `itemsAt`
 * (inc 3) resolves a range to its quiz item(s).
 */

import freezeInPlace from '@utils/freeze-in-place.js';

import type { ClassifiedToken } from '../../../lib/classifying/types.js';
import type { QuizItem } from '../../../lib/quizzing/types.js';
import type { ActiveTab } from '../types.js';

/**
 * Resolves a document `offset` to the classified token whose half-open range
 * `[start, end)` contains it (`start <= offset < end`), or `null` when the
 * offset falls on whitespace, between tokens, or past the end. Binary search
 * over the source-ascending, non-overlapping token stream (`classifyTokens`
 * drops EOF + zero-length tokens, so ranges never overlap). A click exactly on
 * a token's `end` belongs to the next token (or to whitespace) — half-open.
 *
 * @param offset - A zero-indexed character offset into the source.
 * @param classified - The source-ascending classified-token stream.
 * @returns The containing token, or `null`.
 */
function anchorAt(
	offset: number,
	classified: readonly ClassifiedToken[],
): ClassifiedToken | null {
	return searchByOffset(offset, classified, 0, classified.length - 1);
}

/**
 * Recursive binary search for the token whose `[start, end)` contains `offset`,
 * within the inclusive index window `[lo, hi]`. Recursive (not a `while` loop)
 * to stay within the module's functional style. The stream is source-ascending
 * and non-overlapping, so the half-open membership test partitions the search
 * cleanly: `offset < start` → left, `offset >= end` → right, else hit.
 */
function searchByOffset(
	offset: number,
	classified: readonly ClassifiedToken[],
	lo: number,
	hi: number,
): ClassifiedToken | null {
	if (lo > hi) return null;
	const mid = Math.floor((lo + hi) / 2);
	const token = classified[mid];
	if (offset < token.start) {
		return searchByOffset(offset, classified, lo, mid - 1);
	}
	if (offset >= token.end) {
		return searchByOffset(offset, classified, mid + 1, hi);
	}
	return token;
}

/**
 * Resolves a picked token `range` to the quiz item(s) anchored exactly there —
 * the panel's content. Matches on `anchorRange` equality. Co-anchoring is the
 * norm: a clicked range can carry several forms (an identifier carries V1 + V7),
 * so the array return is load-bearing — it is the bundle the panel renders as
 * answer-neutral tabs. Pure and mode-agnostic (it filters on `anchorRange`
 * only), so it serves the full `QuizItem` union — and the span-render fallback —
 * unchanged.
 *
 * @param items - The admitted quiz items (mode-filtered upstream by build-quiz).
 * @param range - The picked token's half-open `[start, end)` range.
 * @returns The items whose `anchorRange` equals `range` — the co-anchored bundle,
 *   deep-frozen (the items are already frozen upstream; the array is frozen here
 *   so the resolution is immutable at the boundary).
 */
function itemsAt(
	items: readonly QuizItem[],
	range: readonly [number, number],
): readonly QuizItem[] {
	return freezeInPlace(
		items.filter(
			(item) =>
				item.anchorRange[0] === range[0] && item.anchorRange[1] === range[1],
		),
	);
}

/**
 * The mode-aware safe default tab for a co-anchored bundle: the index of the
 * first `mcq` item, or `null` when the bundle has none. NOT a bare index 0 — that
 * would arm the editor whenever `generateQuiz` happened to emit a code-surface
 * form first. An `mcq` active tab is anchor phase (an mcq is answered in the
 * panel, not the editor), so defaulting to the first `mcq` keeps the editor from
 * **ever auto-arming**; a bundle with no `mcq` item stays unarmed (`null`) until
 * the learner selects a tab. The lens's own "never auto-arm" invariant — see
 * `../README.md` § Panel + `../DOCS.md` § Why dispatch on active-tab mode.
 *
 * @param bundle - The co-anchored items `itemsAt` resolved for the picked range.
 * @returns The first `mcq` index, or `null` for a bundle with no `mcq` item.
 */
function defaultActiveTab(bundle: readonly QuizItem[]): ActiveTab {
	const index = bundle.findIndex((item) => item.mode === 'mcq');
	return index === -1 ? null : index;
}

const anchors = { anchorAt, itemsAt, defaultActiveTab };

export default anchors;
