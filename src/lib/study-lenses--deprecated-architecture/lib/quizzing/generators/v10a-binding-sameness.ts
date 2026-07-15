/**
 * @file The V10a binding-sameness generator — the execution × relation
 * select-in-code question "click every occurrence of this same variable". A
 * node-anchored generator that emits ONE item per binding, anchored at the
 * binding's source-first occurrence (the representative), whose `targetRanges`
 * span every occurrence of that binding. Its `groupKey` is the binding identity
 * (`binding:<decl>`) and it `unlocks` that same group — passing it earns
 * bulk-credit for the binding's V3/V6/V8/V12 peers. The first producer of the
 * `unlocks` data contract. An occurrence with no resolvable binding (a free
 * global, or any name the scope forest does not track) yields no item — there is
 * no "same variable" set without a binding.
 */

import type { GenerationContext, IdentifierAnchor } from '../context/types.js';
import bindingGroupKey from '../keying/binding-group-key.js';
import resolveBinding from '../resolving/resolve-binding.js';
import type { Binding } from '../resolving/types.js';
import type { QuizItem, SelectInCodeQuizItem } from '../types.js';

import isRepresentative from './is-representative.js';
import type { Generator } from './types.js';

const v10aBindingSameness: Generator = {
	anchorType: 'node',
	build(
		anchor: IdentifierAnchor,
		context: GenerationContext,
	): readonly QuizItem[] {
		const binding = resolveBinding(
			{ start: anchor.range[0], text: anchor.name },
			context.forest,
		);
		if (binding === null) {
			return [];
		}
		const members = membersOfBinding(binding, context);
		return isRepresentative(anchor, members)
			? [buildV10aItem(anchor, binding, members)]
			: [];
	},
};

export default v10aBindingSameness;

/**
 * Every occurrence resolving to `binding`, in source order (the descent's order —
 * `identifierAnchors` is never re-sorted). Use-type-agnostic: a declaration, read,
 * assignment-target, or read-and-assigned occurrence of the binding all count.
 * Membership is "shares the binding identity" — an occurrence is a member iff its
 * resolved binding key equals this binding's.
 */
function membersOfBinding(
	binding: Binding,
	context: GenerationContext,
): readonly IdentifierAnchor[] {
	const key = bindingGroupKey(binding);
	return context.identifierAnchors.filter(
		(occurrence) => bindingKeyOf(occurrence, context) === key,
	);
}

/** The binding-identity key an occurrence resolves to, or null (no tracked binding). */
function bindingKeyOf(
	occurrence: IdentifierAnchor,
	context: GenerationContext,
): string | null {
	const binding = resolveBinding(
		{ start: occurrence.range[0], text: occurrence.name },
		context.forest,
	);
	return binding === null ? null : bindingGroupKey(binding);
}

/**
 * The V10a item for one binding: a select-in-code question targeting every
 * occurrence of the binding, anchored at the representative. `groupKey` and
 * `unlocks` are both the binding identity — the item is a member of the group it
 * unlocks. The `id` is binding-flavored (occurrence-independent), so it is stable
 * regardless of which occurrence is the representative.
 */
function buildV10aItem(
	anchor: IdentifierAnchor,
	binding: Binding,
	members: readonly IdentifierAnchor[],
): SelectInCodeQuizItem {
	const key = bindingGroupKey(binding);
	return {
		mode: 'select-in-code',
		id: `V10a/binding:${binding.name}@${binding.declarationRange[0]}-${binding.declarationRange[1]}`,
		family: 'variables',
		form: 'V10a',
		anchorRange: anchor.range,
		cells: [{ dimension: 'execution', level: 'relation' }],
		prompt: `Click every occurrence of \`${binding.name}\`.`,
		targetRanges: members.map((member) => member.range),
		groupKey: key,
		unlocks: [key],
		feedback: V10A_FEEDBACK,
	};
}

const V10A_FEEDBACK =
	'These are all the occurrences of this variable — every one resolves to the same binding under lexical scoping.';
