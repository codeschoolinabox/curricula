import * as acorn from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type {
	Category,
	ClassifiedToken,
	ClassifyInput,
	Role,
} from './types.js';

/**
 * Classify every token of a parsed snippet into the five-category house
 * taxonomy (see `./README.md` § The taxonomy). Returns one `ClassifiedToken`
 * per non-empty source token, in source order — total and pure (inputs are
 * never mutated; safe on frozen embodiment data).
 *
 * Increment scope: home category + token-derivable role seed + delimiter
 * pairing + the `block` brace role + closer-role inheritance. Each
 * `categories` is single-element (AST alternates land later); paren and
 * operator AST roles land later.
 *
 * @throws TypeError when `code`, `tokens`, or `ast` is missing or null —
 *   callers gate on a successful parse (see `./README.md` § Public API).
 */
export default function classifyTokens({
	code,
	tokens,
	ast,
}: ClassifyInput): readonly ClassifiedToken[] {
	if (typeof code !== 'string' || isNullish(tokens) || isNullish(ast)) {
		throw new TypeError(
			'classifyTokens requires { code, tokens, ast } from a parsed snippet',
		);
	}

	const kept = tokens.filter(
		(token) => token.type !== tt.eof && token.end > token.start,
	);
	const seeded = kept.map((token) => classifyToken(token, code));
	const refined = refineOpenerRoles(seeded, ast);
	const partners = computePartners(kept);
	const paired = inheritFromPartners(refined, partners);

	return deepFreezeInPlace(paired);
}

function classifyToken(token: acorn.Token, code: string): ClassifiedToken {
	const { start, end } = token;
	const text = code.slice(start, end);
	const category = homeCategory(token, text);
	return {
		text,
		start,
		end,
		categories: [category],
		role: roleSeed(token, category),
		partner: null,
	};
}

// AST role refinement (openers only): a `BlockStatement` opener `{` becomes
// `block`. Object-literal, switch, and other braces keep their seed. Paren and
// operator opener roles land in later increments. Closer roles are phase 4's
// job (see `inheritFromPartners`).
function refineOpenerRoles(
	tokens: ReadonlyArray<ClassifiedToken>,
	ast: acorn.Node,
): ReadonlyArray<ClassifiedToken> {
	const blockStarts = new Set(collectBlockStarts(ast));
	return tokens.map(function refine(token) {
		if (token.text === '{' && blockStarts.has(token.start)) {
			return { ...token, role: 'block' };
		}
		return token;
	});
}

function collectBlockStarts(node: acorn.Node): ReadonlyArray<number> {
	const here = node.type === 'BlockStatement' ? [node.start] : [];
	const childStarts = astChildren(node).flatMap((child) =>
		collectBlockStarts(child),
	);
	return [...here, ...childStarts];
}

function astChildren(node: acorn.Node): ReadonlyArray<acorn.Node> {
	const record = node as unknown as Record<string, unknown>;
	return Object.entries(record).flatMap(function childrenOf([key, value]) {
		if (key === 'parent') {
			return [];
		}
		if (Array.isArray(value)) {
			return value.filter((item) => isAstNode(item));
		}
		return isAstNode(value) ? [value] : [];
	});
}

function isAstNode(value: unknown): value is acorn.Node {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as { readonly type?: unknown }).type === 'string'
	);
}

// Closer inheritance (the last pass, so opener roles are final): each closer
// inherits its opener's role across the `partner` link — a block `}` becomes
// `block`, a closing backtick inherits `template-delimiter`, a `)` inherits its
// `(`'s role. `partners` aligns by index with `tokens` (both derived from the
// kept list in source order).
function inheritFromPartners(
	tokens: ReadonlyArray<ClassifiedToken>,
	partners: ReadonlyArray<number | null>,
): ReadonlyArray<ClassifiedToken> {
	return tokens.map(function link(token, index) {
		const partner = partners[index];
		const role =
			partner !== null && partner < index ? tokens[partner].role : token.role;
		return partner === token.partner && role === token.role
			? token
			: { ...token, partner, role };
	});
}

// Match paired delimiters by a stack walk over the kept tokens (by Acorn token
// type, so a template chunk whose text is `(` is never mistaken for a paren),
// returning each token's partner index (into the same array) or null. Backtick
// is one token type for open AND close — it closes iff the stack top is a
// pending backtick, else opens. `}` closes whichever of `{` / `${` is on top.
// The local stack and result array never escape this function, so the in-place
// mutation is safe.
/* eslint-disable functional/immutable-data -- local stack + result array, never escape this pure function */
function computePartners(
	tokens: ReadonlyArray<acorn.Token>,
): ReadonlyArray<number | null> {
	const partner: Array<number | null> = tokens.map(() => null);
	const stack: Array<{ index: number; closer: acorn.TokenType }> = [];
	for (const [index, token] of tokens.entries()) {
		const { type } = token;
		const closer = OPENER_CLOSERS.get(type);
		if (closer !== undefined) {
			stack.push({ index, closer });
			continue;
		}
		const top = stack.at(-1);
		if (type === tt.backQuote && top?.closer !== tt.backQuote) {
			stack.push({ index, closer: tt.backQuote });
			continue;
		}
		if (top?.closer === type) {
			stack.pop();
			partner[index] = top.index;
			partner[top.index] = index;
		}
	}
	return partner;
}
/* eslint-enable functional/immutable-data */

