/**
 * Patience-sort an array of numbers into "decks" (the classic LIS building
 * block): each element is appended to the current deck while it is strictly less
 * than that deck's last element, otherwise it starts a new deck.
 *
 * @remarks Returns `[]` for empty input (the legacy built a phantom
 * `[[undefined]]` deck; this port returns `[]` — `best_lise_inverse_indices`
 * short-circuits empty input before reaching here anyway).
 */
export default function patienceSort(list: ReadonlyArray<number>): number[][] {
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
