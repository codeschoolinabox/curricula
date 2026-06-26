/**
 * @file The V7 usage-kind generator — the text-surface × relation question "how
 * is this variable used here?", one per identifier occurrence. A `node`-anchored
 * generator: the run phase fires its `build` over the per-node identifier-anchor
 * stream (so non-reference occurrences — property names, object keys — never
 * reach it). The answer key is the occurrence's usage kind, read off its AST
 * position (no binding resolution); the propagation group is per-occurrence
 * (`usage:<start>-<end>`, group-of-one) until V10b earns binding × use-type
 * propagation.
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type {
	GenerationContext,
	IdentifierAnchor,
	UsageKind,
} from '../context/types.js';
import type { McqQuizItem, QuizItem, QuizOption } from '../types.js';

import type { Generator } from './types.js';

const v7UsageKind: Generator = {
	anchorType: 'node',
	build(
		anchor: IdentifierAnchor,
		_context: GenerationContext,
	): readonly QuizItem[] {
		return [buildV7Item(anchor)];
	},
};

export default v7UsageKind;

/**
 * The V7 item for one occurrence: the text-surface × relation usage-kind
 * question. The occurrence's `usageKind` (read off AST position by the descent)
 * is the answer key; the four usage kinds are the fixed options. The propagation
 * group is keyed per-occurrence (`usage:<start>-<end>`) — a group-of-one,
 * deliberately finer than V8's binding grouping, because two occurrences of one
 * binding can be used differently; V10b re-keys to binding × use-type when it
 * earns that propagation. `family` is the form's fixed `'variables'` constant.
 */
function buildV7Item(anchor: IdentifierAnchor): McqQuizItem {
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
		groupKey: `usage:${anchor.range[0]}-${anchor.range[1]}`,
		feedback: USAGE_FEEDBACK[anchor.usageKind],
	};
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
