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
import type { SessionState, StreamElement } from './types.js';

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
	// writer.
	const taken = stream.slice(0, session.cursor);
	// This survives the claim loop landing: a fate is a function of the element
	// KIND alone, so an element that fell because it was claimed is always
	// `token-tape` and never survives this filter, whoever moved it.
	const setAside = taken.filter(
		(streamElement) => streamElement.fate === 'set-aside',
	);
	// The tape's text comes from the STREAM, not from `facts.source.value`: the
	// elements tile the source exactly, so joining them reproduces it, and the
	// data flow has no edge from the source to this surface.
	const unspent = textOf(stream.slice(session.cursor));

	return (
		<div data-lens="spellme" data-cursor={session.cursor}>
			{/* The input tape: what the scanner has taken, the run the learner is
			    proposing, and what it has not reached (`./README.md`
			    § UI structure). The boundary between spent and unspent is the
			    only thing that moves — the characters stay where they are. */}
			<section data-spellme-input>
				<span data-spellme-consumed>{textOf(taken)}</span>
				<span data-spellme-proposed data-extent={PROPOSED_EXTENT}>
					{unspent.slice(0, PROPOSED_EXTENT)}
				</span>
				<span data-spellme-rest>{unspent.slice(PROPOSED_EXTENT)}</span>
			</section>
			{/* Always present, empty or not: an empty jar is itself information —
			    this program set nothing aside (`./ux/wireframes.md`). */}
			<section data-spellme-jar>
				{setAside.map((streamElement) => (
					<span
						data-spellme-set-aside
						data-marked={streamElement.marked}
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
 * The source text a run of stream elements covers. The elements tile the source
 * exactly (`../../lib/scanning/README.md`), so joining their text reproduces
 * the original characters — whitespace included — rather than approximating it.
 */
function textOf(run: ReadonlyArray<StreamElement>): string {
	return run.map((streamElement) => streamElement.element.text).join('');
}

/**
 * The extent the claim opens on, in characters (human ruling 2026-08-29).
 *
 * One, not the element's true width: `ux/wireframes.md`'s fresh-mount frame
 * draws a stepper already resting on the right answer, which would hand the
 * learner half the claim, while `ux/user-journeys.md` Journey 1 has them "step
 * the extent to 5" — so the frame is a moment mid-interaction, not a seed.
 *
 * ⚠ **A constant only until the stepper is live.** The extent becomes
 * component-local form state at the stepper increment, and `data-extent` must
 * track it — `./DOCS.md` § Structural constraints makes that the stated reason
 * the stepper is live at all.
 */
const PROPOSED_EXTENT = 1;

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
