/**
 * @file Pure anchor / item resolution for the quiz lens — CM-independent so it
 * serves both the CodeMirror click path and the span-render fallback unchanged
 * (no React, no `@codemirror/*`). `anchorAt` resolves a document offset to the
 * classified token under it (the click → highlight step, inc 2); `itemsAt`
 * (inc 3) resolves a range to its quiz item(s).
 */

import type { ClassifiedToken } from '../../../lib/classifying/types.js';

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

const anchors = { anchorAt };

export default anchors;
