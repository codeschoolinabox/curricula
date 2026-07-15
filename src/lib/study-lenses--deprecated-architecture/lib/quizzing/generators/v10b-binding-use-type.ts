/**
 * @file The V10b binding × use-type sameness generator — the execution × relation
 * select-in-code question "click every occurrence where this variable is used the
 * same way as here". A node-anchored generator that emits ONE item per
 * (binding, use-type) pair, anchored at that group's source-first occurrence (the
 * representative), whose `targetRanges` span every occurrence of the binding
 * sharing this occurrence's `usageKind`. Its `groupKey` is the binding × use-type
 * key (`usage:<decl>:<kind>`, via `usageGroupKey`) and it `unlocks` that same group
 * — the exact key the re-keyed V7 usage-kind items carry, so passing it
 * bulk-credits those V7 instances. An occurrence with no resolvable binding (a free
 * global, or any name the scope forest does not track) yields no item.
 */

import type {
	GenerationContext,
	IdentifierAnchor,
	UsageKind,
} from '../context/types.js';
import usageGroupKey from '../keying/usage-group-key.js';
import resolveBinding from '../resolving/resolve-binding.js';
import type { Binding } from '../resolving/types.js';
import type { QuizItem, SelectInCodeQuizItem } from '../types.js';

import isRepresentative from './is-representative.js';
import type { Generator } from './types.js';

const v10bBindingUseType: Generator = {
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
		const key = usageGroupKey(binding, anchor.usageKind);
		const members = context.identifierAnchors.filter(
			(occurrence) => usageKeyOf(occurrence, context) === key,
		);
		return isRepresentative(anchor, members)
			? [buildV10bItem(anchor, binding, anchor.usageKind, members)]
			: [];
	},
};

export default v10bBindingUseType;

/**
 * The binding × use-type key an occurrence carries, or null when it resolves to no
 * binding. Two occurrences share a group iff they resolve to the same binding AND
 * are used the same way — exactly what `usageGroupKey` string-equality captures.
 */
function usageKeyOf(
	occurrence: IdentifierAnchor,
	context: GenerationContext,
): string | null {
	const binding = resolveBinding(
		{ start: occurrence.range[0], text: occurrence.name },
		context.forest,
	);
	return binding === null ? null : usageGroupKey(binding, occurrence.usageKind);
}

/**
 * The V10b item for one (binding, use-type) group: a select-in-code question
 * targeting every occurrence of the binding used this way, anchored at the
 * representative. `groupKey` and `unlocks` are both the binding × use-type key —
 * the same key the re-keyed V7 items carry, so passing this bulk-credits them. The
 * `id` is binding-and-use-type-flavored (occurrence-independent).
 */
function buildV10bItem(
	anchor: IdentifierAnchor,
	binding: Binding,
	usageKind: UsageKind,
	members: readonly IdentifierAnchor[],
): SelectInCodeQuizItem {
	const key = usageGroupKey(binding, usageKind);
	return {
		mode: 'select-in-code',
		id: `V10b/binding:${binding.name}@${binding.declarationRange[0]}-${binding.declarationRange[1]}:${usageKind}`,
		family: 'variables',
		form: 'V10b',
		anchorRange: anchor.range,
		cells: [{ dimension: 'execution', level: 'relation' }],
		prompt: `Click every occurrence where \`${binding.name}\` is used the same way as here.`,
		targetRanges: members.map((member) => member.range),
		groupKey: key,
		unlocks: [key],
		feedback: V10B_FEEDBACK,
	};
}

const V10B_FEEDBACK =
	'These are all the occurrences where this variable is used the same way — every one shares both the binding and the use-type (declared, read, assigned, or read-and-assigned).';
