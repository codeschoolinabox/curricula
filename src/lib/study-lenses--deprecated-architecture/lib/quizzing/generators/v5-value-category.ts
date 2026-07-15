/**
 * @file The V5 value-category generator — the execution × atom question "what kind
 * of value is this built-in?": an **object-register** (a box with methods and a
 * prototype — `Math`, `console`), a **function** (a callable value — `parseInt`,
 * `alert`), or a **constant** (a bare primitive — `Infinity`, `NaN`, `undefined`).
 * A `node`-anchored generator that fires ONLY on an **unshadowed realm name**:
 * `resolveBinding` returns `null` (no program declaration) AND the realm table hits.
 * A program declaration that shadows a realm name (`let Math = 1`) makes
 * `resolveBinding` succeed, so V5 stays silent — only V3 fires there, answering
 * "program-declared". Value-category questions apply only to the actual realm global.
 *
 * The answer is machine-determined by the realm shim's `valueCategory`, read straight
 * off `RealmBindingData` (the option id IS the `valueCategory`, like V4's option id is
 * the chain role). The propagation group is `realm:<name>`, so every occurrence of one
 * realm global shares a group. Copy is PLAIN PROSE — the notional-machine doc's `ƒ`
 * notation for callables is diagram-internal (learners never see it in code), so it is
 * deliberately kept out of the options and feedback. Copy is authored from the
 * notional-machine doc's § Realm (`embody/language-levels/just-enough-javascript/
 * notional-machine.md` L330-405).
 *
 * V5 reads only `context.identifierAnchors` (scope-chain occurrences); a property name
 * (`o.Math`'s `Math`) lives in `propertyAccessAnchors` and never reaches it, so a
 * realm-named property is never mistaken for the realm global (the inc-2 FLAG holds by
 * construction, exactly as for V3 / V6 / V7 / V8).
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { RealmBindingData } from '../../../../embody/types.js';
import type { GenerationContext, IdentifierAnchor } from '../context/types.js';
import realmGroupKey from '../keying/realm-group-key.js';
import readRealmBinding from '../realm/read-realm-binding.js';
import resolveBinding from '../resolving/resolve-binding.js';
import type { McqQuizItem, QuizItem, QuizOption } from '../types.js';

import type { Generator } from './types.js';

/** The three value categories — the answer ids, identical to `valueCategory`. */
type V5OptionId = RealmBindingData['valueCategory'];

const v5ValueCategory: Generator = {
	anchorType: 'node',
	build(
		anchor: IdentifierAnchor,
		context: GenerationContext,
	): readonly QuizItem[] {
		// Fires ONLY on an unshadowed realm name: no program binding AND a realm hit.
		const binding = resolveBinding(
			{ start: anchor.range[0], text: anchor.name },
			context.forest,
		);
		if (binding !== null) {
			return []; // shadowed / program-declared → V3 answers, V5 is silent
		}
		const realmBinding = readRealmBinding(anchor.name);
		if (realmBinding === null) {
			return []; // undeclared non-realm name — no value category to ask about
		}
		return [buildV5Item(anchor, realmBinding)];
	},
};

export default v5ValueCategory;

/**
 * The V5 item for one unshadowed realm occurrence: the execution × atom
 * value-category question. The answer key IS the realm binding's `valueCategory`; the
 * three categories are the fixed options. The propagation group is `realm:<name>`, so
 * every occurrence of one realm global shares a group. The `id` is per-occurrence
 * (`V5@start-end`), since V5 fires on every unshadowed occurrence. `family` is the
 * form's fixed `'variables'` constant.
 */
function buildV5Item(
	anchor: IdentifierAnchor,
	realmBinding: RealmBindingData,
): McqQuizItem {
	return {
		mode: 'mcq',
		id: `V5@${anchor.range[0]}-${anchor.range[1]}`,
		family: 'variables',
		form: 'V5',
		anchorRange: anchor.range,
		cells: [{ dimension: 'execution', level: 'atom' }],
		prompt: `What kind of value is the built-in \`${anchor.name}\`?`,
		options: V5_OPTIONS,
		answerOptionIds: [realmBinding.valueCategory],
		groupKey: realmGroupKey(anchor.name),
		feedback: V5_FEEDBACK[realmBinding.valueCategory],
	};
}

const V5_OPTION_ORDER: readonly V5OptionId[] = [
	'object-register',
	'function',
	'constant',
];

const V5_OPTION_LABEL: Readonly<Record<V5OptionId, string>> = {
	'object-register':
		'An object with methods — a box you read properties and call methods off of (like `Math.max` or `console.log`).',
	function:
		'A function — a callable value you invoke with `()` (like `parseInt`).',
	constant:
		'A constant — a bare primitive value (like a number), not an object or a function.',
};

const V5_FEEDBACK: Readonly<Record<V5OptionId, string>> = {
	'object-register':
		'An object register is a box with methods and a prototype; you reach its members through property access (e.g. `Math.max`).',
	function:
		'A callable value — you invoke it with `()` (e.g. `parseInt(…)`), not a box of methods.',
	constant:
		'A bare primitive value the realm provides (like `Infinity`, `NaN`, `undefined`) — not an object with methods or a callable function.',
};

// Frozen at declaration (shared by reference across every V5 item, like V1/V4/V6).
const V5_OPTIONS: readonly QuizOption[] = deepFreezeInPlace(
	V5_OPTION_ORDER.map((id) => ({ id, text: V5_OPTION_LABEL[id] })),
);
