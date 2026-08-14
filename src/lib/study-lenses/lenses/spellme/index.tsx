// cspell:ignore spellme

/**
 * The `spellme` lens — default-exports the frozen `Lens` object the
 * composition root imports by reference. See `./README.md` § UI
 * structure for the DOM contract and `./DOCS.md` for the sketch.
 */

import type { ReactElement } from 'react';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { Lens, LensProperties } from '../types.js';

import spellmeCore from './core.js';

/**
 * The spellme surface: the input tape, the token tape, the jar, the
 * claim form with whichever fields the attempt count has opened, and the
 * per-field verdicts in a live region.
 *
 * May assume this lens's applicability held over the embodiment's facts;
 * mounting it otherwise is a consumer bug, so it carries no refusal arm.
 */
function SpellmeMain(_properties: LensProperties): ReactElement | null {
	throw new Error('spellme main: not implemented');
}

/**
 * The lens object — the module's identity. Frozen at construction (the
 * consumer-facing freeze boundary); the composition root imports it by
 * reference and keys it by `name`.
 *
 * `phase` declares the **pedagogical target**, not which facts are read.
 * They coincide here, and that is a coincidence rather than a rule: the
 * five lifecycle phases and the six facts are not the same set.
 */
const spellmeLens = freezeInPlace({
	name: 'spellme',
	main: SpellmeMain,
	applicability: spellmeCore.applicability,
	config: spellmeCore.config,
	recommend: spellmeCore.recommend,
	phase: 'tokens',
} satisfies Lens);

export default spellmeLens;
