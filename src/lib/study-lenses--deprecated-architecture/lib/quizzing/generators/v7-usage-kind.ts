/**
 * @file The V7 usage-kind generator — the text-surface × relation question "how
 * is this variable used here?", one per identifier occurrence. A `node`-anchored
 * generator: the run phase fires its `build` over the per-node identifier-anchor
 * stream (so non-reference occurrences — property names, object keys — never
 * reach it). The answer key is the occurrence's usage kind, read off its AST
 * position. The propagation group is keyed on binding × use-type
 * (`usage:<decl-start>-<decl-end>:<usageKind>` via `usageGroupKey`), so every
 * occurrence of one binding used the same way shares a group — the key the V10b
 * sameness form carries to bulk-credit these items. An occurrence with no
 * resolvable binding (a free global, or any name the scope forest does not track)
 * falls back to a per-occurrence group-of-one (`usage:occ:<start>-<end>`).
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type {
	GenerationContext,
	IdentifierAnchor,
	UsageKind,
} from '../context/types.js';
import usageGroupKey from '../keying/usage-group-key.js';
import resolveBinding from '../resolving/resolve-binding.js';
import type { McqQuizItem, QuizItem, QuizOption } from '../types.js';

import type { Generator } from './types.js';

const v7UsageKind: Generator = {
	anchorType: 'node',
	build(
		anchor: IdentifierAnchor,
		context: GenerationContext,
	): readonly QuizItem[] {
		return [buildV7Item(anchor, context)];
	},
};

export default v7UsageKind;

/**
 * The V7 item for one occurrence: the text-surface × relation usage-kind
 * question. The occurrence's `usageKind` (read off AST position by the descent)
 * is the answer key; the four usage kinds are the fixed options. The propagation
 * group is keyed on binding × use-type (see `usageGroupKeyFor`). `family` is the
 * form's fixed `'variables'` constant.
 */
function buildV7Item(
	anchor: IdentifierAnchor,
	context: GenerationContext,
): McqQuizItem {
	return {
		mode: 'mcq',
		id: `V7@${anchor.range[0]}-${anchor.range[1]}`,
		family: 'variables',
		form: 'V7',
		anchorRange: anchor.range,
		cells: [{ dimension: 'text-surface', level: 'relation' }],
		prompt: V7_PROMPT,
		options: V7_OPTIONS,
		answerOptionIds: [anchor.usageKind],
		groupKey: usageGroupKeyFor(anchor, context),
		feedback: USAGE_FEEDBACK[anchor.usageKind],
	};
}

/**
 * The occurrence's binding × use-type propagation key. Resolves the occurrence to
 * its binding (the same `resolveBinding` V8 uses) and keys it via `usageGroupKey`,
 * so every occurrence of one binding used the same way shares a group — the key
 * V10b carries to bulk-credit these items. An occurrence with no resolvable
 * binding (the same boundary V8 resolves behind) falls back to a per-occurrence
 * group-of-one (`usage:occ:<start>-<end>`): the one projection-less key kept
 * inline here rather
 * than serialized in `keying/` (DOCS § Decisions — nothing else ever constructs
 * it). `resolveBinding` is pure and total; V7 now pays its per-occurrence
 * resolution cost (the same as V8), with no cross-generator memoization — an
 * accepted redundancy on JeJ-sized snippets.
 */
function usageGroupKeyFor(
	anchor: IdentifierAnchor,
	context: GenerationContext,
): string {
	const binding = resolveBinding(
		{ start: anchor.range[0], text: anchor.name },
		context.forest,
	);
	return binding === null
		? `usage:occ:${anchor.range[0]}-${anchor.range[1]}`
		: usageGroupKey(binding, anchor.usageKind);
}

const V7_PROMPT = 'How is this variable used here?';

const USAGE_ORDER: readonly UsageKind[] = [
	'declared',
	'read',
	'assigned',
	'read-and-assigned',
];

const USAGE_LABEL: Readonly<Record<UsageKind, string>> = {
	declared: 'Declared — this occurrence introduces the binding',
	read: 'Read — this occurrence uses the value',
	assigned: 'Assigned — this occurrence writes a new value',
	'read-and-assigned':
		'Read and assigned — this occurrence both reads and writes (e.g. x += 1)',
};

const USAGE_FEEDBACK: Readonly<Record<UsageKind, string>> = {
	declared:
		'This occurrence declares the variable — it introduces the binding into scope.',
	read: 'This occurrence reads the variable — it uses the current value without changing it.',
	assigned:
		'This occurrence assigns the variable — it writes a new value, replacing the old one.',
	'read-and-assigned':
		'This occurrence both reads and assigns the variable — it uses the current value and writes a new one (e.g. x += 1 or x++).',
};

// Frozen at declaration (shared by reference across every V7 item, like
// V1_OPTIONS) — the generator's only shared, embedded-in-output value.
const V7_OPTIONS: readonly QuizOption[] = deepFreezeInPlace(
	USAGE_ORDER.map((kind) => ({
		id: kind,
		text: USAGE_LABEL[kind],
	})),
);
