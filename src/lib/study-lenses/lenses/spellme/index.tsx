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
import type {
	ClaimableKind,
	OneMoreAnswer,
	SessionState,
	StreamElement,
} from './types.js';

import './spellme.css';

/**
 * The spellme surface: the input tape, the token tape, the jar, the
 * claim form with whichever fields the attempt count has opened, the
 * per-field verdicts in a live region, and the two static regions — the
 * fates panel, collapsed, and the legend, open.
 *
 * May assume this lens's applicability held over the embodiment's facts;
 * mounting it otherwise is a consumer bug, so it carries no refusal arm.
 *
 * @remarks Owns the session state across renders, per `./DOCS.md`
 *   § Structural constraints — the pure layer never holds state, it takes
 *   a session and returns its successor.
 */
function SpellmeMain({ config, embodiment }: LensProperties): ReactElement {
	// Re-resolved through this module's own factory, as `../parsons/` and
	// `../writeme/` both do. The orchestrator has already run it — its
	// `resolve-lens-config.ts` calls `lens.config(overrides)` — so this is
	// idempotent and defensive rather than the first resolution.
	//
	// ⚠ The factory THROWS a `RangeError` on an out-of-range threshold
	// (`./core.ts`), so this call can throw during render. That is a boundary
	// refusing invalid input, and it is NOT the refusal barred from `main`: that
	// bar lives in `./README.md` § Edge cases, citing `../types.ts`'s `Lens`
	// Totality remark, and it is about applicability answering as DATA so `main`
	// carries no refusal ARM. An educator's malformed setting is instead the
	// fail-fast case this package refuses at every other boundary.
	//
	// ⚠ The siblings share the PATTERN, not the RISK. `../parsons/` and
	// `../writeme/` re-resolve through their own factories exactly like this, but
	// neither factory validates anything [measured 2026-08-30: zero `throw new`
	// or `@throws` in either sibling's `core.ts`, against eight in this module's],
	// so this is the first lens of the family whose render-time re-resolution can
	// throw at all.
	const resolved = React.useMemo(
		function resolveConfig() {
			return spellmeCore.config(config);
		},
		[config],
	);
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

	// Narrowed FIELD BY FIELD off the open-shape `LensConfig`, which is a
	// `Record<string, SerializableValue>` — `session.attempts >= config.oneMoreAfter`
	// is a type error without this. `./core.ts` is where the defaults actually
	// live; `./types.ts` § SpellmeLensConfig states them in prose.
	//
	// ⚠ The literals below are NOT dead. They are unreachable for any
	// configuration that passed the factory's range check — but that check guards
	// on `typeof value === 'number'`, so a NON-NUMERIC override survives the
	// factory unrefused, and does so deliberately: `./README.md` § Configuration
	// rules that "a non-numeric threshold is a different question and is
	// deliberately not answered here". In exactly that case the factory has run
	// and succeeded on a value that is not a number — `SerializableValue` admits
	// a string, a boolean, `null` and an array of those, and the guard excludes
	// none of them — and these literals are what the render falls back to,
	// silently, with no throw and no report. Whether that silence is right is
	// README's open question, not this file's to settle.
	const oneMoreAfter =
		typeof resolved.oneMoreAfter === 'number' ? resolved.oneMoreAfter : 2;
	const skipAfter =
		typeof resolved.skipAfter === 'number' ? resolved.skipAfter : 4;
	// Both thresholds are REACHED, not exceeded (`./README.md` § Configuration,
	// human ruling 2026-08-14): `>=`, never `>`. Under an exceeds reading no
	// configuration could open either control on the first attempt, and
	// `oneMoreAfter: 0` is precisely the setting an educator wanting that trade
	// reaches for.
	//
	// ⚠ `session.attempts` is permanently 0 until `settle` exists, so at this
	// wave only a ZERO threshold opens either region. That is not a placeholder:
	// it is the whole reason the suite carries a `{ oneMoreAfter: 0 }` fixture.
	const isWayPastOpen = session.attempts >= skipAfter;

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
	// The one-more field needs BOTH the threshold and a character to ask about,
	// and it must be computed here because `shownExtent` is its second input.
	// That value is CLAMPED to the text left on the tape, so once the stepper
	// reaches the end `unspent.slice(0, shownExtent + 1)` and
	// `unspent.slice(0, shownExtent)` are the same string and the two stacked runs
	// stop differing. The twin's whole reason for stacking them is that "the extra
	// character is the only thing that moves between the two lines"; drawn there,
	// nothing moves and the field says one more character changes nothing — the
	// inverse of what it teaches. So the question is not asked when it has no
	// referent (human ruling 2026-09-03), which is the same refuse-rather-than-
	// coerce posture as the factory declining an out-of-range threshold.
	const isOneMoreOpen =
		session.attempts >= oneMoreAfter && shownExtent < unspent.length;
	// The consumed half of the mark. A set-aside comment carries `data-marked` on
	// its jar entry; a consumed line break leaves this instead, at the position
	// the grammar read it (`./DOCS.md` § Structural constraints). PRESENCE is the
	// mark — there is no false-valued twin, because an unmarked consumed element
	// leaves nothing at all, which is what evaporates MEANS.
	//
	// ⚠ **Fallen elements REPLACE this shape rather than joining it.** A second
	// `.map()` beside this one renders all breaks then all fallen elements — or
	// the reverse — which violates the stream order the token tape asserts. The
	// form that holds both is ONE ordered pass over `taken`, branching per
	// element.
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
			    tapes_). A mark is not a fallen element and carries no provenance:
			    nothing claimed it. */}
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
					{/* The question is the stepper's value PLUS ONE (`./README.md`
					    § One more character) — never the stepper's value itself,
					    which is off by one exactly where the question is most worth
					    asking: at a stepper resting on the boundary. It opens BELOW
					    the extent and pushes the button down, so the surface visibly
					    grows a new requirement rather than swapping one in
					    (`./ux/wireframes.md`).

					    ⚠ Both runs are built on `shownExtent`, the CLAMPED value,
					    not the raw stepper: these two lines must describe text that
					    is actually on the tape, and a run past the end would draw
					    nothing while naming something. The seam is real and belongs
					    to the wave that wires judging — `judgeClaim` compares the
					    CLAIMED extent plus one, and the claimed extent is the raw
					    stepper. The two agree everywhere the stepper is within the
					    tape, which is everywhere a claim could be correct.

					    ⚠ The radios are DISABLED, not merely unwired (human ruling
					    2026-08-30). An uncontrolled radio keeps its `checked` state
					    in the DOM across re-renders, so a live-looking group here
					    would let a stale answer stand against a changed question —
					    which `./DOCS.md` § Structural constraints forbids by name.
					    `disabled` is what makes "selecting does nothing" true rather
					    than merely intended, and it owes no clear-on-step test
					    because there is no pending answer to clear. The wave that
					    wires judging removes the attribute. */}
					{isOneMoreOpen && (
						<div data-spellme-one-more>
							{/* A description list, not four sibling paragraphs: the twin
							    draws these "stacked and aligned, so the extra character
							    is the only thing that moves between the two lines", and
							    `<dl>` is what makes each label OWN its run rather than
							    merely precede it. Paragraphs would read correctly today
							    and decouple silently the first time the stylesheet
							    arranges labels and runs in separate columns — with no
							    test able to see it, since nothing anywhere in this
							    module's tests reads `textContent`.

							    ⚠ This is a TRADE, not a free improvement, and it is
							    not settled here. A description list carries list
							    semantics four paragraphs did not, so a screen reader
							    may announce the group before each pair — added
							    verbosity on a control `ux/user-journeys.md` already
							    worries about, since its items 5 and 6 are both about
							    costs that compound across many repeated claims. Which
							    way that nets out is the kind of question this module
							    settles at a running surface rather than on paper, like
							    the falling animation and the consumed break's mark.
							    Owed to a sandbox checkpoint. */}
							<dl>
								<dt>on the stepper</dt>
								<dd>{unspent.slice(0, shownExtent)}</dd>
								<dt>one more</dt>
								<dd>{unspent.slice(0, shownExtent + 1)}</dd>
							</dl>
							<fieldset disabled>
								<legend>and what would that be?</legend>
								{ONE_MORE_ANSWERS.map((option) => (
									<label key={option.answer}>
										<input
											name="spellme-one-more"
											type="radio"
											value={option.answer}
										/>
										{option.label}
									</label>
								))}
							</fieldset>
						</div>
					)}
					{/* Drawn as `[ claim it ]` in the twin's fresh-mount frame and
					    specified at `./README.md` § UI structure. It carries no handler
					    while `judgeClaim` and `settle` are stubs (human ruling
					    2026-08-26: the stepper and the picker are live, submitting and
					    judging are not). It renders regardless, because a claim form the
					    twin draws with a button, drawn without one, is not this form. */}
					<button data-spellme-submit type="button">
						claim it
					</button>
					{/* BESIDE the claim button, never in place of it — an
					    equal-weight sibling rather than a demotion, because taking it
					    is a legitimate move and a control that looked like giving up
					    would teach that being stuck is a failure rather than a place
					    (`./ux/wireframes.md` § After the fourth wrong claim). INERT
					    alongside submit by the same 2026-08-26 ruling: handing an element
					    over moves the cursor, and `settle` is a stub. */}
					{isWayPastOpen && (
						<button data-spellme-skip type="button">
							let the machine
						</button>
					)}
				</form>
			)}
			{/* Unconditional, unlike parsons's conditional score region: the tests
			    reach for it directly and a missing region is an error, not a state.
			    The three verdict attributes are ABSENT until the first submitted
			    claim — `./README.md` § UI structure, "treat absence as unclaimed,
			    not as a state" — so each renders `undefined` and React drops it
			    rather than emitting an empty string. `judgeClaim` fills them; it is
			    a separate seam from rendering them. */}
			<div
				data-spellme-verdicts
				aria-live="polite"
				data-element-kind-verdict={session.lastVerdicts?.elementKind}
				data-extent-verdict={session.lastVerdicts?.extent}
				data-one-more-verdict={session.lastVerdicts?.oneMore}
			/>
			{/* COLLAPSED is structural rather than a state: `./README.md` § UI
			    structure writes `<details data-spellme-fates>`, and a bare `<details>`
			    is closed — no `open` prop is written, and none should be. It is the
			    deliberate INVERSE of the legend below: the vocabulary a learner cannot
			    play without is open, the reference they consult when a character
			    surprises them is not.

			    ⚠ Both twins were checked before this content was written — checking
			    one and generalizing is the failure this module has already committed
			    once, at the legend. `ux/wireframes.md` drew this panel in a title bar
			    until README's placement won (human ruling 2026-08-30); that frame now
			    draws it here.
			    `ux/user-journeys.md` names the fates exactly once — "The three fates
			    carry a border style as well as a hue" — which is a requirement on the
			    stylesheet, NOT on this panel, and is carried there rather than
			    absorbed here.

			    The wording is `./README.md` § The three fates, condensed rather than
			    newly authored — plus "claimed or not", which is borrowed from that
			    file's § Glossary rather than from § The three fates, and which
			    `types.ts` echoes on `Fate`. It keeps the mark's negative, the one
			    thing here a learner is most likely to over-read. */}
			<details data-spellme-fates>
				<summary>the three fates</summary>
				<p>
					Every character meets one of three fates, claimed or not. Two are
					quiet, and neither is quite nothing.
				</p>
				<ul>
					<li>
						<strong>becomes a token</strong> — lands on the token tape
					</li>
					<li>
						<strong>set aside</strong> — goes to the jar, and stays there
					</li>
					<li>
						<strong>consumed</strong> — evaporates
					</li>
				</ul>
				<p>
					Two of them can leave a <strong>mark</strong>: a block comment
					carrying a line break, and a line break itself. The mark says the
					syntactic grammar reads a line break here — never that automatic
					semicolon insertion fired, which depends on the production, and which
					this lens does not know.
				</p>
			</details>
			{/* A plain div, and OPEN is structural rather than a state: `./README.md`
			    § UI structure writes `<div data-spellme-legend>`, where parsons's
			    equivalent is a collapsed `<details>`. The contrast is the reason —
			    parsons's legend explains feedback colours, which a learner can
			    ignore and still play; this one explains the answer vocabulary,
			    which they cannot.

			    ⚠ It stays visible when the picker does NOT: the form is gated on
			    whether anything is left to claim, the legend is not, so the vocabulary is still readable
			    on a program with nothing left to claim.

			    ⚠ It carries the two facts `ux/user-journeys.md` says a learner
			    takes FROM IT — Journey 1's "the legend they just read says a
			    keyword is an identifier name", and Journey 4's learner who reads
			    it again on reaching `true`. An earlier draft listed the ten names
			    alone and justified that by "the twin draws no legend region";
			    that is true of `ux/wireframes.md` and FALSE of its sibling, which
			    is the wave-1 failure of checking one twin and calling the twin
			    done. The wording below is `./README.md` § What the learner claims,
			    condensed, not newly authored. */}
			<div data-spellme-legend>
				<p>the ten element kinds you can claim</p>
				<ul>
					{CLAIMABLE_KINDS.map((elementKind) => (
						<li key={elementKind}>{elementKind}</li>
					))}
				</ul>
				<p>
					Every keyword is an <code>IdentifierName</code> — at this phase{' '}
					<code>if</code> and <code>myVar</code> are the same kind of thing. And
					so are <code>null</code>, <code>true</code> and <code>false</code>,
					which is the sharper case: they look like values, and there are two
					literal buttons inviting the mistake.
				</p>
			</div>
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
 * union, is the whole union exactly once by pigeonhole.
 *
 * The distinctness assertion is `tests/component.test.tsx`'s
 * `offers ten distinct element kinds`, which counts a `Set` of the rendered
 * `data-element-kind` values.
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
 * The three answers to the one-more-character question, in the order
 * `./README.md` § One more character lists them, paired with its wording.
 *
 * The values are `OneMoreAnswer` verbatim, so the wave that wires judging reads
 * a submitted answer straight off the input rather than translating a label
 * back into the domain.
 *
 * ⚠ **README's wording, deliberately, not the twin's.** Both `./ux/` documents
 * draw the first option specialized to the kind the learner picked — `still a
 * Punctuator`. That reads better and cannot be built from these three strings:
 * it breaks on the article (`still a IdentifierName`) and has no defined form
 * before any kind is picked. Recorded as a refinement for a sandbox checkpoint
 * to ask for, rather than silently dropped.
 *
 * ⚠ `not an element here` must not be shortened. The word *here* is
 * load-bearing: whether a run of characters is an element depends on which
 * question the scanner was asked, and that question belongs to a different
 * lens.
 */
const ONE_MORE_ANSWERS: ReadonlyArray<{
	readonly answer: OneMoreAnswer;
	readonly label: string;
}> = freezeInPlace([
	{ answer: 'same-kind', label: 'still an element of the same kind' },
	{ answer: 'different-kind', label: 'an element of a different kind' },
	{ answer: 'not-an-element', label: 'not an element here' },
]);

/**
 * What a consumed line break leaves on the token tape.
 *
 * A glyph rather than colour alone, and it says a line break is read here and
 * nothing about whether automatic semicolon insertion fired — which depends on
 * the production, and which this lens does not know. Those are the two
 * constraints `./ux/wireframes.md` states for this mark.
 *
 * ⚠ **It fires on EVERY line**, because `isMarked` is true for every
 * `LineTerminator`. `ux/wireframes.md`'s argument that the mark is "rare enough
 * not to crowd" is therefore false, and the density is a known open question
 * rather than a settled design (human ruling 2026-09-02: it stays as drawn).
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
	label: 'drive the scanner',
	main: SpellmeMain,
	applicability: spellmeCore.applicability,
	config: spellmeCore.config,
	recommend: spellmeCore.recommend,
	phase: 'tokens',
} satisfies Lens);

export default spellmeLens;