// Categories are SEMANTIC, not lexical: a "keyword" indicates a statement /
// declaration / control structure acting on the NM, and does not transform
// or produce a value. So the reserved-word operators (`typeof`, `in`,
// `instanceof`, `void`, `delete`) and reserved-word literals (`null`, `true`,
// `false`) — though Acorn flags them `.keyword` — are operators and literals
// by what they DO, and the OPERATOR_TYPES / LITERAL_TYPES checks must precede
// the keyword check. Keyword then precedes identifier so contextual keywords
// (`let`, `of`, …), which Acorn emits as `name` tokens, classify as keyword.
function homeCategory(token: acorn.Token, text: string): Category {
	const { type } = token;
	if (DELIMITER_TYPES.has(type)) {
		return 'delimiter';
	}
	if (OPERATOR_TYPES.has(type)) {
		return 'operator';
	}
	if (LITERAL_TYPES.has(type)) {
		return 'literal';
	}
	if (typeof type.keyword === 'string' || isContextualKeyword(token, text)) {
		return 'keyword';
	}
	if (type === tt.name || type === tt.privateId) {
		return 'identifier';
	}
	return 'delimiter';
}

function isContextualKeyword(token: acorn.Token, text: string): boolean {
	return token.type === tt.name && CONTEXTUAL_KEYWORDS.has(text);
}

function isNullish(value: unknown): boolean {
	return value === null || value === undefined;
}

function roleSeed(token: acorn.Token, category: Category): Role | null {
	if (category === 'delimiter') {
		return DELIMITER_ROLE_SEEDS.get(token.type) ?? 'other';
	}
	if (category === 'literal') {
		return LITERAL_ROLE_SEEDS.get(token.type) ?? 'other';
	}
	if (category === 'operator') {
		return 'other';
	}
	return null;
}

const tt = acorn.tokTypes;

// Paired-delimiter openers → the token type that closes them. Backtick is
// absent (its own open/close toggle, handled in `computePartners`); `${` and
// `{` both close with `}` (`braceR`).
const OPENER_CLOSERS = new Map<acorn.TokenType, acorn.TokenType>([
	[tt.parenL, tt.parenR],
	[tt.bracketL, tt.bracketR],
	[tt.braceL, tt.braceR],
	[tt.dollarBraceL, tt.braceR],
]);

// Punctuator token types that are delimiters in the house taxonomy — ternary
// `?`/`:`, `=>`, `?.`, `...`, and the template backtick included.
const DELIMITER_TYPES = new Set<acorn.TokenType>([
	tt.parenL,
	tt.parenR,
	tt.braceL,
	tt.braceR,
	tt.bracketL,
	tt.bracketR,
	tt.dollarBraceL,
	tt.semi,
	tt.comma,
	tt.dot,
	tt.arrow,
	tt.question,
	tt.colon,
	tt.questionDot,
	tt.ellipsis,
	tt.backQuote,
]);

// Every operator token type. Punctuator operators (equality / relational /
// bit-shift / inc-dec each share ONE token type across their variants) plus
// the reserved-word operators (`typeof`, `in`, `instanceof`, `void`,
// `delete`) — value-producing, so operators despite their `.keyword` flag.
// (`in` is an operator here even in `for (… in …)`, where it is statement
// glue; disambiguating that needs the AST and is out of JEJ scope.)
const OPERATOR_TYPES = new Set<acorn.TokenType>([
	tt.eq,
	tt.assign,
	tt.incDec,
	tt.prefix,
	tt.logicalOR,
	tt.logicalAND,
	tt.bitwiseOR,
	tt.bitwiseXOR,
	tt.bitwiseAND,
	tt.equality,
	tt.relational,
	tt.bitShift,
	tt.plusMin,
	tt.modulo,
	tt.star,
	tt.slash,
	tt.starstar,
	tt.coalesce,
	tt._typeof,
	tt._instanceof,
	tt._in,
	tt._void,
	tt._delete,
]);

// Every literal token type. `num` / `string` / `regexp` / `template` (and
// `invalidTemplate`, the chunk Acorn emits for an illegal escape in a tagged
// template `` tag`\unicode` `` — still a parseable chunk), plus the
// reserved-word literals `null` / `true` / `false` — values, so literals
// despite their `.keyword` flag.
const LITERAL_TYPES = new Set<acorn.TokenType>([
	tt.num,
	tt.string,
	tt.regexp,
	tt.template,
	tt.invalidTemplate,
	tt._null,
	tt._true,
	tt._false,
]);

const DELIMITER_ROLE_SEEDS = new Map<acorn.TokenType, Role>([
	[tt.semi, 'statement-end'],
	[tt.dot, 'member-access'],
	[tt.questionDot, 'member-access'],
	[tt.backQuote, 'template-delimiter'],
	[tt.dollarBraceL, 'template-expression'],
]);

const LITERAL_ROLE_SEEDS = new Map<acorn.TokenType, Role>([
	[tt.num, 'number'],
	[tt.string, 'string'],
	[tt.regexp, 'regexp'],
	[tt.template, 'template-chunk'],
	[tt.invalidTemplate, 'template-chunk'],
	[tt._null, 'null'],
	[tt._true, 'boolean'],
	[tt._false, 'boolean'],
]);

// Tokens acorn emits as `name` (no `.keyword` flag) that JEJ treats as
// keywords wherever they appear (see `./README.md` § Edge cases).
const CONTEXTUAL_KEYWORDS = new Set<string>([
	'let',
	'static',
	'async',
	'await',
	'yield',
	'of',
	'as',
	'from',
	'get',
	'set',
]);
