/**
 * @file Position-aware per-blank correctness evaluator. NEW in V2 —
 * fixes the legacy's two evaluation bugs:
 *
 * 1. Substring-containment false positive (`"function"` matches
 *    `"functionX"` in the legacy's `learnerText.includes(expectedAnswer)`).
 * 2. Multi-blank-same-token tracking failure (two blanks of the same
 *    word are both marked correct if the word appears once in the
 *    learner's text).
 *
 * Algorithm — anchor-split:
 *
 * The blankenated source has `__` placeholders at known
 * `[blank.start, blank.end)` positions of the **original source**. The
 * text BETWEEN blanks (the "anchors") is verbatim in both the original
 * source and the learner's edited text — provided the learner edits
 * only the `__` placeholders (the v1 contract per `./README.md` §
 * Edge cases). The evaluator extracts each blank's learner-typed text
 * by splitting `learnerCode` at the anchor boundaries.
 *
 * For each blank:
 * - If the learner left `__` in place: `unfilled`.
 * - If the learner typed `blank.original`: `correct`.
 * - Otherwise: `incorrect`.
 *
 * Adjacent-blanks groups (consecutive blanks with zero-length
 * inter-anchor, e.g. `i++` produces Identifier+Operator blanks): split
 * the group's learner text by `blank.original.length` boundaries when
 * the group's total length matches `sum(originals.length)`; otherwise
 * fall back to unfilled for the whole group (length-mismatch
 * defensive — handles e.g. learner typed extra characters or left
 * some `__` unfilled in adjacent group).
 *
 * Defensive fallback: if anchor matching fails (the learner edited
 * outside placeholder ranges, corrupting the anchor offsets), every
 * blank is reported as `unfilled`. v2 (see `./README.md` § Future
 * direction) will re-anchor via CodeMirror `Decoration.mark`.
 *
 * Score formula per `./types.ts` `EvaluationResult`:
 * `total === 0 ? 100 : Math.round(correct / total * 100)`.
 */

import { freezeInPlace } from '@utils/freeze.js';

import type { Blank, BlankCorrectness, EvaluationResult } from '../types.js';

const PLACEHOLDER = '__';

/**
 * Builds the EvaluationResult from sorted-order learner texts.
 *
 * Note on `correctnessMap` mutability: `CorrectnessMap` is typed
 * `ReadonlyMap` (compile-time enforcement). At runtime the `Map`
 * itself is mutable — `freezeInPlace` cannot freeze internal Map slots
 * (`Object.freeze(new Map()).set('k', 'v')` succeeds in V8). The
 * TypeScript structural type IS the contract; well-typed callers
 * cannot `.set()`. Accepted per AR-4 for v1.
 */
function buildResultFromTexts(
	blanks: ReadonlyArray<Blank>,
	learnerTexts: ReadonlyArray<string | null>,
): EvaluationResult {
	const correctnessMap = new Map<string, BlankCorrectness>();
	let correct = 0;
	let incorrect = 0;
	let unfilled = 0;
	for (let i = 0; i < blanks.length; i += 1) {
		const blank = blanks[i]!;
		const text = learnerTexts[i];
		let status: BlankCorrectness;
		if (text === null || text === PLACEHOLDER) {
			status = 'unfilled';
			unfilled += 1;
		} else if (text === blank.original) {
			status = 'correct';
			correct += 1;
		} else {
			status = 'incorrect';
			incorrect += 1;
		}
		correctnessMap.set(blank.id, status);
	}
	const total = blanks.length;
	const score = total === 0 ? 100 : Math.round((correct / total) * 100);
	return freezeInPlace({
		correctnessMap,
		total,
		correct,
		incorrect,
		unfilled,
		score,
	});
}

