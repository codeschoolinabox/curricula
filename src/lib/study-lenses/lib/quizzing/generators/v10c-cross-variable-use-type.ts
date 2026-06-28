/**
 * @file The V10c cross-variable use-type sameness generator — the execution ×
 * relation select-in-code question "click every place a variable is used the same
 * way as here". A node-anchored generator that emits ONE item per use-type, across
 * ALL variables (a free global is a valid target), anchored at that use-type's
 * source-first occurrence (the representative), whose `targetRanges` span every
 * occurrence sharing this occurrence's `usageKind`. Its `groupKey` is the
 * cross-variable use-type key (`usage-kind:<kind>`, the fourth namespaced axis, via
 * `usageKindGroupKey`). Its `unlocks` lists the binding × use-type group
 * (`usage:<decl>:<kind>`) of every distinct RESOLVED binding among its members —
 * one entry per binding, source-ordered, deduped; an unresolved occurrence (a free
 * global) contributes a target but no unlock. V10c is the deliberate exception to
 * the member-of-its-own-group rule: its `usage-kind:` group has no peer form this
 * far, so its `groupKey` is NOT among its `usage:`-axis `unlocks`.
 */

import type { GenerationContext, IdentifierAnchor } from '../context/types.js';
import usageGroupKey from '../keying/usage-group-key.js';
import usageKindGroupKey from '../keying/usage-kind-group-key.js';
import resolveBinding from '../resolving/resolve-binding.js';
import type { QuizItem, SelectInCodeQuizItem } from '../types.js';

import isRepresentative from './is-representative.js';
import type { Generator } from './types.js';

const v10cCrossVariableUseType: Generator = {
	anchorType: 'node',
	build(
		anchor: IdentifierAnchor,
		context: GenerationContext,
	): readonly QuizItem[] {
		const members = context.identifierAnchors.filter(
			(occurrence) => occurrence.usageKind === anchor.usageKind,
		);
		return isRepresentative(anchor, members)
			? [buildV10cItem(anchor, members, context)]
			: [];
	},
};

export default v10cCrossVariableUseType;

/**
 * The V10c item for one use-type group: a select-in-code question targeting every
 * occurrence used this way across all variables (globals included), anchored at the
 * representative. `groupKey` is the cross-variable usage-kind axis; `unlocks` lists
 * the binding × use-type group of each distinct resolved binding among the members.
 */
function buildV10cItem(
	anchor: IdentifierAnchor,
	members: readonly IdentifierAnchor[],
	context: GenerationContext,
): SelectInCodeQuizItem {
	return {
		mode: 'select-in-code',
		id: `V10c/use-type:${anchor.usageKind}`,
		family: 'variables',
		form: 'V10c',
		anchorRange: anchor.range,
		cells: [{ dimension: 'execution', level: 'relation' }],
		prompt: 'Click every place a variable is used the same way as here.',
		targetRanges: members.map((member) => member.range),
		groupKey: usageKindGroupKey(anchor.usageKind),
		unlocks: unlocksOf(members, context),
		feedback: V10C_FEEDBACK,
	};
}

/**
 * The binding × use-type groups this cross-variable item earns — one
 * `usage:<decl>:<kind>` per DISTINCT resolved binding among the members, in source
 * order, deduped. An unresolved occurrence (a free global) contributes a target but
 * no unlock, so it is dropped here. The cross-variable `groupKey`
 * (`usage-kind:<kind>`) is deliberately NOT among these — it has no peer form, so
 * V10c is not a member of the group(s) it unlocks.
 */
function unlocksOf(
	members: readonly IdentifierAnchor[],
	context: GenerationContext,
): readonly string[] {
	const keys = members
		.map((member) => unlockKeyOf(member, context))
		.filter((key): key is string => key !== null);
	// eslint-disable-next-line unicorn/prefer-spread -- Docusaurus/Babel mistranspiles `[...<Set>]` to `[<Set>]`; Array.from survives.
	return Array.from(new Set(keys));
}

/**
 * The binding × use-type key a member earns, or null when it resolves to no binding
 * (a free global). Self-contained: keys on the member's own `usageKind`, so it
 * needs no shared invariant about the group's kind.
 */
function unlockKeyOf(
	member: IdentifierAnchor,
	context: GenerationContext,
): string | null {
	const binding = resolveBinding(
		{ start: member.range[0], text: member.name },
		context.forest,
	);
	return binding === null ? null : usageGroupKey(binding, member.usageKind);
}

const V10C_FEEDBACK =
	'These are every place a variable is used this way — declared, read, assigned, or read-and-assigned — regardless of which variable: the same use-type across every binding.';
