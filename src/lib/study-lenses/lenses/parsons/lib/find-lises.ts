// cspell:ignore lises lise parsonizer

/**
 * Given patience-sort decks, enumerate the maximal-length increasing
 * subsequences. Returns every candidate of the maximum length so `bestLise`
 * can choose among them. Vendored from the legacy parsonizer `lis.js`
 * (mechanical JS→TS conversion; identifiers renamed to house style and the
 * per-deck extension extracted to a helper, algorithm untouched).
 */
export default function findLises(
	decks: ReadonlyArray<ReadonlyArray<number>>,
): number[][] {
	if (decks.length === 0) return [];
	let lises: number[][] = [];
	for (const deck of decks) {
		lises = extendLises(lises, deck);
	}
	let lisLength = 0;
	for (const candidate of lises) {
		lisLength = Math.max(lisLength, candidate.length);
	}
	return lises.filter((candidate) => candidate.length >= lisLength);
}

/**
 * One deck's generation step: every existing partial LIS extended by each
 * larger deck value (as a copy), the partial itself carried forward, and
 * each deck value seeded as a fresh singleton candidate.
 */
function extendLises(
	lises: ReadonlyArray<number[]>,
	deck: ReadonlyArray<number>,
): number[][] {
	const nextLises: number[][] = [];
	for (const partialLis of lises) {
		for (const value of deck) {
			const last = partialLis.at(-1);
			if (last !== undefined && value > last) {
				nextLises.push([...partialLis, value]);
			}
		}
		nextLises.push(partialLis);
	}
	for (const value of deck) {
		nextLises.push([value]);
	}
	return nextLises;
}
