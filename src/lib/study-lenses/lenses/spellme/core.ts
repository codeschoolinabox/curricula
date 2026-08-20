// cspell:ignore spellme

/**
 * The pure core of the `spellme` lens — the configuration factory, the
 * gate, and the phases the surface is a rendering of.
 *
 * @remarks Per the region's two-layer module convention, `core.ts`
 * imports no React. Tests run in vitest without jsdom (see
 * `./tests/core.test.ts`).
 */

import type { Facts } from '../../embody/types.js';
import type { LensConfig, Recommendation } from '../types.js';

import type {
	Claim,
	ClaimVerdicts,
	SessionState,
	StreamElement,
} from './types.js';

/**
 * Resolves the spellme lens's configuration — applies the two
 * documented defaults and merges overrides on top (overrides win).
 * Unknown fields are preserved verbatim, per the open-shape contract.
 *
 * Per the kind contract, an override key present with `undefined` is
 * treated as absent and the default applies, while `null` and `false`
 * are values and win verbatim.
 *
 * @throws TypeError on a negative, fractional or non-finite threshold —
 *   the factory is a boundary and does not coerce invalid input (see
 *   `./README.md` § Configuration).
 */
function config(_overrides?: Partial<LensConfig>): LensConfig {
	throw new Error('spellme config: not implemented');
}

/**
 * Whether this lens can serve the embodiment: the tokens stage must have
 * produced a value, because the element sequence is derived from it.
 *
 * No syntax tree is read, so a program that lexes but does not parse is
 * served in full.
 */
function applicability(_facts: Facts): boolean {
	throw new Error('spellme applicability: not implemented');
}

/**
 * Derives the stream from the input-element sequence the embodiment
 * publishes at `facts.tokens.value.inputElements`: every input element
 * carrying the fate its kind implies and, where it has one, its mark.
 *
 * Derives no element, and calls nothing — the scanning leaf owns the
 * derivation and its vocabulary, the embodiment publishes the result,
 * and this function reads the published member.
 *
 * Called behind `applicability`, so an unusable embodiment is a caller
 * bug rather than a state to absorb.
 */
function readStream(_facts: Facts): ReadonlyArray<StreamElement> {
	throw new Error('spellme readStream: not implemented');
}

/**
 * Advances a cursor past every element that advances on its own, so it
 * comes to rest on a claimable element or past the end of the stream.
 * The only writer of the cursor.
 */
function positionCursor(
	_stream: ReadonlyArray<StreamElement>,
	_from: number,
): number {
	throw new Error('spellme positionCursor: not implemented');
}

/**
 * Judges each field of a submitted claim independently against the
 * element at the cursor. No field is inferred from another.
 *
 * The one-more-character verdict compares the shown extent against the
 * element's own — longest match, from the sequence already derived —
 * and never consults a table of punctuators.
 */
function judgeClaim(
	_stream: ReadonlyArray<StreamElement>,
	_cursor: number,
	_claim: Claim,
): ClaimVerdicts {
	throw new Error('spellme judgeClaim: not implemented');
}

/**
 * Produces the next session state from the verdicts: the element falls
 * when kind and extent both attest, and the one-more verdict never
 * blocks it. Any blocking field diverging moves nothing and raises the
 * attempt count.
 */
function settle(
	_state: SessionState,
	_stream: ReadonlyArray<StreamElement>,
	_verdicts: ClaimVerdicts,
): SessionState {
	throw new Error('spellme settle: not implemented');
}

/**
 * Hands the element at the cursor to the machine: it falls named and
 * unclaimed, and the cursor advances. Available once attempts reach the
 * way-past threshold; the gate is unchanged by it.
 */
function handOver(
	_state: SessionState,
	_stream: ReadonlyArray<StreamElement>,
): SessionState {
	throw new Error('spellme handOver: not implemented');
}

/**
 * Next-step proposals for this lens. Returns the shared frozen empty
 * array — spellme is offered via its gate and contributes no
 * recommendations yet (see `./README.md` § Future direction).
 */
function recommend(): ReadonlyArray<Recommendation> {
	throw new Error('spellme recommend: not implemented');
}

// Intentionally unfrozen — `./index.tsx` freezes the composed `Lens`
// object at construction time, the consumer-facing freeze boundary.
const spellmeCore = {
	config,
	applicability,
	readStream,
	positionCursor,
	judgeClaim,
	settle,
	handOver,
	recommend,
};

export default spellmeCore;
