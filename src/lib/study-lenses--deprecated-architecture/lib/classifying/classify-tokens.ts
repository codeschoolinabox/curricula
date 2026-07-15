import * as acorn from 'acorn';

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type {
	Category,
	ClassifiedToken,
	ClassifyInput,
	DelimiterRole,
	OperatorRole,
	Role,
} from './types.js';

/**
 * Classify every token of a parsed snippet into the five-category house
 * taxonomy (see `./README.md` § The taxonomy). Returns one `ClassifiedToken`
 * per non-empty source token, in source order — total and pure (inputs are
 * never mutated; safe on frozen embodiment data).
 *
 * Per token: home category + token-derivable role seed + delimiter pairing +
 * brace/paren opener roles (`block`, `call-arguments`, `control-head`,
 * `grouping`) + operator roles (`declarator-init` / `assignment` and
 * `binary` / `logical` / `unary` / `update`) + the generator-`*` re-bin
 * (`operator` → `delimiter`, role `generator`) + closer-role inheritance.
 * Each `categories` is single-element (AST alternates and contextual-keyword
 * re-categorization land later).
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
	const refined = refineFromAst(seeded, ast);
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

// AST refinement (one descent — see `collectAstRefinements`): assign each opener
// delimiter and operator its AST-context role, and perform the single sanctioned
// home-category change (the generator-`*` re-bin). A `BlockStatement` `{` is
// `block`; a paren is `call-arguments` / `control-head` / `grouping` / `other`
// (see `./DOCS.md` § Structural constraints — grouping is by elimination, sound
// only because the claim list is exhaustive). An operator takes its owning node's
// role (`declarator-init` / `assignment` / `binary` / `logical` / `unary` /
// `update`), else keeps its `'other'` seed. A `*` in generator position moves
// `operator` → `delimiter`, role `generator` — the `*` of `yield*` and
// `import *` stays an operator. Closer roles are phase 4's job (see
// `inheritFromPartners`).
function refineFromAst(
	tokens: ReadonlyArray<ClassifiedToken>,
	ast: acorn.Node,
): ReadonlyArray<ClassifiedToken> {
	const parenStarts = tokens
		.filter((token) => isParenOpener(token))
		.map((token) => token.start);
	const operatorStarts = tokens
		.filter((token) => isOperator(token))
		.map((token) => token.start);
	const starStarts = tokens
		.filter((token) => isStarOperator(token))
		.map((token) => token.start);
	const { blockStarts, parenClaims, operatorClaims, generatorStarClaims } =
		collectAstRefinements(ast);
	const blockOpeners = new Set(blockStarts);
	const parenRoles = resolveParenClaims(parenClaims, parenStarts);
	const operatorRoles = resolveOperatorClaims(operatorClaims, operatorStarts);
	const generatorStars = resolveGeneratorStars(generatorStarClaims, starStarts);
	return tokens.map(function refine(token): ClassifiedToken {
		if (generatorStars.has(token.start)) {
			return { ...token, categories: ['delimiter'], role: 'generator' };
		}
		const role = refinedRole(token, blockOpeners, parenRoles, operatorRoles);
		return role === token.role ? token : { ...token, role };
	});
}

// A `{` at a `BlockStatement` start is `block`; a `(` takes its owner's role, or
// `grouping` when no owner claimed it; an operator takes its owning node's role,
// or keeps its `'other'` seed. Every other token keeps its seed. (The generator
// re-bin is handled by the caller, ahead of this dispatch.)
function refinedRole(
	token: ClassifiedToken,
	blockOpeners: ReadonlySet<number>,
	parenRoles: ReadonlyMap<number, DelimiterRole>,
	operatorRoles: ReadonlyMap<number, OperatorRole>,
): Role | null {
	if (isBraceOpener(token)) {
		return blockOpeners.has(token.start) ? 'block' : token.role;
	}
	if (isParenOpener(token)) {
		return parenRoles.get(token.start) ?? 'grouping';
	}
	if (isOperator(token)) {
		return operatorRoles.get(token.start) ?? token.role;
	}
	return token.role;
}

// A claim that the first paren opener in `[anchor, bound)` plays `role`.
type ParenClaim = {
	readonly anchor: number;
	readonly bound: number;
	readonly role: DelimiterRole;
};

// A claim that the first operator token in `[anchor, bound)` plays `role`.
type OperatorClaim = {
	readonly anchor: number;
	readonly bound: number;
	readonly role: OperatorRole;
};

// A range whose first `*` operator token is a generator star (to be re-binned).
type TokenRange = {
	readonly anchor: number;
	readonly bound: number;
};

// One AST traversal (see `./DOCS.md` § Structural constraints): collect every
// `BlockStatement` start offset, every paren-owner claim, every operator-owner
// claim, and every generator-star range in a single descent.
function collectAstRefinements(node: acorn.Node): {
	readonly blockStarts: ReadonlyArray<number>;
	readonly parenClaims: ReadonlyArray<ParenClaim>;
	readonly operatorClaims: ReadonlyArray<OperatorClaim>;
	readonly generatorStarClaims: ReadonlyArray<TokenRange>;
} {
	const blockHere = node.type === 'BlockStatement' ? [node.start] : [];
	const parenHere = parenClaim(node);
	const operatorHere = operatorClaim(node);
	const generatorHere = generatorStarClaim(node);
	const children = astChildren(node).map((child) =>
		collectAstRefinements(child),
	);
	return {
		blockStarts: [
			...blockHere,
			...children.flatMap((child) => child.blockStarts),
		],
		parenClaims: [
			...(parenHere === null ? [] : [parenHere]),
			...children.flatMap((child) => child.parenClaims),
		],
		operatorClaims: [
			...(operatorHere === null ? [] : [operatorHere]),
			...children.flatMap((child) => child.operatorClaims),
		],
		generatorStarClaims: [
			...(generatorHere === null ? [] : [generatorHere]),
			...children.flatMap((child) => child.generatorStarClaims),
		],
	};
}

// The owner claim for a node's paren, or null when the node owns none. The
// anchor points just before the owned `(`; `resolveParenClaims` snaps it to the
// first paren opener in `[anchor, bound)`. The param-list arm claims role
// `'other'` (JEJ assigns param parens no finer role) PURELY to exclude them from
// grouping-by-elimination — an unclaimed function paren would wrongly degrade to
// `grouping`. Order of the branches is irrelevant; node types are disjoint.
function parenClaim(node: acorn.Node): ParenClaim | null {
	if (node.type === 'CallExpression' || node.type === 'NewExpression') {
		const callee = childNode(node, 'callee');
		return callee === null
			? null
			: { anchor: callee.end, bound: node.end, role: 'call-arguments' };
	}
	if (CONTROL_HEAD_TYPES.has(node.type)) {
		return controlHead(node.start, node.end);
	}
	if (node.type === 'DoWhileStatement') {
		const body = childNode(node, 'body');
		return body === null ? null : controlHead(body.end, node.end);
	}
	if (node.type === 'CatchClause') {
		const parameter = childNode(node, 'param');
		const body = childNode(node, 'body');
		return parameter === null || body === null
			? null
			: controlHead(node.start, body.start);
	}
	if (FUNCTION_TYPES.has(node.type)) {
		const parameters = childNodes(node, 'params');
		const body = childNode(node, 'body');
		if (body === null) {
			return null;
		}
		const bound = parameters.length > 0 ? parameters[0].start : body.start;
		return { anchor: node.start, bound, role: 'other' };
	}
	return null;
}

function controlHead(anchor: number, bound: number): ParenClaim {
	return { anchor, bound, role: 'control-head' };
}

// The operator-role claim for a node, or null when the node owns no operator
// token. `=` is `declarator-init` under a `VariableDeclarator` (with `init`) and
// `assignment` under an `AssignmentExpression` (compound `+=` included); binary /
// logical / unary / update come from the owning expression node. The anchor sits
// just before the owned operator; `resolveOperatorClaims` snaps it to the first
// operator token in `[anchor, bound)` (the find-first invariant — between an
// operand's end and its operator lie only closing delimiters, never operators).
// Order of the branches is irrelevant; node types are disjoint.
function operatorClaim(node: acorn.Node): OperatorClaim | null {
	if (node.type === 'VariableDeclarator') {
		const id = childNode(node, 'id');
		const init = childNode(node, 'init');
		return id === null || init === null
			? null
			: { anchor: id.end, bound: init.start, role: 'declarator-init' };
	}
	if (node.type === 'AssignmentExpression') {
		return infixOperatorClaim(node, 'assignment');
	}
	if (node.type === 'BinaryExpression') {
		return infixOperatorClaim(node, 'binary');
	}
	if (node.type === 'LogicalExpression') {
		return infixOperatorClaim(node, 'logical');
	}
	if (node.type === 'UnaryExpression') {
		const argument = childNode(node, 'argument');
		return argument === null
			? null
			: { anchor: node.start, bound: argument.start, role: 'unary' };
	}
	if (node.type === 'UpdateExpression') {
		return updateOperatorClaim(node);
	}
	return null;
}

// An infix operator sits between `left.end` and `right.start`.
function infixOperatorClaim(
	node: acorn.Node,
	role: OperatorRole,
): OperatorClaim | null {
	const left = childNode(node, 'left');
	const right = childNode(node, 'right');
	return left === null || right === null
		? null
		: { anchor: left.end, bound: right.start, role };
}

// A prefix `++` / `--` sits before its argument; a postfix one sits after it.
function updateOperatorClaim(node: acorn.Node): OperatorClaim | null {
	const argument = childNode(node, 'argument');
	if (argument === null) {
		return null;
	}
	return nodeFlag(node, 'prefix')
		? { anchor: node.start, bound: argument.start, role: 'update' }
		: { anchor: argument.end, bound: node.end, role: 'update' };
}

// The generator-star range for a node, or null when the node introduces none. A
// `function*` star sits between the `function` keyword and the name (or the
// params / body when anonymous); a `*method` / `*property` star sits between the
// node start and the key. The `function`-rule bound stops before the params so a
// default-value `*` (`function* g(a = b * c) {}`) is never mistaken for the
// generator star; a generator method's value `FunctionExpression` also matches
// the `function` rule but its start is past the leading `*`, so it claims none.
function generatorStarClaim(node: acorn.Node): TokenRange | null {
	if (isGeneratorFunction(node)) {
		const body = childNode(node, 'body');
		return body === null
			? null
			: { anchor: node.start, bound: functionHeadBound(node, body) };
	}
	if (node.type === 'MethodDefinition' || node.type === 'Property') {
		const value = childNode(node, 'value');
		const key = childNode(node, 'key');
		return value === null || key === null || !nodeFlag(value, 'generator')
			? null
			: { anchor: node.start, bound: key.start };
	}
	return null;
}

// The end of a generator function's header — the name when present, else the
// first parameter, else the body — bounding the claim to the `function *` prefix
// so no default-value expression inside the params is reached.
function functionHeadBound(node: acorn.Node, body: acorn.Node): number {
	const id = childNode(node, 'id');
	if (id !== null) {
		return id.start;
	}
	const parameters = childNodes(node, 'params');
	return parameters.length > 0 ? parameters[0].start : body.start;
}

function isGeneratorFunction(node: acorn.Node): boolean {
	return (
		(node.type === 'FunctionDeclaration' ||
			node.type === 'FunctionExpression') &&
		nodeFlag(node, 'generator')
	);
}

function childNode(node: acorn.Node, key: string): acorn.Node | null {
	const value = (node as unknown as Record<string, unknown>)[key];
	return isAstNode(value) ? value : null;
}

function childNodes(node: acorn.Node, key: string): ReadonlyArray<acorn.Node> {
	const value = (node as unknown as Record<string, unknown>)[key];
	return Array.isArray(value) ? value.filter((item) => isAstNode(item)) : [];
}

function nodeFlag(node: acorn.Node, key: string): boolean {
	return (node as unknown as Record<string, unknown>)[key] === true;
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

// Snap each claim's anchor to the first paren opener at/after it (within the
// claim's bound), mapping that opener's offset to the claimed role. First-writer
// wins: a parent owner is emitted before its descendants, so it keeps the paren
// — insurance against future overlapping claims (none overlap in valid JS today).
/* eslint-disable functional/immutable-data -- local Map, never escapes until returned */
function resolveParenClaims(
	claims: ReadonlyArray<ParenClaim>,
	parenStarts: ReadonlyArray<number>,
): ReadonlyMap<number, DelimiterRole> {
	const roleByOffset = new Map<number, DelimiterRole>();
	for (const { anchor, bound, role } of claims) {
		const offset = firstStartInRange(parenStarts, anchor, bound);
		if (offset !== undefined && !roleByOffset.has(offset)) {
			roleByOffset.set(offset, role);
		}
	}
	return roleByOffset;
}
/* eslint-enable functional/immutable-data */

