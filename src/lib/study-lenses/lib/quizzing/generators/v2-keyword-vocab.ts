/**
 * @file The V2 keyword-vocab generator — the text-surface × atom question "what
 * does this keyword do?", one per `let` / `const` keyword token. A `token`-anchored
 * generator (like V1): the run phase fires its `build` over the `classified` stream.
 * The FIRST curated generator — its option text and feedback are a compile-time
 * constant table rather than computed strings (README § Glossary "Curated bank vs
 * generated"), but the correct answer stays machine-determined: the token text
 * (`let` / `const`) statically decides which card applies; only the prose is
 * authored. The shared option pool carries the `var`-misconception distractor
 * (function-scoped, hoisted) the generated forms cannot produce — the pedagogical
 * point of a curated bank. The propagation group is the keyword element type
 * (`category:keyword`, via `categoryRoleGroupKey`).
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { ClassifiedToken } from '../../classifying/types.js';
import type { GenerationContext } from '../context/types.js';
import categoryRoleGroupKey from '../keying/classification-group-key.js';
import type { McqQuizItem, QuizItem, QuizOption } from '../types.js';

import type { Generator } from './types.js';

/** The two keyword-declaration vocab words V2 fires on. */
type VocabKeyword = 'let' | 'const';

const v2KeywordVocab: Generator = {
	anchorType: 'token',
	build(
		token: ClassifiedToken,
		context: GenerationContext,
	): readonly QuizItem[] {
		const keyword = token.text;
		if (token.categories[0] !== 'keyword' || !isVocabKeyword(keyword)) {
			return [];
		}
		if (!headsDeclaration(token, context.classified)) {
			return [];
		}
		return [buildV2Item(token, keyword)];
	},
};

export default v2KeywordVocab;

/** Whether a token's text is one of the declaration-keyword vocab words. */
function isVocabKeyword(text: string): text is VocabKeyword {
	return text === 'let' || text === 'const';
}

/**
 * Whether this `let` / `const` keyword token heads a declaration — its next
 * meaningful token (in source order) is the declared identifier. The acorn
 * tokenizer is context-free, so it labels `let` / `const` as keyword tokens even
 * in non-declaration positions (`obj.let`, `{ const: 1 }`); classifying carries
 * that label through. Without this check V2 would over-fire a keyword-vocab card on
 * a property or object-literal key name. A real declaration's next token is the
 * declared identifier (`let x`, `for (let i …)`); a contextual keyword's is a
 * delimiter (`.`-member's `;`, the key's `:`). Lexical-only (token category +
 * source order) — no AST or binding lookup, so V2 stays text-surface × atom.
 */
function headsDeclaration(
	token: ClassifiedToken,
	classified: readonly ClassifiedToken[],
): boolean {
	const next = classified.find((other) => other.start >= token.end);
	return next?.categories[0] === 'identifier';
}

/**
 * The V2 item for one `let` / `const` keyword token: the text-surface × atom
 * keyword-vocab question. Curated — the prompt, options, and feedback are authored
 * constants — but the answer card is machine-determined by the keyword text. The
 * propagation group is the keyword element type (via `categoryRoleGroupKey`, role
 * `null` because keyword is role-less). `family` is the form's fixed `'variables'`
 * constant — V2 belongs to the variables curriculum thread (`let` / `const` declare
 * variables), NOT the `keywords` family: `Family` is the curriculum domain, not the
 * token's classifying `Category` (README § Glossary), and the keywords-family
 * keyword-vocab analogue is the separate catalog form K2.
 */
function buildV2Item(
	token: ClassifiedToken,
	keyword: VocabKeyword,
): McqQuizItem {
	return {
		mode: 'mcq',
		id: `V2@${token.start}-${token.end}`,
		family: 'variables',
		form: 'V2',
		anchorRange: [token.start, token.end],
		cells: [{ dimension: 'text-surface', level: 'atom' }],
		prompt: V2_PROMPT,
		options: V2_OPTIONS,
		answerOptionIds: [KEYWORD_ANSWER[keyword]],
		groupKey: categoryRoleGroupKey('keyword', null),
		feedback: KEYWORD_FEEDBACK[keyword],
	};
}

const V2_PROMPT = 'What does this keyword do?';

type V2OptionId = 'reassignable' | 'initialize-once' | 'var-scoped';

const V2_OPTION_ORDER: readonly V2OptionId[] = [
	'reassignable',
	'initialize-once',
	'var-scoped',
];

const V2_OPTION_LABEL: Readonly<Record<V2OptionId, string>> = {
	reassignable:
		'Declares a reassignable binding — its value can be updated after initialization.',
	'initialize-once':
		'Declares an initialize-once binding — its value cannot be updated after initialization.',
	'var-scoped':
		'Declares a function-scoped binding hoisted to the top of its scope.',
};

/** Which option card is correct for each keyword — the machine-determined answer. */
const KEYWORD_ANSWER: Readonly<Record<VocabKeyword, V2OptionId>> = {
	let: 'reassignable',
	const: 'initialize-once',
};

const KEYWORD_FEEDBACK: Readonly<Record<VocabKeyword, string>> = {
	let: '`let` introduces a reassignable binding: you can update its value after initialization.',
	const:
		'`const` introduces an initialize-once binding: its value is set at initialization and never reassigned.',
};

// Frozen at declaration (shared by reference across every V2 item, like V1_OPTIONS)
// — the generator's only shared, embedded-in-output value.
const V2_OPTIONS: readonly QuizOption[] = deepFreezeInPlace(
	V2_OPTION_ORDER.map((id) => ({ id, text: V2_OPTION_LABEL[id] })),
);