function evaluateCorrectness(
	learnerCode: string,
	blanks: ReadonlyArray<Blank>,
	originalCode: string,
): EvaluationResult {
	if (blanks.length === 0) {
		return buildResultFromTexts(blanks, []);
	}

	// Sort blanks ascending by start position (preserve original ids).
	const sortedBlanks: ReadonlyArray<Blank> = [...blanks].sort(
		(a, b) => a.start - b.start,
	);

	// Build anchors[0..N]: text segments between blanks in originalCode.
	const anchors: string[] = [];
	anchors.push(originalCode.slice(0, sortedBlanks[0]!.start)); // leading
	for (let i = 1; i < sortedBlanks.length; i += 1) {
		anchors.push(
			originalCode.slice(sortedBlanks[i - 1]!.end, sortedBlanks[i]!.start),
		);
	}
	anchors.push(originalCode.slice(sortedBlanks[sortedBlanks.length - 1]!.end)); // trailing

	// Leading anchor must be a prefix of learnerCode.
	if (!learnerCode.startsWith(anchors[0]!)) {
		return mapBackToBlankOrder(
			blanks,
			sortedBlanks,
			allUnfilledTexts(sortedBlanks),
		);
	}

	const learnerTexts: Array<string | null> = sortedBlanks.map(() => null);

	let cursor = anchors[0]!.length;
	let i = 0;
	while (i < sortedBlanks.length) {
		// Group consecutive blanks separated by empty inter-anchors.
		let groupEnd = i;
		while (groupEnd < sortedBlanks.length - 1 && anchors[groupEnd + 1] === '') {
			groupEnd += 1;
		}
		const nextAnchor = anchors[groupEnd + 1]!;

		let groupTextEnd: number;
		if (nextAnchor === '') {
			// Trailing anchor is empty: group extends to end of learnerCode.
			groupTextEnd = learnerCode.length;
		} else {
			const found = learnerCode.indexOf(nextAnchor, cursor);
			if (found === -1) {
				return mapBackToBlankOrder(
					blanks,
					sortedBlanks,
					allUnfilledTexts(sortedBlanks),
				);
			}
			groupTextEnd = found;
		}

		const groupText = learnerCode.slice(cursor, groupTextEnd);

		if (i === groupEnd) {
			// Single-blank group.
			learnerTexts[i] = groupText;
		} else {
			// Adjacent-blanks group: split by original-length boundaries.
			let expectedLength = 0;
			for (let j = i; j <= groupEnd; j += 1) {
				expectedLength += sortedBlanks[j]!.original.length;
			}
			if (groupText.length === expectedLength) {
				let offset = 0;
				for (let j = i; j <= groupEnd; j += 1) {
					const len = sortedBlanks[j]!.original.length;
					learnerTexts[j] = groupText.slice(offset, offset + len);
					offset += len;
				}
			}
			// else: leave null for the group; will be reported as unfilled.
		}

		cursor = groupTextEnd + nextAnchor.length;
		i = groupEnd + 1;
	}

	// Trailing anchor must consume to end of learnerCode.
	if (cursor !== learnerCode.length) {
		return mapBackToBlankOrder(
			blanks,
			sortedBlanks,
			allUnfilledTexts(sortedBlanks),
		);
	}

	return mapBackToBlankOrder(blanks, sortedBlanks, learnerTexts);
}

function allUnfilledTexts(blanks: ReadonlyArray<Blank>): Array<string | null> {
	return blanks.map(() => null);
}

/**
 * Re-key the learnerTexts (indexed in sorted order) back to the
 * caller-supplied `blanks` order, so the returned `correctnessMap`
 * iteration matches the input order. Since `correctnessMap` is keyed
 * by `blank.id`, the order matters for tests using
 * `[...correctnessMap.keys()]`.
 */
function mapBackToBlankOrder(
	originalBlanks: ReadonlyArray<Blank>,
	sortedBlanks: ReadonlyArray<Blank>,
	sortedTexts: ReadonlyArray<string | null>,
): EvaluationResult {
	// Build a map from blank.id → text (using sorted order).
	const textById = new Map<string, string | null>();
	for (let i = 0; i < sortedBlanks.length; i += 1) {
		textById.set(sortedBlanks[i]!.id, sortedTexts[i] ?? null);
	}
	// Now rebuild texts in original order.
	const originalOrderedTexts: Array<string | null> = originalBlanks.map(
		(blank) => textById.get(blank.id) ?? null,
	);
	return buildResultFromTexts(originalBlanks, originalOrderedTexts);
}

export default evaluateCorrectness;
