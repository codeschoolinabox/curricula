/**
 * @file The V6b const-update-twin generator — the execution × atom question
 * "reassigning this `const` throws which error?", one per `const` binding. A
 * `node`-anchored CURATED generator: it fires ONLY on the declaration occurrence
 * (`usageKind === 'declared'`) of a `const` binding, so it emits exactly one item
 * per const binding anchored at the `const` site. The correct answer is statically
 * fixed (`TypeError`) because V6b only fires on const — only the prose is authored
 * (README § Glossary "Curated bank vs generated"). The distractors are the three
 * documented misconceptions (`SyntaxError` / `ReferenceError` / silently-ignored;
 * NM doc — const reassignment is a TypeError at evaluation, not a SyntaxError). The
 * V6 twin: V6 asks reassignable-or-not (let and const); V6b asks the specific const
 * error.
 *
 * The propagation group is a DISTINCT const-update element-type key
 * (`element-type:const-update`), NOT `category:keyword`: that key already holds V1's
 * keyword-category and V2's keyword-vocab items, both text-surface × atom
 * surface-recognition forms, whereas V6b is an execution × atom runtime-error fact —
 * sharing that group would conflate distinct mastery signals across Block-Model
 * dimensions (ar-3 finding). The catalog separates V6 (group: binding) from V6b
 * (group: element type); this is the element-type group, isolated to V6b. The key is
 * an inline constant (like V7's `usage:occ:` fallback) — a single value V6b alone
 * produces, not a `keying/` serializer.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { GenerationContext, IdentifierAnchor } from '../context/types.js';
import resolveBinding from '../resolving/resolve-binding.js';
import type { Binding } from '../resolving/types.js';
import type { McqQuizItem, QuizItem, QuizOption } from '../types.js';

import type { Generator } from './types.js';

const v6bConstUpdate: Generator = {
	anchorType: 'node',
	build(
		anchor: IdentifierAnchor,
		context: GenerationContext,
	): readonly QuizItem[] {
		if (anchor.usageKind !== 'declared') {
			return [];
		}
		const binding = resolveBinding(
			{ start: anchor.range[0], text: anchor.name },
			context.forest,
		);
		// A null binding (unresolvable) OR a non-const binding both exit here; the
		// optional chain fuses the two into one gate and narrows `binding` to a
		// non-null const `Binding` for `buildV6bItem`.
		if (binding?.kind !== 'const') {
			return [];
		}
		return [buildV6bItem(anchor, binding)];
	},
};

export default v6bConstUpdate;

/**
 * The V6b item for one `const` binding: the execution × atom const-update question,
 * anchored at the `const` declaration. The answer is the statically fixed
 * `TypeError` (V6b fires only on const, so the card is machine-determined); the four
 * options + feedback are authored constants. The propagation group is the distinct
 * const-update element-type key. The `id` is binding-flavored (the
 * `form/binding:name@decl` scheme V6/V10a use). `family` is the form's fixed
 * `'variables'` constant (V6b is in the variables curriculum thread).
 */
function buildV6bItem(anchor: IdentifierAnchor, binding: Binding): McqQuizItem {
	return {
		mode: 'mcq',
		id: `V6b/binding:${binding.name}@${binding.declarationRange[0]}-${binding.declarationRange[1]}`,
		family: 'variables',
		form: 'V6b',
		anchorRange: anchor.range,
		cells: [{ dimension: 'execution', level: 'atom' }],
		prompt: `Reassigning the \`const\` binding \`${binding.name}\` throws which error?`,
		options: V6B_OPTIONS,
		answerOptionIds: ['TypeError'],
		groupKey: V6B_GROUP_KEY,
		feedback: V6B_FEEDBACK,
	};
}

/** The distinct const-update element-type propagation group (inline, V6b-only). */
const V6B_GROUP_KEY = 'element-type:const-update';

type V6bOptionId =
	| 'TypeError'
	| 'SyntaxError'
	| 'ReferenceError'
	| 'silently-ignored';

const V6B_OPTION_ORDER: readonly V6bOptionId[] = [
	'TypeError',
	'SyntaxError',
	'ReferenceError',
	'silently-ignored',
];

// Answer-neutral copy: each option describes its error generically, so the option
// text never reveals that const-reassignment is the TypeError case.
const V6B_OPTION_LABEL: Readonly<Record<V6bOptionId, string>> = {
	TypeError: 'TypeError — a runtime operation is not allowed on this value.',
	SyntaxError: 'SyntaxError — the code fails to parse.',
	ReferenceError: 'ReferenceError — a name is used that is not declared.',
	'silently-ignored': 'Nothing — the reassignment is silently ignored.',
};

const V6B_FEEDBACK =
	'Reassigning a `const` throws a TypeError at evaluation (ECMA-262 §13.6.1), not a SyntaxError: the declaration is valid syntax; the error fires when the update runs.';

// Frozen at declaration (shared by reference across every V6b item, like V1_OPTIONS).
const V6B_OPTIONS: readonly QuizOption[] = deepFreezeInPlace(
	V6B_OPTION_ORDER.map((id) => ({ id, text: V6B_OPTION_LABEL[id] })),
);
