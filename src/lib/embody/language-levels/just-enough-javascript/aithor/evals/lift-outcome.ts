import cloneAndFreeze from '@utils/clone-and-freeze.js';
import deepFreezeInPlace from '@utils/deep-freeze-in-place.js';

import type { AithorResult, Meta } from '../types.js';

import type {
	CaseSpec,
	ConformVerdict,
	Outcome,
	RefusalOutcome,
	UncuratedOutcome,
} from './types.js';

/**
 * The one boundary-lift: maps one sampled {@link CaseSpec} + its
 * {@link AithorResult} (+ the driver's externally-computed reads) to the right
 * {@link Outcome} variant.
 *
 * @remarks
 * Pure given its inputs — the eval's Lift phase ([`./DOCS.md`](./DOCS.md)): the
 * impurity is the driver's, in producing the `AithorResult` and the reads; the
 * lift only maps shapes — it never runs `isJej` or `conform` (the reads arrive
 * computed) and never re-derives the path.
 *
 * Variant selection: `spec.config.validate` picks the path (an `AithorResult`
 * carries no path tag; an absent `validate` is the parent contract's default,
 * curated), then `result.ok` sub-selects within it:
 * - uncurated + ok → `UncuratedOutcome` — the reads embedded verbatim by value
 *   (the caller's objects are cloned, never frozen in place); `model` from
 *   `Meta`.
 * - curated + ok → `CuratedSuccessOutcome` — `attempts` / `model` from `Meta`;
 *   the reads are omitted by construction and never read (admission and
 *   conformance hold by the loop's guarantee).
 * - not ok → `RefusalOutcome` — the refusal's `cause`, with `path` stamped from
 *   `validate` (a bring-up cause alone cannot tell the paths apart). A refusal
 *   carries no `Meta`, which is never read.
 *
 * Boundary honesty is fail-fast (a malformed result is the caller's defect,
 * not data): an `ok` result without `meta`, a refused result without
 * `refusal`, and a curated success whose `Meta.attempts` falls outside the
 * literal `1 | 2 | 3` all throw — trusting them would silently poison the fold
 * (`attemptDistribution` is keyed by that literal union).
 *
 * @param spec - The sampled case; only its `config.validate` fork is read
 * @param result - What `aithor` resolved to for this draw
 * @param reads - The driver's `isJej` / `conform` reads, consumed only on the
 *   uncurated ok path
 * @returns The frozen per-sample distillate
 * @throws {Error} On a malformed `AithorResult` (see above)
 */
export default function liftOutcome(
	spec: CaseSpec,
	result: AithorResult,
	reads: {
		readonly admitted: boolean;
		readonly conform: ConformVerdict;
	},
): Outcome {
	// The parent contract's resolution: an absent validate defaults to curated.
	const curated = spec.config.validate !== false;

	if (!result.ok) return liftRefusal(result, curated);

	const meta = metaOf(result);
	if (curated) {
		return deepFreezeInPlace({
			kind: 'curated-success',
			attempts: attemptsOf(meta),
			model: meta.model,
		});
	}

	// The caller owns the reads — clone-and-freeze, never freeze in place.
	const outcome: UncuratedOutcome = {
		kind: 'uncurated',
		admitted: reads.admitted,
		conform: reads.conform,
		model: meta.model,
	};
	return cloneAndFreeze(outcome);
}

/** The refusal map: cause copied, path stamped from the case's validate fork. */
function liftRefusal(result: AithorResult, curated: boolean): RefusalOutcome {
	const { refusal } = result;
	if (!refusal) {
		throw new Error('liftOutcome: a refused AithorResult carries no refusal');
	}

	return deepFreezeInPlace({
		kind: 'refusal',
		cause: refusal.cause,
		path: curated ? 'curated' : 'uncurated',
	});
}

/** The ok-path contract guard: meta is set on every successful result. */
function metaOf(result: AithorResult): Meta {
	const { meta } = result;
	if (!meta) {
		throw new Error('liftOutcome: an ok AithorResult carries no meta');
	}

	return meta;
}

/**
 * Narrows Meta's wide `attempts` to the curated literal `1 | 2 | 3` — an
 * out-of-bound count would silently poison `attemptDistribution`, so it throws.
 */
function attemptsOf(meta: Meta): 1 | 2 | 3 {
	const { attempts } = meta;
	if (attempts === 1 || attempts === 2 || attempts === 3) return attempts;

	throw new Error(
		`liftOutcome: curated success attempts outside 1|2|3: ${attempts}`,
	);
}