// Snap each operator claim to the first operator token in its range, mapping that
// offset to the claimed role. First-writer wins (parent before descendants), as
// for parens; operator claim ranges do not overlap in valid JS.
/* eslint-disable functional/immutable-data -- local Map, never escapes until returned */
function resolveOperatorClaims(
	claims: ReadonlyArray<OperatorClaim>,
	operatorStarts: ReadonlyArray<number>,
): ReadonlyMap<number, OperatorRole> {
	const roleByOffset = new Map<number, OperatorRole>();
	for (const { anchor, bound, role } of claims) {
		const offset = firstStartInRange(operatorStarts, anchor, bound);
		if (offset !== undefined && !roleByOffset.has(offset)) {
			roleByOffset.set(offset, role);
		}
	}
	return roleByOffset;
}
/* eslint-enable functional/immutable-data */

// The offsets of every generator star: the first `*` operator token in each
// claim's range. A generator method's value `FunctionExpression` contributes an
// empty claim (its start is past the leading `*`), so the `Set` makes any such
// overlap idempotent.
/* eslint-disable functional/immutable-data -- local Set, never escapes until returned */
function resolveGeneratorStars(
	claims: ReadonlyArray<TokenRange>,
	starStarts: ReadonlyArray<number>,
): ReadonlySet<number> {
	const offsets = new Set<number>();
	for (const { anchor, bound } of claims) {
		const offset = firstStartInRange(starStarts, anchor, bound);
		if (offset !== undefined) {
			offsets.add(offset);
		}
	}
	return offsets;
}
/* eslint-enable functional/immutable-data */

