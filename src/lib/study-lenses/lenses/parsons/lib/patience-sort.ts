// cspell:ignore parsonizer lise

/**
 * Patience-sort an array of numbers into "decks" (the classic LIS building
 * block): each element is appended to the current deck while it is strictly
 * less than that deck's last element, otherwise it starts a new deck.
 * Vendored from the legacy parsonizer `lis.js` (mechanical JS→TS
 * conversion; identifiers renamed to house style, algorithm untouched).
 *
 * @remarks Returns `[]` for empty input (the legacy built a phantom
 * `[[undefined]]` deck; this port returns `[]` —
 * `bestLiseInverseIndices` short-circuits empty input before reaching here
 * anyway).
 */
export default function patienceSort(list: ReadonlyArray<number>): number[][] {
	const values = [...list];
	if (values.length === 0) return [];
	const decks: number[][] = [[values[0]]];
	let deckPosition = 0;
	for (let index = 1; index < values.length; index++) {
		const value = values[index];
		const currentDeck = decks[deckPosition];
		const last = currentDeck.at(-1);
		if (last !== undefined && value < last) {
			// append to the last created deck
			currentDeck.push(value);
		} else {
			// create a new deck
			decks.push([value]);
			deckPosition++;
		}
	}
	return decks;
}
