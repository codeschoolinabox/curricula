// cspell:ignore distractor distractors lise

/**
 * Per-line ORDER correctness for a Parsons arrangement — ports the
 * order-grading logic of the legacy JSParsons `LineBasedGrader.grade` onto
 * the id-keyed model.
 *
 * The grader matches each placed line's `code` to the next-unused model
 * solution line (the legacy `lastFoundCodeIndex` walk) so that **duplicate
 * lines are interchangeable** — the learner is not penalized for placing
 * "the wrong copy" of a line that appears twice. A placed line whose code is
 * not in the model is a `distractor`. The matched model positions are fed to
 * the Longest-Increasing-Subsequence grader
 * (`./best-lise-inverse-indices.ts`); placed lines NOT in the LIS are
 * `wrong-order` (the minimal set that must move). Order-correct lines carry
 * their matched model index out so `./evaluate-indentation.ts` can look up
 * the expected indent level. Pure.
 */

import type { LineOrderResult, OrderVerdict, PlacedCode } from '../types.js';

import bestLiseInverseIndices from './best-lise-inverse-indices.js';

/**
 * Grade the order of the learner's placed lines against the model solution.
 *
 * @param placed - the learner's solution column, in order (id + code).
 * @param modelCodes - the model solution lines' codes, in model order.
 */
export default function evaluateLineOrder(
	placed: ReadonlyArray<PlacedCode>,
	modelCodes: ReadonlyArray<string>,
): LineOrderResult {
	const order = new Map<string, OrderVerdict>();
	const matchedModelIndex = new Map<string, number>();
	if (placed.length === 0) {
		return { order, matchedModelIndex };
	}

	// Match each placed line's code to the next-unused model position (the
	// legacy lastFoundCodeIndex walk). `lastFound` maps a code to the highest
	// model index already consumed by an earlier placed line with that code.
	const lastFound = new Map<string, number>();
	const walked: Array<{ id: string; position: number; ignore: boolean }> = [];
	for (const { id, code } of placed) {
		const lastUsed = lastFound.get(code);
		const start = lastUsed === undefined ? 0 : lastUsed + 1;
		let foundAt = -1;
		for (let index = start; index < modelCodes.length; index++) {
			if (modelCodes[index] === code) {
				foundAt = index;
				break;
			}
		}
		if (foundAt === -1) {
			if (lastUsed === undefined) {
				// Code never appears in the model → distractor (not part of
				// the LIS).
				walked.push({ id, position: -1, ignore: true });
			} else {
				// Exhausted duplicate: the code is in the model but the
				// learner placed more copies than exist. Reuse the last
				// matched position; it stays in the LIS input and will be
				// flagged out-of-order (duplicate position).
				walked.push({ id, position: lastUsed, ignore: false });
			}
		} else {
			lastFound.set(code, foundAt);
			walked.push({ id, position: foundAt, ignore: false });
		}
	}

	// LIS over the non-distractor positions; inverse indices (into the
	// FILTERED array) are the lines to move.
	const lisEntries = walked.filter((entry) => !entry.ignore);
	const inverse = new Set(
		bestLiseInverseIndices(lisEntries.map((entry) => entry.position)),
	);

	// Single forward pass over `walked` so `order` reflects placed-line order
	// (a distractor between two solution lines keeps its placed position in
	// the Map's iteration order). `lisIndex` walks the filtered array in
	// lockstep with the non-ignored entries.
	let lisIndex = 0;
	for (const entry of walked) {
		if (entry.ignore) {
			order.set(entry.id, 'distractor');
		} else {
			const verdict = inverse.has(lisIndex) ? 'wrong-order' : 'correct';
			lisIndex++;
			order.set(entry.id, verdict);
			if (verdict === 'correct') {
				matchedModelIndex.set(entry.id, entry.position);
			}
		}
	}

	return { order, matchedModelIndex };
}
