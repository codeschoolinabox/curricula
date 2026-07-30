/**
 * The shared presence-diff core (scripts/DOCS.md § Migration loss-lister
 * mode): source terms whose text appears in NO destination term, matched on
 * exact text across kinds — no case folding (recapitalization is a candidate
 * loss for the human ledger to answer). A term repeated in the source is
 * reported once, at its first source location, only when ALL occurrences
 * vanish. Backs both the headings check and `--migration`.
 *
 * @typedef {import('./types.mjs').ExtractedTerm} ExtractedTerm
 */

/**
 * @param {ExtractedTerm[]} sourceTerms
 * @param {ExtractedTerm[]} destinationTerms
 * @returns {ExtractedTerm[]} Candidate losses, deduplicated by text, in
 *   first-occurrence source order.
 */
export default function presenceDiff(sourceTerms, destinationTerms) {
	const surviving = new Set(destinationTerms.map((term) => term.term));
	/** @type {Map<string, ExtractedTerm>} */
	const losses = new Map();
	for (const term of sourceTerms) {
		if (surviving.has(term.term)) continue;
		if (!losses.has(term.term)) losses.set(term.term, term);
	}
	return [...losses.values()];
}
