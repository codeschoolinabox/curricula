// cspell:ignore spellme

/**
 * The pure core of the `spellme` lens — the configuration factory, the
 * gate, and the phases the surface is a rendering of.
 *
 * @remarks Per the region's two-layer module convention, `core.ts`
 * imports no React. Tests run in vitest without jsdom (see
 * `./tests/core.test.ts`).
 */

import cloneAndFreeze from '@utils/clone-and-freeze.js';

import type { Facts } from '../../embody/types.js';
import type {
	LensConfig,
	Recommendation,
	SerializableValue,
} from '../types.js';

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
function config(overrides: Partial<LensConfig> = {}): LensConfig {
	// Drop `undefined`-valued keys BEFORE the spread: a bare spread would let
	// `{ oneMoreAfter: undefined }` shadow the default with `undefined`,
	// violating the kind contract's absent-key rule. `null`/`false` survive the
	// filter and win verbatim (no `??` / `||` coercion).
	const defined = Object.fromEntries(
		Object.entries(overrides).filter(
			(entry): entry is [string, SerializableValue] => entry[1] !== undefined,
		),
	);
	refuseOutOfRangeThresholds(defined);
	// `cloneAndFreeze` (not `freezeInPlace`) so a caller-supplied overrides
	// object is NOT frozen as a side-effect.
	return cloneAndFreeze<LensConfig>({
		oneMoreAfter: 2,
		skipAfter: 4,
		...defined,
	});
}

/**
 * Whether this lens can serve the embodiment:
 * `facts.tokens.ok && facts.tokens.value.inputElements !== undefined`.
 *
 * Two conditions (human ruling 2026-08-19). The tokens stage because a
 * source that does not lex has no sequence at all. The member's presence
 * because it is optional — embody publishes it on every successful
 * tokenization except when its own derivation defected — so a successful
 * tokens stage does not by itself guarantee the sequence exists. Absent
 * it, this lens has nothing to build a stream from, so it declines and
 * is not offered.
 *
 * Presence is tested with `!== undefined` rather than `in`. Both narrow
 * under this repo's `exactOptionalPropertyTypes` — but `in`'s narrowing
 * DEPENDS on that flag, and only `!== undefined` still narrows without
 * it. The spelling is chosen to survive a compiler-config change, not
 * because `in` is wrong today.
 *
 * Stays pure: no logging, no side effect. The defect is already reported
 * loudly by the machinery that caused it.
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
 * bug rather than a state to absorb. Applicability has already required
 * the member's presence, so there is no absent-member state to handle
 * here — but its narrowing does not cross this function boundary, so
 * **both narrowing checks are re-made** — the stage's `ok`, then the
 * member — and a failure **throws**. That throw is unreachable whenever
 * applicability was honored, which is exactly the precondition the
 * scanning leaf states for its own inputs.
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

/**
 * The two keys `config` resolves as thresholds. Every other key is an
 * unknown field, preserved verbatim under the open-shape contract and never
 * range-checked.
 */
const THRESHOLD_KEYS = ['oneMoreAfter', 'skipAfter'] as const;

/**
 * Refuses an out-of-range threshold at the factory boundary rather than
 * coercing it — a silently clamped configuration is an educator's setting
 * that did not take effect and said nothing (`./DOCS.md` § Decisions).
 *
 * Scoped to numbers on purpose. Negative, fractional and non-finite are the
 * three refusals `./README.md` § Configuration names, and all three are
 * properties a number can have; no document rules on a non-numeric value for
 * either key, so this does not invent one.
 */
function refuseOutOfRangeThresholds(
	defined: Record<string, SerializableValue>,
): void {
	for (const key of THRESHOLD_KEYS) {
		const value = defined[key];
		if (typeof value === 'number' && value < 0) {
			throw new TypeError(
				`spellme config: ${key} must be a non-negative integer, got ${value}`,
			);
		}
	}
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
