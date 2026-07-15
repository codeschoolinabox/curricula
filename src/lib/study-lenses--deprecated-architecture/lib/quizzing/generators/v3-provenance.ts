/**
 * @file The V3 provenance generator — the execution × atom question "where does
 * this name come from?": the **program** (a `let` / `const` declaration in this
 * code → `binding:<decl>`), the **JavaScript language** (an ECMA-262 intrinsic like
 * `Math` / `parseInt` / `Infinity`), or the **host environment** (a browser binding
 * like `console` / `alert`) — the last two both a realm hit → `realm:<name>`. A
 * `node`-anchored generator that fires on EVERY identifier occurrence (a declaration
 * occurrence resolves to its own binding → "program-declared"; every reference
 * re-fires — the provenance analogue of V4's "all occurrences"), so N uses of one
 * name yield N items sharing one group (the M3 lens bulk-credits the group).
 *
 * The answer is machine-determined by a two-step resolution: `resolveBinding` FIRST
 * (a program declaration wins → "program-declared", keyed `binding:<decl>`), then the
 * realm table SECOND (an undeclared name that is a known realm global →
 * "ECMA-intrinsic" / "host-provided", keyed `realm:<name>`); an undeclared non-realm
 * name (a free variable, a typo) yields nothing. Shadowing falls out for free: a
 * program `let Math = 1` resolves to the binding, so V3 answers "program-declared",
 * never "ECMA-intrinsic". This is the **dual group axis** — an item keys `binding:`
 * OR `realm:` depending on which resolver won, and the answer key co-varies.
 *
 * V3 reads only `context.identifierAnchors` (scope-chain occurrences); property
 * names live in `propertyAccessAnchors` and never reach it, so a property access
 * `str.length`'s `length` is never given a provenance (the inc-2 FLAG holds by
 * construction, exactly as for V6 / V7 / V8). Unlike V6, V3 needs NO `kind` guard: it
 * keys on `bindingGroupKey` (declaration range only), so a laundered `var` binding is
 * simply "program-declared" — correct. Copy is authored from the notional-machine
 * doc's § Realm (`embody/language-levels/just-enough-javascript/notional-machine.md`
 * L330-405).
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { GenerationContext, IdentifierAnchor } from '../context/types.js';
import bindingGroupKey from '../keying/binding-group-key.js';
import realmGroupKey from '../keying/realm-group-key.js';
import readRealmBinding from '../realm/read-realm-binding.js';
import resolveBinding from '../resolving/resolve-binding.js';
import type { McqQuizItem, QuizItem, QuizOption } from '../types.js';

import type { Generator } from './types.js';

/** The three provenance answers — one per resolution outcome that yields an item. */
type V3OptionId = 'program-declared' | 'ecma-intrinsic' | 'host-provided';

const v3Provenance: Generator = {
	anchorType: 'node',
	build(
		anchor: IdentifierAnchor,
		context: GenerationContext,
	): readonly QuizItem[] {
		// resolveBinding FIRST: a program declaration wins (and shadows a realm name).
		const binding = resolveBinding(
			{ start: anchor.range[0], text: anchor.name },
			context.forest,
		);
		if (binding !== null) {
			return [
				buildV3Item(anchor, 'program-declared', bindingGroupKey(binding)),
			];
		}
		// realm table SECOND: an undeclared name that is a known realm global.
		const realmBinding = readRealmBinding(anchor.name);
		if (realmBinding !== null) {
			return [
				buildV3Item(
					anchor,
					PROVENANCE_BY_CATEGORY[realmBinding.category],
					realmGroupKey(anchor.name),
				),
			];
		}
		// neither: a free variable / typo — no provenance to ask about.
		return [];
	},
};

export default v3Provenance;

/**
 * The V3 item for one occurrence: the execution × atom provenance question. The
 * `provenance` (which resolver won) is the answer key; the three provenances are the
 * fixed options. The propagation group is the DUAL axis — `binding:<decl>` for a
 * program-declared occurrence, `realm:<name>` for a realm one — passed in by the
 * caller, so the answer key and the group co-vary. The `id` is per-occurrence
 * (`V3@start-end`), like V4, since V3 fires on every occurrence. `family` is the
 * form's fixed `'variables'` constant.
 */
function buildV3Item(
	anchor: IdentifierAnchor,
	provenance: V3OptionId,
	groupKey: string,
): McqQuizItem {
	return {
		mode: 'mcq',
		id: `V3@${anchor.range[0]}-${anchor.range[1]}`,
		family: 'variables',
		form: 'V3',
		anchorRange: anchor.range,
		cells: [{ dimension: 'execution', level: 'atom' }],
		prompt: `Where does the name \`${anchor.name}\` come from?`,
		options: V3_OPTIONS,
		answerOptionIds: [provenance],
		groupKey,
		feedback: V3_FEEDBACK[provenance],
	};
}

/** Maps a realm binding's `category` to its provenance answer (V3's realm branch). */
const PROVENANCE_BY_CATEGORY: Readonly<
	Record<'intrinsic' | 'host', V3OptionId>
> = {
	intrinsic: 'ecma-intrinsic',
	host: 'host-provided',
};

const V3_OPTION_ORDER: readonly V3OptionId[] = [
	'program-declared',
	'ecma-intrinsic',
	'host-provided',
];

const V3_OPTION_LABEL: Readonly<Record<V3OptionId, string>> = {
	'program-declared':
		"The program — it's a variable declared in this code, not a built-in.",
	'ecma-intrinsic':
		'The JavaScript language — a built-in the ECMA-262 spec provides in every environment.',
	'host-provided':
		'The host environment — provided by the browser (the HTML/WHATWG APIs), not by the JavaScript language itself.',
};

const V3_FEEDBACK: Readonly<Record<V3OptionId, string>> = {
	'program-declared':
		'This name is declared in this program, so the engine finds it by walking the scope chain to the script scope — not in the realm.',
	'ecma-intrinsic':
		'This name is an ECMA-262 intrinsic (set by `SetDefaultGlobalBindings`, §9.3.4, when the realm is created) — present in every JavaScript environment regardless of host.',
	'host-provided':
		"This name is a host binding — provided by the browser's HTML host hook (`InitializeHostDefinedRealm`, §9.6), not by ECMA-262. A browser feature, not a language feature.",
};

// Frozen at declaration (shared by reference across every V3 item, like V1/V4/V6).
const V3_OPTIONS: readonly QuizOption[] = deepFreezeInPlace(
	V3_OPTION_ORDER.map((id) => ({ id, text: V3_OPTION_LABEL[id] })),
);
