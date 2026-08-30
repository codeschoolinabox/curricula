// cspell:ignore spellme wireframes colour

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
import type { ClaimableKind, SessionState, StreamElement } from './types.js';

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

	// The claim in progress — component-local form state, and NOT a `Claim`.
	// `./DOCS.md` § Structural constraints: `Claim` is only ever the submitted
	// snapshot the pure layer judges. `aria-pressed` is the only carrier of which
	// kind is selected (human ruling 2026-08-26); no `data-*` hook duplicates it.
	const [claimedKind, setClaimedKind] = React.useState<ClaimableKind | null>(
		null,
	);
	const [extent, setExtent] = React.useState(MINIMUM_EXTENT);

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
	// What the proposed span can actually show. The stepper is deliberately
	// unbounded — a `max` would restate the tape's own length, and a native `max`
	// does not clamp a typed value anyway — so the span clamps instead. Without
	// this, `data-extent` and the text it sits on are two different reads of one
	// state: a stepper at 500 over eight remaining characters would DRAW eight and
	// CLAIM five hundred. The control keeps the raw number the learner typed; the
	// span describes what the span holds.
	const shownExtent = Math.min(extent, unspent.length);
	// The consumed half of the mark. A set-aside comment carries `data-marked` on
	// its jar entry; a consumed line break leaves this instead, at the position
	// the grammar read it (`./DOCS.md` § Structural constraints). PRESENCE is the
	// mark — there is no false-valued twin, because an unmarked consumed element
	// leaves nothing at all, which is what evaporates MEANS.
	//
	// ⚠ **This shape is REPLACED, not extended, when fallen elements land**
	// (wave 5, with the claim loop). A second `.map()` appended beside this one
	// would render all breaks then all fallen elements — or the reverse — which
	// silently violates the stream order the comment below asserts. The
	// replacement is ONE ordered pass over `taken`, branching per element. It is
	// deliberately not written yet: nothing falls until `settle` exists, so
	// there is nothing to interleave with and no test could reach it.
	const breaks = taken.filter(
		(streamElement) =>
			streamElement.fate === 'consumed' && streamElement.marked,
	);
	// The cursor rests past the end exactly when nothing is left to claim — on an
	// empty program, on one that is only trivia, and (once the claim loop lands)
	// once the last element has fallen. `./README.md` § UI structure: the form is
	// ABSENT then, and nothing replaces it.
	const isClaimable = session.cursor < stream.length;

	return (
		<div data-lens="spellme" data-cursor={session.cursor}>
			{/* The input tape: what the scanner has taken, the run the learner is
			    proposing, and what it has not reached (`./README.md`
			    § UI structure). The boundary between spent and unspent is the
			    only thing that moves — the characters stay where they are. */}
			<section data-spellme-input>
				<span data-spellme-consumed>{textOf(taken)}</span>
				<span data-spellme-proposed data-extent={shownExtent}>
					{unspent.slice(0, shownExtent)}
				</span>
				<span data-spellme-rest>{unspent.slice(shownExtent)}</span>
			</section>
			{/* What has fallen, in stream order, plus the marks for the line
			    breaks the grammar read as the tape filled — including one read
			    before anything has fallen at all (`./README.md` § Glossary, _the
			    tapes_). Nothing falls until the claim loop lands, so at this wave
			    the tape holds marks alone. */}
			<section data-spellme-tokens>
				{breaks.map((streamElement) => (
					<span data-spellme-break key={streamElement.element.start}>
						{BREAK_MARK}
					</span>
				))}
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
			{isClaimable && (
				<form data-spellme-claim-form data-attempts={session.attempts}>
					<div data-spellme-element-kinds>
						{CLAIMABLE_KINDS.map((elementKind) => (
							<button
								data-element-kind={elementKind}
								aria-pressed={elementKind === claimedKind}
								key={elementKind}
								onClick={function pickThisKind() {
									setClaimedKind(elementKind);
								}}
								type="button"
							>
								{elementKind}
							</button>
						))}
					</div>
					{/* A WRAPPER, not the input: `./README.md` § UI structure writes
					    `<div data-spellme-extent>`, and the keyboard journey's test
					    selects `[data-spellme-extent] input` — a descendant. Native
					    `number`, because the extent is a small integer and a stepper
					    is keyboard-reachable where a drag is not. */}
					<div data-spellme-extent>
						<label>
							extent, in characters
							<input
								min={MINIMUM_EXTENT}
								onChange={function stepExtent(event) {
									setExtent(readExtent(event.target.value));
								}}
								type="number"
								value={extent}
							/>
						</label>
					</div>
					{/* Drawn as `[ claim it ]` in the twin's fresh-mount frame and
					    specified at `./README.md` § UI structure. INERT in this wave
					    by ruling — the stepper and the picker are live, submitting
					    and judging are not, and `judgeClaim`/`settle` are still
					    stubs. It renders because a claim form the twin draws with a
					    button, drawn without one, is not this form. */}
					<button data-spellme-submit type="button">
						claim it
					</button>
				</form>
			)}
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
 * The ten element kinds a learner claims, in the order the picker offers them —
 * `./README.md` § What the learner claims, and the twin's fresh-mount frame.
 *
 * **Spelled out, never filtered from the fourteen.** `./DOCS.md` § Decisions
 * rules this directly: which kinds this exercise asks about is a pedagogical
 * decision, and deriving it would let a widening upstream silently grow the
 * picker. `Object.keys(FATE_BY_KIND).filter(…)` is the forbidden form.
 *
 * ⚠ **Known residual, closed by a test rather than by the type.** The
 * annotation pins that every entry IS a claimable kind, and the suite pins that
 * there are ten — but neither catches a DUPLICATE standing in for an omission.
 * A *compile-time* guarantee would want a totality device like the one `core.ts`
 * uses for its kind tables, which is a contract question. A *runtime* one is
 * cheap and sufficient: ten DISTINCT values, each type-pinned to a ten-member
 * union, is the whole union exactly once by pigeonhole. That assertion is an
 * authored regression lock and lands with the others (raised by `ar-4` at this
 * increment; an earlier draft of this comment claimed nothing short of a
 * contract change could close it, which was wrong).
 */
const CLAIMABLE_KINDS: ReadonlyArray<ClaimableKind> = freezeInPlace<
	ReadonlyArray<ClaimableKind>
>([
	'IdentifierName',
	'PrivateIdentifier',
	'Punctuator',
	'DivPunctuator',
	'RightBracePunctuator',
	'NumericLiteral',
	'StringLiteral',
	'Template',
	'TemplateSubstitutionTail',
	'RegularExpressionLiteral',
]);

/**
 * What a consumed line break leaves on the token tape.
 *
 * ⚠ **A PROPOSAL, not a settled design.** `./ux/wireframes.md`
 * § What has no wire-frame, deliberately records this visual as **owed and
 * undesigned** and defers it to a sandbox checkpoint against a running surface,
 * so something must exist for the human to react to. It meets the two
 * constraints that document does state: it is a glyph rather than colour alone,
 * and it says a line break is read here and nothing about whether automatic
 * semicolon insertion fired — which depends on the production, and which this
 * lens does not know.
 */
const BREAK_MARK = '↵';

/**
 * The stepper's value as a number, converted at the boundary rather than
 * confused with the string the DOM hands over (`./README.md` § Glossary,
 * _extent_, on the same discipline between an extent and a span).
 *
 * `Number`, not `Number.parseInt`: parseInt stops at the first non-digit, so it
 * reads `'1e2'` as 1 and `'3xyz'` as 3 — silently guessing where the string was
 * not a legal number at all. It also never returns a fraction, which would make
 * the `Number.isInteger` guard below dead code. A real `type="number"` field
 * sanitizes most of this away, but jsdom does not, and the claim loop's tests
 * will construct these strings directly.
 *
 * Anything that is not a legal extent floors to the minimum rather than reaching
 * the surface as `0` or `NaN`. Flooring visibly is the interactive analogue of
 * the factory's refuse-rather-than-coerce rule (`./DOCS.md` § Decisions): a live
 * control cannot throw on every keystroke, but it can decline to guess.
 */
function readExtent(value: string): number {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed >= MINIMUM_EXTENT
		? parsed
		: MINIMUM_EXTENT;
}

/**
 * The extent the claim opens on, in characters (human ruling 2026-08-29).
 *
 * One, not the element's true width: `ux/wireframes.md`'s fresh-mount frame
 * draws a stepper already resting on the right answer, which would hand the
 * learner half the claim, while `ux/user-journeys.md` Journey 1 has them "step
 * the extent to 5" — so the frame is a moment mid-interaction, not a seed.
 *
 * It doubles as the stepper's floor: an element of zero characters cannot
 * exist, so nothing below this is a claim anyone could make. There is
 * deliberately no ceiling — the proposed run is clipped by the text remaining
 * on the tape, so a ceiling would restate the tape's own length.
 */
const MINIMUM_EXTENT = 1;

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
