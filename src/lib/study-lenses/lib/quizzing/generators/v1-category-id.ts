/**
 * @file The V1 category-ID generator — the text-surface × atom question "what
 * kind of syntax element is this?", one per classified token. A `token`-anchored
 * generator: the run phase fires its `build` over the `classified` stream. The
 * five categories are the fixed options; the token's primary category is the
 * answer key, its category-and-role the propagation group.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { Category, ClassifiedToken } from '../../classifying/types.js';
import type { GenerationContext } from '../context/types.js';
import categoryRoleGroupKey from '../keying/classification-group-key.js';
import type { McqQuizItem, QuizItem, QuizOption } from '../types.js';

import type { Generator } from './types.js';

const v1CategoryId: Generator = {
	anchorType: 'token',
	build(
		token: ClassifiedToken,
		_context: GenerationContext,
	): readonly QuizItem[] {
		return [buildV1Item(token)];
	},
};

export default v1CategoryId;

/**
 * The V1 item for one token: the text-surface × atom category-ID question. The
 * token's primary category is the answer key, while its category refined by role
 * is the propagation group axis (via `categoryRoleGroupKey` — `identifier` /
 * `keyword` are role-less, so they key on the bare category). `family` is the
 * fixed `'variables'` constant of the V1 form (the catalog's first family), not a
 * function of the token's category. Scalar fields are copied by value; the frozen
 * `ClassifiedToken` is never embedded.
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
