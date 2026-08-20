// cspell:ignore spellme

/**
 * @file Canonical types for the spellme lens.
 *
 * The domain model in TypeScript: which element kinds a learner claims
 * and which advance on their own, the three fates and the one mark, the
 * claim and its independent per-field verdicts, the per-mount session
 * state, and the configuration contract.
 *
 * Two families live here, per the region's convention. **Domain values**
 * are runtime structures this lens owns. **The configuration contract**
 * is the shape read out of the open `LensConfig` and must stay
 * serializable-primitive throughout.
 *
 * See `./README.md` for the claim contract, the gate, the
 * one-more-character question, and the vocabulary these types encode.
 * The element sequence itself is not derived here — see
 * `../../lib/scanning/README.md`.
 */

import type { InputElement } from '../../lib/scanning/types.js';

/**
 * The ten element kinds a learner claims.
 *
 * Spelled out rather than derived from the derivation's fourteen:
 * **which kinds this exercise asks about is this lens's decision**, so a
 * widening upstream must be met here deliberately rather than silently
 * growing the picker. The specification has no collective name for these
 * ten — `CommonToken` covers only six — so naming the union after a
 * production would be a false citation.
 */
export type ClaimableKind =
	| 'IdentifierName'
	| 'PrivateIdentifier'
	| 'Punctuator'
	| 'DivPunctuator'
	| 'RightBracePunctuator'
	| 'NumericLiteral'
	| 'StringLiteral'
	| 'Template'
	| 'TemplateSubstitutionTail'
	| 'RegularExpressionLiteral';

/**
 * The four kinds that advance on their own and are never claimed. The
 * learner watches these rather than asserting them; that is the whole
 * argument for not asking about them.
 */
export type AdvancingKind =
	| 'Comment'
	| 'HashbangComment'
	| 'WhiteSpace'
	| 'LineTerminator';

/**
 * Where an element ends up. This lens's word, derived from the element
 * kind — the derivation reports the kind and says nothing about
 * destinations.
 *
 * Every element has one, claimed or not. `set-aside` also takes the
 * hashbang, which the specification discards without ruling on where a
 * surface should show it: it is authored text that was lifted out and
 * kept, and evaporating it would teach that it was layout.
 */
export type Fate = 'token-tape' | 'set-aside' | 'consumed';

/**
 * One element as this exercise holds it: the derivation's element, the
 * fate derived from its kind, and the one mark.
 *
 * `marked` says **the syntactic grammar reads a line break here**. Two
 * elements carry it (human ruling 2026-08-20): a `LineTerminator`, which
 * is one directly, and a block comment containing one, which ECMA-262
 * §12.4 makes one for the purposes of the syntactic grammar. The mark is
 * the same property in both cases, which is why it is one field and not
 * two.
 *
 * It names a **property, never a consequence**: whether automatic
 * semicolon insertion actually fired depends on the production it lands
 * in, and this lens does not know that. Per-field correctness is a
 * `Verdict`, never a mark.
 */
export type StreamElement = {
	readonly element: InputElement;
	readonly fate: Fate;
	readonly marked: boolean;
};

/**
 * The three answers to "the extent on the stepper, plus one more
 * character — what would that be?"
 *
 * **The judged quantity is the claimed extent PLUS ONE**, never the
 * claimed extent itself. Writing `M` for that run's length and `L` for
 * the element's true extent: `M > L` is `not-an-element`; `M === L` is
 * `same-kind` or `different-kind` by what the sequence names there; and
 * `M < L` is answered `not-an-element` with a stated, narrow inaccuracy.
 * Judging against the claimed extent directly is off by one, and it is
 * off by one exactly where the question is most worth asking — a stepper
 * resting on the boundary.
 *
 * `not-an-element` is worded _not an element here_ on the surface, and
 * the qualifier is load-bearing: whether a run of characters is an
 * element depends on which goal symbol the scanner was asked, and that
 * question belongs to a different lens.
 */
export type OneMoreAnswer = 'same-kind' | 'different-kind' | 'not-an-element';

/**
 * One submitted answer about the element at the cursor.
 *
 * `oneMore` is carried only once the one-more-character field has
 * opened, and is `null` before that. It is judged but **never blocks**:
 * the element falls on `elementKind` and `extent` alone.
 *
 * `extent` is a **count of characters** — the width of the element's
 * span, not the span itself. The surface asks for a width because it is
 * the smaller thing to hold in mind; the two are converted at the
 * boundary rather than confused.
 */
export type Claim = {
	readonly elementKind: ClaimableKind;
	readonly extent: number;
	readonly oneMore: OneMoreAnswer | null;
};

/**
 * The judgement of one claim field. Two named semantic roles; the hues
 * that carry them are presentation and live in CSS custom properties,
 * never here.
 */
export type Verdict = 'attested' | 'diverging';

/**
 * One judged claim: one verdict per field the claim carried, judged
 * independently and never combined into a score. `oneMore` is present
 * exactly when the claim carried an answer for it.
 */
export type ClaimVerdicts = {
	readonly elementKind: Verdict;
	readonly extent: Verdict;
	readonly oneMore: Verdict | null;
};

/** Whether the learner put an element on its fate, or the machine did. */
export type Provenance = 'claimed' | 'unclaimed';

/** An element that has left the input tape, and whose doing it was. */
export type FallenElement = {
	readonly element: StreamElement;
	readonly provenance: Provenance;
};

/**
 * The lens's per-mount working state. Disposable: nothing survives an
 * unmount, and there is no score, no history and no persistence.
 *
 * `cursor` indexes the element sequence, not the source text, and rests
 * only on claimable elements. `attempts` counts wrong claims on the
 * element at the cursor and resets when the cursor advances; both
 * configured thresholds are read against it. `lastVerdicts` is `null`
 * until the first submitted claim — the surface treats that absence as
 * "unclaimed" rather than as a state.
 */
export type SessionState = {
	readonly cursor: number;
	readonly attempts: number;
	readonly fallen: ReadonlyArray<FallenElement>;
	readonly lastVerdicts: ClaimVerdicts | null;
};

/**
 * The fields this lens reads from the open `LensConfig`.
 *
 * Documentation type: no runtime import consumes this alias — the
 * component narrows the open-shape config field by field at its
 * boundary. This is the canonical statement of the fields and their
 * defaults.
 *
 * - `oneMoreAfter` — wrong attempts on one element **at which** the
 *   one-more-character field opens. Default `2`, so it opens on the
 *   third attempt. Reached, not exceeded: `0` opens it from the first
 *   attempt, which is the setting an educator wanting that trade reaches
 *   for, and no exceeds-reading could offer.
 * - `skipAfter` — wrong attempts on one element **at which** the
 *   hand-it-to-the-machine control appears. Default `4`.
 *
 * Both are non-negative integers and both count per element. A
 * `skipAfter` below `oneMoreAfter` leaves the one-more field unreachable
 * — legal, and an educator's choice rather than an error. Negative,
 * fractional and non-finite values are refused at the factory boundary
 * rather than coerced.
 */
export type SpellmeLensConfig = Readonly<{
	oneMoreAfter?: number;
	skipAfter?: number;
}>;
