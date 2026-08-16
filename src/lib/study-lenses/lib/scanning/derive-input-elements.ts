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
	const folded = foldTemplateRuns(tokens);
	const named = folded.map((span) => nameElement(span, code));

	return fillGaps(named, code);
}

const tt = acorn.tokTypes;

// The production a token type names on its own. A type absent from this table
// is a `Punctuator` — §12.8's catch-all once the productions carrying their
// own rows are taken out of it.
const KIND_BY_TOKEN_TYPE = new Map<acorn.TokenType, InputElementKind>([
	[tt.name, 'IdentifierName'],
	[tt.num, 'NumericLiteral'],
	[tt.privateId, 'PrivateIdentifier'],
	[tt.slash, 'DivPunctuator'],
	[tt.braceR, 'RightBracePunctuator'],
	[tt.regexp, 'RegularExpressionLiteral'],
	[tt.string, 'StringLiteral'],
]);

/**
 * A token-channel span before it is named: where it sits in the source, the
 * positions of the tokens it wraps, and the token it opens with — which is
 * what names it. A folded template run wraps several tokens; every other span
 * wraps exactly one.
 */
type TokenSpan = {
	readonly opener: acorn.Token;
	readonly start: number;
	readonly end: number;
	readonly tokenIndices: ReadonlyArray<number>;
};

/**
 * Phase 2 — fold each template run into one span, fixing the element list for
 * the token channel before anything is named. A backtick, or a right brace
 * continuing a template, opens a run of `opener · chunk · closer`; every other
 * token spans itself. Nesting needs no stack: the walk resumes past a run's
 * closer, so an inner run is reached only after the run containing it has
 * closed — and the same property is what keeps a run's own closing backtick
 * from being read as the opener of a new one.
 */
/* eslint-disable functional/immutable-data -- local accumulator, never escapes until returned */
function foldTemplateRuns(
	tokens: ReadonlyArray<acorn.Token>,
): ReadonlyArray<TokenSpan> {
	const everyIndex = Array.from(tokens.keys());
	const spans: TokenSpan[] = [];
	let index = 0;

	while (index < tokens.length) {
		const opener = tokens[index];
		const end = opensTemplateRun(tokens, index)
			? runEnd(tokens, index)
			: index + 1;

		spans.push({
			opener,
			start: opener.start,
			end: tokens[end - 1].end,
			tokenIndices: everyIndex.slice(index, end),
		});
		index = end;
	}

	return spans;
}
/* eslint-enable functional/immutable-data -- scoped mutation confined to the block above */

/**
 * One past the closer of a template run opened at `openerIndex`. The parser
 * emits exactly one chunk between a run's delimiters — zero-width where the
 * template has no text there — so the search stops at the first token that is
 * not a chunk and takes that one as the closer.
 *
 * A run whose closer never arrives is reported as ending at the end of the
 * array rather than throwing: this phase stays total, and the boundary keeps
 * the only throw site. That branch is reachable today, not theoretical — a
 * chunk type this module does not yet recognize breaks the search, and the run
 * it opened then finds no closer. It is dead only once every template-chunk
 * type is admitted below.
 */
function runEnd(
	tokens: ReadonlyArray<acorn.Token>,
	openerIndex: number,
): number {
	const chunkCount = tokens
		.slice(openerIndex + 1)
		.findIndex((token) => !isTemplateChunk(token));

	return chunkCount === -1 ? tokens.length : openerIndex + chunkCount + 2;
}

/**
 * A backtick opens a template run, and so does a right brace whose immediate
 * successor is a template chunk — the parser emits a chunk directly after a
 * backtick or a continuation brace and nowhere else, which is what makes one
 * token of lookahead exact. Every other right brace closes a block, an object
 * or an interpolation, and is a `RightBracePunctuator`.
 */
function opensTemplateRun(
	tokens: ReadonlyArray<acorn.Token>,
	index: number,
): boolean {
	const token = tokens[index];

	if (token.type === tt.backQuote) return true;

	return token.type === tt.braceR && isTemplateChunk(tokens[index + 1]);
}

/**
 * The text run between a template's delimiters, as the parser emits it. The
 * successor of the last token is absent, and absent is not a chunk — which is
 * what lets the lookahead read past the end of the array without a bounds
 * test at each call site.
 *
 * Two token types carry a chunk, and only one is recognized here. The other —
 * the type the parser gives a chunk carrying an escape the language permits
 * only under a tag — is not yet triangulated by a live test, and until it is,
 * a tagged template carrying such an escape is read wrongly: its `}` is named
 * a `RightBracePunctuator`, its closing backtick is mistaken for an opener,
 * and the span that opener starts swallows whatever follows the template.
 */
function isTemplateChunk(token: acorn.Token | undefined): boolean {
	return token?.type === tt.template;
}

/**
 * Phase 3 — name one token-channel element and attach its verbatim slice.
 */
function nameElement(span: TokenSpan, code: string): InputElement {
	const text = code.slice(span.start, span.end);

	return {
		kind: elementKind(span, text),
		start: span.start,
		end: span.end,
		text,
		tokenIndices: span.tokenIndices,
	};
}

/**
 * The production a span names. A folded run takes its name from its opener; a
 * lone token takes its name from its own type. Every reserved word carries a
 * keyword on its type — thirty-five of them — and all thirty-five name the
 * identifier production, so the collapse is one test rather than a list.
 * The contextual keywords never reach it: the parser already types `let`
 * and its family as plain identifiers.
 *
 * Where one type serves several productions the source slice decides, and
 * that is the whole reason this takes the text as well as the span.
 */
function elementKind(span: TokenSpan, text: string): InputElementKind {
	const { opener } = span;

	// A run opened by a backtick is a `Template`; one opened by a continuation
	// brace is a `TemplateSubstitutionTail`. Each kind covers two of the
	// specification's productions, distinguished only by which closer ended
	// the run — a distinction this module deliberately does not publish.
	if (isFoldedRun(span)) {
		return opener.type === tt.backQuote
			? 'Template'
			: 'TemplateSubstitutionTail';
	}

	if (typeof opener.type.keyword === 'string') return 'IdentifierName';

	// Every compound assignment shares one token type, so `/=` is separated
	// from `+=`, `**=` and `??=` by the characters its own span points at —
	// not by its length, and not by anything the type can be asked.
	if (opener.type === tt.assign) {
		return text === '/=' ? 'DivPunctuator' : 'Punctuator';
	}

	return KIND_BY_TOKEN_TYPE.get(opener.type) ?? 'Punctuator';
}

// Only a folded template run wraps more than one token.
function isFoldedRun(span: TokenSpan): boolean {
	return span.tokenIndices.length > 1;
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
