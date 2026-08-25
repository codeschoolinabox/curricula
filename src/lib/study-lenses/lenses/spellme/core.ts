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
import freezeInPlace from '@utils/freeze-in-place.js';

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
 * @throws RangeError on a negative, fractional or non-finite threshold —
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
function applicability(facts: Facts): boolean {
	return facts.tokens.ok && facts.tokens.value.inputElements !== undefined;
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
 *
 * @throws TypeError when the tokens stage did not succeed, or succeeded
 *   without the published member. (human ruling 2026-08-25) The class is
 *   the scanning leaf's own for an absent input, and an absent member is
 *   a wrong-**kind** case rather than the right-kind-wrong-**value** one
 *   `config` refuses with a `RangeError`.
 */
function readStream(facts: Facts): ReadonlyArray<StreamElement> {
	if (!facts.tokens.ok) {
		throw new TypeError(
			'spellme readStream: the tokens stage did not succeed; call behind applicability',
		);
	}
	if (facts.tokens.value.inputElements === undefined) {
		throw new TypeError(
			'spellme readStream: the tokens stage published no input elements; call behind applicability',
		);
	}
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
	return EMPTY_RECOMMENDATIONS;
}

/**
 * Module-level frozen-empty-array constant — shared across all `recommend`
 * calls so the empty-result return is a stable reference (no per-call
 * allocation). `freezeInPlace`, not `cloneAndFreeze`: this array is built
 * here and no caller owns it.
 */
const EMPTY_RECOMMENDATIONS = freezeInPlace<ReadonlyArray<Recommendation>>([]);

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
		if (typeof value === 'number' && !isLegalThreshold(value)) {
			throw new RangeError(
				`spellme config: ${key} must be a non-negative integer, got ${value}`,
			);
		}
	}
}

/**
 * `./README.md` § Configuration's "Legal values" as a predicate — "Both are
 * non-negative integers". `Number.isInteger` is false for a fraction AND for
 * NaN and Infinity, so the three refusals that section names — negative,
 * fractional, non-finite — are all of them the negation of this one test.
 */
function isLegalThreshold(value: number): boolean {
	return Number.isInteger(value) && value >= 0;
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
