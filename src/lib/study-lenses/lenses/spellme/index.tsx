// cspell:ignore spellme wireframes

/**
 * The `spellme` lens — default-exports the frozen `Lens` object the
 * composition root imports by reference. See `./README.md` § UI
 * structure for the DOM contract and `./DOCS.md` for the sketch.
 */

import React from 'react';
import type { ReactElement } from 'react';

import freezeInPlace from '@utils/freeze-in-place.js';

import type { Lens, LensProperties } from '../types.js';

import spellmeCore from './core.js';
import type { SessionState } from './types.js';

/**
 * The spellme surface: the input tape, the token tape, the jar, the
 * claim form with whichever fields the attempt count has opened, and the
 * per-field verdicts in a live region.
 *
 * May assume this lens's applicability held over the embodiment's facts;
 * mounting it otherwise is a consumer bug, so it carries no refusal arm.
 *
 * @remarks Owns the session state across renders, per `./DOCS.md`
 *   § Structural constraints — the pure layer never holds state, it takes
 *   a session and returns its successor.
 */
function SpellmeMain({ embodiment }: LensProperties): ReactElement {
	// Keyed on the embodiment, so the stream is read once per embodiment rather
	// than re-derived on every render. `readStream` is pure and its result is
	// frozen, so the memo is a cost decision, never a correctness one.
	const stream = React.useMemo(
		function readStreamOnce() {
			return spellmeCore.readStream(embodiment.facts);
		},
		[embodiment],
	);
	// Lazily seeded STATE rather than a memo: this is the session the pure
	// layer will take and return successors of, and the seed runs once. The
	// cursor is derived by `positionCursor` — the module's only writer of it —
	// never assigned a literal, so it already rests past the end on a program
	// with nothing claimable.
	const [session] = React.useState<SessionState>(function seedSession() {
		return {
			cursor: spellmeCore.positionCursor(stream, 0),
			attempts: 0,
			fallen: [],
			lastVerdicts: null,
		};
	});

	// Everything behind the cursor has already met its fate — that is what
	// `positionCursor` advancing past it MEANS, and it is the cursor's only
	// writer. This survives the claim loop landing: a fate is a function of the
	// element KIND alone, so an element that fell because it was claimed is
	// always `token-tape` and never survives this filter, whoever moved it.
	const setAside = stream
		.slice(0, session.cursor)
		.filter((streamElement) => streamElement.fate === 'set-aside');

	return (
		<div data-lens="spellme" data-cursor={session.cursor}>
			{/* Always present, empty or not: an empty jar is itself information —
			    this program set nothing aside (`./ux/wireframes.md`). */}
			<section data-spellme-jar>
				{setAside.map((streamElement) => (
					<span
						data-marked={streamElement.marked}
						data-spellme-set-aside
						key={streamElement.element.start}
					>
						{streamElement.element.text}
					</span>
				))}
			</section>
		</div>
	);
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
