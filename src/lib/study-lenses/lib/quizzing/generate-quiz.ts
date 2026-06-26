/**
 * @file The `generateQuiz` public export — the quizzing module's content entry
 * point. Runs the registered generators (in this increment, the single V1
 * category-ID generator) over a parsed snippet and its pre-computed classified
 * tokens, and returns a frozen, source-ordered array of auto-gradable
 * `QuizItem`s. See `./README.md` for the bounded context and `./DOCS.md` for
 * the gate → context → run → filter → freeze pipeline this file realizes.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { Snippet } from '../../embody/types.js';
import type { Category, ClassifiedToken } from '../classifying/types.js';

import categoryRoleGroupKey from './keying/classification-group-key.js';
import type { McqQuizItem, QuizFilter, QuizItem, QuizOption } from './types.js';

/**
 * Generate the auto-gradable quiz items for a parsed snippet.
 *
 * One `McqQuizItem` is emitted per classified token: the V1 category-ID
 * question ("what kind of syntax element is this?"), anchored to the token's
 * source range, carrying the token's primary category as its machine-derived
 * answer key. The returned array is source-ordered (inherited from
 * `classified`) and deeply frozen.
 *
 * @remarks
 * - **Throws** on null / unparsed input: `generateQuiz` is called behind the
 *   consumer's `status.parsed` gate, and a valid `classified` already implies a
 *   successful parse, so a missing AST here is a caller bug to surface (the same
 *   posture as the sibling `classifyTokens`). This is the module's only throw
 *   site.
 * - **Pure / deterministic / frozen.** No mutation of `snippet` or `classified`
 *   (safe on deep-frozen embodiment data); same inputs, same output.
 * - The `filter` parameter is part of the locked contract but is **not yet
 *   consumed** — post-generation filtering lands with its own increment. It is
 *   accepted and ignored here (no-op), not forgotten.
 *
 * @throws Error when the snippet is unparsed (no AST) — see `assertParsed`.
 */
export default function generateQuiz(
	snippet: Snippet,
	classified: readonly ClassifiedToken[],
	_filter?: QuizFilter,
): readonly QuizItem[] {
	assertParsed(snippet);
	const items = classified.map((token) => buildV1Item(token));
	return deepFreezeInPlace(items);
}

/**
 * The gate (the module's only throw site). A parsed snippet is the precondition
 * for generation: `status.parsed` and a present `raw.ast`. Both are read
 * through the accessor seam — never inline — so later forms' binding/scope
 * reads join the same seam. The AST itself is not consumed in this increment
 * (the V1 generator reads only the per-token `classified` stream); the gate
 * exists to surface a caller that invoked `generateQuiz` off the parse gate.
 * The `readParsedAst` call is structural — it establishes the AST accessor the
 * context phase (a later increment) routes its descent through; do not inline
 * it away as "unused," that would dissolve the seam before its first consumer.
 */
function assertParsed(snippet: Snippet): void {
	if (!isParsed(snippet) || readParsedAst(snippet) === null) {
		throw new Error(
			'generateQuiz requires a parsed snippet: status.parsed must be true and raw.ast present',
		);
	}
}

/** Accessor seam (Class A): is this snippet's source successfully parsed? */
function isParsed(snippet: Snippet): boolean {
	return snippet.status.parsed;
}

/** Accessor seam (Class A): the AST this snippet produced, or null if absent. */
function readParsedAst(snippet: Snippet): Snippet['raw']['ast'] {
	return snippet.raw.ast;
}

/**
 * The V1 category-ID generator, per token: the text-surface × atom question
 * "what kind of syntax element is this?". The five categories are the fixed
 * options; the token's primary category is the answer key, while its category
 * refined by role is the propagation group axis (via `categoryRoleGroupKey` —
 * `identifier` / `keyword` are role-less, so they key on the bare category).
 * `family` is the fixed `'variables'` constant of the V1 form (the
 * catalog's first family), not a function of the token's category — `Family` is
 * the domain a *form* belongs to, not classifying's `Category`. Scalar fields
 * are copied by value; the frozen `ClassifiedToken` is never embedded.
 */
function buildV1Item(token: ClassifiedToken): McqQuizItem {
	const category = token.categories[0];
	return {
		mode: 'mcq',
		id: `V1@${token.start}-${token.end}`,
		family: 'variables',
		form: 'V1',
		anchorRange: [token.start, token.end],
		cells: [{ dimension: 'text-surface', level: 'atom' }],
		prompt: V1_PROMPT,
		options: V1_OPTIONS,
		answerOptionIds: [category],
		groupKey: categoryRoleGroupKey(category, token.role),
		feedback: CATEGORY_FEEDBACK[category],
	};
}

const V1_PROMPT = 'What kind of syntax element is this?';

const CATEGORY_ORDER: readonly Category[] = [
	'identifier',
	'keyword',
	'operator',
	'literal',
	'delimiter',
];

const CATEGORY_LABEL: Readonly<Record<Category, string>> = {
	identifier: 'Identifier — names a binding',
	keyword: 'Keyword — directs the notional machine',
	operator: 'Operator — transforms operands or produces a value',
	literal: 'Literal — is a value',
	delimiter: 'Delimiter — structural punctuation',
};

const CATEGORY_FEEDBACK: Readonly<Record<Category, string>> = {
	identifier: 'This element is an identifier — it names a binding.',
	keyword: 'This element is a keyword — it directs the notional machine.',
	operator:
		'This element is an operator — it transforms operands or produces a value.',
	literal: 'This element is a literal — it is a value.',
	delimiter: 'This element is a delimiter — structural punctuation.',
};

// Frozen at declaration (not just as a side-effect of the first generate call)
// because every item shares this one array by reference — the module's only
// shared, embedded-in-output value.
const V1_OPTIONS: readonly QuizOption[] = deepFreezeInPlace(
	CATEGORY_ORDER.map((category) => ({
		id: category,
		text: CATEGORY_LABEL[category],
	})),
);
