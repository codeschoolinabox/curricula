// cspell:ignore reassignable reassignability

/**
 * @file The V6 kind-semantics generator — the execution × atom question "can this
 * binding be updated after initialization?", one per binding. A `node`-anchored
 * generator that fires ONLY on the declaration occurrence (`usageKind === 'declared'`),
 * so it emits exactly one item per binding, anchored at the `let` / `const` site —
 * the catalog's "binding" anchor (contrast V7's "per instance"). For JeJ's
 * `let` / `const`-only fragment the declared occurrence is always the binding's
 * source-first occurrence (TDZ forbids use-before-declaration), so firing on
 * `declared` is the simplest one-item-per-binding rule and the anchor is always the
 * declaration span. The answer is machine-determined: `let` → reassignable (yes),
 * `const` → not (no), read off the resolved binding's `kind` (commit 1's widening).
 * The propagation group is the binding identity (`binding:<decl>` via
 * `bindingGroupKey`), so a V10a binding-sameness pass bulk-credits it.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { GenerationContext, IdentifierAnchor } from '../context/types.js';
import bindingGroupKey from '../keying/binding-group-key.js';
import resolveBinding from '../resolving/resolve-binding.js';
import type { Binding } from '../resolving/types.js';
import type { McqQuizItem, QuizItem, QuizOption } from '../types.js';

import type { Generator } from './types.js';

const v6KindSemantics: Generator = {
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
		if (binding === null) {
			return [];
		}
		// `build-scope` blind-casts a declaration's kind to `'let' | 'const'`, but
		// quizzing gates on `status.parsed` (not `status.validated`), so a non-JeJ
		// `var` binding reaches here with a runtime `kind` of `'var'` the type does
		// not admit. Guard defensively (widen to compare) so V6 skips it rather than
		// mis-grading `var` as non-reassignable — V6b's positive const gate is already
		// immune. See README/DOCS § the parsed-not-validated input precondition.
		const declaredKind: string = binding.kind;
		if (declaredKind !== 'let' && declaredKind !== 'const') {
			return [];
		}
		return [buildV6Item(anchor, binding)];
	},
};

export default v6KindSemantics;

/**
 * The V6 item for one binding: the execution × atom kind-semantics question,
 * anchored at the declaration occurrence. The answer is the binding's
 * reassignability, read off `binding.kind` (`let` → yes, `const` → no); the option
 * copy is answer-neutral (it never names the keyword, so the option text is not the
 * answer key). The propagation group is the binding identity (via `bindingGroupKey`),
 * so a V10a binding-sameness pass bulk-credits it. The `id` is binding-flavored
 * (the `form/binding:name@decl` scheme V10a uses). `family` is the form's fixed
 * `'variables'` constant.
 */
function buildV6Item(anchor: IdentifierAnchor, binding: Binding): McqQuizItem {
	return {
		mode: 'mcq',
		id: `V6/binding:${binding.name}@${binding.declarationRange[0]}-${binding.declarationRange[1]}`,
		family: 'variables',
		form: 'V6',
		anchorRange: anchor.range,
		cells: [{ dimension: 'execution', level: 'atom' }],
		prompt: `Can the binding \`${binding.name}\` be updated after initialization?`,
		options: V6_OPTIONS,
		answerOptionIds: [binding.kind === 'let' ? 'yes' : 'no'],
		groupKey: bindingGroupKey(binding),
		feedback: KIND_FEEDBACK[binding.kind],
	};
}

type V6OptionId = 'yes' | 'no';

const V6_OPTION_ORDER: readonly V6OptionId[] = ['yes', 'no'];

const V6_OPTION_LABEL: Readonly<Record<V6OptionId, string>> = {
	yes: 'Yes — it can be reassigned after initialization.',
	no: 'No — it is initialize-once and cannot be reassigned.',
};

const KIND_FEEDBACK: Readonly<Record<'let' | 'const', string>> = {
	let: '`let` introduces a reassignable binding: you can update its value after initialization.',
	const:
		'`const` introduces an initialize-once binding: its value is set at initialization and cannot be reassigned.',
};

// Frozen at declaration (shared by reference across every V6 item, like V1_OPTIONS).
const V6_OPTIONS: readonly QuizOption[] = deepFreezeInPlace(
	V6_OPTION_ORDER.map((id) => ({ id, text: V6_OPTION_LABEL[id] })),
);
