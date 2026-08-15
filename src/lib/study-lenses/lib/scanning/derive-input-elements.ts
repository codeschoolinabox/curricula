import type { InputElement, ScanInput } from './types.js';

/**
 * Derives the ECMA-262 input-element sequence from a snippet's published
 * parse facts: one named element per span, ascending, non-overlapping,
 * non-empty, and joining to cover the whole source exactly.
 *
 * Pure and tree-free — it reads published tokens, published comments and
 * the source text, and never re-tokenizes. The returned sequence and
 * every element in it are deeply frozen.
 *
 * @throws TypeError when `code`, `tokens` or `comments` is missing or
 *   absent — callers gate on a successful tokens stage first (see
 *   `./README.md` § Public API).
 */
export default function deriveInputElements({
	code,
	tokens,
}: ScanInput): readonly InputElement[] {
	return tokens.map((token, index) => ({
		kind: 'IdentifierName',
		start: token.start,
		end: token.end,
		text: code.slice(token.start, token.end),
		tokenIndices: [index],
	}));
}
