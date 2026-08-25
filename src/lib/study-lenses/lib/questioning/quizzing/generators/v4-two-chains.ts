/**
 * @file The V4 two-chains generator — the execution × atom question "which chain
 * does the engine walk to resolve this name?": the **scope chain** for a bare
 * reference (`x`, `Math` → `binding:access`) or the **prototype chain** for a
 * non-computed property access (`o.x`'s `x`, `str.length`'s `length` →
 * `proto-check`). The answer is read off AST position. A `program`-anchored
 * generator — the FIRST shipped generator to use that arm — because it must read
 * BOTH context anchor streams at once: a `node`-anchored V4 would fire only over
 * `identifierAnchors` (all scope-chain) and never see a prototype-chain occurrence,
 * so it would be vacuous. It emits one scope-chain item per `identifierAnchors`
 * occurrence (declarations included — a declared name is a scope-chain citizen) and
 * one prototype-chain item per `propertyAccessAnchors` occurrence, grouping each on
 * the binding-agnostic `chain:<role>:<name>` axis. V4 never resolves a binding, so
 * it is immune to the inc-2 FLAG. Copy is authored from the notional-machine doc's
 * "two chains, same shape" section (`embody/language-levels/just-enough-javascript/
 * notional-machine.md` L192-196, L254-328).
 */

import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type {
	ChainRole,
	GenerationContext,
	IdentifierAnchor,
	PropertyAccessAnchor,
} from '../context/types.js';
import chainGroupKey from '../keying/chain-group-key.js';
import type { McqQuizItem, QuizItem, QuizOption } from '../types.js';

import type { Generator } from './types.js';

const v4TwoChains: Generator = {
	anchorType: 'program',
	build(context: GenerationContext): readonly QuizItem[] {
		// Stream order (not source position): every scope-chain occurrence, then
		// every prototype-chain occurrence. Both streams are already source-ordered.
		return [
			...context.identifierAnchors.map((anchor) =>
				buildV4Item(anchor, 'scope-chain'),
			),
			...context.propertyAccessAnchors.map((anchor) =>
				buildV4Item(anchor, 'prototype-chain'),
			),
		];
	},
};

export default v4TwoChains;

/**
 * The V4 item for one anchor: the execution × atom two-chains question. The chain
 * `role` (scope vs prototype, decided by which stream the anchor came from) is the
 * answer key; the two chains are the fixed options. The propagation group is the
 * binding-agnostic `chain:<role>:<name>` axis, so every occurrence of one name in
 * one role shares a group. `family` is the form's fixed `'variables'` constant; the
 * `anchorRange` is the anchor's own span (the property identifier's span for a
 * prototype-chain item, never the enclosing member expression).
 */
function buildV4Item(
	anchor: IdentifierAnchor | PropertyAccessAnchor,
	role: ChainRole,
): McqQuizItem {
	return {
		mode: 'mcq',
		id: `V4@${anchor.range[0]}-${anchor.range[1]}`,
		family: 'variables',
		form: 'V4',
		anchorRange: anchor.range,
		cells: [{ dimension: 'execution', level: 'atom' }],
		prompt: V4_PROMPT,
		options: V4_OPTIONS,
		answerOptionIds: [role],
		groupKey: chainGroupKey(role, anchor.name),
		feedback: CHAIN_FEEDBACK[role],
	};
}

const V4_PROMPT = 'Which chain does this name belong to?';

const CHAIN_ORDER: readonly ChainRole[] = ['scope-chain', 'prototype-chain'];

const CHAIN_LABEL: Readonly<Record<ChainRole, string>> = {
	'scope-chain':
		'The scope chain — the name is a variable bound in the enclosing scopes (block → script → realm).',
	'prototype-chain':
		"The prototype chain — the name is a property found on the value's prototypes (e.g. String.prototype).",
};

const CHAIN_FEEDBACK: Readonly<Record<ChainRole, string>> = {
	'scope-chain':
		'This name is a variable — it belongs to the scope chain (block → script → realm), not to any prototype. A reference walks that chain to find it (binding:access): the same "walk a chain to find a name" shape as a property lookup, but on scopes.',
	'prototype-chain':
		'This name is a property access — the engine walks the prototype chain (the value, then its prototype) to find it (proto-check). Same "walk a chain to find a name" shape as a scope-chain lookup, but on prototypes.',
};

// Frozen at declaration (shared by reference across every V4 item, like the V1/V7
// option pools) — the generator's only shared, embedded-in-output value.
const V4_OPTIONS: readonly QuizOption[] = deepFreezeInPlace(
	CHAIN_ORDER.map((role) => ({
		id: role,
		text: CHAIN_LABEL[role],
	})),
);
