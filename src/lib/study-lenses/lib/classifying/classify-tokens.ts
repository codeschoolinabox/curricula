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
 * Increment 1 scope: home category + token-derivable role seed only. Each
 * `categories` is single-element (AST alternates land later); `partner` is
 * always `null` (pairing lands later); `ast` is validated but not yet walked.
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

	const classified = tokens
		.filter((token) => token.type !== tt.eof && token.end > token.start)
		.map((token) => classifyToken(token, code));

	return deepFreezeInPlace(classified);
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
