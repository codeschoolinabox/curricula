/**
 * @file Longest-Increasing-Subsequence utilities — vendored & TS-converted from
 * the legacy `spiral-lens/public/static/parsonizer/lis.js` (a de-underscored,
 * de-jQueried copy of js-parsons' `lib/lis.js`). Used by
 * `../lib/evaluate-line-order.ts` to find, among the learner's placed lines, the
 * minimal set that must move to fix the order: the indices NOT in the longest
 * increasing subsequence of the lines' model positions.
 *
 * **Mechanical conversion with ONE declined defect.** The de-underscored
 * `parsonizer/lis.js` L99 replaced the original underscore
 * `_.max(scores, s => s.score)` (still visible commented on its L98) with
 * `scores.sort(s => s.score)[length - 1]` — a single-argument function passed to
 * `Array.sort`, i.e. not a valid comparator, which silently broke the
 * "prefer the LIS with the most consecutive runs" tie-break. That is a
 * transcription bug introduced by the prior de-underscoring, NOT a JSParsons
 * design choice (the original `js-parsons/lib/lis.js` uses `_.max`). This port
 * restores the `_.max` semantics — pick the highest-consecutive-run LIS,
 * first-max on ties — declining the defect exactly as `parse-parsons.ts` declines
 * the legacy `maxDistractors` overflow bug. See `../DOCS.md` § "Why restore the
 * original LIS selection".
 *
 * Eslint-ignored (vendored) per `eslint.config.mjs` § Global ignores.
 */

/**
 * Patience-sort an array of numbers into "decks" (the classic LIS building
 * block): each element is appended to the current deck while it is strictly less
 * than that deck's last element, otherwise it starts a new deck.
 *
 * @remarks Returns `[]` for empty input (the legacy built a phantom
 * `[[undefined]]` deck; this port returns `[]` — `best_lise_inverse_indices`
 * short-circuits empty input before reaching here anyway).
 */
export function patience_sort(list: ReadonlyArray<number>): number[][] {
	const arr = Array.from(list);
	if (arr.length === 0) return [];
	const decks: number[][] = [[arr[0]]];
	let deckPos = 0;
	for (let i = 1; i < arr.length; i++) {
		const x = arr[i];
		const currDeck = decks[deckPos];
		if (x < currDeck[currDeck.length - 1]) {
			// append to the last created deck
			currDeck.push(x);
		} else {
			// create a new deck
			decks.push([x]);
			deckPos++;
		}
	}
	return decks;
}

/**
 * Given patience-sort decks, enumerate the maximal-length increasing
 * subsequences. Returns every candidate of the maximum length so `best_lise` can
 * choose among them.
 */
export function find_lises(
	decks: ReadonlyArray<ReadonlyArray<number>>,
): number[][] {
	if (decks.length < 1) return [];
	let lises: number[][] = [];
	for (let i = 0; i < decks.length; i++) {
		const new_lises: number[][] = [];
		const deck = decks[i];
		for (let j = 0; j < lises.length; j++) {
			const partial_lis = lises[j];
			for (let k = 0; k < deck.length; k++) {
				const x = deck[k];
				if (x > partial_lis[partial_lis.length - 1]) {
					const new_partial_lis = partial_lis.slice(0);
					new_partial_lis.push(x);
					new_lises.push(new_partial_lis);
				}
			}
			new_lises.push(partial_lis);
		}
		for (let k = 0; k < deck.length; k++) {
			new_lises.push([deck[k]]);
		}
		lises = new_lises;
	}
	let lis_length = 0;
	for (let i = lises.length; i--; ) {
		lis_length = Math.max(lis_length, lises[i].length);
	}
	return lises.filter((item) => item.length >= lis_length);
}

/**
 * Pick the "best" LIS among candidates: the one with the most consecutive runs
 * (adjacent values differing by exactly 1), first-max on ties.
 *
 * @remarks Restores the original `_.max(scores, s => s.score)` semantics (see
 * file header) rather than the parsonizer `.sort()` transcription bug.
 */
export function best_lise(lises: ReadonlyArray<ReadonlyArray<number>>): number[] {
	if (lises.length === 0) return [];
	const lis_scores = lises.map((item, index) => {
		if (item.length <= 1) {
			return { score: 0, index };
		}
		let score = 0;
		for (let i = 1; i < item.length; i++) {
			if (item[i - 1] === item[i] - 1) {
				score++;
			}
		}
		return { score, index };
	});
	// Restore `_.max(lis_scores, s => s.score)`: highest score wins; the strict
	// `>` keeps the FIRST candidate on a tie (first-max), matching `_.max`.
	let best = lis_scores[0];
	for (const s of lis_scores) {
		if (s.score > best.score) {
			best = s;
		}
	}
	return [...lises[best.index]];
}

/**
 * The indices of `input` that are NOT part of the chosen longest increasing
 * subsequence — i.e. the positions a grader should flag as "needs to move".
 *
 * @param input the sequence of model positions, in the learner's placed order.
 * @returns ascending array of indices into `input` not covered by the best LIS.
 *   Empty input returns `[]` (callers should still short-circuit before calling,
 *   per `../DOCS.md` § Structural constraints "Empty-input guard").
 */
export function best_lise_inverse_indices(
	input: ReadonlyArray<number>,
): number[] {
	if (input.length === 0) return [];
	const best = best_lise(find_lises(patience_sort(input)));
	const inverse_indices: number[] = [];
	let j = 0;
	for (let i = 0; i < best.length; i++) {
		for (; j < input.length; j++) {
			if (input[j] === best[i]) {
				j++;
				break;
			} else {
				inverse_indices.push(j);
			}
		}
	}
	for (; j < input.length; j++) {
		inverse_indices.push(j);
	}
	return inverse_indices;
}
