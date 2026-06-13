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

// Order matters where branches overlap: contextual keywords (`let`, `of`, …)
// are `name` tokens, so the keyword check must precede the identifier check.
// Reserved keyword-operators (`in` / `instanceof` / `typeof` / `void` /
// `delete`) match only this keyword branch — their operator nature is added
// later as an AST alternate — so keyword-before-operator is conceptual
// ordering, not a contested precedence.
function homeCategory(token: acorn.Token, text: string): Category {
	const { type } = token;
	if (DELIMITER_TYPES.has(type)) {
		return 'delimiter';
	}
	if (typeof type.keyword === 'string' || isContextualKeyword(token, text)) {
		return 'keyword';
	}
	if (OPERATOR_TYPES.has(type)) {
		return 'operator';
	}
	if (type === tt.name || type === tt.privateId) {
		return 'identifier';
	}
	if (LITERAL_TYPES.has(type)) {
		return 'literal';
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

// Every operator token type. Equality / relational / bit-shift / inc-dec each
// share ONE token type across their variants, so identity covers them all.
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
]);

// `invalidTemplate` is the template chunk Acorn emits for an illegal escape in
// a tagged template (`` tag`\unicode` ``) — still a parseable literal chunk.
const LITERAL_TYPES = new Set<acorn.TokenType>([
	tt.num,
	tt.string,
	tt.regexp,
	tt.template,
	tt.invalidTemplate,
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
