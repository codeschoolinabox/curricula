/**
 * @file Pure two-pass derivation for the `blanks` lens: AST classify +
 * raw-token-stream position, followed by seeded selection and fragment
 * build. Produces the `BlanksDerivation` the React wrapper renders.
 * No React imports.
 *
 * @remarks Per `./DOCS.md` § Execution phases, Phase 3 has four
 * sub-steps:
 * 1. **Classify** — walks the raw token stream once to apply
 *    token-type rules (keyword text match, identifier/literal/operator
 *    labels), then walks the AST to override Identifier and Literal
 *    node positions (so `true`/`false`/`null` are `literals`, not
 *    `keywords`; `let` as a variable name is `identifiers`, not
 *    `keywords`). Result: a start-offset → `TokenCategory` map.
 * 2. **Position** — walks tokens in source order, looking up each
 *    in the classifier map. Tokens not in the map are skipped;
 *    tokens in disabled categories are skipped.
 * 3. **Select** — for each eligible token, draws from a seeded LCG;
 *    keeps the token as a `Blank` (contiguous 0-based `index`) when
 *    the draw is below `difficulty / 100`.
 * 4. **Build fragments** — walks `embodiment.source.code`
 *    interleaving `text` fragments for non-blank stretches with
 *    `blank` fragments at selected ranges.
 *
 * @remarks Keyword classification uses a text-match approach (against
 * a fixed `KEYWORDS` set) rather than Acorn's `tok.type.keyword` flag,
 * because **contextual keywords** (`let`, `const` in some contexts,
 * `of`, `async`, `await`, `yield`, `static`) are lexed as `name`
 * tokens by Acorn — the parser disambiguates by position. Text match
 * catches every keyword the lens surfaces (per `./README.md` §
 * Glossary § Token category § keywords).
 */

import { freezeInPlace } from '@utils/freeze.js';

import type { Snippet } from '../../embody/types.js';

import type {
	Blank,
	BlanksDerivation,
	DisplayFragment,
	EligibleToken,
	TokenCategory,
	TextFragment,
	BlankFragment,
} from './types.js';

/**
 * Minimal duck-typed shapes for Acorn AST nodes + tokens. Acorn types
 * are not exported from `embody/types.ts` (the `raw.ast` / `raw.tokens`
 * fields are typed as `AcornNode | null` / `ReadonlyArray<unknown>`
 * respectively); these local types narrow the runtime shape this file
 * actually consumes.
 */
type AcornNode = {
	readonly type: string;
	readonly start: number;
	readonly end: number;
	readonly [key: string]: unknown;
};

type AcornTokenType = {
	readonly label: string;
	readonly keyword?: string;
	readonly binop?: number | null;
	readonly prefix?: boolean;
	readonly postfix?: boolean;
	readonly isAssign?: boolean;
};

type AcornToken = {
	readonly type: AcornTokenType;
	readonly value: unknown;
	readonly start: number;
	readonly end: number;
};

/**
 * Two-pass derivation entry-point. See file-header for the four
 * sub-steps and `../DOCS.md` § Execution phases for the architectural
 * sketch.
 *
 * @param embodiment - Frozen `Snippet` (must have `status.parsed ===
 *   true`; gated by the lens's `applicableTo`).
 * @param difficulty - Probability (0–100) per eligible token of being
 *   selected as a blank. Out-of-range values are clamped.
 * @param tokenCategories - The enabled categories; tokens not in this
 *   set are not eligible.
 * @param seed - Numeric seed for the deterministic sampler. Wrapper
 *   computes a per-mount random seed when caller does not pin one.
 * @returns Frozen `BlanksDerivation` (`{ fragments, blanks }`).
 */
function deriveBlanks(
	embodiment: Snippet,
	difficulty: number,
	tokenCategories: ReadonlyArray<TokenCategory>,
	seed: number,
): BlanksDerivation {
	const categories = new Set(tokenCategories);
	const ast = embodiment.raw.ast as AcornNode | null;
	const tokens = (embodiment.raw.tokens ?? []) as ReadonlyArray<AcornToken>;
	const source = embodiment.source.code;

	const classifierMap = classify(ast, tokens, source);
	const eligible = position(tokens, source, classifierMap, categories);
	const blanks = select(eligible, difficulty, seed);
	const fragments = buildFragments(source, blanks);

	return freezeInPlace({ fragments, blanks });
}