// The first candidate offset in `[anchor, bound)`. `starts` is in source order,
// so `find` returns the lexically-first match — the owned token for every claim
// (no non-owned candidate precedes it in an owner's range; see `./DOCS.md` §
// Structural constraints, the find-first invariant).
function firstStartInRange(
	starts: ReadonlyArray<number>,
	anchor: number,
	bound: number,
): number | undefined {
	return starts.find((start) => start >= anchor && start < bound);
}

// A real `(` / `{` opener is a delimiter-category token; a template chunk whose
// text is `(` / `{` is a literal, so it is never mistaken for a delimiter.
function isParenOpener(token: ClassifiedToken): boolean {
	return token.text === '(' && token.categories[0] === 'delimiter';
}

function isBraceOpener(token: ClassifiedToken): boolean {
	return token.text === '{' && token.categories[0] === 'delimiter';
}

function isOperator(token: ClassifiedToken): boolean {
	return token.categories[0] === 'operator';
}

// A `*` in operator position (a multiply / `yield*` / namespace `*`); the AST
// pass re-bins only the ones in generator position to `delimiter`.
function isStarOperator(token: ClassifiedToken): boolean {
	return token.text === '*' && isOperator(token);
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

// AST node types whose head paren is the first `(` after the keyword (anchor =
// `node.start`). `do…while` (tail paren) and `catch` (optional binding) need
// their own anchors and are handled separately in `parenClaim`.
const CONTROL_HEAD_TYPES = new Set<string>([
	'IfStatement',
	'WhileStatement',
	'ForStatement',
	'ForInStatement',
	'ForOfStatement',
	'SwitchStatement',
]);

// AST node types whose parameter-list paren is claimed `'other'`. Methods,
// getters, setters, and accessors are `FunctionExpression` values, so they are
// covered here without a separate branch.
const FUNCTION_TYPES = new Set<string>([
	'FunctionDeclaration',
	'FunctionExpression',
	'ArrowFunctionExpression',
]);

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
