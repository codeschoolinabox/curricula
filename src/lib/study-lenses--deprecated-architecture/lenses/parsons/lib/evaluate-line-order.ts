/**
 * @file Per-line ORDER correctness for a Parsons arrangement — NEW code (not a
 * vendored conversion), porting the order-grading logic of the legacy
 * `LineBasedGrader.grade` (`parsons.js` L609–691) onto the V2 id-keyed model.
 *
 * The grader matches each placed line's `code` to the next-unused model
 * solution line (the legacy `lastFoundCodeIndex` walk) so that **duplicate lines
 * are interchangeable** — the learner is not penalized for placing "the wrong
 * copy" of a line that appears twice. A placed line whose code is not in the
 * model is a `distractor`. The matched model positions are fed to the
 * Longest-Increasing-Subsequence grader (`./lis.ts`); placed lines NOT in the
 * LIS are `wrong-order` (the minimal set that must move). Order-correct lines
 * carry their matched model index out so `evaluate-indentation.ts` can look up
 * the expected indent level.
 *
 * Pure. Not eslint-ignored (this is our code, not vendored) — but it lives under
 * `lib/` which is carved out per `eslint.config.mjs`.
 */

import bestLiseInverseIndices from './best-lise-inverse-indices.js';

/** A line the learner placed in the solution column: its id and visible code. */
export type PlacedCode = Readonly<{ id: string; code: string }>;

/** The order verdict for a single placed line (pre-precedence; indent is separate). */
export type OrderVerdict = 'correct' | 'wrong-order' | 'distractor';

export type LineOrderResult = Readonly<{
	/** Per placed-line id → its order verdict. */
	order: ReadonlyMap<string, OrderVerdict>;
	/**
	 * Per ORDER-CORRECT placed-line id → the matched model-solution index, so
	 * `evaluate-indentation` can compare against that model line's indent level.
	 * Distractor and wrong-order lines are absent.
	 */
	matchedModelIndex: ReadonlyMap<string, number>;
}>;

/**
 * Grade the order of the learner's placed lines against the model solution.
 *
 * @param placed the learner's solution column, in order (id + code).
 * @param modelCodes the model solution lines' codes, in model order.
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
		const start = lastFound.has(code) ? lastFound.get(code)! + 1 : 0;
		let foundAt = -1;
		for (let i = start; i < modelCodes.length; i++) {
			if (modelCodes[i] === code) {
				foundAt = i;
				break;
			}
		}
		if (foundAt !== -1) {
			lastFound.set(code, foundAt);
			walked.push({ id, position: foundAt, ignore: false });
		} else if (lastFound.has(code)) {
			// Exhausted duplicate: the code is in the model but the learner placed
			// more copies than exist. Reuse the last matched position; it stays in
			// the LIS input and will be flagged out-of-order (duplicate position).
			walked.push({ id, position: lastFound.get(code)!, ignore: false });
		} else {
			// Code never appears in the model → distractor (not part of the LIS).
			walked.push({ id, position: -1, ignore: true });
		}
	}

	// LIS over the non-distractor positions; inverse indices (into the FILTERED
	// array) are the lines to move.
	const lisEntries = walked.filter((w) => !w.ignore);
	const inverse = new Set(
		bestLiseInverseIndices(lisEntries.map((w) => w.position)),
	);
	const verdictByLisIndex = new Map<number, 'correct' | 'wrong-order'>();
	for (let i = 0; i < lisEntries.length; i++) {
		verdictByLisIndex.set(i, inverse.has(i) ? 'wrong-order' : 'correct');
	}

	// Single forward pass over `walked` so `order` reflects placed-line order
	// (a distractor between two solution lines keeps its placed position in the
	// Map's iteration order).
	let lisIndex = 0;
	for (const w of walked) {
		if (w.ignore) {
			order.set(w.id, 'distractor');
		} else {
			const verdict = verdictByLisIndex.get(lisIndex)!;
			lisIndex++;
			order.set(w.id, verdict);
			if (verdict === 'correct') {
				matchedModelIndex.set(w.id, w.position);
			}
		}
	}

	return { order, matchedModelIndex };
}
