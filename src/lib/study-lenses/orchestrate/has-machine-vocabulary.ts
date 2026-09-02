/**
 * Whether a learner-facing string carries vocabulary a learner would need
 * this package's glossary to understand.
 *
 * @remarks
 * This is the region's OPERATIONAL test made executable, and it is
 * deliberately not the etymological one: the question is whether the learner
 * needs the glossary, never who coined the word. So `barring edge` fails it,
 * naming a boundary the drawn copy never introduces — while `phase` PASSES,
 * which is why the count line may say "four phases have nothing to open yet"
 * even though `phase` is package vocabulary. A broader rule — no contract
 * vocabulary at all — would be falsified by the very string it is meant to
 * govern.
 *
 * Two channels of learner copy exist and one rule governs both: the strings
 * this region KEYS (`display-labels.ts`) and the strings it is HANDED by an
 * author elsewhere (a lens's own `label`). Both import this, so the rule has
 * one home and widening it reaches every instrument at once.
 */

import freezeInPlace from '@utils/freeze-in-place.js';

export default function hasMachineVocabulary(text: string): boolean {
	return NEEDS_THE_GLOSSARY.some((term) =>
		new RegExp(String.raw`\b${term}\b`, 'i').test(text),
	);
}

// Terms a learner meets nowhere in the drawn copy: this region's own contract
// nouns, and the mark values whose learner-facing words are keyed elsewhere.
// `phase`, `waiting` and `bare` are absent on purpose — each is an ordinary
// word the region reclaimed, and each is legible cold.
const NEEDS_THE_GLOSSARY: ReadonlyArray<string> = freezeInPlace([
	'lens',
	'lenses',
	'embodiment',
	'applicability',
	'gateable',
	'barring edge',
	'openable',
	'undetermined',
	'does-not-fit',
	'not-applicable-for-type',
]);
