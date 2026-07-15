/**
 * Given patience-sort decks, enumerate the maximal-length increasing
 * subsequences. Returns every candidate of the maximum length so `bestLise` can
 * choose among them.
 */
export default function findLises(
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