// ─── Pass 1 — Classify (token-stream walk + AST override) ────

/**
 * The set of source strings the lens treats as keywords. Includes
 * Acorn-recognized JS reserved words plus contextual keywords (`let`,
 * `const`, `of`, `async`, `await`, `static`, `yield`) that Acorn
 * lexes as `name` tokens. AST overrides handle the inverse case
 * (`true`/`false`/`null` are keywords-by-text but Literal nodes;
 * `let` as a variable name is an Identifier node).
 */
const KEYWORDS: ReadonlySet<string> = new Set([
	'let', 'const', 'var',
	'if', 'else',
	'for', 'while', 'do',
	'break', 'continue',
	'return', 'throw',
	'switch', 'case', 'default',
	'try', 'catch', 'finally',
	'function', 'class', 'extends',
	'new', 'delete', 'typeof', 'instanceof', 'in', 'of', 'void',
	'this', 'super',
	'async', 'await', 'yield', 'static',
]);

const LITERAL_TOKEN_LABELS: ReadonlySet<string> = new Set([
	'num', 'string', 'regexp',
]);

/**
 * Walks the raw token stream once to apply token-type classification,
 * then walks the AST to override Identifier and Literal positions.
 * The override pass handles the cases where token-type classification
 * disagrees with the AST's interpretation:
 * - `true`/`false`/`null` are keyword-text but Literal AST nodes →
 *   classify as `literals`.
 * - `let` (or any contextual keyword) used as a variable name is an
 *   Identifier AST node → classify as `identifiers`.
 *
 * Returns a complete `start-offset → TokenCategory` map. Tokens not
 * in the map are not classifiable (punctuation, whitespace).
 */
function classify(
	ast: AcornNode | null,
	tokens: ReadonlyArray<AcornToken>,
	source: string,
): ReadonlyMap<number, TokenCategory> {
	const map = new Map<number, TokenCategory>();

	for (const token of tokens) {
		const text = source.slice(token.start, token.end);
		if (KEYWORDS.has(text)) {
			map.set(token.start, 'keywords');
			continue;
		}
		if (token.type.label === 'name') {
			map.set(token.start, 'identifiers');
			continue;
		}
		if (LITERAL_TOKEN_LABELS.has(token.type.label)) {
			map.set(token.start, 'literals');
			continue;
		}
		if (isOperatorType(token.type)) {
			map.set(token.start, 'operators');
		}
	}

	if (ast === null) return map;
	walkAst(ast, function applyAstOverride(node) {
		if (node.type === 'Literal') {
			map.set(node.start, 'literals');
			return;
		}
		if (node.type === 'Identifier') {
			map.set(node.start, 'identifiers');
		}
	});

	return map;
}

/**
 * Recursive AST traversal. Calls `visit` on every node, then recurses
 * into all node-shaped properties (objects with a `type` field) and
 * arrays of node-shaped entries. Pure; no library dependency.
 */
function walkAst(node: AcornNode, visit: (node: AcornNode) => void): void {
	visit(node);
	for (const key of Object.keys(node)) {
		if (key === 'type' || key === 'start' || key === 'end') continue;
		const value = node[key];
		if (Array.isArray(value)) {
			walkAstArray(value, visit);
			continue;
		}
		if (isAstNode(value)) walkAst(value, visit);
	}
}

function walkAstArray(
	items: ReadonlyArray<unknown>,
	visit: (node: AcornNode) => void,
): void {
	for (const item of items) {
		if (isAstNode(item)) walkAst(item, visit);
	}
}

function isAstNode(value: unknown): value is AcornNode {
	return (
		value !== null &&
		typeof value === 'object' &&
		typeof (value as { readonly type?: unknown }).type === 'string'
	);
}

