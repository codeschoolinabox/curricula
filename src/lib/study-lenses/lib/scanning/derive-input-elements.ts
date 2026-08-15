import * as acorn from 'acorn';

import type { InputElement, InputElementKind, ScanInput } from './types.js';

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
	const named = tokens.map((token, index) => nameElement(token, index, code));

	return fillGaps(named, code);
}

const tt = acorn.tokTypes;

// The productions a token type names on its own. Every type absent from this
// table is CURRENTLY treated as a `Punctuator`, which is §12.8's catch-all
// once the productions carrying their own rows are taken out of it — but
// several absent types have their own production and are simply not
// triangulated yet. Two of those productions can never be reached by a row
// here at all: `/=` shares one token type with every other compound
// assignment, so the source slice decides, as phase 3 of the sketch says.
const KIND_BY_TOKEN_TYPE = new Map<acorn.TokenType, InputElementKind>([
	[tt.name, 'IdentifierName'],
	[tt.num, 'NumericLiteral'],
]);

/**
 * Phase 3 — name one token-channel element and attach its verbatim slice.
 */
function nameElement(
	token: acorn.Token,
	index: number,
	code: string,
): InputElement {
	return {
		kind: KIND_BY_TOKEN_TYPE.get(token.type) ?? 'Punctuator',
		start: token.start,
		end: token.end,
		text: code.slice(token.start, token.end),
		tokenIndices: [index],
	};
}

/**
 * Phase 5 — fill every gap the token channel left, so the sequence tiles
 * the source. A gap before the first element and one after the last are
 * the same case as a gap between two, which is why neither is special.
 */
function fillGaps(
	named: readonly InputElement[],
	code: string,
): readonly InputElement[] {
	const gapped = named.flatMap(function precedeWithGap(element, index) {
		// At index 0 this reads `named[-1]`, which is `undefined` rather than
		// the last element — so the leading edge falls out as offset zero.
		const previousEnd = named[index - 1]?.end ?? 0;

		return element.start > previousEnd
			? [gapElement(previousEnd, element.start, code), element]
			: [element];
	});
	const lastEnd = named.at(-1)?.end ?? 0;

	return lastEnd < code.length
		? gapped.concat(gapElement(lastEnd, code.length, code))
		: gapped;
}

/**
 * One trivia element covering a gap. It wraps no parser token, so it
 * carries no token index.
 */
function gapElement(start: number, end: number, code: string): InputElement {
	return {
		kind: 'WhiteSpace',
		start,
		end,
		text: code.slice(start, end),
		tokenIndices: [],
	};
}
