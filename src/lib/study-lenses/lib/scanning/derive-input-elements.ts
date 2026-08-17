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

// ECMA-262 §12.3 (15th edition) gives LineTerminator exactly these four
// characters. The parser skips the last two the same way it skips a tab, so
// nothing but this table separates them from whitespace.
const LINE_TERMINATORS = new Set(['\n', '\r', '\u2028', '\u2029']);

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
 * array rather than throwing. That is what keeps this phase total, so the
 * boundary stays the module's only throw site — and the guard earns its keep
 * arithmetically: without it the end expression would resolve to one past the
 * opener, and the span would silently take the opener's own extent instead.
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
 * Two token types carry a chunk and both are admitted: the parser types a
 * chunk carrying an escape the language permits only under a tag differently
 * from an ordinary one, rather than refusing the program. Admitting only the
 * ordinary type would name the `}` before such a chunk a `RightBracePunctuator`
 * and leave the template's own closing backtick opening a run instead of
 * ending one.
 */
function isTemplateChunk(token: acorn.Token | undefined): boolean {
	return token?.type === tt.template || token?.type === tt.invalidTemplate;
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
			? gapElements(previousEnd, element.start, code).concat(element)
			: [element];
	});
	const lastEnd = named.at(-1)?.end ?? 0;

	return lastEnd < code.length
		? gapped.concat(gapElements(lastEnd, code.length, code))
		: gapped;
}

/**
 * Cut one gap into maximal runs of a single kind, one element each. Splitting
 * and naming are one act: which kind a run is decides where it ends, so a gap
 * holding both kinds yields one element per run rather than one per gap.
 */
/* eslint-disable functional/immutable-data -- local accumulator, never escapes until returned */
function gapElements(
	start: number,
	end: number,
	code: string,
): readonly InputElement[] {
	const elements: InputElement[] = [];
	let runStart = start;

	while (runStart < end) {
		const nextRunStart = endOfGapRun(runStart, end, code);

		elements.push(gapElement(runStart, nextRunStart, code));
		runStart = nextRunStart;
	}

	return elements;
}
/* eslint-enable functional/immutable-data -- scoped mutation confined to the block above */

/**
 * One past the last character of the maximal same-kind run opening at `start`.
 * The two trivia kinds never merge, so the run ends at the first character
 * that answers the line-terminator question differently from its opener.
 */
function endOfGapRun(start: number, end: number, code: string): number {
	const opensWithLineTerminator = LINE_TERMINATORS.has(code[start]);
	let position = start + 1;

	while (
		position < end &&
		LINE_TERMINATORS.has(code[position]) === opensWithLineTerminator
	) {
		position += 1;
	}

	return position;
}

/**
 * One trivia element covering one same-kind run within a gap — a whole gap
 * only when the gap holds a single kind. It wraps no parser token, so it
 * carries no token index.
 *
 * `<CR><LF>` is one element here rather than the two the specification
 * reads, which is this module's stated run-collapsing departure.
 */
function gapElement(start: number, end: number, code: string): InputElement {
	const text = code.slice(start, end);

	return {
		kind: isLineTerminatorRun(text) ? 'LineTerminator' : 'WhiteSpace',
		start,
		end,
		text,
		tokenIndices: [],
	};
}

// A gap is named by the characters it holds, never by the tokens around it.
function isLineTerminatorRun(text: string): boolean {
	return Array.from(text).every((character) => LINE_TERMINATORS.has(character));
}