function isOperatorType(type: AcornTokenType): boolean {
	if (typeof type.binop === 'number') return true;
	if (type.isAssign === true) return true;
	if (type.prefix === true) return true;
	if (type.postfix === true) return true;
	return false;
}

// ─── Pass 2 — Position (token-stream walk) ────────────────────

/**
 * Walks tokens in source order. For each token, looks up its category
 * in the classifier map. Tokens not in the map are skipped (per DOCS
 * § Execution phases); tokens whose category is not in the enabled
 * set are skipped (the educator-supplied filter).
 *
 * The token's source text is sliced from `source` for fidelity
 * (Acorn's `token.value` is a Number for numeric literals, not a
 * string — the source slice gives the verbatim character range every
 * time).
 */
function position(
	tokens: ReadonlyArray<AcornToken>,
	source: string,
	classifierMap: ReadonlyMap<number, TokenCategory>,
	enabledCategories: ReadonlySet<TokenCategory>,
): ReadonlyArray<EligibleToken> {
	const eligible: readonly EligibleToken[] = [];
	for (const token of tokens) {
		const category = classifierMap.get(token.start);
		if (category === undefined || !enabledCategories.has(category)) continue;
		eligible.push({
			category,
			text: source.slice(token.start, token.end),
			start: token.start,
			end: token.end,
		});
	}
	return eligible;
}

// ─── Pass 3 — Select (seeded sampling) ────────────────────────

/**
 * For each eligible token in source order, draws from a seeded LCG.
 * Keeps the token as a `Blank` when the draw is below
 * `difficulty / 100` (clamped to `[0, 1]`). Assigns contiguous
 * 0-based indices in source order across the selected subset.
 */
function select(
	eligible: ReadonlyArray<EligibleToken>,
	difficulty: number,
	seed: number,
): ReadonlyArray<Blank> {
	const threshold = Math.max(0, Math.min(100, difficulty)) / 100;
	const blanks: readonly Blank[] = [];
	let state = seed >>> 0;
	for (const token of eligible) {
		const draw = nextRandom(state);
		state = draw.nextState;
		if (draw.value < threshold) {
			blanks.push({
				index: blanks.length,
				answer: token.text,
				category: token.category,
				start: token.start,
				end: token.end,
			});
		}
	}
	return blanks;
}

/**
 * One step of a Numerical-Recipes LCG. Deterministic given seed; good
 * enough for blank selection (not a cryptographic RNG; not used for
 * security). State is a uint32; output is in `[0, 1)`.
 */
function nextRandom(state: number): { readonly value: number; readonly nextState: number } {
	const next = (state * 1_664_525 + 1_013_904_223) >>> 0;
	return { value: next / 0x1_00_00_00_00, nextState: next };
}

// ─── Pass 4 — Build fragments ────────────────────────────────

/**
 * Interleaves the source string and the selected blanks into a flat
 * fragment sequence. Walks `source` left-to-right; for each blank
 * (in source order, contiguous indices), emits a `text` fragment for
 * the preceding gap (if non-empty) and a `blank` fragment at the
 * blank's range. After the last blank, emits a final `text` fragment
 * for the trailing gap (if non-empty).
 *
 * Concatenating every `text` fragment + every `blank.answer`
 * reconstructs `source` byte-for-byte (per the README's display-
 * fragment contract).
 */
function buildFragments(
	source: string,
	blanks: ReadonlyArray<Blank>,
): ReadonlyArray<DisplayFragment> {
	const fragments: readonly DisplayFragment[] = [];
	let cursor = 0;
	for (const blank of blanks) {
		if (blank.start > cursor) {
			fragments.push(textFragment(source.slice(cursor, blank.start)));
		}
		fragments.push(blankFragment(blank.index, blank.answer));
		cursor = blank.end;
	}
	if (cursor < source.length) {
		fragments.push(textFragment(source.slice(cursor)));
	}
	return fragments;
}

function textFragment(text: string): TextFragment {
	return { kind: 'text', text };
}

function blankFragment(index: number, answer: string): BlankFragment {
	return { kind: 'blank', index, answer };
}

export default deriveBlanks;
